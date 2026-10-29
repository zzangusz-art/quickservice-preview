// 주간·월간 리포트 공용 구역 — 현황표, 증빙 카드, 블로그 발행·겹침 점검, 인용 출처, 다음 할 일
import { ENG, QUERIES, SEARCH, CHAT, esc, md, mark, oldOf, resultOf, readResult, shotOf, textOf, snippet, cropShot, dataUri, qOrder, eOrder, domainLabel, valid, LEGEND } from './lib.mjs';
import { allPosts, checkTargets, keywordDupes, suspectPairs } from '../blog/overlap.mjs';

// 키워드×엔진 현황표(한 날짜). weekHits가 있으면 칸 아래에 기간 노출 횟수를 작게 붙인다
export function matrix(d, cell, engines, weekHits) {
  const qs = QUERIES.filter(q => engines.some(e => cell(d, e, q)) || readResult(d).some(x => x.query === q));
  const head = `<tr><th style="width:17%">키워드</th>${engines.map(e => `<th class="c">${ENG[e]}</th>`).join('')}<th class="c">노출 엔진</th></tr>`;
  const body = qs.map(q => {
    const cells = engines.map(e => { const c = cell(d, e, q); const w = weekHits ? weekHits(e, q) : null;
      return `<td>${mark(c, c && oldOf(d, e, q))}${w && w.n > 1 ? `<br><span class="small muted">${w.hit}/${w.n}</span>` : ''}</td>`; }).join('');
    const n = engines.filter(e => (cell(d, e, q) || {}).site).length;
    return `<tr><td>${esc(q)}</td>${cells}<td><b>${n}</b></td></tr>`;
  }).join('');
  return `<table class="mx">${head}${body}</table>${LEGEND}`;
}

// 측정 못 한 엔진(차단·로그인 필요) 한 줄 설명
export function gaps(d) {
  const res = readResult(d); const by = {};
  for (const r of res) if (r.error || r.blocked) { const k = r.error === '로그인 필요' ? '로그인 필요' : r.error && r.error.startsWith('차단') ? '차단 화면' : '오류'; (by[r.engine] ||= {})[k] = ((by[r.engine] || {})[k] || 0) + 1; }
  const parts = Object.entries(by).map(([e, m]) => `${ENG[e]} ${Object.entries(m).map(([k, n]) => `${k} ${n}건`).join('·')}`);
  return parts.length ? `<p class="note">이번 측정에서 결과를 못 받은 곳: ${esc(parts.join(' / '))}. 봇 확인 화면은 우회하지 않고 '미측정'으로 둡니다. Claude·Gemini는 측정용 크롬 창에 한 번 로그인해 두면 다음 날부터 함께 측정됩니다.</p>` : '';
}

// 증빙 카드: 문맥 + 노출 위치 부근 캡처
export async function evidence(d, e, q, headline, sub) {
  const r = resultOf(d, e, q); const ratio = r && r.hit && r.hit.h ? Math.min(1, r.hit.y / r.hit.h) : 'top';
  const img = await cropShot(shotOf(d, e, q), ratio, 0.55);
  const qt = snippet(textOf(d, e, q), false);
  return `<div class="item"><div class="ih"><span class="kw">${esc(q)}</span><span class="en">${ENG[e]}</span><span class="chg">${headline}</span></div>
${sub ? `<p class="small muted">${sub}</p>` : ''}${qt ? `<p class="q">${esc(qt)}</p>` : ''}${img ? `<figure><img src="${dataUri(img)}" alt=""><figcaption>${ENG[e]} — "${esc(q)}" (${d})${ratio !== 'top' ? ' · 노출 위치 부근' : ''}</figcaption></figure>` : ''}</div>`;
}

// 블로그: 기간 안에 발행된 글 + 겹침 판정, 다음 기간 예약 수
export function blogData(from, to, nowStr) {
  const posts = allPosts(); const at = (p) => `${p.date} ${p.time || '00:00'}`;
  const published = posts.filter(p => p.date >= from && p.date <= to && at(p) <= nowStr).sort((a, b) => at(a).localeCompare(at(b)));
  const checked = checkTargets(published, posts);
  const scheduled = posts.filter(p => at(p) > nowStr);
  return { posts, published, checked, scheduled, dupes: keywordDupes(posts), pairs: suspectPairs(posts), total: posts.filter(p => at(p) <= nowStr).length };
}
const ICON = ['<span class="ok">✔</span>', '<span class="warn">△</span>', '<span class="warn">⚠</span>'];
export function blogTable(b, limit = 40) {
  if (!b.published.length) return '<p class="muted">이 기간에 발행된 글이 없습니다.</p>';
  const rows = b.checked.slice(0, limit).map(r => `<tr><td class="c">${ICON[r.level]}</td><td>${md(r.p.date)} ${r.p.time || ''}</td><td><b>${esc(r.p.title)}</b></td><td>${esc((r.p.tags || [])[0] || '')}</td><td class="small muted">${r.top.o ? `${esc(r.top.o.title.slice(0, 30))} (${r.top.t})` : '-'}</td></tr>`).join('');
  return `<table><tr><th class="c" style="width:6%">겹침</th><th style="width:12%">발행</th><th>제목</th><th style="width:15%">주 키워드</th><th style="width:27%">가장 비슷한 글(유사도)</th></tr>${rows}</table>
${b.checked.length > limit ? `<p class="small muted">외 ${b.checked.length - limit}건</p>` : ''}
<p class="small">겹침 점검: 주 키워드(글마다 겨냥하는 검색어)가 같은 글 <b>${b.dupes.length}</b>묶음 · 제목 앞부분이 겹치는 글 <b>${b.pairs.filter(x => !x.sameKw).length}</b>쌍 (전체 ${b.posts.length}건 기준, 예약 글 포함). ✔ 겹침 없음 · △ 문형만 비슷함 · ⚠ 같은 검색어를 겨냥.</p>`;
}

