// 화면 전후 비교 시트 — ① 홈페이지: 기존 .com 기준본(측정/스크린샷/before) vs 신규 .kr 최신 캡처, ② 신규에만 있는 페이지,
// ③ 검색 결과: AI·검색 캡처 첫 측정일 vs 최신일(브랜드·핵심 키워드), ④ 신규 사이트 첫 캡처 vs 최신(사이트 자체 변화).
// 출력: 보고/퀵서비스다_화면전후비교_<날짜>.html/.pdf
//   node tools/ai-exposure/compare.mjs [YYYY-MM-DD]
import fs from 'node:fs';
import path from 'node:path';
import { ENG, AI_DIR, REPORT_DIR, REPORT_CSS, FONT_LINK, HOST_KO, readRows, makeCell, kstDate, md, esc, shotOf, resultOf, oldOf, cropShot, dataUri, htmlToPdf, closeHeadless } from './lib.mjs';
import { SHOT_DIR, PAGES } from './screens.mjs';

const DATE = process.argv.slice(2).find(a => /^\d{4}-\d{2}-\d{2}$/.test(a)) || kstDate();
const BEFORE = path.join(SHOT_DIR, 'before');
const days = fs.existsSync(SHOT_DIR) ? fs.readdirSync(SHOT_DIR).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d) && d <= DATE).sort() : [];
if (!days.length) { console.error('화면 캡처가 없습니다 — node tools/ai-exposure/screens.mjs --old --full'); process.exit(1); }
const LAST = days[days.length - 1], FIRST = days[0];
const beforeDate = (() => { try { return fs.readFileSync(path.join(BEFORE, 'README.txt'), 'utf8').match(/\d{4}-\d{2}-\d{2}/)[0]; } catch (_) { return ''; } })();
const f = (dir, name) => { const p = path.join(dir, name); return fs.existsSync(p) ? p : null; };
const img = (file, cap, style = '') => file ? `<figure><img src="${dataUri(file)}" style="${style}" alt=""><figcaption>${esc(cap)}</figcaption></figure>` : `<figure class="miss"><p class="muted small">${esc(cap)} — 캡처 없음</p></figure>`;
const pair = (title, a, ac, b, bc, style) => `<div class="item"><h3>${esc(title)}</h3><div class="two"><div><span class="tag before">전</span>${img(a, ac, style)}</div><div><span class="tag after">후</span>${img(b, bc, style)}</div></div></div>`;

// ③ 검색 결과 전후: 첫 측정일·최신일 모두 유효하게 측정된 (엔진, 키워드)
const rows = readRows(DATE); const cell = makeCell(rows); const aiDays = [...new Set(rows.map(r => r.date))].sort();
const A0 = aiDays[0], A1 = aiDays[aiDays.length - 1];
const SEARCH_PAIRS = [['naver', '퀵서비스다'], ['bing', '퀵서비스다'], ['perplexity', '퀵서비스다'], ['naverai', '서울퀵'], ['naver', '서울퀵'], ['naver', '오토바이 퀵'], ['chatgpt', '서울퀵'], ['naverai', '다마스 퀵']];
const st = (d, e, q) => { const c = cell(d, e, q); return !c ? '미측정' : c.site ? '퀵서비스다.kr 노출' : oldOf(d, e, q) ? '기존 .com만' : c.brand ? '상호·번호만' : '없음'; };

