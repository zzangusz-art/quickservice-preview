// 통합 리포트 — 기준일 하루의 AI·검색 노출 전체(키워드×엔진), 측정 추이, .kr 노출 증빙, 서치콘솔, 블로그, 인용 출처, 화면 전후, 검색 등록, 남은 일을 한 파일로.
// 입력: 측정/AI검색/추이.csv·날짜 폴더, 측정/서치콘솔.json, 측정/검색등록.json, 측정/남은일.json, 측정/진단_*/scores.json, 측정/스크린샷/. 없는 자료는 그 구역을 뺀다.
// 출력: 보고/퀵서비스다_통합리포트_<날짜>.html/.pdf
//   node tools/ai-exposure/integrated.mjs [YYYY-MM-DD]
import fs from 'node:fs';
import path from 'node:path';
import { ENG, CORE_QUERIES, QUERIES, PROJ, REPORT_DIR, REPORT_CSS, FONT_LINK, HOST_KO, readRows, makeCell, valid, kstDate, kstNow, addDays, weekday, md, esc, oldOf, snippet, textOf, qOrder, eOrder, dataUri, htmlToPdf, closeHeadless } from './lib.mjs';
import { matrix, gaps, evidence, blogData, blogTable, domainsTable, todo } from './sections.mjs';

const DATE = process.argv.slice(2).find(a => /^\d{4}-\d{2}-\d{2}$/.test(a)) || kstDate();
const rows = readRows(DATE); const cell = makeCell(rows);
const dates = [...new Set(rows.map(r => r.date))].sort();
if (!dates.includes(DATE)) { console.error('측정 없음:', DATE); process.exit(1); }
const engines = Object.keys(ENG).filter(e => rows.some(r => r.date === DATE && r.engine === e));
const today = [...new Map(rows.filter(r => r.date === DATE && valid(r)).map(r => [r.engine + '|' + r.query, r])).values()].map(r => cell(DATE, r.engine, r.query)).sort((a, b) => qOrder(a.query) - qOrder(b.query) || eOrder(a.engine) - eOrder(b.engine));
const siteN = today.filter(r => r.site).length, brandN = today.filter(r => r.brand && !r.site).length, oldN = today.filter(r => !r.site && oldOf(DATE, r.engine, r.query)).length;
const json = (...p) => { try { return JSON.parse(fs.readFileSync(path.join(PROJ, ...p), 'utf8')); } catch (_) { return null; } };

// 추이: 날마다 측정된 엔진이 달라 다섯 곳(네이버·네이버 AI탭·Bing·ChatGPT·Gemini) × 핵심 키워드만 센다
const COMMON = ['naver', 'naverai', 'bing', 'chatgpt', 'gemini'];
const trend = dates.map(d => { const u = COMMON.flatMap(e => CORE_QUERIES.map(q => cell(d, e, q))).filter(Boolean); return { d, n: u.length, s: u.filter(c => c.site).length, c: u.filter(c => !c.site && oldOf(d, c.engine, c.query)).length, b: u.filter(c => !c.site && c.brand && !oldOf(d, c.engine, c.query)).length }; });
const seen = (e, q) => { const m = dates.filter(d => cell(d, e, q)); return { hit: m.filter(d => cell(d, e, q).site).length, n: m.length }; };

const nowStr = `${kstNow().toISOString().slice(0, 10)} ${kstNow().toISOString().slice(11, 16)}`;
const from = addDays(DATE, -6);
const blog = blogData(from, DATE, nowStr);
const gsc = json('측정', '서치콘솔.json'), reg = json('측정', '검색등록.json'), left = json('측정', '남은일.json');
const scoreDir = fs.readdirSync(path.join(PROJ, '측정')).filter(d => /^진단_\d{4}-\d{2}-\d{2}$/.test(d) && d.slice(3) <= DATE).sort().pop();
const scores = scoreDir ? json('측정', scoreDir, 'scores.json') : null;
const SHOT = path.join(PROJ, '측정', '스크린샷');
const lastShot = fs.existsSync(SHOT) ? fs.readdirSync(SHOT).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d) && d <= DATE).sort().pop() : null;
const shot = (dir, name) => { const f = path.join(SHOT, dir, name); return fs.existsSync(f) ? dataUri(f) : ''; };
const said = today.filter(r => ['naverai', 'perplexity', 'chatgpt', 'claude', 'gemini'].includes(r.engine) && (r.brand || r.site) && r.query !== '퀵서비스다').map(r => ({ r, t: snippet(textOf(DATE, r.engine, r.query), false) })).filter(x => x.t);

