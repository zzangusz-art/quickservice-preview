// 월간 리포트 — 한 달 동안의 AI·검색 노출 추이(일별·엔진별·키워드별), 월초→월말 전후 화면, 블로그 발행·키워드 겹침, 검색 등록 현황.
// 입력: 측정/AI검색/추이.csv + 날짜 폴더 캡처, 측정/검색등록.json. 출력: 보고/퀵서비스다_월간리포트_<YYYY-MM>.html/.pdf
// 실행: node tools/ai-exposure/monthly.mjs [--month YYYY-MM]   (기본: 어제가 속한 달 — 매월 1일에 돌리면 지난달 전체)
import fs from 'node:fs';
import path from 'node:path';
import { ENG, QUERIES, PROJ, REPORT_DIR, REPORT_CSS, FONT_LINK, HOST_KO, readRows, makeCell, valid, kstDate, kstNow, addDays, md, esc, arg, eOrder, oldOf, shotOf, resultOf, cropShot, dataUri, htmlToPdf, closeHeadless } from './lib.mjs';
import { matrix, blogData, blogTable, domainsTable, todo } from './sections.mjs';

const MONTH = arg('month', addDays(kstDate(), -1).slice(0, 7));
const [YY, MM] = MONTH.split('-').map(Number);
const M0 = `${MONTH}-01`; const M1 = new Date(Date.UTC(YY, MM, 0)).toISOString().slice(0, 10); // 그 달 마지막 날
const rows = readRows(M1).filter(r => r.date >= M0); const cell = makeCell(rows);
const dates = [...new Set(rows.map(r => r.date))].sort();
if (!dates.length) { console.error('이 달 측정 없음:', MONTH); process.exit(1); }
const FIRST = dates[0], LAST = dates[dates.length - 1];
const engines = Object.keys(ENG).filter(e => rows.some(r => r.engine === e));
const lastEngines = engines.filter(e => rows.some(r => r.date === LAST && r.engine === e));

// 일별 추이
const trend = dates.map(d => { const v = rows.filter(r => r.date === d).map(r => cell(d, r.engine, r.query)).filter(Boolean); const u = [...new Map(v.map(r => [r.engine + r.query, r])).values()];
  return { d, n: u.length, s: u.filter(r => r.site).length, b: u.filter(r => !r.site && (r.brand || oldOf(d, r.engine, r.query))).length }; });
const T0 = trend[0], T1 = trend[trend.length - 1];
const chart = (() => { const W = 680, H = 190, L = 28, R = 8, T = 16, B = 26; const mx = Math.max(5, ...trend.map(t => t.s + t.b)); const n = trend.length; const bw = Math.min(26, (W - L - R) / n * 0.7);
  const x = (i) => L + (i + 0.5) * (W - L - R) / n; const y = (v) => T + (1 - v / mx) * (H - T - B);
  const bars = trend.map((t, i) => `<rect x="${x(i) - bw / 2}" y="${y(t.s)}" width="${bw}" height="${H - B - y(t.s)}" fill="#1e88e5"/><rect x="${x(i) - bw / 2}" y="${y(t.s + t.b)}" width="${bw}" height="${y(t.s) - y(t.s + t.b)}" fill="#b9d8f6"/>${t.s ? `<text x="${x(i)}" y="${y(t.s + t.b) - 3}" font-size="9" text-anchor="middle" fill="#0b2545">${t.s}</text>` : ''}`).join('');
  const step = Math.ceil(n / 16);
  return `<svg viewBox="0 0 ${W} ${H}" width="100%">${[0, .5, 1].map(f => `<line x1="${L}" x2="${W - R}" y1="${y(mx * f)}" y2="${y(mx * f)}" stroke="#e3e8f0"/><text x="${L - 4}" y="${y(mx * f) + 3}" font-size="9" text-anchor="end" fill="#6b7485">${Math.round(mx * f)}</text>`).join('')}${bars}${trend.map((t, i) => i % step ? '' : `<text x="${x(i)}" y="${H - 9}" font-size="9" text-anchor="middle" fill="#6b7485">${md(t.d)}</text>`).join('')}</svg>
<p class="small muted"><span style="color:#1e88e5">■</span> 퀵서비스다.kr 노출 · <span style="color:#b9d8f6">■</span> 상호·대표번호·기존 사이트만 (막대 위 숫자 = .kr 노출 수, 날마다 측정 가능한 엔진 수가 달라 아래 엔진별 표의 비율을 함께 봅니다)</p>`; })();