(async () => {
  const site = PAGES.filter(p => p.old !== null).map(p => pair(p.label,
    f(BEFORE, `old_${p.key}_desktop.jpg`), `기존 퀵서비스다.com (${beforeDate} 기준본)`, f(path.join(SHOT_DIR, LAST), `new_${p.key}_desktop.jpg`), `신규 퀵서비스다.kr (${LAST})`, '')).join('');
  const mobile = PAGES.filter(p => p.old !== null).slice(0, 4).map(p => pair(`${p.label} — 모바일`,
    f(BEFORE, `old_${p.key}_mobile.jpg`), `기존 (${beforeDate})`, f(path.join(SHOT_DIR, LAST), `new_${p.key}_mobile.jpg`), `신규 (${LAST})`, 'height:120mm;width:auto;max-width:100%;margin:0 auto;object-fit:contain')).join('');
  const onlyNew = PAGES.filter(p => p.old === null).map(p => `<div><h3>${esc(p.label)}</h3>${img(f(path.join(SHOT_DIR, LAST), `new_${p.key}_desktop.jpg`), `신규에만 있는 페이지 (${LAST})`)}</div>`).join('');
  const search = [];
  if (A0) for (const [e, q] of SEARCH_PAIRS) {
    if (!cell(A0, e, q) && !cell(A1, e, q)) continue;
    const r1 = resultOf(A1, e, q); const ratio = r1 && r1.hit && r1.hit.h ? r1.hit.y / r1.hit.h : 'top';
    const a = await cropShot(shotOf(A0, e, q), 'top', 0.75), b = A1 !== A0 ? await cropShot(shotOf(A1, e, q), ratio, 0.75) : null;
    search.push(A1 !== A0 ? pair(`${ENG[e]} — "${q}"`, a, `${A0} 첫 측정: ${st(A0, e, q)}`, b, `${A1}: ${st(A1, e, q)}`, '')
      : `<div><h3>${ENG[e]} — "${esc(q)}"</h3>${img(a, `${A0} 첫 측정(기준): ${st(A0, e, q)}`)}</div>`);
  }
  // 아직 측정일이 하루뿐이면 기준 화면만 두 장씩 나란히
  if (A0 && A0 === A1) { const g = []; for (let i = 0; i < search.length; i += 2) g.push(`<div class="item two">${search[i]}${search[i + 1] || '<div></div>'}</div>`); search.splice(0, search.length, ...g); }
  const evo = FIRST !== LAST ? ['home', 'pricing'].map(k => pair(`신규 사이트 변화 — ${PAGES.find(p => p.key === k).label}`,
    f(path.join(SHOT_DIR, FIRST), `new_${k}_desktop.jpg`), `신규 첫 캡처 (${FIRST})`, f(path.join(SHOT_DIR, LAST), `new_${k}_desktop.jpg`), `최신 (${LAST})`, '')).join('') : '';

  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>퀵서비스다 화면 전후 비교 ${DATE}</title>${FONT_LINK}<style>${REPORT_CSS}
.two figure img{height:62mm;object-fit:cover;object-position:top}.miss{border:1px dashed var(--line);border-radius:5px;padding:20mm 4mm;text-align:center}
.grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}.grid3 img{height:48mm;object-fit:cover;object-position:top}</style></head><body>
<div class="head"><div class="k">QUICKSERVICEDA · BEFORE / AFTER</div><h1>화면 전후 비교</h1>
<div class="meta">전 = 기존 퀵서비스다.com(${beforeDate || '기준본 없음'} 촬영 기준본) · 후 = 신규 ${HOST_KO}(${LAST} 캡처) · 검색 결과 ${A0 ? `${A0} → ${A1}` : '측정 없음'}</div></div>
<p class="small muted">같은 내용의 페이지를 같은 화면 크기(데스크톱 1366×820, 모바일 390×844)로 찍어 나란히 놓았습니다. 기존 사이트 기준본은 처음 찍은 날 그대로 보관하며, 신규 사이트와 검색 결과는 매일 다시 찍습니다. 원본: 측정/스크린샷/, 측정/AI검색/</p>
<h2>1. 홈페이지 — 같은 내용 페이지 (데스크톱)</h2>${site}
<h2>2. 모바일</h2>${mobile}
<h2>3. 신규 사이트에만 있는 페이지</h2><div class="grid3">${onlyNew}</div>
<h2>4. 검색 결과 전후</h2>${search.join('') || '<p class="muted">검색 캡처 없음</p>'}
${evo ? `<h2>5. 신규 사이트 자체 변화</h2>${evo}` : ''}
</body></html>`;
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const out = path.join(REPORT_DIR, `퀵서비스다_화면전후비교_${DATE}`);
  fs.writeFileSync(out + '.html', html, 'utf8');
  await htmlToPdf(out + '.html', out + '.pdf', `퀵서비스다 화면 전후 비교 ${DATE}`);
  await closeHeadless();
  console.log(`전후 비교: 페이지 ${PAGES.filter(p => p.old !== null).length}쌍 · 검색 ${search.length}건(${A0}→${A1}) · 신규 변화 ${evo ? '있음' : '첫 캡처'} → ${out}.pdf ${Math.round(fs.statSync(out + '.pdf').size / 1024)}KB`);
  process.exit(0);
})().catch(async e => { console.error(e); await closeHeadless(); process.exit(1); });
