// Railway(또는 로컬)용 정적 서버: 시작할 때 사이트를 빌드해 서비스하고, 매시 정각에 다시 빌드한다.
// 외부 패키지 없이 node만으로 돈다(파릇 사이트 서버와 같은 구조).
//   node tools/serve.mjs                          → PORT(기본 5520)에서 서비스, 미리보기 모드(noindex)
//   node tools/serve.mjs --production [--url 주소] → 운영 모드(검색 노출·방문 분석 켬). SITE_MODE=production·SITE_URL 환경 변수와 같음
//     운영 모드: www.대표주소 → 대표 주소로 301, 기존 퀵서비스다.com(www 포함) → 새 주소의 같은 내용 페이지로 301. Railway 기본 주소(*.up.railway.app) 등 다른 호스트는
//     그대로 보여 주되 X-Robots-Tag noindex로 중복 색인을 막는다(도메인 연결 전에도 Railway 주소로 확인 가능).
//     빌드마다 새로 생겼거나 바뀐 주소를 IndexNow로 네이버·빙에 알린다(tools/indexnow.mjs).
// 미리보기 주소는 SITE_URL → Railway 공개 도메인(RAILWAY_PUBLIC_DOMAIN) → localhost 순으로 정한다.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { handleAdmin } from './admin/admin.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT) || 5520;
const argv = process.argv.slice(2);
const argOf = n => { const i = argv.indexOf(n); return i > -1 ? argv[i + 1] : null; };
const PROD = process.env.SITE_MODE === 'production' || argv.includes('--production');
if (argOf('--url')) process.env.SITE_URL = argOf('--url'); // 빌드(자식 프로세스)도 같은 주소를 쓴다
const PUBLIC = process.env.SITE_URL || (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}/` : `http://localhost:${PORT}/`);
const CANON = PROD && process.env.SITE_URL ? new URL(process.env.SITE_URL) : null; // 운영 대표 주소
const SITE_DIR = path.join(ROOT, '.site', String(PORT)); // 포트마다 따로(서버 여러 개를 띄워도 서로 지우지 않게)

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.gif': 'image/gif', '.avif': 'image/avif', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.pdf': 'application/pdf', '.webmanifest': 'application/manifest+json',
};
const ZIP = /\.(html|css|js|json|xml|txt|svg|webmanifest)$/;

let live = null;          // 지금 서비스 중인 빌드 폴더
let building = null;      // 진행 중인 빌드(Promise)
const packed = new Map(); // 압축본 캐시: `${file}|${enc}` → Buffer

// ── 빌드: 새 폴더에 만든 뒤 바꿔 끼운다(빌드 중에도 이전 판을 그대로 서비스) ──
function build() {
  if (building) return building;
  const out = path.join(SITE_DIR, String(Date.now()));
  const args = ['build.mjs', '--out', out, '--cname', 'no', ...(PROD ? [] : ['--preview', PUBLIC])];
  const t = Date.now();
  building = new Promise(done => {
    const p = spawn(process.execPath, args, { cwd: ROOT, stdio: ['ignore', 'ignore', 'pipe'] });
    let err = '';
    p.stderr.on('data', d => { err += d; });
    p.on('close', code => {
      building = null;
      if (code !== 0) {
        console.error(`빌드 실패(code ${code}) — 이전 판을 계속 서비스합니다\n${err.trim()}`);
        fs.rmSync(out, { recursive: true, force: true });
        return done(false);
      }
      const old = live;
      live = out;
      packed.clear();
      if (old) setTimeout(() => fs.rmSync(old, { recursive: true, force: true }), 60_000).unref();
      console.log(`빌드 ${((Date.now() - t) / 1000).toFixed(1)}s → ${PROD ? '운영' : '미리보기'} ${PROD ? (process.env.SITE_URL || 'data.mjs 기본 주소') : PUBLIC}`);
      if (PROD) notifyIndexNow(out);
      done(true);
    });
  });
  return building;
}

// ── IndexNow: 처음 빌드 땐 lastmod가 오늘인 주소, 그다음부턴 직전 빌드와 달라진 주소만 알린다 ──
let lastMap = null;
async function notifyIndexNow(out) {
  try {
    const { parseSitemap, changedUrls, todayUrls, ping } = await import('./indexnow.mjs');
    const map = parseSitemap(fs.readFileSync(path.join(out, 'sitemap.xml'), 'utf8'));
    const urls = lastMap ? changedUrls(lastMap, map) : todayUrls(map);
    lastMap = map;
    if (urls.length) await ping(urls);
  } catch (e) { console.error('IndexNow 실패:', e.message); }
}

// 매시 정각 5초 뒤에 다시 빌드한다(날짜가 바뀌면 sitemap·기준일이 새 날짜로)
function schedule() {
  const now = Date.now();
  setTimeout(() => { build().finally(schedule); }, 3_600_000 - (now % 3_600_000) + 5_000).unref();
}

// ── 응답 ──
const stat = f => { try { return fs.statSync(f); } catch { return null; } };

function resolve(pathname) {
  let p;
  try { p = decodeURIComponent(pathname); } catch { return null; }
  if (p.includes('\0')) return null;
  const f = path.join(live, path.normalize(p));
  return f === live || f.startsWith(live + path.sep) ? f : null;
}

