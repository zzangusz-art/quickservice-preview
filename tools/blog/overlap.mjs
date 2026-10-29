// 블로그 키워드 겹침 점검 — 같은 키워드로 우리 글끼리 검색 순위를 나눠 먹지 않게(카니발리제이션) 발행·예약 글을 비교한다.
//   node tools/blog/overlap.mjs                   → 전체 글끼리 겹침 의심 쌍
//   node tools/blog/overlap.mjs --today [--days 3] [--save]
//        → 오늘(KST) 발행 글 + 앞으로 N일 예약 글을 다른 모든 글과 비교. --save 면 측정/블로그점검/<날짜>.md·json 저장
//   node tools/blog/overlap.mjs "후보 제목" ...     → 새 글 후보 제목이 기존 글과 얼마나 겹치는지
// 판정: ⚠ 겹침 = 주 키워드(tags 첫 항목)가 같거나 제목 앞부분 유사도 45 이상, △ 일부 = 유사도 30 이상 또는 태그 절반 이상 공유
// (하나회원권 scripts/topic-overlap.js 의 제목 유사도 방식 + 퀵서비스다 글 머리말의 주 키워드·태그 비교)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPosts } from './lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..');
const BLOG = path.join(REPO, 'content', 'blog');
const OUT = process.env.QS_CHECK_DIR || path.join(REPO, '..', '측정', '블로그점검');
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d; };
const now = new Date(Date.now() + 9 * 3600e3); const TODAY = opt('date', now.toISOString().slice(0, 10)); const NOW = `${TODAY} ${now.toISOString().slice(11, 16)}`;
const addDays = (d, n) => new Date(new Date(d + 'T00:00:00Z').getTime() + n * 864e5).toISOString().slice(0, 10);