(async () => {
  const cards = [];
  for (const t of today.filter(x => x.site)) { const w = seen(t.engine, t.query); cards.push(await evidence(DATE, t.engine, t.query, `<b>${md(DATE)} 노출</b>`, `지금까지 측정 ${w.n}회 중 노출 ${w.hit}회`)); }
  const n = (v) => Number(v).toLocaleString('ko-KR');
  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>퀵서비스다 통합 리포트 ${DATE}</title>${FONT_LINK}<style>${REPORT_CSS}
.two figure img{height:58mm;object-fit:cover;object-position:top}</style></head><body>
<div class="head"><div class="k">QUICKSERVICEDA · INTEGRATED REPORT</div><h1>통합 리포트</h1>
<div class="meta">기준일 <b>${DATE}(${weekday(DATE)})</b> · 사이트 ${HOST_KO} · 측정 ${engines.map(e => ENG[e]).join('·')} · 키워드 ${QUERIES.length}개</div></div>

<div class="kpi">
<div><b>${siteN}</b><span>퀵서비스다.kr이 나온 곳 (키워드×엔진, 유효 ${today.length}곳 중)</span></div>
<div><b>${brandN}</b><span>링크 없이 상호·대표번호만 나온 곳${oldN ? ` (그중 기존 .com ${oldN})` : ''}</span></div>
<div><b>${blog.total}</b><span>공개된 블로그 글 (예약 ${blog.scheduled.length}건 별도)</span></div>
<div><b>${gsc ? n(gsc.impressions) : '—'}</b><span>${gsc ? `구글 검색 노출 (${md(gsc.from)}~${md(gsc.to)}, 클릭 ${n(gsc.clicks)})` : '구글 검색 노출(서치콘솔 자료 없음)'}</span></div>
</div>
${scores ? `<table><tr><th>AEO·GEO·SEO 점수(자체 채점)</th>${Object.keys(scores).map(k => `<th class="c">${esc(k)}</th>`).join('')}</tr>${[['착수 전 (기존 .com)', 0], ['공개 직후 (10/30)', 1], [`현재 (${md(scoreDir.slice(3))})`, 2]].map(([l, i]) => `<tr><td>${l}</td>${Object.values(scores).map(v => `<td class="c">${i === 2 ? `<b>${v[i]}</b>` : v[i]}</td>`).join('')}</tr>`).join('')}</table>` : ''}

<h2>1. 키워드별 노출 현황 (${md(DATE)})</h2>
${matrix(DATE, cell, engines, null)}
${gaps(DATE)}
<p class="small muted">구글·Perplexity·Claude는 11/9에 처음 측정했습니다. Claude는 계정의 지난 대화가 답변에 섞이지 않도록 시크릿 모드로 묻습니다. 구글 결과는 측정 PC의 지역(위치 설정)에 영향을 받습니다.</p>

<h2>2. 측정 추이 (네이버·네이버 AI탭·Bing·ChatGPT·Gemini × 핵심 ${CORE_QUERIES.length}개)</h2>
<table><tr><th class="c">측정일</th><th class="c">유효</th><th class="c">.kr 노출</th><th class="c">기존 .com만</th><th class="c">상호·번호만</th></tr>${trend.map(t => `<tr><td class="c">${md(t.d)}</td><td class="c">${t.n}</td><td class="c">${t.s ? `<span class="ok">${t.s}</span>` : 0}</td><td class="c">${t.c}</td><td class="c">${t.b}</td></tr>`).join('')}</table>
<p class="small muted">날마다 측정할 수 있는 엔진이 달라 다섯 곳만 같은 기준으로 셉니다. 검색 결과와 AI 답변은 날마다 조금씩 바뀌므로 추세로 봐 주세요.</p>

<h2>3. 퀵서비스다.kr이 나온 곳 (${siteN}곳)</h2>
${cards.join('') || '<p class="muted">오늘은 나온 곳이 없습니다.</p>'}

${said.length ? `<h2>4. AI 답변에 나온 상호·대표번호</h2><table><tr><th style="width:13%">엔진</th><th style="width:18%">키워드</th><th>답변 내용</th></tr>${said.slice(0, 10).map(x => `<tr><td>${ENG[x.r.engine]}</td><td>${esc(x.r.query)}</td><td class="small">${esc(x.t)}</td></tr>`).join('')}</table>` : ''}

${gsc ? `<h2>5. 구글 서치콘솔 (${md(gsc.from)}~${md(gsc.to)})</h2>
<div class="kpi"><div><b>${n(gsc.clicks)}</b><span>클릭</span></div><div><b>${n(gsc.impressions)}</b><span>노출</span></div><div><b>${gsc.position}</b><span>평균 순위</span></div><div><b>${gsc.aiImpressions}</b><span>생성형 AI 기능 노출</span></div></div>
<table><tr><th>일자</th>${gsc.daily.map(d => `<th class="c">${d[0]}</th>`).join('')}</tr><tr><td>노출</td>${gsc.daily.map(d => `<td class="c">${d[2]}</td>`).join('')}</tr><tr><td>클릭</td>${gsc.daily.map(d => `<td class="c">${d[1]}</td>`).join('')}</tr></table>
<table><tr><th>검색어</th><th class="c">클릭</th><th class="c">노출</th><th class="c">평균 순위</th></tr>${gsc.queries.map(q => `<tr><td>${esc(q[0])}</td><td class="c">${q[1]}</td><td class="c">${q[2]}</td><td class="c">${Number(q[3]).toFixed(1)}</td></tr>`).join('')}</table>
<p class="small muted">${gsc.readAt} 조회. 노출된 페이지 ${gsc.pages}개, 외부 링크 ${gsc.externalLinks}개, 직접 조치 ${esc(gsc.manualActions)}, 사이트맵 ${md(gsc.sitemapRead)} 처리, 페이지 색인 보고서: ${esc(gsc.indexing)}.</p>` : ''}

<h2>6. 최근 7일 블로그 발행과 키워드 겹침 (${md(from)}~${md(DATE)})</h2>
${blogTable(blog, 21)}

<h2>7. 검색 결과·AI 답변이 많이 인용한 출처 (${md(DATE)})</h2>
${await domainsTable([DATE], 12)}

${lastShot && shot('before', 'old_home_desktop.jpg') ? `<h2>8. 화면 전후 (홈)</h2><div class="two"><div><span class="tag before">전</span><figure><img src="${shot('before', 'old_home_desktop.jpg')}" alt=""><figcaption>기존 퀵서비스다.com</figcaption></figure></div><div><span class="tag after">후</span><figure><img src="${shot(lastShot, 'new_home_desktop.jpg')}" alt=""><figcaption>신규 ${HOST_KO} (${lastShot})</figcaption></figure></div></div>` : ''}

${reg ? `<div style="page-break-inside:avoid"><h2>9. 검색엔진 등록 현황</h2><table><tr><th>대상</th><th style="width:24%">상태</th><th style="width:13%">날짜</th></tr>${reg.items.map(x => `<tr><td>${esc(x.engine)}</td><td>${esc(x.status)}</td><td>${esc(x.date)}</td></tr>`).join('')}</table></div>` : ''}

<h2>10. 남은 일</h2>
${left ? `<table><tr><th style="width:6%" class="c">순서</th><th>할 일</th><th style="width:14%" class="c">담당</th></tr>${left.map((x, i) => `<tr><td class="c">${i + 1}</td><td>${esc(x[0])}</td><td class="c">${esc(x[1])}</td></tr>`).join('')}</table>` : ''}
${todo({ d: DATE, cell, engines, b: blog, weekHits: null })}
</body></html>`;
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const out = path.join(REPORT_DIR, `퀵서비스다_통합리포트_${DATE}`);
  fs.writeFileSync(out + '.html', html, 'utf8');
  await htmlToPdf(out + '.html', out + '.pdf', `퀵서비스다 통합 리포트 ${DATE}`);
  await closeHeadless();
  console.log(`기준 ${DATE}: 노출 ${siteN}/${today.length} · 상호만 ${brandN} · 공개 글 ${blog.total}`);
  console.log('ok', out + '.pdf', Math.round(fs.statSync(out + '.pdf').size / 1024) + 'KB');
  process.exit(0);
})().catch(async e => { console.error(e); await closeHeadless(); process.exit(1); });
