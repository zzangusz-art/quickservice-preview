// 주간 리포트 — 지난주(기준일 -7일 이전 마지막 측정일) 대비 AI·검색 노출 변화 + 이번 주 블로그 발행·키워드 겹침 점검.
// 입력: 측정/AI검색/추이.csv + 날짜 폴더 캡처. 출력: 보고/퀵서비스다_주간리포트_<날짜>.html/.pdf
// 실행: node tools/ai-exposure/weekly.mjs [YYYY-MM-DD] [--base YYYY-MM-DD]   (지난주 측정이 없으면 '첫 측정(기준선)' 리포트)
import fs from 'node:fs';
import path from 'node:path';
import { ENG, REPORT_DIR, REPORT_CSS, FONT_LINK, HOST_KO, readRows, makeCell, valid, kstDate, kstNow, addDays, weekday, md, esc, arg, qOrder, eOrder, oldOf, state, htmlToPdf, closeHeadless } from './lib.mjs';
import { matrix, gaps, evidence, blogData, blogTable, domainsTable, todo } from './sections.mjs';

const DATE = process.argv.slice(2).find((a, i, A) => /^\d{4}-\d{2}-\d{2}$/.test(a) && A[i - 1] !== '--base') || kstDate();
const rows = readRows(DATE); const cell = makeCell(rows);
const dates = [...new Set(rows.map(r => r.date))].sort();
if (!dates.includes(DATE)) { console.error('측정 없음:', DATE, '— 먼저 node tools/ai-exposure/capture.mjs'); process.exit(1); }
const BASE = arg('base') || dates.filter(d => d <= addDays(DATE, -7)).pop() || null;
const week = dates.filter(d => (BASE ? d > BASE : true) && d <= DATE && d > addDays(DATE, -7));
const engines = Object.keys(ENG).filter(e => rows.some(r => r.date === DATE && r.engine === e));
const weekHits = (e, q) => { const m = week.filter(d => cell(d, e, q)); return { hit: m.filter(d => cell(d, e, q).site).length, n: m.length }; };

const today = [...new Map(rows.filter(r => r.date === DATE && valid(r)).map(r => [r.engine + '|' + r.query, r])).values()].map(r => cell(DATE, r.engine, r.query))
  .sort((a, b) => qOrder(a.query) - qOrder(b.query) || eOrder(a.engine) - eOrder(b.engine));
const siteN = today.filter(r => r.site).length, brandN = today.filter(r => r.brand && !r.site).length, oldN = today.filter(r => !r.site && oldOf(DATE, r.engine, r.query)).length;

// 지난주 대비 변화(같은 엔진·질의를 양쪽 다 측정한 것만 비교)
const gained = [], lost = [], unmeasured = []; let kept = 0, baseSite = 0, common = 0;
if (BASE) for (const t of today) {
  const b = cell(BASE, t.engine, t.query);
  if (!b) { if (t.site) unmeasured.push(t); continue; }
  common++; if (b.site) baseSite++;
  if (t.site && !b.site) gained.push({ t, b }); else if (!t.site && b.site) lost.push({ t, b }); else if (t.site) kept++;
}
const todaySiteCommon = BASE ? today.filter(t => cell(BASE, t.engine, t.query) && t.site).length : siteN;

const nowStr = `${kstNow().toISOString().slice(0, 10)} ${kstNow().toISOString().slice(11, 16)}`;
const from = BASE ? addDays(BASE, 1) : addDays(DATE, -6);
const blog = blogData(from, DATE, nowStr);

