// 키워드 노출·문의 성과 리포트 — 어떤 키워드로 노출되고, 어디서 문의가 나오는지를 한 문서로
// 입력: 측정/성과_<날짜>.json(GA4 문의·방문, 서치콘솔, 네이버 수집, 다음 단계), 측정/AI검색/추이.csv(키워드 × 엔진 매일 측정),
//       측정/일일/*.md(상호·번호 언급 추이), 측정/AI검색(노출 증빙 화면)
// 출력: 보고/퀵서비스다_키워드노출문의리포트_<날짜>.html/.pdf
//   node tools/ai-exposure/kwreport.mjs [YYYY-MM-DD]
import fs from 'node:fs';
import path from 'node:path';
import { PROJ, REPORT_DIR, REPORT_CSS, FONT_LINK, esc, htmlToPdf, kstDate } from './lib.mjs';
import { evidence } from './sections.mjs';
import { bars, hbars, n, shade, inkOn, CHART_CSS } from './charts.mjs';

const DATE = process.argv.slice(2).find(a => /^\d{4}-\d{2}-\d{2}$/.test(a)) || kstDate();
const D = JSON.parse(fs.readFileSync(path.join(PROJ, '측정', `성과_${DATE}.json`), 'utf8'));
const md = d => d.replace(/^\d{4}-/, '').replace(/^0?(\d+)-0?(\d+)$/, '$1/$2');
const pct = (a, b) => b ? Math.round((a - b) / b * 100) : 0;
const DATA_TO = D.dataTo || DATE;

// ── 키워드 × 엔진: 측정/AI검색/추이.csv (date,engine,query,site,brand,domains,blocked,error)
const csvRows = text => text.replace(/^﻿/, '').split(/\r?\n/).filter(Boolean).map(line => {
  const out = []; let cur = '', q = false;
  for (const ch of line) { if (ch === '"') q = !q; else if (ch === ',' && !q) { out.push(cur); cur = ''; } else cur += ch; }
  out.push(cur); return out;
});
const [head, ...body] = csvRows(fs.readFileSync(path.join(PROJ, '측정', 'AI검색', '추이.csv'), 'utf8'));
const col = k => head.indexOf(k);
const TR = body.map(r => ({ date: r[col('date')], engine: r[col('engine')], query: r[col('query')], site: r[col('site')] === '1', brand: r[col('brand')] === '1', ok: r[col('blocked')] !== '1' && !r[col('error')] }))
  .filter(r => r.date <= DATA_TO);
const ENGINES = [['naver', '네이버'], ['naverai', '네이버 AI'], ['google', '구글'], ['bing', 'Bing'], ['chatgpt', 'ChatGPT'], ['gemini', 'Gemini'], ['perplexity', 'Perplexity'], ['claude', 'Claude']];
const QUERIES = [...new Set(TR.map(r => r.query))];
const DATES = [...new Set(TR.map(r => r.date))].sort();
const cell = (q, e) => {
  const rs = TR.filter(r => r.query === q && r.engine === e && r.ok);
  return { valid: rs.length, site: rs.filter(r => r.site).length, brand: rs.filter(r => r.brand || r.site).length };
};
const MATRIX = QUERIES.map(q => {
  const cells = ENGINES.map(([e]) => cell(q, e));
  return { q, cells, brand: cells.reduce((a, c) => a + c.brand, 0), site: cells.reduce((a, c) => a + c.site, 0), engines: cells.filter(c => c.brand).length };
}).sort((a, b) => b.site - a.site || b.brand - a.brand);
const mentionedKw = MATRIX.filter(m => m.brand > 0);
const siteKw = MATRIX.filter(m => m.site > 0);
const naverSite = MATRIX.reduce((a, m) => a + m.cells[0].site, 0);
const lastSiteDay = TR.filter(r => r.site).map(r => r.date).sort().pop();