const cacheControl = rel => (/^\/assets\//.test(rel) ? 'public, max-age=86400' : 'public, max-age=0, must-revalidate');

function send(req, res, file, st, status, rel, noindex) {
  const ext = path.extname(file).toLowerCase();
  const etag = `W/"${st.size.toString(16)}-${Math.floor(st.mtimeMs).toString(16)}"`;
  const headers = {
    'Content-Type': TYPES[ext] || 'application/octet-stream',
    'Cache-Control': status === 200 ? cacheControl(rel) : 'no-store',
    'Last-Modified': st.mtime.toUTCString(),
    ETag: etag,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };
  if (noindex) headers['X-Robots-Tag'] = 'noindex, nofollow';
  if (status === 200 && req.headers['if-none-match'] === etag) { res.writeHead(304, headers).end(); return; }

  // 글자 파일은 brotli/gzip으로 줄여 보낸다
  const accept = String(req.headers['accept-encoding'] || '');
  const enc = ZIP.test(ext) && st.size > 1024 ? (/\bbr\b/.test(accept) ? 'br' : /\bgzip\b/.test(accept) ? 'gzip' : null) : null;
  if (ZIP.test(ext)) headers.Vary = 'Accept-Encoding';
  if (enc) {
    const key = `${file}|${enc}`;
    let body = packed.get(key);
    if (!body) {
      const raw = fs.readFileSync(file);
      body = enc === 'br' ? zlib.brotliCompressSync(raw, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 9 } }) : zlib.gzipSync(raw, { level: 9 });
      packed.set(key, body);
    }
    res.writeHead(status, { ...headers, 'Content-Encoding': enc, 'Content-Length': body.length });
    res.end(req.method === 'HEAD' ? undefined : body);
    return;
  }
  res.writeHead(status, { ...headers, 'Content-Length': st.size });
  if (req.method === 'HEAD') { res.end(); return; }
  fs.createReadStream(file).on('error', () => res.destroy()).pipe(res);
}

// 기존 사이트 퀵서비스다.com(index.php?page_id=…)이 이 서버를 가리키게 되면, 같은 내용의 새 페이지로 301 — 검색 순위·외부 링크를 .kr로 옮긴다
const LEGACY_HOST = /^(www\.)?xn--2j1bs9sn9b30bc55a\.com$/;
const LEGACY_PAGES = { company: 'about/', quick: 'services/motorcycle/', damas: 'services/damas-labo/', delivery: 'services/intercity/', cargo: 'services/truck/',
  truckinfo: 'vehicles/', service_center: 'faq/', privacy: 'privacy/', terms: 'terms/', InsungApi: '' };
function legacyTarget(reqUrl) {
  const u = new URL(reqUrl, 'http://localhost');
  if (u.pathname === '/' || /^\/index\.php$/i.test(u.pathname)) return LEGACY_PAGES[u.searchParams.get('page_id')] ?? '';
  return u.pathname.slice(1); // 그 밖의 경로(robots.txt 등)는 같은 경로로
}

const server = http.createServer((req, res) => {
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim().toLowerCase().replace(/:\d+$/, '');
  if (CANON && LEGACY_HOST.test(host)) {
    res.writeHead(301, { Location: CANON.origin + '/' + legacyTarget(req.url), 'Cache-Control': 'public, max-age=86400' }).end();
    return;
  }
  // 운영 모드: www.대표주소는 대표 주소로 모은다
  if (CANON && host === 'www.' + CANON.hostname) {
    res.writeHead(301, { Location: CANON.origin + req.url, 'Cache-Control': 'public, max-age=3600' }).end();
    return;
  }
  // 관리자(유입·트래픽/콘텐츠)와 방문 기록 수집 — tools/admin/admin.mjs
  if (req.url === '/api/t' || req.url.startsWith('/admin')) {
    handleAdmin(req, res, { CANON, PROD, host }).catch(e => { console.error('[admin]', e.message); if (!res.headersSent) res.writeHead(500).end(); });
    return;
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, { Allow: 'GET, HEAD' }).end(); return; }
  // 대표 주소가 아닌 호스트(Railway 기본 주소 등)와 미리보기 모드는 검색 노출 막기
  const noindex = !PROD || (CANON && host && host !== CANON.hostname && !/^(localhost|127\.|\[::1\])/.test(host));
  if (!live) { res.writeHead(503, { 'Retry-After': '5', 'Content-Type': 'text/plain; charset=utf-8' }).end('사이트를 준비하고 있습니다.'); return; }
  const url = new URL(req.url, 'http://localhost');
  let file = resolve(url.pathname);
  let st = file && stat(file);
  if (st?.isDirectory()) {
    if (!url.pathname.endsWith('/')) { res.writeHead(301, { Location: url.pathname + '/' + url.search }).end(); return; }
    file = path.join(file, 'index.html');
    st = stat(file);
  }
  if (st?.isFile()) { send(req, res, file, st, 200, url.pathname, noindex); return; }
  const nf = path.join(live, '404.html');
  const nst = stat(nf);
  if (nst) send(req, res, nf, nst, 404, url.pathname, true);
  else res.writeHead(404).end();
});

// ── 시작 ──
// 지난 실행이 남긴 빌드와 Railway 빌드 단계의 검사용 빌드(.site/check) 정리
for (const d of [SITE_DIR, path.join(ROOT, '.site', 'check')]) fs.rmSync(d, { recursive: true, force: true });
server.listen(PORT, () => console.log(`퀵서비스다 사이트 서버: http://localhost:${PORT} (${PROD ? '운영' : '미리보기'})`));
const ok = await build();
if (!ok && !live) { console.error('첫 빌드에 실패해 종료합니다.'); process.exit(1); }
schedule();
for (const sig of ['SIGTERM', 'SIGINT']) process.on(sig, () => {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 5_000).unref();
});