// 모든 글에 흔한 말은 빼고 비교(퀵·퀵서비스·안내 같은 말이 겹쳐도 같은 주제가 아니다)
const STOP = new Set(['퀵서비스다', '퀵서비스', '퀵', '안내', '정리', '가이드', '방법', '기준', '확인', '알아', '것', '때', '할', '수', '고르는', '부를', '보낼', '보내는', '언제', '얼마', '무엇', '어떻게', '2026년', '10월', '11월', '12월']);
const norm = (s) => String(s || '').replace(/\s+/g, '').toLowerCase();
const words = (t) => String(t || '').replace(/\(.*?\)/g, ' ').split(/[\s:·,|/?!~—\-–()'"“”.]+/).map(w => w.replace(/(은|는|이|가|을|를|의|에|와|과|도|로|으로|에서|까지|부터|이나|나|요)$/, '')).filter(w => w.length >= 2 && !STOP.has(w));
const strip = (t) => { let s = String(t || ''); for (const w of ['퀵서비스다', '퀵서비스']) s = s.split(w).join(' '); return s; };
const bigrams = (t) => { const s = strip(t).replace(/[^가-힣a-z0-9]/gi, ''); const o = new Set(); for (let i = 0; i < s.length - 1; i++) o.add(s.slice(i, i + 2)); return o; };
const jac = (a, b) => { let n = 0; for (const x of a) if (b.has(x)) n++; return n / Math.max(1, a.size + b.size - n); };
// 제목 앞 30자(검색 결과에 보이는 핵심 구간) bigram 60% + 핵심 단어 40%
export const titleScore = (a, b) => { const ha = a.slice(0, 30), hb = b.slice(0, 30); return Math.round((jac(bigrams(ha), bigrams(hb)) * 0.6 + jac(new Set(words(ha)), new Set(words(hb))) * 0.4) * 100); };
const tagSet = (p) => new Set((p.tags || []).map(norm));

// 제목 앞머리(첫 쉼표·콜론 앞) = 검색어를 겨냥한 자리. '대전 퀵, 서울·경기에서 …'와 '전국 퀵서비스, 서울·경기에서 …'처럼
// 뒷부분 문형만 같고 앞머리가 다르면 겨냥 키워드가 달라 서로 경쟁하지 않으므로 △까지만 준다
const headOf = (t) => String(t || '').split(/[,:—]/)[0];
export function compare(a, b) {
  const t = titleScore(a.title, b.title);
  const kwA = norm((a.tags || [])[0]), kwB = norm((b.tags || [])[0]);
  const sameKw = !!kwA && kwA === kwB;
  const tagJ = Math.round(jac(tagSet(a), tagSet(b)) * 100);
  const sameHead = jac(bigrams(headOf(a.title)), bigrams(headOf(b.title))) >= 0.5;
  const level = sameKw || (t >= 45 && sameHead) ? 2 : t >= 30 || tagJ >= 50 ? 1 : 0;
  return { t, tagJ, sameKw, sameHead, level };
}
const ICON = ['✔', '△', '⚠'];
const status = (p) => `${p.date} ${p.time || '00:00'}` <= NOW ? '발행' : '예약';
const label = (p) => `${p.date.slice(5)} ${p.time || ''} ${p.title.slice(0, 44)}`;

export function allPosts() { return loadPosts(BLOG); }

// 주 키워드 중복(같은 tags[0]을 쓰는 글 묶음)
export function keywordDupes(posts) {
  const m = new Map(); for (const p of posts) { const k = norm((p.tags || [])[0]); if (!k) continue; if (!m.has(k)) m.set(k, []); m.get(k).push(p); }
  return [...m.entries()].filter(([, l]) => l.length > 1).map(([k, l]) => ({ kw: l[0].tags[0], posts: l }));
}
export function suspectPairs(posts, min = 2) {
  const out = [];
  for (let i = 0; i < posts.length; i++) for (let j = i + 1; j < posts.length; j++) { const c = compare(posts[i], posts[j]); if (c.level >= min) out.push({ a: posts[i], b: posts[j], ...c }); }
  return out.sort((x, y) => y.level - x.level || y.t - x.t);
}
// 대상 글 각각에 대해 가장 비슷한 다른 글
export function checkTargets(targets, posts) {
  return targets.map(p => {
    const others = posts.filter(o => o.slug !== p.slug).map(o => ({ o, ...compare(p, o) })).sort((x, y) => y.level - x.level || y.t - x.t || y.tagJ - x.tagJ);
    const top = others[0] || { t: 0, tagJ: 0, level: 0 };
    return { p, top, level: top.level, near: others.slice(0, 3) };
  });
}

function runToday() {
  const posts = allPosts(); const days = +opt('days', 3);
  const end = addDays(TODAY, days);
  const today = posts.filter(p => p.date === TODAY).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  const upcoming = posts.filter(p => p.date > TODAY && p.date <= end).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const res = checkTargets([...today, ...upcoming], posts);
  const dupes = keywordDupes(posts); const pairs = suspectPairs(posts);
  const lines = [`# 블로그 키워드 겹침 점검 — ${TODAY}`, '', `전체 글 ${posts.length}건(발행 ${posts.filter(p => status(p) === '발행').length} · 예약 ${posts.filter(p => status(p) === '예약').length}) · 주 키워드 중복 ${dupes.length}묶음 · 제목 겹침 의심 ${pairs.length}쌍`, '',
    '| 판정 | 날짜·시각 | 상태 | 제목 | 주 키워드 | 가장 비슷한 글 (제목 유사도·태그 공유) |', '|---|---|---|---|---|---|'];
  for (const r of res) lines.push(`| ${ICON[r.level]} | ${r.p.date.slice(5)} ${r.p.time || ''} | ${status(r.p)} | ${r.p.title} | ${(r.p.tags || [])[0] || '-'} | ${r.top.o ? `${r.top.o.title.slice(0, 34)} (${r.top.t}·${r.top.tagJ}%${r.top.sameKw ? '·주 키워드 같음' : ''})` : '-'} |`);
  if (dupes.length) { lines.push('', '## 주 키워드가 같은 글'); for (const d of dupes) lines.push(`- **${d.kw}**: ${d.posts.map(p => `${p.title} (${p.date}${status(p) === '예약' ? ' 예약' : ''})`).join(' / ')}`); }
  if (pairs.length) { lines.push('', '## 제목 겹침 의심(유사도 45 이상)'); for (const x of pairs.filter(x => !x.sameKw)) lines.push(`- ${x.t}: ${x.a.title} ↔ ${x.b.title}`); }
  const warn = res.filter(r => r.level === 2).length;
  lines.push('', warn || dupes.length ? `→ 조치: ⚠ 글은 제목 앞부분 키워드나 주 키워드(tags 첫 항목)를 바꾸거나, 기존 글을 보강하는 쪽으로 돌린다.` : '→ 오늘 발행·예약 글은 기존 글과 키워드가 겹치지 않는다.');
  const md = lines.join('\n') + '\n';
  process.stdout.write(md);
  if (argv.includes('--save')) {
    fs.mkdirSync(OUT, { recursive: true });
    fs.writeFileSync(path.join(OUT, `${TODAY}.md`), md, 'utf8');
    fs.writeFileSync(path.join(OUT, `${TODAY}.json`), JSON.stringify({ date: TODAY, total: posts.length, dupes: dupes.map(d => ({ kw: d.kw, slugs: d.posts.map(p => p.slug) })), pairs: pairs.map(x => ({ a: x.a.slug, b: x.b.slug, t: x.t, sameKw: x.sameKw })),
      checked: res.map(r => ({ slug: r.p.slug, date: r.p.date, time: r.p.time, title: r.p.title, kw: (r.p.tags || [])[0] || '', level: r.level, near: r.top.o ? r.top.o.slug : '', t: r.top.t, tagJ: r.top.tagJ })) }, null, 1), 'utf8');
    console.log(`저장: ${path.join(OUT, TODAY + '.md')}`);
  }
}

function runCandidates(cands) {
  const posts = allPosts();
  for (const c of cands) {
    const top = posts.map(p => ({ p, t: titleScore(c, p.title) })).sort((a, b) => b.t - a.t).slice(0, 4);
    // 후보 제목이 기존 글의 주 키워드로 시작하면(예: '서울퀵 요금 …' ↔ 주 키워드 '서울퀵') 같은 검색어를 겨냥하는 것
    const kwHits = posts.filter(p => { const k = norm((p.tags || [])[0]); return k.length >= 3 && norm(c).startsWith(k); });
    const verdict = kwHits.length ? `⚠ 주 키워드 겹침 — 「${kwHits[0].tags[0]}」를 이미 쓰는 글이 있다. 기존 글을 보강하거나 앞머리 키워드를 바꾼다`
      : top[0].t >= 45 ? '⚠ 겹침 — 각도를 바꾸거나 기존 글을 보강' : top[0].t >= 30 ? '△ 일부 겹침 — 제목 앞부분 키워드를 다르게' : '✔ 새 주제';
    console.log(`\n후보: ${c}\n  최대 유사도 ${top[0].t} ${verdict}`);
    for (const p of kwHits) console.log(`  주키워드  ${label(p)}  [${status(p)}]`);
    for (const x of top) console.log(`  ${String(x.t).padStart(3)}  ${label(x.p)}  [${status(x.p)}]`);
  }
}

function runAll() {
  const posts = allPosts(); const dupes = keywordDupes(posts); const pairs = suspectPairs(posts, +opt('min', 2));
  for (const d of dupes) console.log(`주 키워드 중복 「${d.kw}」: ${d.posts.map(p => p.slug).join(', ')}`);
  for (const x of pairs) console.log(`${ICON[x.level]} ${String(x.t).padStart(3)} 태그${String(x.tagJ).padStart(3)}%${x.sameKw ? ' 주키워드' : ''}  ${label(x.a)}  ↔  ${label(x.b)}`);
  console.log(`비교 ${posts.length}건 · 주 키워드 중복 ${dupes.length}묶음 · 겹침 의심 ${pairs.length}쌍`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const cands = argv.filter((a, i) => !a.startsWith('--') && !(argv[i - 1] || '').match(/^--(days|date|min)$/));
  if (argv.includes('--today')) runToday(); else if (cands.length) runCandidates(cands); else runAll();
}