(async () => {
  const cards = [];
  const list = BASE ? [...gained.map(x => ({ ...x, kind: 'gain' })), ...unmeasured.map(t => ({ t, kind: 'new' }))] : today.filter(t => t.site).map(t => ({ t, kind: 'now' }));
  for (const x of list.slice(0, 10)) {
    const w = weekHits(x.t.engine, x.t.query);
    const head = x.kind === 'gain' ? `${md(BASE)} ${state(x.b, oldOf(BASE, x.t.engine, x.t.query))} → <b>${md(DATE)} 노출</b>` : x.kind === 'new' ? `지난주 미측정 → <b>${md(DATE)} 노출</b>` : `<b>${md(DATE)} 노출</b>`;
    cards.push(await evidence(DATE, x.t.engine, x.t.query, head, `이번 주 측정 ${w.n}회 중 노출 ${w.hit}회`));
  }
  const delta = BASE ? todaySiteCommon - baseSite : null;
  const title = BASE ? '주간 리포트' : '주간 리포트 · 첫 측정(기준선)';
  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>퀵서비스다 ${title} ${DATE}</title>${FONT_LINK}<style>${REPORT_CSS}</style></head><body>
<div class="head"><div class="k">QUICKSERVICEDA · WEEKLY REPORT</div><h1>${title}</h1>
<div class="meta">${BASE ? `비교 <b>${BASE}(${weekday(BASE)})</b> → <b>${DATE}(${weekday(DATE)})</b>` : `측정일 <b>${DATE}(${weekday(DATE)})</b> — 다음 주부터 이 날과 비교합니다`} · 사이트 ${HOST_KO} · 측정 ${engines.map(e => ENG[e]).join('·')}</div></div>

<div class="kpi">
<div><b>${siteN}</b><span>이번 측정에서 퀵서비스다.kr이 나온 곳 (키워드×엔진, 유효 ${today.length}곳 중)</span></div>
<div><b>${delta == null ? '—' : (delta > 0 ? '+' : '') + delta}</b><span>${BASE ? `지난주 대비 노출 증감 (공통 측정 ${common}곳 기준: ${baseSite} → ${todaySiteCommon})` : '지난주 대비 증감 — 다음 주부터 표시'}</span></div>
<div><b>${brandN}</b><span>링크 없이 상호·대표번호만 나온 곳${oldN ? ` (그중 기존 사이트 .com ${oldN})` : ''}</span></div>
<div><b>${blog.published.length}</b><span>이번 주 발행한 블로그 글 (누적 ${blog.total}건)</span></div>
</div>
<p class="small muted">같은 키워드 ${new Set(today.map(t => t.query)).size}개를 매번 같은 방법(측정 전용 크롬, 로그인 없는 상태 기준)으로 검색·질문해 결과 화면을 저장하고, 결과에 퀵서비스다.kr 링크·주소가 나오면 '노출', 상호나 대표번호만 나오면 '상호 언급'으로 판정했습니다. 원본 캡처: 측정/AI검색/${DATE}/</p>

<h2>1. 키워드별 노출 현황 (${md(DATE)})</h2>
${matrix(DATE, cell, engines, week.length > 1 ? weekHits : null)}
${week.length > 1 ? `<p class="small muted">칸 아래 숫자 = 이번 주(${md(week[0])}~${md(DATE)}) 측정 횟수 중 노출 횟수.</p>` : ''}
${gaps(DATE)}

<h2>2. ${BASE ? `지난주 대비 새로 노출된 곳 (${gained.length + unmeasured.length}곳)` : `지금 노출되고 있는 곳 (${siteN}곳)`}</h2>
${BASE ? `<p class="note">지난주 노출 중 유지 ${kept}곳 · 이번에 빠진 곳 ${lost.length}곳${lost.length ? ` (${lost.map(x => `${esc(x.t.query)}/${ENG[x.t.engine]}`).join(', ')})` : ''}. AI 답변과 검색 결과는 날마다 조금씩 바뀌므로 표 아래 주간 노출 횟수를 함께 봐 주세요.</p>` : ''}
${cards.length ? cards.join('') : `<p class="muted">${BASE ? '이번 주에는 지난주 대비 새로 노출된 곳이 없습니다.' : '아직 퀵서비스다.kr이 나온 곳이 없습니다(사이트 공개 직후 기준선).'}</p>`}

<h2>3. 이번 주 블로그 발행과 키워드 겹침 점검 (${md(from)}~${md(DATE)})</h2>
${blogTable(blog)}

<h2>4. 검색 결과·AI 답변이 많이 인용한 출처</h2>
${await domainsTable(week.length ? week : [DATE])}

<h2>5. 다음 주 할 일</h2>
${todo({ d: DATE, cell, engines, b: blog, weekHits })}
</body></html>`;
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const out = path.join(REPORT_DIR, `퀵서비스다_주간리포트_${DATE}`);
  fs.writeFileSync(out + '.html', html, 'utf8');
  await htmlToPdf(out + '.html', out + '.pdf', `퀵서비스다 주간 리포트 ${DATE}`);
  await closeHeadless();
  console.log(`${BASE ? `기준 ${BASE} → ${DATE}` : `기준선 ${DATE}`}: 노출 ${siteN}/${today.length}${BASE ? ` · 신규 ${gained.length} · 미측정→노출 ${unmeasured.length} · 유지 ${kept} · 빠짐 ${lost.length}` : ''} · 상호만 ${brandN} · 이번 주 글 ${blog.published.length}`);
  console.log('ok', out + '.pdf', Math.round(fs.statSync(out + '.pdf').size / 1024) + 'KB');
  process.exit(0);
})().catch(async e => { console.error(e); await closeHeadless(); process.exit(1); });
