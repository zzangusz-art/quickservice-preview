// 종합 현황 리포트 — 지금까지 만든 리포트, AI 반영 상황, 화면 전후 비교, 유입량을 한 문서로
// 입력: 측정/성과_<날짜>.json(리포트 목록·GA4·서치콘솔·다음 단계), 측정/AI검색/추이.csv·일일 점검(kwmatrix.mjs),
//       측정/스크린샷(before·날짜별), 측정/AI검색(검색 결과 화면)
// 출력: 보고/퀵서비스다_종합현황리포트_<날짜>.html/.pdf
//   node tools/ai-exposure/status.mjs [YYYY-MM-DD]
import fs from 'node:fs';
import path from 'node:path';
import { PROJ, REPORT_DIR, REPORT_CSS, FONT_LINK, ENG, esc, htmlToPdf, kstDate, shotOf, resultOf, cropShot, dataUri, closeHeadless } from './lib.mjs';
import { evidence } from './sections.mjs';
import { SHOT_DIR } from './screens.mjs';
import { bars, hbars, n, CHART_CSS } from './charts.mjs';
import { loadMatrix, loadMentions, heatTable, HEAT_CSS } from './kwmatrix.mjs';

const DATE = process.argv.slice(2).find(a => /^\d{4}-\d{2}-\d{2}$/.test(a)) || kstDate();
const D = JSON.parse(fs.readFileSync(path.join(PROJ, '측정', `성과_${DATE}.json`), 'utf8'));
const md = d => d.replace(/^\d{4}-/, '').replace(/^0?(\d+)-0?(\d+)$/, '$1/$2');
const pct = (a, b) => b ? Math.round((a - b) / b * 100) : 0;
const TO = D.dataTo || DATE;

const KM = loadMatrix(TO);
const mentions = loadMentions(TO);
const firstM = mentions[0], lastM = mentions[mentions.length - 1];
const maxM = mentions.reduce((a, b) => b.brand > a.brand ? b : a);
const hitsBy = KM.siteHits.reduce((m, h) => { const k = `${ENG[h.engine]} 「${h.query}」`; m[k] = (m[k] || 0) + 1; return m; }, {});

// 화면 캡처: 기존 .com 기준본(before) vs 최신 날짜 폴더
const BEFORE = path.join(SHOT_DIR, 'before');
const shotDays = fs.readdirSync(SHOT_DIR).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d) && d <= DATE).sort();
const LAST = shotDays[shotDays.length - 1];
const beforeDate = (() => { try { return fs.readFileSync(path.join(BEFORE, 'README.txt'), 'utf8').match(/\d{4}-\d{2}-\d{2}/)[0]; } catch (_) { return ''; } })();
const fileOr = p => fs.existsSync(p) ? p : null;
const fig = (file, cap, cls = '') => file ? `<figure class="${cls}"><img src="${dataUri(file)}" alt=""><figcaption>${esc(cap)}</figcaption></figure>` : `<figure class="miss"><p class="muted small">${esc(cap)} — 캡처 없음</p></figure>`;
const pair = (title, a, ac, b, bc, cls = '') => `<div class="item"><h3>${esc(title)}</h3><div class="two"><div><span class="tag before">전</span>${fig(a, ac, cls)}</div><div><span class="tag after">후</span>${fig(b, bc, cls)}</div></div></div>`;
const okDays = (e, q) => [...new Set(KM.TR.filter(r => r.engine === e && r.query === q && r.ok).map(r => r.date))].sort();
const stateOf = (d, e, q) => { const r = KM.TR.find(x => x.date === d && x.engine === e && x.query === q && x.ok); return !r ? '미측정' : r.site ? '퀵서비스다.kr 노출' : r.brand ? '상호·번호 언급' : '없음'; };