// 엔진별·키워드별
const engRows = engines.map(e => { const all = rows.filter(r => r.engine === e); const v = dates.flatMap(d => QUERIES.map(q => cell(d, e, q))).filter(Boolean);
  return { e, n: v.length, s: v.filter(r => r.site).length, miss: all.filter(r => !valid(r)).length, login: all.some(r => r.error === '로그인 필요') }; });
const qRows = QUERIES.map(q => { const v = dates.flatMap(d => engines.map(e => cell(d, e, q))).filter(Boolean);
  return { q, n: v.length, s: v.filter(r => r.site).length, now: lastEngines.filter(e => (cell(LAST, e, q) || {}).site), was: engines.filter(e => (cell(FIRST, e, q) || {}).site) }; }).filter(x => x.n);
const pct = (a, b) => b ? Math.round(a / b * 100) + '%' : '-';

// 월초에 없다가 월말에 노출된 곳 — 전후 화면
const gains = [];
for (const q of QUERIES) for (const e of lastEngines) { const a = cell(FIRST, e, q), b = cell(LAST, e, q); if (FIRST !== LAST && a && b && !a.site && b.site && shotOf(FIRST, e, q) && shotOf(LAST, e, q)) gains.push({ q, e }); }

const nowStr = `${kstNow().toISOString().slice(0, 10)} ${kstNow().toISOString().slice(11, 16)}`;
const blog = blogData(M0, M1, nowStr);
const byCat = {}; for (const p of blog.published) byCat[p.category] = (byCat[p.category] || 0) + 1;
const nextMonth = blog.scheduled.filter(p => p.date > M1 && p.date <= addDays(M1, 31)).length;
const reg = (() => { try { return JSON.parse(fs.readFileSync(path.join(PROJ, '측정', '검색등록.json'), 'utf8')).items || []; } catch (_) { return []; } })();
const exposedQ = QUERIES.filter(q => dates.some(d => engines.some(e => (cell(d, e, q) || {}).site)));