// 상호·번호 언급 추이: 일일 점검 첫 줄
const DAILY = path.join(PROJ, '측정', '일일');
const mentions = fs.readdirSync(DAILY).filter(f => /^\d{4}-\d{2}-\d{2}\.md$/.test(f) && f.slice(0, 10) <= DATA_TO).sort().map(f => {
  const l = (fs.readFileSync(path.join(DAILY, f), 'utf8').match(/AI·검색 노출:[^\n]*/) || [''])[0];
  const num = re => +((l.match(re) || [])[1] || 0);
  return { d: f.slice(5, 10), valid: num(/유효 (\d+)곳/), brand: num(/상호·번호만 (\d+)/), site: num(/\.kr 노출 (\d+)/) };
}).filter(x => x.valid > 0);
const firstM = mentions[0], lastM = mentions[mentions.length - 1];
const maxM = mentions.reduce((a, b) => b.brand > a.brand ? b : a);

(async () => {
  const g = D.ga, s = D.gsc;
  const inqTotal = g.inquiries.reduce((a, b) => a + b.count, 0);
  const m0 = g.months[0], m1 = g.months[1];
  const src = g.bySource;
  const sum = r => r.online + r.call + r.quote + r.kakao;
  const fromSearch = src.filter(r => /검색/.test(r.name)).reduce((a, r) => a + sum(r), 0);
  const naver = src.find(r => /네이버/.test(r.name)), google = src.find(r => /구글/.test(r.name));
  const wk = g.weeks.map(w => ({ ...w, inq: sum(w) }));
  const lastWk = wk[wk.length - 1], prevWk = wk[wk.length - 2];
  const organic = g.channels[0], direct = g.channels[1];
  const ones = s.queries.filter(q => q[3] === 1);
  const top10 = s.queries.filter(q => q[3] && q[3] <= 10);
  const ev = await evidence(lastSiteDay || '2026-11-17', 'naver', '경기 퀵서비스', '<b>퀵서비스다.kr 노출</b>', `네이버 「경기 퀵서비스」 검색 결과에 퀵서비스다.kr이 나온 날: 측정 ${DATES.length}회 중 ${MATRIX.find(m => m.q === '경기 퀵서비스').cells[0].site}회`).catch(() => '');

  const kpis = [
    [`${inqTotal}회`, `문의 행동(접수·전화·문의·카톡)<br>10월 ${m0.inquiries}회 → 11월 ${m1.inquiries}회`],
    [`${Math.round(fromSearch / inqTotal * 100)}%`, `검색에서 나온 문의<br>네이버 ${sum(naver)}회 · 구글 ${sum(google)}회`],
    [`${lastWk.inq}회`, `최근 ${lastWk.days}일(${lastWk.label}) 문의<br>하루 ${(lastWk.inq / lastWk.days).toFixed(1)}회, 직전 주 ${(prevWk.inq / prevWk.days).toFixed(1)}회`],
    [`${m1.users}명`, `11월 방문자(${m1.range.replace(/\(.*\)/, '')})<br>10월 ${m0.users}명 대비 +${pct(m1.users, m0.users)}%`],
    [`${ones.length}개`, `구글 1위 검색어<br>10위 안 ${top10.length}개`],
    [`${mentionedKw.length}/${MATRIX.length}개`, `AI·검색 답변에서 퀵서비스다가<br>언급된 측정 키워드`],
    [`${naverSite}회`, `네이버 「경기 퀵서비스」<br>퀵서비스다.kr 직접 노출`],
    [`${organic.engaged.toFixed(0)}%`, `검색 방문 참여율<br>직접 방문 ${direct.engaged.toFixed(0)}%의 ${(organic.engaged / direct.engaged).toFixed(1)}배`],
  ];

  const inqCols = [['online', '온라인 접수'], ['call', '전화'], ['quote', '요금 문의'], ['kakao', '카카오톡']];
  const engHead = ENGINES.map(([, l]) => `<th class="c">${l}</th>`).join('');
  const heat = MATRIX.map(m => `<tr><td><b>${esc(m.q)}</b></td>${m.cells.map(c => {
    if (!c.valid) return '<td class="c muted">·</td>';
    const ratio = c.brand / DATES.length; // 측정 횟수 전체 대비(한두 번만 잰 엔진이 진하게 보이지 않게)
    return `<td class="c" style="background:${shade(ratio)};color:${inkOn(ratio)}">${c.brand ? c.brand : '<span class="muted">0</span>'}${c.site ? ` <span class="kr">●${c.site}</span>` : ''}</td>`;
  }).join('')}<td class="c"><b>${m.brand}</b></td></tr>`).join('');
  const validRow = `<tr class="vr"><td>측정된 날(평균)</td>${ENGINES.map((_, i) => `<td class="c">${Math.round(MATRIX.reduce((a, m) => a + m.cells[i].valid, 0) / MATRIX.length)}</td>`).join('')}<td></td></tr>`;

  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>퀵서비스다 키워드 노출·문의 성과 리포트 ${DATE}</title>${FONT_LINK}<style>${REPORT_CSS}${CHART_CSS}
.kpi{grid-template-columns:repeat(4,1fr)}.kpi div{background:#fff}.kpi b{font-size:17pt}.kpi div:nth-child(-n+4){border-color:#b9d7f5;background:#f5faff}
.hero{background:linear-gradient(135deg,#0b2545,#1e5fa8);color:#fff;border-radius:10px;padding:9mm 9mm 8mm;margin-bottom:6mm}.hero .k{font-size:9pt;letter-spacing:.12em;font-weight:800;color:#9fd0ff}.hero h1{font-size:22pt;margin:4px 0 2px}.hero p{margin:0;color:#d6e8fb;font-size:10pt}
.hl{display:grid;grid-template-columns:1fr 1fr;gap:6px 14px;margin:6px 0}.hl div{border-left:4px solid var(--green);background:#f3faf6;padding:5px 9px;border-radius:0 6px 6px 0;font-size:9.6pt}.hl b{color:var(--green)}
.up{color:var(--green);font-weight:800}.rk{color:var(--green);font-weight:800}
.heat td,.heat th{padding:3px 4px;font-size:8.8pt}.heat td:first-child{white-space:nowrap}.heat .kr{display:inline-block;background:#fff;color:#0a7a3e;border:1px solid #9fd8b8;border-radius:7px;padding:0 4px;font-weight:800;font-size:7.5pt;line-height:1.3}.heat .vr td{background:#f6f8fb;color:var(--muted);font-size:8pt}
.nx{border:1px solid var(--line);border-radius:8px;padding:6px 10px;margin:6px 0;page-break-inside:avoid}.nx b{color:var(--navy)}
.tl td:first-child{white-space:nowrap;font-weight:800;color:var(--navy);width:52px}
.pb{page-break-before:always}.keep{page-break-inside:avoid}</style></head><body>

<div class="hero"><div class="k">QUICKSERVICEDA · 키워드 노출·문의 성과 리포트</div><h1>어떤 검색에서 보이고, 어디서 문의가 오는가</h1>
<p>퀵서비스다.kr · 운영 시작 ${D.open.replace(/-/g, '.')} · 자료 ${g.range} · 작성 ${DATE.replace(/-/g, '.')} · 구글 애널리틱스(GA4)·구글 서치콘솔·매일 AI·검색 측정(${DATES.length}회)</p></div>

<h2>한눈에 보는 성과</h2>
<div class="kpi">${kpis.map(([b, sp]) => `<div><b>${b}</b><span>${sp}</span></div>`).join('')}</div>
<div class="hl">
<div><b>네이버가 문의 창구</b> — 네이버 검색으로 온 ${naver.users}명이 전화 ${naver.call}회·카카오톡 ${naver.kakao}회·온라인 접수 ${naver.online}회·요금 문의 ${naver.quote}회, 모두 ${sum(naver)}회 문의했습니다. 전화·카카오톡 문의는 전부 네이버에서 나왔습니다.</div>
<div><b>구글은 접수로 직행</b> — 구글 검색 방문 ${google.users}명에서 온라인 접수 클릭 ${google.online}회가 나왔습니다. 「다마스 적재함 크기」「다마스 퀵 요금표」 등 ${ones.length}개 검색어에서 1위입니다.</div>
<div><b>최근 반등</b> — ${g.recent.range} 네이버 검색 방문 ${g.recent.naverUsers}명, 검색 방문 평균 ${g.recent.organicAvg}. 최근 ${lastWk.days}일 문의 ${lastWk.inq}회로 하루 평균이 가장 높습니다.</div>
<div><b>키워드 노출</b> — 매일 재는 ${MATRIX.length}개 키워드 중 ${mentionedKw.length}개에서 AI·검색 답변에 퀵서비스다가 나오고, 네이버 「경기 퀵서비스」는 퀵서비스다.kr 링크가 ${naverSite}회 직접 노출됐습니다.</div>
</div>

<h2>1. 문의 성과</h2>
<div class="two">
<div class="chart"><h3>문의 행동 ${inqTotal}회</h3><p class="small muted">GA4 이벤트, ${g.range}. 오른쪽 작은 글씨는 행동한 사람 수.</p>${hbars(g.inquiries.map(i => [i.name, i.count, `${i.users}명`]), '#14804a')}</div>
<div class="chart"><h3>어디서 온 문의인가</h3><table><tr><th>유입</th>${inqCols.map(([, l]) => `<th class="c">${l}</th>`).join('')}<th class="c">합계</th></tr>
${src.map(r => `<tr><td>${esc(r.name)}${r.users ? ` <span class="small muted">${r.users}명</span>` : ''}</td>${inqCols.map(([k]) => `<td class="c">${r[k] || '<span class="muted">0</span>'}</td>`).join('')}<td class="c"><b class="${/네이버/.test(r.name) ? 'up' : ''}">${sum(r)}</b></td></tr>`).join('')}</table>
<p class="small muted">검색 유입 문의 ${fromSearch}회(${Math.round(fromSearch / inqTotal * 100)}%). 직접 방문 1회는 10월 운영 첫 주.</p></div>
</div>
<div class="chart"><h3>주별 방문과 문의</h3>
<table><tr><th>기간</th><th class="c">일수</th><th class="c">방문자</th>${inqCols.map(([, l]) => `<th class="c">${l}</th>`).join('')}<th class="c">문의 합계</th><th class="c">하루 평균 문의</th></tr>
${wk.map((w, i) => `<tr><td><b>${w.label}</b></td><td class="c">${w.days}</td><td class="c">${w.users}명</td>${inqCols.map(([k]) => `<td class="c">${w[k] || '<span class="muted">0</span>'}</td>`).join('')}<td class="c"><b>${w.inq}회</b></td><td class="c ${i === wk.length - 1 ? 'up' : ''}">${(w.inq / w.days).toFixed(1)}</td></tr>`).join('')}</table>
${bars(wk.map(w => [w.label, +(w.inq / w.days).toFixed(1)]), { h: 120, hi: [lastWk.label], unit: '회' })}
<p class="small muted">막대: 기간별 하루 평균 문의 행동. 10월은 운영 첫 4일입니다.</p></div>
<div class="two">
<div class="chart"><h3>요금 문의 단계</h3>${hbars([['문의 창 열기', g.funnel.quote_start[0], `${g.funnel.quote_start[1]}명`], ['문의 글 작성', g.funnel.quote_submit[0], `${g.funnel.quote_submit[1]}명`], ['카카오톡으로 보내기', g.funnel.quote_kakao[0], `${g.funnel.quote_kakao[1]}명`]])}<p class="small muted">요금 문의 창을 연 사람 ${g.funnel.quote_start[1]}명, 문의 글을 완성한 사람 ${g.funnel.quote_submit[1]}명.</p></div>
<div class="chart"><h3>읽어 둘 점</h3><ul class="small">${g.notes.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>
</div>

<h2>2. 방문</h2>
<table><tr><th>구분</th><th>기간</th><th class="c">월 방문자</th><th class="c">세션</th><th class="c">페이지뷰</th><th class="c">문의 행동</th></tr>
${g.months.map(m => `<tr><td><b>${m.label}</b></td><td>${m.range}</td><td class="c">${m.users}명</td><td class="c">${m.sessions}</td><td class="c">${m.pageviews}</td><td class="c">${m.inquiries}회</td></tr>`).join('')}
<tr><td><b>증가</b></td><td>10월 → 11월</td><td class="c up">+${m1.users - m0.users}명(+${pct(m1.users, m0.users)}%)</td><td class="c up">+${m1.sessions - m0.sessions}</td><td class="c up">+${m1.pageviews - m0.pageviews}</td><td class="c up">+${m1.inquiries - m0.inquiries}회</td></tr></table>
<p class="small muted">10월은 운영을 시작한 10/28부터 4일(오픈 점검 방문 포함), 11월은 17일까지입니다. 누적(${g.range}) 방문자 ${g.total.users}명·세션 ${g.total.sessions}·페이지뷰 ${g.total.pageviews}.</p>
<div class="chart"><h3>일 방문자</h3><p class="small muted">GA4 하루 방문자(명). 11/14 0명에서 11/16 4명, 11/17 6명으로 다시 늘었습니다.</p>
${bars(g.daily.map(([d, v]) => [md(d), v]), { h: 140, hi: ['11/11', md(g.daily[g.daily.length - 1][0])], unit: '명' })}</div>
<div class="two">
<div class="chart"><h3>유입별 질</h3><table><tr><th>유입</th><th class="c">세션</th><th class="c">참여율</th><th class="c">평균</th><th class="c">주요 전환</th></tr>${g.channels.map(ch => `<tr><td>${ch.name}</td><td class="c">${ch.sessions}</td><td class="c">${ch.engaged.toFixed(0)}%</td><td class="c">${ch.avg}</td><td class="c">${ch.key ? `<b class="up">${ch.key}건</b>` : '0'}</td></tr>`).join('')}</table>
<p class="small muted">주요 전환(온라인 접수) ${organic.key}건이 모두 검색 유입에서 나왔고, 검색 세션의 ${organic.keyRate.toFixed(0)}%가 전환됐습니다.</p></div>
<div class="chart"><h3>네이버 검색 방문자가 본 페이지</h3>${hbars(g.naverPages.map(p => [p[0], p[2]]))}<p class="small muted">방문자 수. ${naver.users}명 중 ${g.naverPages[0][2]}명이 홈을 봤습니다(상호·지역 검색에서 홈으로 들어옴).</p></div>
</div>

<div class="keep"><h2>3. 키워드 노출</h2>
<h3>AI·검색 키워드 노출 현황</h3>
<p class="small">매일 ${MATRIX.length}개 키워드를 8개 검색·AI에 물어(${md(DATES[0])}~${md(DATES[DATES.length - 1])}, ${DATES.length}회) 답변·결과에 퀵서비스다 상호·대표번호·사이트가 나온 날 수입니다. 칸이 진할수록 측정 ${DATES.length}회 중 자주 나온 것이고, <span style="color:#0a7a3e;font-weight:800">●</span>는 퀵서비스다.kr 링크가 직접 나온 날 수입니다.</p>
<table class="heat"><tr><th>키워드</th>${engHead}<th class="c">합계</th></tr>${heat}${validRow}</table></div>
<p class="small muted">· 는 측정 안 됨(로그인·사람 확인 화면). 상호 언급에는 기존 퀵서비스다.com 결과도 포함됩니다. Perplexity·Claude는 최근 사람 확인·로그인 화면으로 측정이 적습니다.</p>
<div class="chart"><h3>AI·검색 답변의 상호·번호 언급</h3><p class="small muted">하루 측정에서 퀵서비스다 상호나 대표번호가 나온 곳 수. ${md(firstM.d)} ${firstM.brand}곳 → 최고 ${md(maxM.d)} ${maxM.brand}곳 → ${md(lastM.d)} ${lastM.brand}곳.</p>
${bars(mentions.map(m => [md(m.d), m.brand]), { h: 125, hi: [md(maxM.d), md(lastM.d)], unit: '곳' })}</div>
<div class="two">
<div>${ev || ''}</div>
<div><div class="note"><b>네이버 웹문서 수집</b> — 글 제목으로 검색해 퀵서비스다.kr이 나온 글 ${D.naver.beforeAt} ${D.naver.before}편 → ${D.naver.at} <b class="up">${D.naver.found}편</b>. 네이버가 사이트 글을 하나씩 받아들이는 중입니다.</div>
<div class="note"><b>네이버 키워드</b> — 「경기 퀵서비스」는 퀵서비스다.kr 링크가 ${naverSite}회, 「퀵서비스다」「인천 퀵서비스」「수도권 퀵서비스」는 상호·번호가 측정일 대부분 나옵니다. 네이버 AI 답변에는 「서울퀵」에서 ${MATRIX.find(m => m.q === '서울퀵').cells[1].brand}회 언급됐습니다.</div></div>
</div>

<h3>구글 검색어 순위</h3>
<div class="kpi"><div><b>${s.queryCount}개</b><span>노출된 검색어(${s.range})</span></div><div><b>${ones.length}개</b><span>1위 검색어</span></div><div><b>${n(s.impressions)}회</b><span>검색 노출 · 클릭 ${s.clicks}회</span></div><div><b>${s.position}위</b><span>평균 게재 순위</span></div></div>
<div class="chart"><h3>하루 구글 노출</h3>${bars(s.daily.map(([d, , v]) => [md(d), v]), { h: 120, hi: ['11/8'], unit: '회' })}
<p class="small muted">11/8 하루 84회까지 올랐다가 구글 재평가로 색인이 ${s.index.before}쪽 → ${s.index.now}쪽이 되며 줄었습니다. 11/17 정리 작업·재요청 후 회복을 확인 중입니다.</p></div>
<div class="two">
<div><table><tr><th>검색어</th><th class="c">노출</th><th class="c">클릭</th><th class="c">순위</th></tr>${s.queries.map(q => `<tr><td>${esc(q[0])}</td><td class="c">${q[2]}</td><td class="c">${q[1] || ''}</td><td class="c">${q[3] === 1 ? '<b class="rk">1위</b>' : q[3] <= 10 ? `<b>${q[3].toFixed(0)}위</b>` : q[3].toFixed(0) + '위'}</td></tr>`).join('')}</table></div>
<div><table><tr><th>페이지</th><th class="c">노출</th><th class="c">클릭</th><th class="c">순위</th></tr>${s.pages.map(p => `<tr><td>${esc(p[0])}</td><td class="c">${p[3]}</td><td class="c">${p[2] || ''}</td><td class="c">${p[4].toFixed(0)}위</td></tr>`).join('')}</table>
</div>
</div>

<h2>4. 최근 작업과 다음 단계</h2>
<table class="tl">${D.work.map(([d, t]) => `<tr><td>${d}</td><td>${esc(t)}</td></tr>`).join('')}</table>
${D.next.map(([t, d], i) => `<div class="nx"><b>${i + 1}. ${esc(t)}</b><br><span class="small">${esc(d)}</span></div>`).join('')}
<p class="small muted">수치 출처: GA4 속성(${g.range}, 운영 도메인 기록만), 구글 서치콘솔(${s.range}), 매일 AI·검색 측정(측정/AI검색/추이.csv), 네이버 웹문서 검색 대조(${D.naver.at}). 문의 행동은 버튼 클릭 기준입니다.</p>
</body></html>`;
  const base = path.join(REPORT_DIR, `퀵서비스다_키워드노출문의리포트_${DATE}`);
  fs.writeFileSync(base + '.html', html);
  await htmlToPdf(base + '.html', base + '.pdf', `퀵서비스다 키워드 노출·문의 성과 리포트 ${DATE}`);
  console.log('저장:', base + '.pdf');
  console.log('키워드', MATRIX.map(m => `${m.q}:${m.brand}${m.site ? '/●' + m.site : ''}`).join(' '));
})();