(async () => {
  const g = D.ga, s = D.gsc, R = D.reports;
  const pagesTotal = R.reduce((a, r) => a + (r.pages || 0), 0);
  const byGroup = R.reduce((m, r) => (m[r.group] = (m[r.group] || 0) + 1, m), {});
  const m0 = g.months[0], m1 = g.months[1];
  const inqTotal = g.inquiries.reduce((a, b) => a + b[1], 0);
  const fromSearch = g.sources.filter(x => /검색/.test(x.name)).reduce((a, x) => a + x.inquiries, 0);
  const lastDay = g.daily[g.daily.length - 1], zeroDay = g.daily.filter(d => d[1] === 0).pop();
  const peakG = s.daily.reduce((a, b) => b[1] > a[1] ? b : a);

  // AI 답변 증빙(2×2), 검색 결과 전후
  const evs = [];
  for (const [d, e, q, kind] of D.evidence) evs.push(await evidence(d, e, q, kind === 'site' ? '<b>퀵서비스다.kr 노출</b>' : '<b>상호·번호 언급</b>', '').catch(() => ''));
  const searchPairs = [];
  for (const [e, q] of D.searchPairs) {
    const days = okDays(e, q); if (days.length < 2) continue;
    const A = days[0]; const B = [...days].reverse().find(d => stateOf(d, e, q) === '퀵서비스다.kr 노출') || days[days.length - 1];
    const r1 = resultOf(B, e, q); const ratio = r1 && r1.hit && r1.hit.h ? r1.hit.y / r1.hit.h : 'top';
    const a = await cropShot(shotOf(A, e, q), 'top', 0.75), b = await cropShot(shotOf(B, e, q), ratio, 0.75);
    searchPairs.push(pair(`${ENG[e]} — "${q}"`, a, `${A} 첫 측정: ${stateOf(A, e, q)}`, b, `${B}: ${stateOf(B, e, q)}`, 'shot'));
  }

  const kpis = [
    [`${R.length}건 · ${pagesTotal}쪽`, `지금까지 만든 리포트<br>정기 ${byGroup['정기'] || 0} · 진단 ${byGroup['진단'] || 0} · 성과 ${byGroup['성과'] || 0}`],
    [`${mentions.length}회`, `AI·검색 매일 측정<br>${KM.MATRIX.length}개 키워드 × 8개 엔진`],
    [`${firstM.brand} → ${lastM.brand}곳`, `AI·검색 답변 상호·번호 언급<br>최고 ${maxM.brand}곳(${md(maxM.d)})`],
    [`${KM.siteHits.length}회`, `퀵서비스다.kr 링크 직접 노출<br>${Object.keys(hitsBy).length}개 검색(엔진·키워드)`],
    [`${g.total.users}명`, `누적 방문자(${g.range})<br>10월 ${m0.users} → 11월 ${m1.users}명`],
    [`${inqTotal}회`, `문의 행동(접수·전화·문의·카톡)<br>검색 유입 ${Math.round(fromSearch / inqTotal * 100)}%`],
    [`${lastDay[1]}명`, `${md(lastDay[0])} 하루 방문<br>${zeroDay ? md(zeroDay[0]) + ' 0명에서 회복' : ''}`],
    [`${s.ones}개`, `구글 1위 검색어<br>노출 검색어 ${s.queryCount}개`],
  ];

  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>퀵서비스다 종합 현황 리포트 ${DATE}</title>${FONT_LINK}<style>${REPORT_CSS}${CHART_CSS}${HEAT_CSS}
.kpi{grid-template-columns:repeat(4,1fr)}.kpi div{background:#fff}.kpi b{font-size:16pt}.kpi div:nth-child(-n+4){border-color:#b9d7f5;background:#f5faff}
.hero{background:linear-gradient(135deg,#0b2545,#1e5fa8);color:#fff;border-radius:10px;padding:9mm 9mm 8mm;margin-bottom:6mm}.hero .k{font-size:9pt;letter-spacing:.12em;font-weight:800;color:#9fd0ff}.hero h1{font-size:22pt;margin:4px 0 2px}.hero p{margin:0;color:#d6e8fb;font-size:10pt}
.hl{display:grid;grid-template-columns:1fr 1fr;gap:6px 14px;margin:6px 0}.hl div{border-left:4px solid var(--green);background:#f3faf6;padding:5px 9px;border-radius:0 6px 6px 0;font-size:9.6pt}.hl b{color:var(--green)}
.up{color:var(--green);font-weight:800}
.rp td{font-size:8.9pt;vertical-align:middle}.rp td:first-child{white-space:nowrap}.gt{display:inline-block;font-size:8pt;font-weight:800;border-radius:4px;padding:0 6px}.gt.정기{background:#e8f3fd;color:#1e6fc0}.gt.진단{background:#f3ecfb;color:#6a4fb3}.gt.성과{background:#e3f4ea;color:#14804a}.gt.전달{background:#eef0f3;color:#5d6b7c}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:8px}.g2 .item{margin:0}
.two figure img{height:62mm;object-fit:cover;object-position:top}.two figure.mob img{height:105mm;width:auto;max-width:100%;margin:0 auto;object-fit:contain}.two figure.shot img{height:70mm;object-fit:cover;object-position:top}
.miss{border:1px dashed var(--line);border-radius:5px;padding:20mm 4mm;text-align:center}
.nx{border:1px solid var(--line);border-radius:8px;padding:6px 10px;margin:6px 0;page-break-inside:avoid}.nx b{color:var(--navy)}
.keep{page-break-inside:avoid}.pb{page-break-before:always}</style></head><body>

<div class="hero"><div class="k">QUICKSERVICEDA · 종합 현황 리포트</div><h1>리포트 · AI 반영 · 화면 비교 · 유입량</h1>
<p>퀵서비스다.kr · 착수 ${D.start.replace(/-/g, '.')} · 운영 시작 ${D.open.replace(/-/g, '.')} · 기준일 ${DATE.replace(/-/g, '.')} · GA4 ${g.range} · 서치콘솔 ${s.range} · AI 측정 ${md(KM.DATES[0])}~${md(KM.DATES[KM.DATES.length - 1])}</p></div>

<h2>한눈에 보는 현황</h2>
<div class="kpi">${kpis.map(([b, sp]) => `<div><b>${b}</b><span>${sp}</span></div>`).join('')}</div>
<div class="hl">
<div><b>리포트</b> — 매주 자동으로 나오는 노출 현황·화면 비교에, 진단·성과 리포트를 더해 ${R.length}건(${pagesTotal}쪽)을 만들었습니다.</div>
<div><b>AI 반영</b> — AI·검색 답변에서 퀵서비스다 상호·번호가 나오는 곳이 ${firstM.brand}곳 → ${lastM.brand}곳. ${md(lastM.d)}에는 Bing 「퀵서비스다」 검색에 퀵서비스다.kr이 직접 나왔습니다.</div>
<div><b>화면</b> — 기존 퀵서비스다.com 대비 신규 사이트는 요금·차량·지역·물류 가이드 페이지가 새로 생겼고, 검색 결과에도 신규 사이트가 나타나기 시작했습니다.</div>
<div><b>유입</b> — 누적 방문자 ${g.total.users}명, 문의 행동 ${inqTotal}회(네이버 검색 ${g.sources[0].inquiries}·구글 검색 ${g.sources[1].inquiries}). 방문은 ${zeroDay ? md(zeroDay[0]) + ' 0명에서 ' : ''}${md(lastDay[0])} ${lastDay[1]}명으로 회복 중입니다.</div>
</div>

<h2>1. 지금까지 만든 리포트</h2>
<p class="small">정기 리포트(주간 노출 현황·화면 전후 비교·월간)는 매일 측정과 함께 자동으로 만들어지고, 진단·성과 리포트는 필요할 때 실측 자료로 만들었습니다.</p>
<table class="rp"><tr><th>날짜</th><th class="c">구분</th><th>리포트</th><th class="c">쪽</th><th>담은 내용</th></tr>
${R.map(r => `<tr><td>${esc(r.label.replace(/^2026-/, '').replace('-', '/'))}</td><td class="c"><span class="gt ${esc(r.group)}">${esc(r.group)}</span></td><td><b>${esc(r.kind)}</b>${r.formats.length > 1 ? ` <span class="small muted">${r.formats.join('·')}</span>` : ''}</td><td class="c">${r.pages || '-'}</td><td class="small">${esc(r.desc)}</td></tr>`).join('')}
</table>

<h2 class="pb">2. AI 반영 상황</h2>
<p class="small">매일 ${KM.MATRIX.length}개 키워드를 네이버·네이버 AI·구글·Bing·ChatGPT·Gemini·Perplexity·Claude에 물어, 답변과 검색 결과에 퀵서비스다(상호·대표번호·사이트)가 나오는지 화면과 함께 기록합니다(${KM.DATES.length}회).</p>
<div class="chart"><h3>AI·검색 답변의 상호·번호 언급</h3><p class="small muted">하루 측정에서 퀵서비스다 상호나 대표번호가 나온 곳 수. ${md(firstM.d)} ${firstM.brand}곳 → 최고 ${md(maxM.d)} ${maxM.brand}곳 → ${md(lastM.d)} ${lastM.brand}곳.</p>
${bars(mentions.map(m => [md(m.d), m.brand]), { h: 125, hi: [md(maxM.d), md(lastM.d)], unit: '곳' })}</div>
<div class="keep"><h3>키워드 × 엔진 — 퀵서비스다가 나온 날 수</h3>
<p class="small muted">칸이 진할수록 측정 ${KM.DATES.length}회 중 자주 나온 것, <span style="color:#0a7a3e;font-weight:800">●</span>는 퀵서비스다.kr 링크가 직접 나온 날 수, · 는 측정 안 됨(로그인·사람 확인 화면). 상호 언급에는 기존 퀵서비스다.com 결과도 포함됩니다.</p>
${heatTable(KM)}</div>
<div class="note"><b>퀵서비스다.kr 링크가 직접 나온 곳</b> — ${Object.entries(hitsBy).map(([k, v]) => `${esc(k)} ${v}회`).join(' · ')} (${KM.siteHits.map(h => md(h.date)).filter((v, i, a) => a.indexOf(v) === i).join('·')})</div>

<h3>AI 답변·검색 결과 속 퀵서비스다</h3>
<div class="g2">${evs.join('')}</div>
<div class="two keep" style="margin-top:8px">
<div class="chart"><h3>AI가 사이트를 읽게 하는 장치</h3><table>${D.aiReady.map(([k, v]) => `<tr><td style="white-space:nowrap"><b>${esc(k)}</b></td><td class="small">${esc(v)}</td></tr>`).join('')}</table></div>
<div class="chart"><h3>AI·검색 봇 방문 7일 ${n(D.cloudflare.aiBots7d)}회</h3><p class="small muted">Cloudflare, ${D.cloudflare.readAt} 기준(이후 대시보드 로그아웃으로 미갱신).</p>${hbars(D.cloudflare.bots)}</div>
</div>

<h2>3. 화면 전후 비교</h2>
<p class="small">같은 페이지를 같은 화면 크기로 찍어 나란히 놓았습니다. 전 = 기존 퀵서비스다.com(${beforeDate} 기준본), 후 = 신규 퀵서비스다.kr(${LAST}). 페이지별 전체 비교는 「화면 전후 비교」 리포트(${R.filter(r => r.kind === '화면전후비교').pop().pages}쪽)에 있습니다.</p>
${pair('홈 — 데스크톱', fileOr(path.join(BEFORE, 'old_home_desktop.jpg')), `기존 퀵서비스다.com (${beforeDate})`, fileOr(path.join(SHOT_DIR, LAST, 'new_home_desktop.jpg')), `신규 퀵서비스다.kr (${LAST})`)}
${pair('홈 — 모바일', fileOr(path.join(BEFORE, 'old_home_mobile.jpg')), `기존 (${beforeDate})`, fileOr(path.join(SHOT_DIR, LAST, 'new_home_mobile.jpg')), `신규 (${LAST})`, 'mob')}
<h3>검색 결과 전후</h3>
${searchPairs.join('')}

<h2>4. 유입량</h2>
<table><tr><th>구분</th><th>기간</th><th class="c">월 방문자</th><th class="c">세션</th><th class="c">페이지뷰</th><th class="c">문의 행동</th></tr>
${g.months.map(m => `<tr><td><b>${m.label}</b></td><td>${m.range}</td><td class="c">${m.users}명</td><td class="c">${m.sessions}</td><td class="c">${m.pageviews}</td><td class="c">${m.inquiries}회</td></tr>`).join('')}
<tr><td><b>증가</b></td><td>10월 → 11월</td><td class="c up">+${m1.users - m0.users}명(+${pct(m1.users, m0.users)}%)</td><td class="c up">+${m1.sessions - m0.sessions}</td><td class="c up">+${m1.pageviews - m0.pageviews}</td><td class="c up">+${m1.inquiries - m0.inquiries}회</td></tr></table>
<p class="small muted">10월은 운영을 시작한 10/28부터 4일(오픈 점검 방문 포함), 11월은 ${m1.range.match(/~(\S+?)\(/)[1]}까지입니다. 누적(${g.range}) 방문자 ${g.total.users}명·세션 ${g.total.sessions}·페이지뷰 ${g.total.pageviews}.</p>
<div class="chart"><h3>일 방문자</h3><p class="small muted">GA4 하루 방문자(명).${zeroDay ? ` ${md(zeroDay[0])} 0명에서 ${g.daily.slice(-3).map(d => `${md(d[0])} ${d[1]}명`).join(', ')}으로 다시 늘었습니다.` : ''}</p>
${bars(g.daily.map(([d, v]) => [md(d), v]), { h: 135, hi: ['11/11', md(lastDay[0])], unit: '명' })}</div>
<div class="two">
<div class="chart"><h3>어디서 들어와 문의했나</h3><table><tr><th>유입</th><th class="c">방문</th><th class="c">문의</th></tr>${g.sources.map(x => `<tr><td>${esc(x.name)}${x.detail ? `<br><span class="small muted">${esc(x.detail)}</span>` : ''}</td><td class="c">${x.users ? x.users + '명' : x.sessions + '세션'}</td><td class="c"><b class="${x.inquiries > 5 ? 'up' : ''}">${x.inquiries}회</b></td></tr>`).join('')}</table></div>
<div class="chart"><h3>문의 행동 ${inqTotal}회</h3><p class="small muted">오른쪽 작은 글씨는 행동한 사람 수.</p>${hbars(g.inquiries.map(i => [i[0], i[1], `${i[2]}명`]), '#14804a')}
<h3 style="margin-top:8px">기간별 하루 평균 문의</h3>${bars(g.weeks.map(w => [w[0], +(w[2] / w[1]).toFixed(1)]), { h: 120, w: 320, hi: [g.weeks[g.weeks.length - 1][0]], unit: '회' })}</div>
</div>
<div class="two">
<div class="chart"><h3>유입별 질</h3><table><tr><th>유입</th><th class="c">세션</th><th class="c">참여율</th><th class="c">평균</th><th class="c">주요 전환</th></tr>${g.channels.map(c => `<tr><td>${c.name}</td><td class="c">${c.sessions}</td><td class="c">${c.engaged.toFixed(0)}%</td><td class="c">${c.avg}</td><td class="c">${c.key ? `<b class="up">${c.key}건</b>` : '0'}</td></tr>`).join('')}</table>
<ul class="small">${g.notes.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>
<div class="chart"><h3>구글 검색</h3><p class="small muted">${s.range} 노출 ${n(s.impressions)}회·클릭 ${s.clicks}회·평균 ${s.position}위. 1위 ${s.ones}개: ${s.onesList.map(esc).join(', ')}.</p>
${bars(s.daily.map(([d, v]) => [md(d), v]), { h: 130, w: 320, hi: [md(peakG[0])], unit: '회', labelEvery: 7 })}
<p class="small">구글 재평가로 색인이 ${s.index.beforeAt} ${s.index.before}쪽 → ${s.index.now}쪽이 되며 노출이 줄었습니다. 11/17 정리 작업과 색인 재요청 후 회복을 확인 중이고, 네이버는 수집 글이 ${D.naver.beforeAt} ${D.naver.before}편 → ${D.naver.at} ${D.naver.found}편으로 늘었습니다.</p></div>
</div>

<h2>5. 다음 단계</h2>
${D.next.map(([t, d], i) => `<div class="nx"><b>${i + 1}. ${esc(t)}</b><br><span class="small">${esc(d)}</span></div>`).join('')}
<p class="small muted">수치 출처: GA4(${g.range}, 운영 도메인 기록만), 구글 서치콘솔(${s.range}), 매일 AI·검색 측정(측정/AI검색, ${KM.DATES.length}회), 화면 캡처(측정/스크린샷), Cloudflare(${D.cloudflare.readAt}). 문의 행동은 버튼 클릭 기준입니다.</p>
</body></html>`;
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const base = path.join(REPORT_DIR, `퀵서비스다_종합현황리포트_${DATE}`);
  fs.writeFileSync(base + '.html', html);
  await htmlToPdf(base + '.html', base + '.pdf', `퀵서비스다 종합 현황 리포트 ${DATE}`);
  await closeHeadless();
  console.log('저장:', base + '.pdf', `| 리포트 ${R.length}건 ${pagesTotal}쪽 | 언급 ${firstM.brand}→${lastM.brand} | .kr ${KM.siteHits.length}회`, JSON.stringify(hitsBy));
  process.exit(0);
})().catch(async e => { console.error(e); await closeHeadless(); process.exit(1); });