(async () => {
  const pairs = [];
  for (const { q, e } of gains.slice(0, 4)) {
    const r = resultOf(LAST, e, q); const ratio = r && r.hit && r.hit.h ? r.hit.y / r.hit.h : 'top';
    const a = await cropShot(shotOf(FIRST, e, q), 'top', 0.75), b = await cropShot(shotOf(LAST, e, q), ratio, 0.75);
    pairs.push(`<div class="item"><h3>${ENG[e]} — "${esc(q)}"</h3><div class="two"><div><span class="tag before">전 ${md(FIRST)}</span><figure><img src="${dataUri(a)}" alt=""><figcaption>퀵서비스다.kr 없음</figcaption></figure></div><div><span class="tag after">후 ${md(LAST)}</span><figure><img src="${dataUri(b)}" alt=""><figcaption>퀵서비스다.kr 노출${ratio !== 'top' ? ' (노출 위치 부근)' : ''}</figcaption></figure></div></div></div>`);
  }
  const [y, m] = MONTH.split('-');
  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>퀵서비스다 월간 리포트 ${MONTH}</title>${FONT_LINK}<style>${REPORT_CSS}</style></head><body>
<div class="head"><div class="k">QUICKSERVICEDA · MONTHLY REPORT</div><h1>월간 리포트 — ${y}년 ${+m}월</h1>
<div class="meta">측정 ${FIRST} ~ ${LAST} (${dates.length}일) · 사이트 ${HOST_KO} · 측정 엔진 ${engines.map(e => ENG[e]).join('·')}</div></div>

<div class="kpi">
<div><b>${T1.s}</b><span>월말(${md(LAST)}) 퀵서비스다.kr 노출 (키워드×엔진, 유효 ${T1.n}곳 중)</span></div>
<div><b>${FIRST === LAST ? '—' : (T1.s - T0.s > 0 ? '+' : '') + (T1.s - T0.s)}</b><span>${FIRST === LAST ? '월초 대비 — 측정 하루뿐' : `월초(${md(FIRST)}) ${T0.s} → 월말 ${T1.s}`}</span></div>
<div><b>${exposedQ.length}/${QUERIES.length}</b><span>한 번이라도 .kr이 노출된 키워드</span></div>
<div><b>${blog.published.length}</b><span>이번 달 발행 블로그 글 (누적 ${blog.total}건)</span></div>
</div>

<h2>1. 일별 노출 추이</h2>
${chart}

<h2>2. 엔진별 노출률</h2>
<table><tr><th style="width:22%">엔진</th><th class="c">유효 측정</th><th class="c">.kr 노출</th><th class="c">노출률</th><th>비고</th></tr>
${engRows.map(r => `<tr><td><b>${ENG[r.e]}</b></td><td class="c">${r.n}</td><td class="c">${r.s}</td><td class="c"><b>${pct(r.s, r.n)}</b></td><td class="small">${r.login ? '로그인 필요(측정용 크롬에 로그인하면 측정됨)' : r.miss ? `미측정 ${r.miss}건(차단·오류)` : ''}</td></tr>`).join('')}</table>

<h2>3. 키워드별 노출 — 월초와 월말</h2>
<table><tr><th style="width:18%">키워드</th><th class="c" style="width:10%">노출률</th><th style="width:30%">월초 ${md(FIRST)} 노출 엔진</th><th>월말 ${md(LAST)} 노출 엔진</th></tr>
${qRows.map(r => `<tr><td><b>${esc(r.q)}</b></td><td class="c">${pct(r.s, r.n)}</td><td class="small">${r.was.map(e => ENG[e]).join(', ') || '<span class="muted">없음</span>'}</td><td class="small">${r.now.map(e => ENG[e]).join(', ') || '<span class="muted">없음</span>'}</td></tr>`).join('')}</table>
<h3>월말 현황표 (${md(LAST)})</h3>
${matrix(LAST, cell, lastEngines, null)}

<h2>4. 월초에 없다가 월말에 노출된 화면 (${gains.length}곳)</h2>
${pairs.length ? pairs.join('') : `<p class="muted">${FIRST === LAST ? '이번 달 측정이 하루뿐이라 전후 비교는 다음 달부터 표시합니다.' : '월초 대비 새로 노출된 곳이 없습니다.'}</p>`}

<h2>5. 블로그 발행과 키워드 겹침 점검</h2>
<p>이번 달 <b>${blog.published.length}</b>건 발행${Object.keys(byCat).length ? ` — ${Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${esc(k)} ${n}`).join(' · ')}` : ''}. 다음 달 예약 ${nextMonth}건.</p>
${blogTable(blog, 120)}

<h2>6. 검색엔진 등록 현황</h2>
${reg.length ? `<table><tr><th style="width:22%">항목</th><th style="width:26%">상태</th><th style="width:12%">날짜</th><th>메모</th></tr>${reg.map(r => `<tr><td><b>${esc(r.engine)}</b></td><td>${esc(r.status)}</td><td>${esc(r.date || '')}</td><td class="small">${esc(r.note || '')}</td></tr>`).join('')}</table>` : '<p class="muted">측정/검색등록.json 없음</p>'}

<h2>7. 많이 인용된 출처</h2>
${await domainsTable(dates, 12)}

<h2>8. 다음 달 할 일</h2>
${todo({ d: LAST, cell, engines: lastEngines, b: blog, weekHits: null })}
</body></html>`;
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const out = path.join(REPORT_DIR, `퀵서비스다_월간리포트_${MONTH}`);
  fs.writeFileSync(out + '.html', html, 'utf8');
  await htmlToPdf(out + '.html', out + '.pdf', `퀵서비스다 월간 리포트 ${MONTH}`);
  await closeHeadless();
  console.log(`${MONTH}: 측정 ${dates.length}일 · 월말 노출 ${T1.s}/${T1.n} · 월초 ${T0.s} · 노출 키워드 ${exposedQ.length} · 전후 ${gains.length} · 발행 ${blog.published.length}`);
  console.log('ok', out + '.pdf', Math.round(fs.statSync(out + '.pdf').size / 1024) + 'KB');
  process.exit(0);
})().catch(async e => { console.error(e); await closeHeadless(); process.exit(1); });
