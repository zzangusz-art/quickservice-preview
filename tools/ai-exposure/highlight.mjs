// 통합 성과 리포트 — 착수부터 기준일까지의 성과를 앞에 모아 보여 주는 고객 보고용 PDF
// 입력: 측정/성과_<날짜>.json(GA4·서치콘솔·Cloudflare·진단·콘텐츠·타임라인·다음 단계), 측정/일일/*.md(AI 답변 상호 언급 추이), 측정/AI검색(노출 증빙 화면)
// 출력: 보고/퀵서비스다_통합성과리포트_<날짜>.html/.pdf
//   node tools/ai-exposure/highlight.mjs [YYYY-MM-DD]
import fs from 'node:fs';
import path from 'node:path';
import { PROJ, REPORT_DIR, REPORT_CSS, FONT_LINK, esc, htmlToPdf, kstDate } from './lib.mjs';
import { evidence } from './sections.mjs';
import { bars, hbars, n } from './charts.mjs';

const DATE = process.argv.slice(2).find(a => /^\d{4}-\d{2}-\d{2}$/.test(a)) || kstDate();
const D = JSON.parse(fs.readFileSync(path.join(PROJ, '측정', `성과_${DATE}.json`), 'utf8'));
const pct = (a, b) => b ? Math.round((a - b) / b * 100) : 0;
const mdDate = d => d.replace(/^\d{4}-/, '').replace(/^0?(\d+)-0?(\d+)$/, '$1/$2');

// AI 답변 상호·번호 언급: 일일 점검 첫 줄에서 「유효 N곳」「상호·번호만 N」
const DAILY = path.join(PROJ, '측정', '일일');
const mentions = fs.readdirSync(DAILY).filter(f => /^\d{4}-\d{2}-\d{2}\.md$/.test(f) && f.slice(0, 10) <= DATE).sort().map(f => {
  const l = (fs.readFileSync(path.join(DAILY, f), 'utf8').match(/AI·검색 노출:[^\n]*/) || [''])[0];
  const num = re => +((l.match(re) || [])[1] || 0);
  return { d: f.slice(5, 10), valid: num(/유효 (\d+)곳/), brand: num(/상호·번호만 (\d+)/), site: num(/\.kr 노출 (\d+)/) };
}).filter(x => x.valid > 0);
const firstM = mentions[0], lastM = mentions[mentions.length - 1];
const siteDays = mentions.filter(m => m.site > 0);

