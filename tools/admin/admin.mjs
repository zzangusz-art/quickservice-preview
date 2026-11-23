// 관리자(유입·트래픽 / 콘텐츠만) — tools/serve.mjs 가 /api/t(방문 기록)와 /admin/* 요청을 여기로 넘긴다. 외부 패키지 없음.
//  - 방문 기록: 사이트 스크립트가 보내는 탭 단위 방문 번호(쿠키 없음)·첫 페이지 리퍼러·페이지뷰·문의 행동. IP는 저장하지 않는다.
//  - 저장: DATA_DIR/hits-YYYY-MM.jsonl (Railway 볼륨이 붙어 있으면 RAILWAY_VOLUME_MOUNT_PATH, 없으면 저장소의 .data — 배포 때 초기화)
//  - 로그인: Railway Variables 의 ADMIN_PASSWORD. 없으면 관리자 화면은 잠긴 채 안내만 보여 준다.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { detect, device, isBot, CHANNELS, CHANNEL_ORDER } from './inflow.mjs';
import { loadPosts } from '../blog/lib.mjs';
import { checkTargets, keywordDupes, suspectPairs } from '../blog/overlap.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const VOLUME = process.env.RAILWAY_VOLUME_MOUNT_PATH || '';
// 저장 폴더에 실제로 써 보고 시작한다. 볼륨 권한 문제는 오류 없이 기록만 사라지므로(2026-11-23 관리자 0건 원인 조사),
// 쓸 수 없으면 저장소의 .data(배포 때 초기화)로 바꾸고 관리자 화면에 이유를 띄운다.
const canWrite = (dir) => { try { fs.mkdirSync(dir, { recursive: true }); const t = path.join(dir, `.w-${process.pid}`); fs.writeFileSync(t, 'ok'); fs.unlinkSync(t); return ''; } catch (e) { return e.code || e.message; } };
const WANTED = process.env.QS_DATA_DIR || VOLUME || path.join(ROOT, '.data');
const STORE = (() => {
  const err = canWrite(WANTED); if (!err) return { dir: WANTED, err: '' };
  const fb = path.join(ROOT, '.data'); console.error(`[admin] 방문 기록 폴더에 쓸 수 없음(${WANTED}: ${err}) — ${fb} 로 저장`);
  return { dir: fb, err: err + (canWrite(fb) ? ' · 임시 폴더도 쓸 수 없음' : '') };
})();
const DATA_DIR = STORE.dir;
console.log(`[admin] 방문 기록 저장 위치: ${DATA_DIR}${VOLUME && DATA_DIR === VOLUME ? ' (Railway 볼륨)' : ''}`);
const PW = () => process.env.ADMIN_PASSWORD || '';
const KEY = () => crypto.createHash('sha256').update('qs-admin|' + PW()).digest();
const kst = (ms = Date.now()) => new Date(ms + 9 * 3600e3).toISOString();
const kstDate = (ms) => kst(ms).slice(0, 10);
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const n = (v) => Number(v || 0).toLocaleString('ko-KR');
const pct = (a, b) => b ? `${Math.round(a / b * 1000) / 10}%` : '-';
const clip = (s, len) => String(s || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, len);
const ipOf = (req) => String(req.headers['cf-connecting-ip'] || String(req.headers['x-forwarded-for'] || '').split(',')[0] || req.socket.remoteAddress || '').trim();

const LEADS = new Set(['contact_call', 'contact_kakao', 'order_online', 'quote_submit']);
const EVENTS = { contact_call: '전화', contact_kakao: '카카오톡', order_online: '온라인 접수', quote_submit: '요금 문의 완성', quote_start: '요금 문의 열기', quick_book: '빠른 접수', map_open: '지도 열기', vehicle_recommend: '차량 추천' };

function readBody(req, max) {
  return new Promise((resolve) => { let size = 0; const parts = []; req.on('data', (c) => { size += c.length; if (size > max) { req.destroy(); resolve(null); } else parts.push(c); }); req.on('end', () => resolve(Buffer.concat(parts).toString('utf8'))); req.on('error', () => resolve(null)); });
}
const fileOf = (d) => path.join(DATA_DIR, `hits-${d.slice(0, 7)}.jsonl`);
// 저장 결과는 관리자 화면 아래 「기록 저장」 줄에 보인다(서버 시작 뒤 저장 건수·마지막 저장·마지막 오류)
const SAVED = { n: 0, ok: '', fail: '' };
const stamp = () => kst().slice(0, 16).replace('T', ' ');
const append = (rec) => fs.appendFile(fileOf(rec.d), JSON.stringify(rec) + '\n', (e) => {
  if (e) { SAVED.fail = `${stamp()} ${e.code || e.message}`; console.error('[admin] 방문 기록 저장 실패:', e.message); } else { SAVED.n++; SAVED.ok = stamp(); }
});
function storeLine() {
  let size = 0; try { size = fs.statSync(fileOf(kstDate())).size; } catch (_) { /* 이번 달 파일 없음 */ }
  const kind = VOLUME && DATA_DIR === VOLUME ? 'Railway 볼륨' : '임시 폴더 — 배포 때 초기화';
  return `<p class="muted" style="font-size:12px">기록 저장: ${esc(DATA_DIR)} (${kind}) · 이번 달 파일 ${n(Math.round(size / 1024))}KB · 서버 시작 뒤 저장 ${n(SAVED.n)}건 · 마지막 저장 ${esc(SAVED.ok || '-')}${SAVED.fail ? ` · <span class="warn">마지막 오류 ${esc(SAVED.fail)}</span>` : ''} · <a href="/admin/import">이전 기록 가져오기</a></p>`;
}

