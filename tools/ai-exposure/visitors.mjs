// 방문·전환 리포트 — 측정/방문.json(GA4에서 읽은 일별 방문자·전환 행동·유입 경로)과 측정/서치콘솔.json으로 만든다.
// 출력: 보고/퀵서비스다_방문전환리포트_<기준일>.html/.pdf
//   node tools/ai-exposure/visitors.mjs
import fs from 'node:fs';
import path from 'node:path';
import { PROJ, REPORT_DIR, REPORT_CSS, FONT_LINK, HOST_KO, weekday, md, esc, htmlToPdf, closeHeadless } from './lib.mjs';

const json = (...p) => { try { return JSON.parse(fs.readFileSync(path.join(PROJ, ...p), 'utf8')); } catch (_) { return null; } };
const V = json('측정', '방문.json'), G = json('측정', '서치콘솔.json');
if (!V) { console.error('측정/방문.json 없음'); process.exit(1); }
const DATE = V.to;
const n = (x) => Number(x).toLocaleString('ko-KR');
const sum = (a, f) => a.reduce((s, x) => s + f(x), 0);
const after = V.daily.filter(d => d.d >= V.sessionsSince.from);
const customers = sum(V.daily, d => d.customer || 0);
const eventsN = sum(V.events, e => e.count);
const perDay = (sum(after, d => d.users) / after.length).toFixed(1);
const rate = Math.round(customers / V.sessionsSince.sessions * 100);
const months = Object.entries(V.daily.reduce((m, d) => { const k = d.d.slice(0, 7); (m[k] ||= []).push(d); return m; }, {}));