// 인용 출처 상위: 기간 동안 (날짜·엔진·질의) 결과에 나온 외부 도메인 횟수
export async function domainsTable(dates, top = 10) {
  const m = new Map(); const NOISE = /(^|\.)(navercorp\.com|openstreetmap\.org|mapbox\.com|kakaocorp\.com|w3\.org|schema\.org)$/i; // 지도 저작권·회사 소개 같은 화면 바닥 링크
  for (const d of dates) for (const r of readResult(d)) { if (r.error || r.blocked) continue; for (const h of (r.domains || []).filter(h => !NOISE.test(h)).slice(0, 8)) { const x = m.get(h) || { n: 0, eng: new Set(), q: new Set() }; x.n++; x.eng.add(r.engine); x.q.add(r.query); m.set(h, x); } }
  const list = [...m.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, top);
  if (!list.length) return '<p class="muted">출처 데이터 없음</p>';
  const rows = []; for (const [h, x] of list) rows.push(`<tr><td><b>${esc(await domainLabel(h))}</b></td><td class="c">${x.n}</td><td class="small">${[...x.eng].sort((a, b) => eOrder(a) - eOrder(b)).map(e => ENG[e]).join(', ')}</td><td class="small">${[...x.q].sort((a, b) => qOrder(a) - qOrder(b)).map(esc).join(', ')}</td></tr>`);
  return `<table><tr><th style="width:28%">출처 도메인</th><th class="c" style="width:9%">횟수</th><th style="width:25%">나온 엔진</th><th>나온 키워드</th></tr>${rows.join('')}</table>
<p class="small muted">검색 결과·AI 답변에 링크로 걸린 외부 사이트(검색엔진 자체 도메인 제외)를 센 값입니다. 같은 키워드에서 자주 인용되는 곳이 우리가 따라잡아야 할 자리입니다.</p>`;
}

// 다음 할 일(측정 결과에서 자동 도출)
export function todo({ d, cell, engines, b, weekHits }) {
  const items = [];
  const zero = QUERIES.filter(q => engines.some(e => cell(d, e, q)) && !engines.some(e => (cell(d, e, q) || {}).site) && !(weekHits && engines.some(e => weekHits(e, q).hit)));
  if (zero.length) items.push(`아직 어느 엔진에도 퀵서비스다.kr이 안 나오는 키워드: <b>${zero.map(esc).join(', ')}</b> — 해당 키워드 글·지역 페이지에 내부 링크를 더 걸고, 첫 문단에 키워드와 요금·시간 직답을 넣어 보강합니다.`);
  const brandOnly = QUERIES.filter(q => engines.some(e => { const c = cell(d, e, q); return c && !c.site && (c.brand || oldOf(d, e, q)); }));
  if (brandOnly.length) items.push(`상호·번호나 기존 사이트(.com)만 나오고 .kr 링크는 없는 키워드: <b>${brandOnly.map(esc).join(', ')}</b> — 기존 사이트에서 새 사이트로 연결(링크·301 여부)을 정하면 노출이 .kr로 모입니다.`);
  const chatMiss = CHAT.filter(e => engines.includes(e) && QUERIES.every(q => !(cell(d, e, q) || {}).site));
  if (chatMiss.length) items.push(`대화형 AI(${chatMiss.map(e => ENG[e]).join('·')})에서는 아직 인용이 없습니다. 이 엔진들은 검색 색인(Bing·구글)과 외부 언급을 따라가므로, Bing 색인·IndexNow 알림과 지역 업체 정보(네이버 플레이스·카카오맵·구글 비즈니스) 등록이 먼저입니다.`);
  if (b && (b.dupes.length || b.checked.some(r => r.level === 2))) items.push('블로그 주 키워드가 겹치는 글이 있습니다 — 뒤 글의 앞머리 키워드를 바꾸거나 앞 글을 보강하는 쪽으로 정리합니다.');
  if (b) items.push(`예약 발행 대기 ${b.scheduled.length}건 — 하루 3편(09·13·18시) 자동 발행이 이어집니다.`);
  return `<ul>${items.map(x => `<li>${x}</li>`).join('')}</ul>`;
}

export { SEARCH, CHAT, valid };