// ── /api/t : 방문 기록 ──
const rate = new Map();
async function collect(req, res, ctx) {
  const done = () => res.writeHead(204, { 'Cache-Control': 'no-store' }).end();
  const ua = String(req.headers['user-agent'] || '');
  const origin = req.headers.origin;
  if (isBot(ua) || (origin && ctx.CANON && origin !== ctx.CANON.origin)) { req.resume(); return done(); }
  const ip = ipOf(req); const now = Date.now(); const r = rate.get(ip) || { n: 0, t: now };
  if (now - r.t > 60e3) { r.n = 0; r.t = now; } r.n++; rate.set(ip, r); if (r.n > 120) { req.resume(); return done(); }
  if (rate.size > 5000) rate.clear();
  const raw = await readBody(req, 2048); if (!raw) return done();
  let b; try { b = JSON.parse(raw); } catch (_) { return done(); }
  const s = clip(b.s, 40); const p = clip(b.p, 200);
  if (!/^[a-z0-9]{8,40}$/i.test(s) || !p.startsWith('/') || p.startsWith('/admin')) return done();
  const ts = kst(now).slice(0, 19); const d = kstDate(now);
  if (b.t === 'p') {
    if (typeof b.r === 'string' || typeof b.q === 'string') { // 탭의 첫 페이지 = 방문 시작
      const own = [ctx.CANON ? ctx.CANON.hostname : '', ctx.host, 'localhost', '127.0.0.1'].filter(Boolean).map(h => h.replace(/^www\./, ''));
      const v = detect({ referer: clip(b.r, 500), search: clip(b.q, 300), ua, ownHosts: own });
      append({ k: 'v', s, ts, d, ch: v.channel, src: v.source, kw: v.keyword, med: v.medium, camp: v.campaign, ref: v.refHost, land: p, dev: device(ua) });
    }
    append({ k: 'p', s, ts, d, p });
  } else if (b.t === 'e' && EVENTS[b.e]) append({ k: 'e', s, ts, d, e: b.e, p, l: clip(b.l, 60) });
  return done();
}

// ── 이전 기록: 관리자 자체 기록이 볼륨에 쌓이기 전 기간을 GA4에서 읽어 와 함께 보여 준다 ──
//  DATA_DIR/ga4-history.json (로그인 뒤 /admin/import 로 올림, 공개 저장소에는 넣지 않음)
//  { source:'GA4', from, to, readAt, daily:[[날짜, 사용자, 세션, 페이지뷰, 온라인접수, 전화, 요금문의, 카카오톡]], channels:[[채널키, 세션, 참여율, 평균, 주요전환]],
//    sources:[[출처, 채널키, 세션, 문의, 설명]], pages:[[경로, 조회]] } — 이 기간(to까지)의 자체 기록은 겹치지 않게 뺀다
const HIST_FILE = () => path.join(DATA_DIR, 'ga4-history.json');
const HIST_EV = ['order_online', 'contact_call', 'quote_submit', 'contact_kakao']; // daily 4~7번째 칸
let HIST = { mtime: -1, val: null };
const isDay = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s));
const validHistory = (h) => !!h && h.source === 'GA4' && isDay(h.from) && isDay(h.to) && h.from <= h.to && Array.isArray(h.daily) && h.daily.length <= 400
  && h.daily.every(r => Array.isArray(r) && isDay(r[0]) && r.length >= 4 && r.slice(1).every(v => Number.isFinite(Number(v))));
function history() {
  try {
    const st = fs.statSync(HIST_FILE());
    if (st.mtimeMs !== HIST.mtime) { const h = JSON.parse(fs.readFileSync(HIST_FILE(), 'utf8')); HIST = { mtime: st.mtimeMs, val: validHistory(h) ? h : null }; }
  } catch (_) { HIST = { mtime: -1, val: null }; }
  return HIST.val;
}