// 일별 방문자 막대(전환 행동이 있던 날은 노란 표시)
const chart = (() => {
  const W = 680, H = 150, L = 28, R = 8, T = 22, B = 26, D = V.daily, mx = Math.max(5, ...D.map(d => d.users));
  const x = i => L + (i + 0.5) * (W - L - R) / D.length, y = v => T + (1 - v / mx) * (H - T - B), bw = (W - L - R) / D.length * 0.62;
  const bars = D.map((d, i) => `<rect x="${x(i) - bw / 2}" y="${y(d.users)}" width="${bw}" height="${H - B - y(d.users)}" rx="2" fill="#1e88e5"/><text x="${x(i)}" y="${y(d.users) - 5}" font-size="11" font-weight="700" text-anchor="middle" fill="#0b2545">${d.users}</text><text x="${x(i)}" y="${H - B + 15}" font-size="9.5" text-anchor="middle" fill="#6b7485">${md(d.d)}</text>${d.conv.length ? `<circle cx="${x(i)}" cy="${y(d.users) - 18}" r="4" fill="${d.customer ? '#14804a' : '#c9ced6'}"/>` : ''}`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" width="100%"><line x1="${L}" x2="${W - R}" y1="${H - B}" y2="${H - B}" stroke="#dde6f0"/>${bars}</svg>
<p class="small muted"><span style="color:#14804a">●</span> 고객의 전환 행동으로 추정한 날 · <span style="color:#c9ced6">●</span> 점검으로 추정한 전환 행동이 있던 날</p>`;
})();

(async () => {
  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>퀵서비스다 방문·전환 리포트 ${DATE}</title>${FONT_LINK}<style>${REPORT_CSS}</style></head><body>
<div class="head"><div class="k">QUICKSERVICEDA · VISITORS &amp; CONVERSIONS</div><h1>방문·전환 리포트</h1>
<div class="meta">기간 <b>${V.from} ~ ${V.to}(${weekday(V.to)})</b> · 사이트 ${HOST_KO} · 자료 Google Analytics(GA4)</div></div>

<div class="kpi">
<div><b>${n(V.total.users)}</b><span>오픈 후 방문자(명)</span></div>
<div><b>${perDay}</b><span>하루 평균 방문자(${md(after[0].d)}~${md(V.to)}, 오픈 직후 3일 제외)</span></div>
<div><b>${n(eventsN)}</b><span>기록된 전환 행동(회)</span></div>
<div><b>${customers}</b><span>실제 고객으로 추정한 전환(건)</span></div>
</div>
<p class="note">오픈 후 13일 동안 방문자는 ${n(V.total.users)}명, 하루 3명 안팎으로 아직 적습니다. 다만 11월 5~7일에 온라인 접수 클릭, 요금 문의, 전화 클릭이 처음으로 잡혔습니다. 표본이 작아 전환율(세션 ${V.sessionsSince.sessions}회 중 ${customers}건, 약 ${rate}%)은 참고로만 봐 주세요.</p>

<h2>1. 일별 방문자</h2>
${chart}
<table><tr><th class="c">날짜</th><th class="c">방문자</th><th class="c">페이지뷰</th><th>전환 행동</th></tr>${V.daily.map(d => `<tr><td class="c">${md(d.d)}(${weekday(d.d)})</td><td class="c"><b>${d.users}</b></td><td class="c">${d.pv}</td><td class="small">${d.conv.map(c => `${esc(c[0])} ${c[1]}회`).join(', ') || '<span class="muted">-</span>'}${d.conv.length ? (d.customer ? ' <span class="ok">고객 추정</span>' : ' <span class="muted">점검 추정</span>') : ''}</td></tr>`).join('')}
<tr><th class="c">합계</th><th class="c">${n(V.total.users)}명*</th><th class="c">${n(V.total.pageviews)}</th><th></th></tr></table>
<p class="small muted">* 기간 전체에서 중복을 뺀 방문자 수입니다. 일별 숫자의 합(${sum(V.daily, d => d.users)}명)과 다릅니다. 세션은 ${n(V.total.sessions)}회입니다. 11/9는 조회 시점까지의 값입니다.</p>

<h2>2. 월별 방문자</h2>
<table><tr><th>월</th><th class="c">집계 일수</th><th class="c">방문자(일별 합)</th><th class="c">하루 평균</th></tr>${months.map(([m, a]) => `<tr><td>${+m.slice(5)}월</td><td class="c">${a.length}일</td><td class="c">${sum(a, d => d.users)}명</td><td class="c">${(sum(a, d => d.users) / a.length).toFixed(1)}명</td></tr>`).join('')}</table>
<p class="small muted">10월은 오픈 직후 점검 방문이 많이 포함돼 있고, 두 달 모두 한 달을 채우지 못해 월간 증감은 12월 보고부터 비교할 수 있습니다.</p>

<h2>3. 전환 행동</h2>
<table><tr><th>항목</th><th class="c">횟수</th><th class="c">사람 수</th><th>날짜</th></tr>${V.events.map(e => `<tr><td>${esc(e.name)}</td><td class="c"><b>${e.count}</b></td><td class="c">${e.users}</td><td class="small">${esc(e.note)}</td></tr>`).join('')}</table>
<p class="small">실제 고객으로 추정한 ${customers}건은 11/5 온라인 접수 클릭 1건, 11/6 요금 문의 1건(작성 후 카카오 전송까지 한 흐름), 11/7 전화 클릭 2건입니다. 10/28은 공개 당일, 11/9는 접수 버튼을 바꾼 날이고 온라인 접수 클릭 7회가 한 사람에게서 나와 점검으로 추정해 뺐습니다. 이 구분은 추정입니다.</p>
<p class="small muted">전환 전 단계: ${V.steps.map(s => `${esc(s.name)} ${s.count}회`).join(' · ')}</p>

<h2>4. 어디서 들어왔나</h2>
<div class="two"><div><table><tr><th>경로</th><th class="c">세션</th><th class="c">참여율</th><th class="c">평균 체류</th></tr>${V.channels.map(c => `<tr><td>${esc(c.name)}</td><td class="c"><b>${c.sessions}</b></td><td class="c">${Math.round(c.engaged)}%</td><td class="c">${esc(c.avg)}</td></tr>`).join('')}</table></div>
<div><table><tr><th>검색 유입</th><th class="c">세션</th></tr>${V.sources.map(s => `<tr><td>${esc(s[0])}</td><td class="c">${s[1]}</td></tr>`).join('')}</table></div></div>
<p class="small">검색으로 들어온 방문은 직접 방문보다 참여율과 체류 시간이 높습니다. 직접 방문에는 저희 쪽 점검 방문이 포함돼 있습니다.</p>

<div style="page-break-inside:avoid"><h2>5. 많이 본 페이지 · 기기</h2>
<div class="two"><div><table><tr><th>페이지</th><th class="c">조회</th><th class="c">사람</th></tr>${V.pages.map(p => `<tr><td>${esc(p[0])}</td><td class="c">${p[2]}</td><td class="c">${p[3]}</td></tr>`).join('')}</table></div>
<div><table><tr><th>기기</th><th class="c">방문자</th></tr>${V.devices.map(p => `<tr><td>${esc(p[0])}</td><td class="c">${p[1]}</td></tr>`).join('')}</table><table><tr><th>브라우저</th><th class="c">방문자</th></tr>${V.browsers.map(p => `<tr><td>${esc(p[0])}</td><td class="c">${p[1]}</td></tr>`).join('')}</table></div></div></div>

${G ? `<h2>6. 구글 검색 (${md(G.from)}~${md(G.to)})</h2>
<p>구글 검색 결과에서 <b>노출 ${n(G.impressions)}회, 클릭 ${n(G.clicks)}회</b>(클릭률 ${G.ctr}%, 평균 순위 ${G.position})입니다. 검색 노출이 방문으로 이어지는 양은 아직 적어서, 순위가 올라가야 방문이 함께 늘어납니다.</p>` : ''}

<h2>${G ? 7 : 6}. 앞으로 볼 것</h2>
<ul>
<li>기존 퀵서비스다.com을 .kr로 연결하면 그쪽 방문과 검색 신호가 옮겨 옵니다. 방문자를 가장 크게 늘릴 수 있는 작업입니다.</li>
<li>네이버 플레이스·카카오맵·구글 비즈니스 프로필에 .kr을 등록해 외부 유입 경로를 만듭니다.</li>
<li>실제 접수 건수와 GA4 전환 행동을 맞춰 보면 어떤 경로가 매출로 이어지는지 알 수 있습니다.</li>
</ul>

<h2>${G ? 8 : 7}. 수치의 한계</h2>
<ul class="small">
<li>저희 쪽 점검·측정 방문이 일부 포함돼 있어 실제 방문자는 이 수치보다 적습니다.</li>
<li>GA4는 클릭과 작성까지만 기록합니다. 실제 접수·매출 건수는 알 수 없고, PC에서 번호를 보고 직접 전화한 경우는 잡히지 않습니다.</li>
<li>광고 차단이나 쿠키 거부 환경의 방문은 빠질 수 있습니다.</li>
</ul>
</body></html>`;
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const out = path.join(REPORT_DIR, `퀵서비스다_방문전환리포트_${DATE}`);
  fs.writeFileSync(out + '.html', html, 'utf8');
  await htmlToPdf(out + '.html', out + '.pdf', `퀵서비스다 방문·전환 리포트 ${DATE}`);
  await closeHeadless();
  console.log('ok', out + '.pdf', Math.round(fs.statSync(out + '.pdf').size / 1024) + 'KB');
  process.exit(0);
})().catch(async e => { console.error(e); await closeHeadless(); process.exit(1); });