(async () => {
  const g = D.ga, s = D.gsc, c = D.cloudflare, ct = D.content, dg = D.diagnosis.scores;
  const peak = s.daily.reduce((a, b) => b[2] > a[2] ? b : a);
  const firstImp = s.daily.find(x => x[2] > 0);
  const m0 = g.months[0], m1 = g.months[1];
  const wk0 = g.weeks[0], wk1 = g.weeks[1];
  const actionsN = g.actions.reduce((a, b) => a + b[1], 0);
  const organic = g.channels[0], direct = g.channels[1];
  const ones = s.queries.filter(q => q[3] === '1.0');
  const ev = await evidence('2026-11-10', 'naver', '경기 퀵서비스', '<b>퀵서비스다.kr 노출</b>', `측정 기간 중 ${siteDays.map(x => mdDate(x.d)).join('·')} 노출 확인`).catch(() => '');

  const kpis = [
    [`${dg['종합'][0]} → ${dg['종합'][1]}점`, `사이트 품질 종합 점수<br>기존 .com 대비 +${dg['종합'][1] - dg['종합'][0]}점`],
    [`${n(peak[2])}회`, `구글 하루 검색 노출 최고(${mdDate(peak[0])})<br>첫 노출일 ${firstImp[2]}회의 ${(peak[2] / firstImp[2]).toFixed(1)}배`],
    [`${s.position}위`, `구글 평균 게재 순위(28일)<br>1위 검색어 ${ones.length}개`],
    [`${organic.key}건`, `검색 유입에서 나온 주요 전환<br>전체 주요 전환의 100%`],
    [`${actionsN}회`, `고객 행동(접수·전화·문의)<br>10월 ${m0.actions}회 → 11월 ${m1.actions}회`],
    [`${m1.users}명`, `11월 월 방문자(1~15일)<br>10월 ${m0.users}명 대비 +${pct(m1.users, m0.users)}%`],
    [`${lastM.brand}곳`, `AI·검색 답변 상호·번호 언급<br>${mdDate(firstM.d)} ${firstM.brand}곳의 ${(lastM.brand / firstM.brand).toFixed(1)}배`],
    [`${ct.published}편`, `물류 가이드 글 공개<br>지역 키워드 ${ct.regionChips}곳 연결`],
  ];

  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>퀵서비스다 통합 성과 리포트 ${DATE}</title>${FONT_LINK}<style>${REPORT_CSS}
.kpi{grid-template-columns:repeat(4,1fr)}.kpi div{background:#fff}.kpi b{font-size:17pt}.kpi div:nth-child(-n+4){border-color:#b9d7f5;background:#f5faff}
.hero{background:linear-gradient(135deg,#0b2545,#1e5fa8);color:#fff;border-radius:10px;padding:9mm 9mm 8mm;margin-bottom:6mm}.hero .k{font-size:9pt;letter-spacing:.12em;font-weight:800;color:#9fd0ff}.hero h1{font-size:23pt;margin:4px 0 2px}.hero p{margin:0;color:#d6e8fb;font-size:10pt}
.hl{display:grid;grid-template-columns:1fr 1fr;gap:6px 14px;margin:6px 0}.hl div{border-left:4px solid var(--green);background:#f3faf6;padding:5px 9px;border-radius:0 6px 6px 0;font-size:9.6pt}.hl b{color:var(--green)}
.chart{border:1px solid var(--line);border-radius:8px;padding:8px 10px 4px;margin:6px 0;page-break-inside:avoid}.chart h3{margin:0 0 2px}.chart p{margin:0 0 4px}
.hb div{display:grid;grid-template-columns:120px 1fr 44px;gap:8px;align-items:center;font-size:9.2pt;margin:3px 0}.hb i{display:block;height:10px;background:#eef3f8;border-radius:5px;overflow:hidden}.hb b{display:block;height:100%;border-radius:5px}.hb em{font-style:normal;font-weight:800;color:var(--navy);text-align:right}
.up{color:var(--green);font-weight:800}.tl td:first-child{white-space:nowrap;font-weight:800;color:var(--navy);width:52px}
.nx{border:1px solid var(--line);border-radius:8px;padding:6px 10px;margin:6px 0;page-break-inside:avoid}.nx b{color:var(--navy)}
.pb{page-break-before:always}</style></head><body>

<div class="hero"><div class="k">QUICKSERVICEDA · 통합 성과 리포트</div><h1>퀵서비스다.kr 4주 성과</h1>
<p>착수 ${D.start.replace(/-/g, '.')} · 운영 시작 ${D.open.replace(/-/g, '.')} · 기준일 ${DATE.replace(/-/g, '.')} · 자료: 구글 애널리틱스(GA4)·구글 서치콘솔·Cloudflare·매일 AI 검색 측정</p></div>

<h2>한눈에 보는 성과</h2>
<div class="kpi">${kpis.map(([b, sp]) => `<div><b>${b}</b><span>${sp}</span></div>`).join('')}</div>
<div class="hl">
<div><b>품질</b> — 진단 점수 SEO ${dg.SEO[0]}→${dg.SEO[1]}, AEO ${dg.AEO[0]}→${dg.AEO[1]}, GEO ${dg.GEO[0]}→${dg.GEO[1]}. 검색엔진과 AI가 읽기 좋은 구조로 바뀌었습니다.</div>
<div><b>검색 유입의 질</b> — 검색으로 들어온 방문은 참여율 ${organic.engaged.toFixed(0)}%·평균 ${organic.avg}로 직접 방문(${direct.engaged.toFixed(0)}%·${direct.avg})보다 높고, 주요 전환 ${organic.key}건이 모두 검색에서 나왔습니다.</div>
<div><b>고객 행동</b> — 온라인 접수 클릭 ${g.actions[0][1]}회, 전화 클릭 ${g.actions[1][1]}회 등 ${actionsN}회. 11월에만 ${m1.actions}회로 10월(${m0.actions}회)보다 크게 늘었습니다.</div>
<div><b>AI 검색</b> — AI·검색 답변에서 퀵서비스다 상호·번호 언급이 ${firstM.brand}곳 → ${lastM.brand}곳. 네이버 「경기 퀵서비스」에서는 퀵서비스다.kr이 직접 노출됐습니다.</div>
${D.naver ? `<div><b>네이버 수집</b> — 네이버 웹문서에서 확인되는 글이 ${D.naver.beforeAt} ${D.naver.before}편 → ${D.naver.at} ${D.naver.found}편. 하남퀵·대구용달처럼 이번 주 글도 들어가기 시작했습니다.</div>` : ''}
<div><b>콘텐츠</b> — 물류 가이드 ${ct.published}편 공개, 고객 네이버 블로그 키워드 ${ct.naverKeywords}개 확보, 서울퀵·인천퀵·경기퀵·지방퀵 아래 지역 키워드 ${ct.regionChips}곳 연결.</div>
</div>

<h2>1. 방문과 고객 행동</h2>
<table><tr><th>구분</th><th>기간</th><th class="c">월 방문자</th><th class="c">세션</th><th class="c">페이지뷰</th><th class="c">고객 행동</th></tr>
${g.months.map(m => `<tr><td><b>${m.label}</b></td><td>${m.range}</td><td class="c">${m.users}명</td><td class="c">${m.sessions}</td><td class="c">${m.pageviews}</td><td class="c">${m.actions}회</td></tr>`).join('')}
<tr><td><b>증가</b></td><td>10월 → 11월</td><td class="c up">+${m1.users - m0.users}명(+${pct(m1.users, m0.users)}%)</td><td class="c up">+${m1.sessions - m0.sessions}</td><td class="c up">+${m1.pageviews - m0.pageviews}</td><td class="c up">+${m1.actions - m0.actions}회</td></tr></table>
<p class="small muted">10월은 운영을 시작한 10/28부터 4일, 11월은 15일까지입니다. 누적(${g.total.range}) 방문자 ${g.total.users}명·세션 ${g.total.sessions}·페이지뷰 ${g.total.pageviews}.</p>
<div class="chart"><h3>일 방문자</h3><p class="small muted">GA4 하루 방문자(명). 운영 첫 사흘(10/28~30)은 오픈 점검 방문이 섞여 있습니다. 주간 합계 ${wk0.label} ${wk0.users}명 → ${wk1.label} ${wk1.users}명(<span class="up">+${pct(wk1.users, wk0.users)}%</span>).</p>
${bars(g.daily.map(([d, v]) => [mdDate(d), v]), { h: 140, hi: ['11/11'], unit: '명' })}</div>
<div class="two">
<div class="chart"><h3>고객 행동 ${actionsN}회</h3><p class="small muted">GA4 이벤트, ${g.total.range}</p>${hbars(g.actions.map(a => [a[0], a[1]]), '#14804a')}</div>
<div class="chart"><h3>유입별 질</h3><table><tr><th>유입</th><th class="c">세션</th><th class="c">참여율</th><th class="c">평균</th><th class="c">주요 전환</th></tr>${g.channels.map(ch => `<tr><td>${ch.name}</td><td class="c">${ch.sessions}</td><td class="c">${ch.engaged.toFixed(0)}%</td><td class="c">${ch.avg}</td><td class="c">${ch.key ? `<b class="up">${ch.key}건</b>` : '0'}</td></tr>`).join('')}</table><p class="small muted">검색으로 온 방문은 더 오래 머물고, 실제 문의로 이어집니다.</p></div>
</div>

<h2 class="pb">2. 구글 검색 성과</h2>
<div class="kpi"><div><b>${n(s.impressions)}회</b><span>검색 노출(28일)</span></div><div><b>${s.clicks}회</b><span>검색 클릭(28일)</span></div><div><b>${s.ctr}%</b><span>클릭률</span></div><div><b>${s.position}위</b><span>평균 게재 순위</span></div></div>
<div class="chart"><h3>하루 검색 노출</h3><p class="small muted">구글 서치콘솔, ${s.range}. 운영 열흘 만에 하루 ${peak[2]}회(${mdDate(peak[0])})까지 올랐습니다.</p>
${bars(s.daily.map(([d, , v]) => [mdDate(d), v]), { h: 150, hi: [mdDate(peak[0])], unit: '회' })}</div>
<div class="two">
<div><h3>노출된 검색어</h3><table><tr><th>검색어</th><th class="c">클릭</th><th class="c">노출</th><th class="c">순위</th></tr>${s.queries.map(q => `<tr><td>${esc(q[0])}</td><td class="c">${q[1] || ''}</td><td class="c">${q[2]}</td><td class="c">${q[3] === '1.0' ? '<b class="up">1위</b>' : q[3] === '-' ? '' : (+q[3]).toFixed(0) + '위'}</td></tr>`).join('')}</table></div>
<div><h3>노출·클릭이 많은 페이지</h3><table><tr><th>페이지</th><th class="c">클릭</th><th class="c">노출</th></tr>${s.pages.map(p => `<tr><td>${esc(p[0])}</td><td class="c">${p[2] || ''}</td><td class="c">${p[3]}</td></tr>`).join('')}</table>
<p class="small muted">브랜드 검색 「퀵서비스다」 클릭 ${s.queries[0][1]}회, 「10톤 화물차」「다마스제원」 1위, 요금 안내 페이지 노출 ${s.pages.find(p => p[1] === '/pricing/')[3]}회.</p></div>
</div>
<div class="note">11/11~14에 구글이 사이트를 다시 수집하면서 색인 페이지가 ${s.index.before}쪽 → ${s.index.now}쪽으로 조정됐고, 같은 시기 하루 노출도 줄었습니다. 새 사이트가 짧은 기간에 글을 많이 올리면 흔히 거치는 재평가 구간입니다. 대응은 5장에 정리했습니다.</div>

<h2>3. AI 검색 성과</h2>
<div class="chart"><h3>AI·검색 답변의 퀵서비스다 상호·번호 언급</h3><p class="small muted">매일 핵심·지역 키워드를 네이버·네이버 AI탭·Bing·ChatGPT·Claude·Gemini 등에 물어 답변에 퀵서비스다 상호나 대표번호가 나온 곳 수. ${mdDate(firstM.d)} ${firstM.brand}곳 → ${mdDate(lastM.d)} ${lastM.brand}곳.</p>
${bars(mentions.map(m => [mdDate(m.d), m.brand]), { h: 135, hi: [mdDate(lastM.d)], unit: '곳' })}</div>
<div class="two">
<div>${ev || ''}</div>
<div class="chart"><h3>AI·검색 봇 방문 7일 ${n(c.aiBots7d)}회</h3><p class="small muted">Cloudflare, ${c.readAt.slice(5).replace('-', '/')} 기준. 아마존·구글·애플·Claude·ChatGPT·Perplexity 봇이 사이트를 읽어 갑니다.</p>${hbars(c.bots)}</div>
</div>

<h2 class="pb">4. 콘텐츠와 키워드 자산</h2>
<div class="kpi"><div><b>${ct.published}편</b><span>물류 가이드 공개</span></div><div><b>${ct.scheduled}편</b><span>${ct.lastScheduled.slice(5).replace('-', '/')}까지 예약</span></div><div><b>${ct.naverKeywords}개</b><span>네이버 블로그 제목 키워드 확보</span></div><div><b>${ct.regionChips}곳</b><span>지역 키워드 연결(강남퀵·부평퀵…)</span></div></div>
<div class="two">
<div class="chart"><h3>분류별 공개 글</h3>${hbars(ct.categories)}</div>
<div class="chart"><h3>핵심 키워드 노출 구조</h3><ul class="small">
<li>홈 제목: <b>서울퀵·인천퀵·경기퀵·다마스퀵·지방퀵 24시간</b></li>
<li>지역 안내: 서울 25개 구·인천·경기 31개 시군·지방 도시를 「강남퀵」「부평퀵」「수원퀵」「대구용달」처럼 검색어 모양으로 연결</li>
<li>홈·모든 페이지 하단에 지역별 퀵 링크, AI용 안내 파일(llms.txt)에도 지역 목록</li>
<li>11/10 이후 새 글 제목은 고객 네이버 블로그 키워드(예: 안산퀵·남양주퀵·하남퀵·일산퀵)로 작성</li>
<li>네이버 서치어드바이저·사이트맵·RSS·IndexNow(새 글 즉시 알림)·네이버 애널리틱스 연결</li></ul>
${D.naver ? `<p class="small"><b>네이버 웹문서 수집</b>: 글 제목으로 검색해 퀵서비스다.kr이 나온 글 ${D.naver.beforeAt} ${D.naver.before}편 → ${D.naver.at} <b class="up">${D.naver.found}편</b>(제목 ${D.naver.checked}개 확인). 최근 글도 수집되기 시작했습니다(${D.naver.recent.map(esc).join(', ')}).</p>` : ''}</div>
</div>

<h3>작업 타임라인</h3>
<table class="tl">${D.timeline.map(([d, t]) => `<tr><td>${d}</td><td>${esc(t)}</td></tr>`).join('')}</table>

<h2>5. 다음 단계 — 성과를 키우는 일</h2>
${D.next.map(([t, d], i) => `<div class="nx"><b>${i + 1}. ${esc(t)}</b><br><span class="small">${esc(d)}</span></div>`).join('')}
<p class="small muted">수치 출처: GA4 속성(10/28~11/15), 구글 서치콘솔(최근 28일), Cloudflare(11/9), 매일 AI 검색 측정(측정/일일). 진단 점수는 같은 도구로 기존 퀵서비스다.com과 새 사이트를 잰 값입니다.</p>
</body></html>`;
  const base = path.join(REPORT_DIR, `퀵서비스다_통합성과리포트_${DATE}`);
  fs.writeFileSync(base + '.html', html);
  await htmlToPdf(base + '.html', base + '.pdf', `퀵서비스다 통합 성과 리포트 ${DATE}`);
  console.log('저장:', base + '.pdf', '| 언급 추이', mentions.map(m => m.d + ':' + m.brand).join(' '));
})();