// ── 집계 ──
let CACHE = { key: '', at: 0, val: null };
function aggregate(days) {
  const key = String(days); if (CACHE.key === key && Date.now() - CACHE.at < 60e3) return CACHE.val;
  const today = kstDate(); const from = kstDate(Date.now() - (days - 1) * 864e5);
  const months = new Set(); for (let i = 0; i < days + 31; i += 28) months.add(kstDate(Date.now() - i * 864e5).slice(0, 7)); months.add(today.slice(0, 7));
  const S = new Map();
  for (const m of months) {
    const f = path.join(DATA_DIR, `hits-${m}.jsonl`); if (!fs.existsSync(f)) continue;
    for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
      if (!line) continue; let r; try { r = JSON.parse(line); } catch (_) { continue; }
      if (r.d < from || r.d > today) continue;
      const x = S.get(r.s) || { s: r.s, v: null, pv: [], ev: [], first: r.ts, d: r.d }; if (r.ts < x.first) { x.first = r.ts; x.d = r.d; }
      if (r.k === 'v' && !x.v) x.v = r; else if (r.k === 'p') x.pv.push(r); else if (r.k === 'e') x.ev.push(r);
      S.set(r.s, x);
    }
  }
  // 점검용 방문(utm_campaign=admin_check…, 저장 확인할 때 보냄)은 집계에서 빼고, 이전 기록(GA4)이 덮는 날짜의 자체 기록도 뺀다(이중 집계 방지)
  const HH = history();
  const sessions = [...S.values()].filter(x => !(HH && x.d <= HH.to)).map(x => ({ ...x, ch: x.v ? x.v.ch : 'unknown', src: x.v ? x.v.src : '(첫 페이지 기록 없음)', kw: x.v ? x.v.kw : '', land: x.v ? x.v.land : (x.pv[0] || {}).p || '', dev: x.v ? x.v.dev : '', camp: x.v ? x.v.camp : '', conv: x.ev.some(e => LEADS.has(e.e)) })).filter(x => !String(x.camp || '').startsWith('admin_check'));
  const inc = (m, k, f) => { const o = m.get(k) || f(); m.set(k, o); return o; };
  const daily = new Map(); for (let i = days - 1; i >= 0; i--) daily.set(kstDate(Date.now() - i * 864e5), { v: 0, pv: 0, c: 0 });
  const ch = new Map(), src = new Map(), kw = new Map(), land = new Map(), pages = new Map(), dev = new Map(), camp = new Map(), ev = new Map();
  for (const x of sessions) {
    const dd = daily.get(x.d); if (dd) { dd.v++; if (x.conv) dd.c++; }
    const c = inc(ch, x.ch, () => ({ v: 0, c: 0 })); c.v++; if (x.conv) c.c++;
    const so = inc(src, x.src, () => ({ ch: x.ch, v: 0, c: 0 })); so.v++; if (x.conv) so.c++;
    if (x.kw) { const k = inc(kw, x.kw, () => ({ src: x.src, v: 0, c: 0 })); k.v++; if (x.conv) k.c++; }
    if (x.land) { const l = inc(land, x.land, () => ({ v: 0, c: 0 })); l.v++; if (x.conv) l.c++; }
    if (x.dev) inc(dev, x.dev, () => ({ v: 0 })).v++;
    if (x.camp) { const k = inc(camp, x.camp, () => ({ v: 0, c: 0 })); k.v++; if (x.conv) k.c++; }
    for (const p of x.pv) { inc(pages, p.p, () => ({ pv: 0 })).pv++; const d2 = daily.get(p.d); if (d2) d2.pv++; }
    for (const e of x.ev) inc(ev, e.e, () => ({ n: 0 })).n++;
  }
  // 이전 기록(GA4): 기간 안의 날짜는 일별 그래프·합계에 더하고, 기간 전체를 덮는 보기(30·90일)에서는 페이지 조회도 더한다
  const H = HH; let hist = null;
  if (H) {
    const rows = H.daily.filter(r => r[0] >= from && r[0] <= today && r[0] <= H.to);
    const hev = Object.fromEntries(HIST_EV.map(e => [e, 0])); let hv = 0, hpv = 0;
    for (const r of rows) {
      const s = Number(r[2]) || 0, p = Number(r[3]) || 0, leads = HIST_EV.reduce((a, e, i) => a + (Number(r[4 + i]) || 0), 0);
      hv += s; hpv += p; HIST_EV.forEach((e, i) => { hev[e] += Number(r[4 + i]) || 0; });
      const dd = daily.get(r[0]); if (dd) { dd.v += s; dd.pv += p; dd.c += leads; dd.g = true; }
    }
    const full = from <= H.from;
    if (full) for (const [p, n2] of (H.pages || [])) inc(pages, p, () => ({ pv: 0 })).pv += Number(n2) || 0;
    for (const e of HIST_EV) if (hev[e]) inc(ev, e, () => ({ n: 0 })).n += hev[e];
    hist = { ...H, days: rows.length, v: hv, pv: hpv, ev: hev, leads: Object.values(hev).reduce((a, b) => a + b, 0), full };
  }
  const sort = (m, k) => [...m.entries()].sort((a, b) => b[1][k] - a[1][k]);
  const ownLeads = sessions.reduce((a, x) => a + x.ev.filter(e => LEADS.has(e.e)).length, 0);
  const val = { from, today, days, sessions, total: sessions.length, pv: sessions.reduce((s, x) => s + x.pv.length, 0), conv: sessions.filter(x => x.conv).length, ownLeads, hist,
    daily: [...daily.entries()], ch: sort(ch, 'v'), src: sort(src, 'v'), kw: sort(kw, 'v'), land: sort(land, 'v'), pages: sort(pages, 'pv'), dev: sort(dev, 'v'), camp: sort(camp, 'v'), ev: sort(ev, 'n'),
    recent: sessions.sort((a, b) => b.first.localeCompare(a.first)).slice(0, 60) };
  CACHE = { key, at: Date.now(), val }; return val;
}

// ── 로그인 ──
const sign = (exp) => crypto.createHmac('sha256', KEY()).update(String(exp)).digest('hex');
function authed(req) {
  if (!PW()) return false;
  const m = String(req.headers.cookie || '').match(/(?:^|;\s*)qs_adm=(\d+)\.([a-f0-9]{64})/); if (!m) return false;
  if (Number(m[1]) < Date.now()) return false;
  const a = Buffer.from(m[2], 'hex'), b = Buffer.from(sign(m[1]), 'hex'); return a.length === b.length && crypto.timingSafeEqual(a, b);
}
const tries = new Map();
async function login(req, res, ctx) {
  const ip = ipOf(req); const t = tries.get(ip) || { n: 0, at: Date.now() }; if (Date.now() - t.at > 15 * 60e3) { t.n = 0; t.at = Date.now(); }
  const raw = await readBody(req, 4096); const pw = new URLSearchParams(raw || '').get('password') || '';
  if (t.n >= 10) return page(res, loginHtml('시도가 너무 많습니다. 15분 뒤 다시 해 주세요.'), 429);
  const ok = PW() && crypto.timingSafeEqual(crypto.createHash('sha256').update(pw).digest(), crypto.createHash('sha256').update(PW()).digest());
  if (!ok) { t.n++; tries.set(ip, t); return page(res, loginHtml(PW() ? '비밀번호가 맞지 않습니다.' : ''), 401); }
  tries.delete(ip); const exp = Date.now() + 7 * 864e5;
  res.writeHead(303, { Location: '/admin/', 'Set-Cookie': `qs_adm=${exp}.${sign(exp)}; Path=/admin; HttpOnly; SameSite=Strict; Max-Age=${7 * 86400}${ctx.PROD ? '; Secure' : ''}`, 'Cache-Control': 'no-store' }).end();
}

// ── 화면 ──
const CSS = `:root{--navy:#0b2545;--sky:#1e88e5;--sky2:#e8f3fd;--line:#dde6f0;--muted:#5d6b7c;--green:#14804a;--amber:#b26a00}*{box-sizing:border-box}
body{margin:0;font-family:Pretendard,'Malgun Gothic',system-ui,sans-serif;background:#f5f8fc;color:#18202c;font-size:14px;line-height:1.55;word-break:keep-all}
header{background:var(--navy);color:#fff;padding:12px 16px;display:flex;gap:12px;align-items:center;flex-wrap:wrap}header b{font-size:16px}header nav{display:flex;gap:6px;flex-wrap:wrap}header a{color:#cfe3fb;text-decoration:none;padding:5px 10px;border-radius:6px}header a.on{background:var(--sky);color:#fff}header .sp{flex:1}
main{max-width:1180px;margin:0 auto;padding:16px}h2{font-size:17px;color:var(--navy);margin:22px 0 8px}h2 small{color:var(--muted);font-weight:400;font-size:12px}
.kpi{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px}.kpi div{background:#fff;border:1px solid var(--line);border-radius:10px;padding:12px}.kpi b{display:block;font-size:24px;color:var(--navy)}.kpi span{color:var(--muted);font-size:12px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:14px}.card{background:#fff;border:1px solid var(--line);border-radius:10px;padding:12px;overflow-x:auto}
table{width:100%;border-collapse:collapse;font-size:13px}th,td{border-bottom:1px solid var(--line);padding:6px 6px;text-align:left;vertical-align:top}th{color:var(--navy);background:var(--sky2);font-weight:700;white-space:nowrap}td.r,th.r{text-align:right;white-space:nowrap}
.muted{color:var(--muted)}.ok{color:var(--green);font-weight:700}.warn{color:var(--amber);font-weight:700}.tag{display:inline-block;font-size:11px;padding:1px 6px;border-radius:4px;background:var(--sky2);color:var(--sky);font-weight:700}
.note{background:#fff7e6;border:1px solid #f3d9a4;border-radius:8px;padding:10px 12px;margin:10px 0}.bar{height:8px;background:var(--sky);border-radius:4px}
form.login{max-width:340px;margin:12vh auto;background:#fff;border:1px solid var(--line);border-radius:12px;padding:22px}form.login input{width:100%;padding:10px;border:1px solid var(--line);border-radius:8px;font-size:15px;margin:10px 0}form.login button{width:100%;padding:10px;border:0;border-radius:8px;background:var(--sky);color:#fff;font-size:15px;font-weight:700}
a{color:var(--sky)}@media(max-width:600px){.grid{grid-template-columns:1fr}}`;
const shell = (title, body) => `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${esc(title)}</title><style>${CSS}</style></head><body>${body}<script>try{localStorage.setItem('qs_admin','1')}catch(e){}</script></body></html>`;
function page(res, html, status = 200) { res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'same-origin' }).end(html); }
const loginHtml = (msg) => shell('퀵서비스다 관리자', PW()
  ? `<form class="login" method="post" action="/admin/login"><b style="font-size:18px;color:#0b2545">퀵서비스다 관리자</b><p class="muted">유입·트래픽과 콘텐츠 현황</p>${msg ? `<p class="warn">${esc(msg)}</p>` : ''}<input type="password" name="password" placeholder="비밀번호" autocomplete="current-password" required autofocus><button>들어가기</button></form>`
  : `<form class="login"><b style="font-size:18px;color:#0b2545">퀵서비스다 관리자</b><p>관리자 비밀번호가 아직 설정되지 않았습니다.</p><p class="muted">Railway → 서비스 quickservice-preview → Variables 에 <b>ADMIN_PASSWORD</b> 를 추가하면(자동 재배포) 이 화면에서 로그인할 수 있습니다.</p></form>`);

const tbl = (head, rows, empty = '아직 기록 없음') => rows.length ? `<table><tr>${head.map(h => `<th${/^(방문|전환|조회|횟수|비율|페이지뷰|전환율)/.test(h) ? ' class="r"' : ''}>${h}</th>`).join('')}</tr>${rows.join('')}</table>` : `<p class="muted">${empty}</p>`;
function chart(daily) {
  const W = 1100, H = 170, L = 30, B = 22, max = Math.max(4, ...daily.map(([, x]) => x.pv)); const bw = (W - L) / daily.length;
  const y = (v) => 8 + (1 - v / max) * (H - B - 8);
  const bars = daily.map(([d, x], i) => `<rect x="${L + i * bw + bw * 0.15}" y="${y(x.pv)}" width="${bw * 0.7}" height="${H - B - y(x.pv)}" fill="${x.g ? '#dbe7f3' : '#b9d8f6'}"><title>${d}${x.g ? ' (GA4 이전 기록)' : ''} 페이지뷰 ${x.pv}</title></rect><rect x="${L + i * bw + bw * 0.3}" y="${y(x.v)}" width="${bw * 0.4}" height="${H - B - y(x.v)}" fill="${x.g ? '#7fa9d6' : '#1e88e5'}"><title>${d}${x.g ? ' (GA4 이전 기록)' : ''} 방문 ${x.v}${x.c ? ` · 문의 ${x.c}` : ''}</title></rect>`).join('');
  const step = Math.ceil(daily.length / 12);
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="일별 방문·페이지뷰">${[0, .5, 1].map(f => `<line x1="${L}" x2="${W}" y1="${y(max * f)}" y2="${y(max * f)}" stroke="#e3e8f0"/><text x="${L - 4}" y="${y(max * f) + 4}" font-size="10" text-anchor="end" fill="#6b7485">${Math.round(max * f)}</text>`).join('')}${bars}${daily.map(([d], i) => i % step ? '' : `<text x="${L + i * bw + bw / 2}" y="${H - 6}" font-size="10" text-anchor="middle" fill="#6b7485">${+d.slice(5, 7)}/${+d.slice(8)}</text>`).join('')}</svg>
<p class="muted" style="margin:4px 0 0"><span style="color:#1e88e5">■</span> 방문 <span style="color:#b9d8f6">■</span> 페이지뷰${daily.some(([, x]) => x.g) ? ' · <span style="color:#7fa9d6">■</span> 옅은 막대 = 이전 기록(GA4 세션·페이지뷰)' : ''}</p>`;
}
const chLabel = (c) => CHANNELS[c] || '알 수 없음';

function trafficHtml(A) {
  const evRow = A.ev.map(([e, x]) => `<tr><td>${esc(EVENTS[e] || e)}${LEADS.has(e) ? ' <span class="tag">문의</span>' : ''}</td><td class="r">${n(x.n)}</td></tr>`);
  const chs = [...A.ch].sort((a, b) => (CHANNEL_ORDER.indexOf(a[0]) + 1 || 99) - (CHANNEL_ORDER.indexOf(b[0]) + 1 || 99));
  const H = A.hist && A.hist.days ? A.hist : null;
  const ownFrom = H && H.to < A.today ? kstDate(Date.parse(H.to + 'T00:00:00+09:00') + 864e5) : '';
  const emp = H ? `자체 기록은 ${ownFrom || A.today}부터 쌓입니다 — 그 전 기간은 아래 「이전 기록(GA4)」` : undefined;
  return `${H ? `<h2>전체 <small>이전 기록(GA4 ${H.from} ~ ${H.to}) + 사이트 자체 기록(${H.to < A.today ? kstDate(Date.parse(H.to + 'T00:00:00+09:00') + 864e5) + ' ~' : '-'}) · 보기 기간 ${A.from} ~ ${A.today}</small></h2>
<div class="kpi"><div><b>${n(H.v + A.total)}</b><span>방문(GA4 세션 ${n(H.v)} + 자체 ${n(A.total)})</span></div><div><b>${n(H.pv + A.pv)}</b><span>페이지뷰(GA4 ${n(H.pv)} + 자체 ${n(A.pv)})</span></div><div><b>${n(H.leads + A.ownLeads)}</b><span>문의 행동 횟수(전화·카톡·온라인 접수·요금 문의)</span></div></div>
<h2>사이트 자체 기록 <small>${H.to < A.today ? kstDate(Date.parse(H.to + 'T00:00:00+09:00') + 864e5) : A.today} ~ ${A.today}</small></h2>` : ''}<div class="kpi"><div><b>${n(A.total)}</b><span>방문(탭 단위 세션)</span></div><div><b>${n(A.pv)}</b><span>페이지뷰</span></div><div><b>${n(A.conv)}</b><span>문의 행동이 있었던 방문(전화·카톡·온라인 접수·요금 문의)</span></div><div><b>${pct(A.conv, A.total)}</b><span>문의 전환율</span></div><div><b>${n(A.ch.find(c => c[0] === 'ai')?.[1].v || 0)}</b><span>AI 검색·챗봇 유입</span></div></div>
<h2>일별 방문 <small>${A.from} ~ ${A.today}</small></h2><div class="card">${chart(A.daily)}</div>
<div class="grid">
<div><h2>유입 채널</h2><div class="card">${tbl(['채널', '방문', '비율', '전환'], chs.map(([c, x]) => `<tr><td>${esc(chLabel(c))}<div class="bar" style="width:${Math.max(2, x.v / Math.max(1, A.total) * 100)}%"></div></td><td class="r">${n(x.v)}</td><td class="r">${pct(x.v, A.total)}</td><td class="r">${n(x.c)}</td></tr>`), emp)}</div></div>
<div><h2>문의 행동 ${H ? '<small>이전 기록 포함</small>' : ''}</h2><div class="card">${tbl(['행동', '횟수'], evRow)}</div></div>
<div><h2>유입 출처 상위</h2><div class="card">${tbl(['출처', '채널', '방문', '전환'], A.src.slice(0, 25).map(([s, x]) => `<tr><td>${esc(s)}</td><td class="muted">${esc(chLabel(x.ch))}</td><td class="r">${n(x.v)}</td><td class="r">${n(x.c)}</td></tr>`), emp)}</div></div>
<div><h2>검색어 <small>네이버 등 리퍼러에 검색어가 남는 경우만</small></h2><div class="card">${tbl(['검색어', '출처', '방문', '전환'], A.kw.slice(0, 30).map(([k, x]) => `<tr><td>${esc(k)}</td><td class="muted">${esc(x.src)}</td><td class="r">${n(x.v)}</td><td class="r">${n(x.c)}</td></tr>`), '아직 검색어가 남은 방문 없음(구글은 검색어를 넘기지 않음)')}</div></div>
<div><h2>첫 페이지(랜딩) 상위</h2><div class="card">${tbl(['페이지', '방문', '전환'], A.land.slice(0, 25).map(([p, x]) => `<tr><td><a href="${esc(p)}" target="_blank" rel="noopener">${esc(p)}</a></td><td class="r">${n(x.v)}</td><td class="r">${n(x.c)}</td></tr>`), emp)}</div></div>
<div><h2>많이 본 페이지 ${H && H.full ? '<small>이전 기록 포함</small>' : ''}</h2><div class="card">${tbl(['페이지', '페이지뷰'], A.pages.slice(0, 25).map(([p, x]) => `<tr><td><a href="${esc(p)}" target="_blank" rel="noopener">${esc(p)}</a></td><td class="r">${n(x.pv)}</td></tr>`))}</div></div>
<div><h2>기기</h2><div class="card">${tbl(['기기', '방문', '비율'], A.dev.map(([d, x]) => `<tr><td>${{ mobile: '모바일', desktop: 'PC', tablet: '태블릿' }[d] || esc(d)}</td><td class="r">${n(x.v)}</td><td class="r">${pct(x.v, A.total)}</td></tr>`), emp)}</div></div>
<div><h2>캠페인 링크(UTM)</h2><div class="card">${tbl(['캠페인', '방문', '전환'], A.camp.map(([c, x]) => `<tr><td>${esc(c)}</td><td class="r">${n(x.v)}</td><td class="r">${n(x.c)}</td></tr>`), '없음 — 블로그·카톡에 링크를 걸 때 ?utm_source=naver_blog&utm_campaign=이름 을 붙이면 따로 집계됩니다')}</div></div>
</div>
${histHtml(A)}
<h2>최근 방문 60건</h2><div class="card">${tbl(['시각', '채널', '출처', '검색어', '첫 페이지', '페이지뷰', '행동'], A.recent.map(x => `<tr><td class="muted" style="white-space:nowrap">${esc(x.first.slice(5, 16).replace('T', ' '))}</td><td>${esc(chLabel(x.ch))}</td><td>${esc(x.src)}</td><td>${esc(x.kw)}</td><td>${esc(x.land)}</td><td class="r">${x.pv.length}</td><td>${x.ev.map(e => `<span class="${LEADS.has(e.e) ? 'ok' : 'muted'}">${esc(EVENTS[e.e] || e.e)}</span>`).join(' ')}</td></tr>`), emp)}</div>
<p class="muted">기록 방식: 사이트 스크립트가 탭마다 임시 방문 번호(쿠키·IP 저장 없음)로 첫 페이지의 유입 경로, 페이지뷰, 문의 버튼 클릭만 보냅니다. 관리자 화면을 연 브라우저와 봇은 제외합니다. 자세한 사용자 분석은 GA4(G-5GKY3M0EL3)에서 봅니다. <a href="/admin/export.csv?days=${A.days}">방문 기록 CSV 내려받기</a></p>`;
}

// 이전 기록(GA4) 기간 전체 요약 — 보기 기간과 상관없이 가져온 기간 그대로
function histHtml(A) {
  const H = A.hist; if (!H) return '';
  const all = H.daily.reduce((a, r) => ({ v: a.v + (Number(r[2]) || 0), pv: a.pv + (Number(r[3]) || 0), l: a.l + HIST_EV.reduce((s, e, i) => s + (Number(r[4 + i]) || 0), 0) }), { v: 0, pv: 0, l: 0 });
  const evTot = HIST_EV.map((e, i) => [e, H.daily.reduce((a, r) => a + (Number(r[4 + i]) || 0), 0)]).filter(([, v]) => v);
  return `<h2>이전 기록(GA4) <small>${esc(H.from)} ~ ${esc(H.to)} · 방문 ${n(all.v)} · 페이지뷰 ${n(all.pv)} · 문의 행동 ${n(all.l)}회 · ${esc(H.readAt || '')} GA4에서 가져옴</small></h2>
<div class="grid">
<div class="card"><b>유입 채널</b>${tbl(['채널', '방문', '참여율', '평균', '주요 전환'], (H.channels || []).map(([c, v, e, avg, k]) => `<tr><td>${esc(chLabel(c))}</td><td class="r">${n(v)}</td><td class="r">${esc(String(e))}%</td><td class="r">${esc(avg)}</td><td class="r">${n(k)}</td></tr>`))}</div>
<div class="card"><b>유입 출처와 문의</b>${tbl(['출처', '방문', '문의'], (H.sources || []).map(([s, c, v, l, d]) => `<tr><td>${esc(s)}${d ? `<br><span class="muted" style="font-size:12px">${esc(d)}</span>` : ''}</td><td class="r">${n(v)}</td><td class="r">${l ? `<span class="ok">${n(l)}</span>` : 0}</td></tr>`))}</div>
<div class="card"><b>문의 행동</b>${tbl(['행동', '횟수'], evTot.map(([e, v]) => `<tr><td>${esc(EVENTS[e] || e)}</td><td class="r">${n(v)}</td></tr>`))}<b style="display:block;margin-top:10px">많이 본 페이지</b>${tbl(['페이지', '조회'], (H.pages || []).slice(0, 15).map(([p, v]) => `<tr><td><a href="${esc(p)}" target="_blank" rel="noopener">${esc(p)}</a></td><td class="r">${n(v)}</td></tr>`))}</div>
</div>
<p class="muted" style="font-size:12px">이전 기록은 관리자 자체 기록이 쌓이기 전 기간을 GA4에서 날짜별로 읽어 온 값입니다(방문 = GA4 세션). 검색어·기기·최근 방문 목록은 자체 기록에만 있습니다.</p>`;
}

let POSTS = { at: 0, val: null };
function contentHtml(A) {
  if (!POSTS.val || Date.now() - POSTS.at > 5 * 60e3) { POSTS = { at: Date.now(), val: loadPosts(path.join(ROOT, 'content', 'blog')) }; }
  const posts = POSTS.val; const now = kst().slice(0, 16).replace('T', ' ');
  const at = (p) => `${p.date} ${p.time || '00:00'}`; const pub = posts.filter(p => at(p) <= now); const sch = posts.filter(p => at(p) > now);
  const pv = new Map(A.pages.map(([p, x]) => [p, x.pv])); const lc = new Map(A.land.map(([p, x]) => [p, x]));
  const chk = new Map(checkTargets(posts, posts).map(r => [r.p.slug, r])); const dupes = keywordDupes(posts), pairs = suspectPairs(posts);
  const cats = {}; for (const p of pub) cats[p.category] = (cats[p.category] || 0) + 1;
  const weekAgo = kstDate(Date.now() - 6 * 864e5); const thisWeek = pub.filter(p => p.date >= weekAgo).length;
  const ICON = ['<span class="ok">✔</span>', '<span class="warn">△</span>', '<span class="warn">⚠</span>'];
  const row = (p, isPub) => { const u = `/blog/${p.slug}/`; const r = chk.get(p.slug); const l = lc.get(u);
    return `<tr><td style="white-space:nowrap">${isPub ? '<span class="ok">발행</span>' : '<span class="muted">예약</span>'}</td><td class="muted" style="white-space:nowrap">${esc(p.date.slice(5))} ${esc(p.time || '')}</td><td>${isPub ? `<a href="${u}" target="_blank" rel="noopener">${esc(p.title)}</a>` : esc(p.title)}</td><td class="muted">${esc(p.category)}</td><td>${esc((p.tags || [])[0] || '')}</td><td class="r">${isPub ? n(pv.get(u) || 0) : '-'}</td><td class="r">${isPub ? n(l ? l.c : 0) : '-'}</td><td style="text-align:center">${r ? ICON[r.level] : ''}</td></tr>`; };
  const svc = A.pages.filter(([p]) => /^\/(services|area|pricing|vehicles|faq|business|about)\//.test(p)).slice(0, 15);
  return `<div class="kpi"><div><b>${n(pub.length)}</b><span>발행된 글</span></div><div><b>${n(sch.length)}</b><span>예약 글(하루 3편 09·13·18시 자동 공개)</span></div><div><b>${sch.length ? esc(sch.map(p => p.date).sort().pop()) : '-'}</b><span>마지막 예약일</span></div><div><b>${n(thisWeek)}</b><span>최근 7일 발행</span></div><div><b>${dupes.length + pairs.filter(x => !x.sameKw).length}</b><span>키워드 겹침 의심(0이 정상)</span></div></div>
${dupes.length ? `<div class="note">주 키워드가 같은 글: ${dupes.map(d => `「${esc(d.kw)}」 ${d.posts.map(p => esc(p.slug)).join(', ')}`).join(' / ')}</div>` : ''}
<div class="grid"><div><h2>카테고리별 발행</h2><div class="card">${tbl(['카테고리', '글 수'], Object.entries(cats).sort((a, b) => b[1] - a[1]).map(([c, k]) => `<tr><td>${esc(c)}</td><td class="r">${k}</td></tr>`))}</div></div>
<div><h2>서비스·안내 페이지 조회 <small>${A.days}일</small></h2><div class="card">${tbl(['페이지', '페이지뷰'], svc.map(([p, x]) => `<tr><td><a href="${esc(p)}" target="_blank" rel="noopener">${esc(p)}</a></td><td class="r">${n(x.pv)}</td></tr>`))}</div></div></div>
<h2>블로그 글 <small>조회·전환은 최근 ${A.days}일${A.hist && A.hist.full ? '(조회는 GA4 이전 기록 포함)' : ''}, 전환 = 그 글로 들어와 문의 행동까지 한 방문 · 겹침 ✔ 없음 △ 문형만 비슷 ⚠ 같은 검색어</small></h2>
<div class="card">${tbl(['상태', '날짜', '제목', '카테고리', '주 키워드', '조회', '전환', '겹침'], [...pub.map(p => row(p, true)), ...[...sch].reverse().map(p => row(p, false))])}</div>`;
}

// 이전 기록 올리기(로그인 필요): GA4 일별 집계 JSON → DATA_DIR/ga4-history.json
async function importHistory(req, res) {
  const json = (code, o) => res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }).end(JSON.stringify(o));
  const raw = await readBody(req, 400 * 1024); let h = null; try { h = JSON.parse(raw || ''); } catch (_) { /* 형식 오류는 아래에서 */ }
  if (!validHistory(h)) return json(400, { ok: false, error: 'GA4 이전 기록 형식이 아닙니다(source·from·to·daily 확인)' });
  const list = (a, max) => Array.isArray(a) ? a.slice(0, max) : [];
  const keep = { source: 'GA4', property: clip(h.property, 40), from: h.from, to: h.to, readAt: clip(h.readAt, 20) || kstDate(), note: clip(h.note, 500), daily: h.daily, channels: list(h.channels, 20), sources: list(h.sources, 30), pages: list(h.pages, 200) };
  try { fs.writeFileSync(HIST_FILE(), JSON.stringify(keep)); } catch (e) { return json(500, { ok: false, error: '저장 실패: ' + (e.code || e.message) }); }
  CACHE = { key: '', at: 0, val: null }; HIST = { mtime: -1, val: null };
  json(200, { ok: true, days: keep.daily.length, from: keep.from, to: keep.to });
}
function importHtml() {
  const H = history();
  return `<h2>이전 기록 가져오기 <small>GA4에서 읽은 일별 집계(JSON)</small></h2>
<div class="card"><p>${H ? `지금 들어 있는 이전 기록: <b>${esc(H.from)} ~ ${esc(H.to)}</b> (${H.daily.length}일, ${esc(H.readAt || '')} 가져옴). 새로 올리면 바뀝니다.` : '아직 이전 기록이 없습니다.'}</p>
<textarea id="hj" rows="10" style="width:100%;font-family:monospace;font-size:12px" placeholder='{"source":"GA4","from":"2026-10-28","to":"2026-11-22","daily":[["2026-10-28",14,16,40,1,0,0,0], ...]}'></textarea>
<p><button id="hb" style="padding:8px 14px;border:0;border-radius:8px;background:#1e88e5;color:#fff;font-weight:700">올리기</button> <span id="hm" class="muted"></span></p></div>
<script>document.getElementById('hb').onclick=async()=>{const m=document.getElementById('hm');m.textContent='올리는 중…';try{const r=await fetch('/admin/import',{method:'POST',headers:{'Content-Type':'application/json'},body:document.getElementById('hj').value});const j=await r.json();m.textContent=j.ok?'저장했습니다: '+j.from+' ~ '+j.to+' ('+j.days+'일)':'실패: '+j.error;}catch(e){m.textContent='실패: '+e.message;}};</script>`;
}

function exportCsv(res, A) {
  const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = ['시각,채널,출처,검색어,캠페인,첫 페이지,기기,페이지뷰,행동'].concat(A.sessions.sort((a, b) => a.first.localeCompare(b.first)).map(x => [x.first.replace('T', ' '), chLabel(x.ch), x.src, x.kw, x.camp, x.land, x.dev, x.pv.length, x.ev.map(e => EVENTS[e.e] || e.e).join(' ')].map(q).join(',')));
  res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="visits-${A.from}_${A.today}.csv"`, 'Cache-Control': 'no-store' }).end('﻿' + lines.join('\r\n'));
}

// serve.mjs 에서 부른다. 처리했으면 true
export async function handleAdmin(req, res, ctx) {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api/t') { if (req.method !== 'POST') { res.writeHead(405, { Allow: 'POST' }).end(); return true; } await collect(req, res, ctx); return true; }
  if (url.pathname === '/admin') { res.writeHead(301, { Location: '/admin/' }).end(); return true; }
  if (!url.pathname.startsWith('/admin/')) return false;
  if (url.pathname === '/admin/login' && req.method === 'POST') { await login(req, res, ctx); return true; }
  if (url.pathname === '/admin/logout') { res.writeHead(303, { Location: '/admin/', 'Set-Cookie': 'qs_adm=; Path=/admin; Max-Age=0' }).end(); return true; }
  if (url.pathname === '/admin/import' && req.method === 'POST') { if (!authed(req)) { res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' }).end('{"ok":false,"error":"로그인이 필요합니다"}'); return true; } await importHistory(req, res); return true; }
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, { Allow: 'GET' }).end(); return true; }
  if (!authed(req)) { page(res, loginHtml('')); return true; }
  const days = [7, 30, 90].includes(Number(url.searchParams.get('days'))) ? Number(url.searchParams.get('days')) : 30;
  const A = aggregate(days);
  if (url.pathname === '/admin/export.csv') { exportCsv(res, A); return true; }
  const tab = url.searchParams.get('tab') === 'content' ? 'content' : 'traffic';
  const link = (t, d) => `/admin/?tab=${t}&days=${d}`;
  const warn = STORE.err
    ? `<div class="note"><b>방문 기록을 볼륨에 저장하지 못하고 있습니다</b>(${esc(WANTED)}: ${esc(STORE.err)}). 지금은 임시 폴더에 쌓이며 배포 때마다 초기화됩니다. Railway → 서비스 → Variables 에 <b>RAILWAY_RUN_UID</b> = <b>0</b> 을 추가하면(자동 재배포) 볼륨에 저장됩니다.</div>`
    : ctx.PROD && !VOLUME && !process.env.QS_DATA_DIR ? '<div class="note">Railway 볼륨이 연결되지 않아 방문 기록이 배포 때마다 초기화됩니다. Railway → 서비스 → Settings → Volumes 에서 볼륨(마운트 경로 /data)을 연결하면 계속 쌓입니다.</div>' : '';
  page(res, shell('퀵서비스다 관리자', `<header><b>퀵서비스다 관리자</b><nav><a class="${tab === 'traffic' ? 'on' : ''}" href="${link('traffic', days)}">유입·트래픽</a><a class="${tab === 'content' ? 'on' : ''}" href="${link('content', days)}">콘텐츠</a></nav><span class="sp"></span><nav>${[7, 30, 90].map(d => `<a class="${d === days ? 'on' : ''}" href="${link(tab, d)}">${d}일</a>`).join('')}</nav><a href="/admin/logout">로그아웃</a></header>
<main>${warn}${url.pathname === '/admin/import' ? importHtml() : tab === 'content' ? contentHtml(A) : trafficHtml(A)}${storeLine()}</main>`));
  return true;
}
