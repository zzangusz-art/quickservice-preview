// AI·검색 노출 측정 공용 — 경로, 질의·엔진 목록, 판정 정규식, 추이.csv 읽기, 리포트 HTML→PDF·캡처 잘라내기
// 하나회원권 프로젝트(hana-site/scripts/ai-capture.js·build-weekly-new-exposure.js)의 방식을 퀵서비스다에 맞게 옮김
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const REPO = path.resolve(HERE, '..', '..');
export const PROJ = path.resolve(REPO, '..'); // 5. 퀵서비스다 — 측정·보고 파일은 저장소 밖에 둔다(배포에 안 섞이게)
export const AI_DIR = process.env.QS_AI_DIR || path.join(PROJ, '측정', 'AI검색');
export const REPORT_DIR = process.env.QS_REPORT_DIR || path.join(PROJ, '보고');
export const BLOG_DIR = path.join(REPO, 'content', 'blog');
export const CHECK_DIR = process.env.QS_CHECK_DIR || path.join(PROJ, '측정', '블로그점검');

export const HOST = 'xn--2j1bs9sn9b30bc55a.kr';
export const HOST_KO = '퀵서비스다.kr';
// 우리 사이트: 퓨니코드·한글 주소 둘 다(Perplexity·구글은 한글로, 링크 주소는 퓨니코드로 보인다)
export const SITE_RE = /xn--2j1bs9sn9b30bc55a|퀵서비스다\.kr/i;
// 상호: '퀵서비스다' — '…퀵서비스다.'처럼 문장 끝 서술이나 '퀵서비스다 보니' 같은 일반 문장은 빼고, 대표번호는 상호로 본다
export const BRAND_WORD_RE = /퀵서비스다(?![.?!。,](?:\s|$))(?!\s*(?:보니|운\s|움|워))/;
export const PHONE_RE = /1661[-\s.]?7462/;
export const BRAND_QUERY = '퀵서비스다';
// 기존 사이트 퀵서비스다.com(같은 대표번호, http) — 신규 .kr 노출과 따로 센다
export const OLD_HOST = 'xn--2j1bs9sn9b30bc55a.com';
export const OLD_RE = /xn--2j1bs9sn9b30bc55a\.com|퀵서비스다\.com/i;

// 우선 키워드 순서(리포트도 이 순서) — 사용자 지정 핵심: 서울퀵·전국 지역 퀵·다마스 퀵·오토바이 퀵 + 수도권·인천·경기
export const QUERIES = ['퀵서비스다', '서울퀵', '오토바이 퀵', '다마스 퀵', '전국 퀵서비스', '수도권 퀵서비스', '인천 퀵서비스', '경기 퀵서비스', '퀵서비스 추천', '퀵서비스 요금'];
export const ENG = { google: '구글', naver: '네이버', naverai: '네이버 AI탭', bing: 'Bing', perplexity: 'Perplexity', chatgpt: 'ChatGPT', claude: 'Claude', gemini: 'Gemini' };
export const SEARCH = ['google', 'naver', 'naverai', 'bing', 'perplexity'];
export const CHAT = ['chatgpt', 'claude', 'gemini'];

export const kstNow = () => new Date(Date.now() + 9 * 3600e3);
export const kstDate = () => kstNow().toISOString().slice(0, 10);
export const addDays = (d, n) => new Date(new Date(d + 'T00:00:00Z').getTime() + n * 864e5).toISOString().slice(0, 10);
export const weekday = (d) => '일월화수목금토'[new Date(d + 'T00:00:00Z').getUTCDay()];
export const safe = (q) => q.replace(/[^\w가-힣]+/g, '_').replace(/^_|_$/g, '');
export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const md = (d) => d ? `${+d.slice(5, 7)}/${+d.slice(8, 10)}` : '-';
export const arg = (name, def) => { const i = process.argv.indexOf('--' + name); return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : def; };
export const flag = (name) => process.argv.includes('--' + name);

export const CSV = path.join(AI_DIR, '추이.csv');
export const CSV_HEAD = 'date,engine,query,site,brand,domains,blocked,error';

// 추이.csv → 행 목록. 같은 날 같은 엔진·질의를 다시 캡처하면 뒤 행이 이긴다(cell)
export function readRows(upTo) {
  if (!fs.existsSync(CSV)) return [];
  return fs.readFileSync(CSV, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean).slice(1)
    .map(l => { const c = l.split(','); return { date: c[0], engine: c[1], query: c[2], site: +c[3], brand: +c[4], domains: (c[5] || '').split('|').filter(Boolean), blocked: +c[6], error: c[7] || '' }; })
    .filter(r => ENG[r.engine] && (!upTo || r.date <= upTo));
}
export const valid = (r) => r && !r.blocked && !r.error;
export function makeCell(rows) {
  const idx = new Map();
  for (const r of rows) if (valid(r)) idx.set(`${r.date}|${r.engine}|${r.query}`, r);
  return (d, e, q) => idx.get(`${d}|${e}|${q}`) || null;
}
export const qOrder = (q) => { const i = QUERIES.indexOf(q); return i < 0 ? 99 : i; };
export const eOrder = (e) => Object.keys(ENG).indexOf(e);

const RESULT_CACHE = new Map();
export function readResult(d) {
  if (!RESULT_CACHE.has(d)) { let v = []; try { v = JSON.parse(fs.readFileSync(path.join(AI_DIR, d, 'result.json'), 'utf8')); } catch (_) { /* 없음 */ } RESULT_CACHE.set(d, v); }
  return RESULT_CACHE.get(d);
}
export const resultOf = (d, e, q) => readResult(d).filter(x => x.engine === e && x.query === q).pop() || null;
// 기존 사이트(.com)가 출처·본문에 나왔는지
export const oldOf = (d, e, q) => { const r = resultOf(d, e, q); return !!(r && (r.domains || []).includes(OLD_HOST)) || OLD_RE.test(textOf(d, e, q)); };
// 출처 도메인 표시: 퓨니코드 → 한글, 우리 기존 사이트는 표시
export async function domainLabel(h) {
  const { domainToUnicode } = await import('node:url');
  const u = domainToUnicode(h) || h;
  return h === OLD_HOST ? `${u} (기존 사이트)` : u;
}
export const shotOf = (d, e, q) => { for (const ext of ['jpg', 'png']) { const f = path.join(AI_DIR, d, `${e}_${safe(q)}.${ext}`); if (fs.existsSync(f)) return f; } return null; };
export const textOf = (d, e, q) => { const f = path.join(AI_DIR, d, `${e}_${safe(q)}.txt`); return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : ''; };

// 캡처 본문에서 우리 사이트(없으면 상호)를 언급한 앞뒤 문맥
export function snippet(T, siteOnly) {
  const t = T.replace(/새 창 열림/g, ' ').replace(/\s+/g, ' ').trim();
  let i = t.search(SITE_RE);
  if (i < 0 && !siteOnly) { const m = t.match(PHONE_RE) || t.match(BRAND_WORD_RE); i = m ? m.index : -1; }
  if (i < 0) return '';
  return (i > 110 ? '… ' : '') + t.slice(Math.max(0, i - 110), i + 110) + (i + 110 < t.length ? ' …' : '');
}

export function findChrome() {
  const list = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean);
  return list.find(p => fs.existsSync(p)) || null;
}
let BROWSER = null;
async function headless() {
  if (BROWSER) return BROWSER;
  const { default: puppeteer } = await import('puppeteer-core');
  BROWSER = await puppeteer.launch({ executablePath: findChrome(), headless: true, args: ['--lang=ko-KR', '--hide-scrollbars'] });
  return BROWSER;
}
export async function closeHeadless() { if (BROWSER) { await BROWSER.close().catch(() => {}); BROWSER = null; } }

// 전체 페이지 캡처(수천 px)를 그대로 넣으면 PDF가 커지므로, 보여 줄 부분만 잘라 JPEG로 만든다(캐시).
// pos: 0~1(노출 위치 비율 — 잘린 영역 위에서 30% 지점에 오게) 또는 'top'. ratio = 결과 높이/너비
export async function cropShot(src, pos = 'top', ratio = 0.62) {
  if (!src || !fs.existsSync(src)) return null;
  const dir = path.join(AI_DIR, '_crops'); fs.mkdirSync(dir, { recursive: true });
  const dst = path.join(dir, crypto.createHash('md5').update(src + fs.statSync(src).size + pos + ratio).digest('hex').slice(0, 14) + '.jpg');
  if (fs.existsSync(dst)) return dst;
  const b = await headless(); const p = await b.newPage();
  try {
    const mime = src.endsWith('.png') ? 'png' : 'jpeg';
    await p.setContent(`<style>html,body{margin:0;background:#fff}img{display:block}</style><img src="data:image/${mime};base64,${fs.readFileSync(src).toString('base64')}">`, { waitUntil: 'load' });
    const { w, h } = await p.evaluate(() => { const i = document.querySelector('img'); return { w: i.naturalWidth, h: i.naturalHeight }; });
    await p.setViewport({ width: w, height: Math.min(h, 2000) });
    const ch = Math.min(h, Math.round(w * ratio));
    const y = pos === 'top' || pos == null ? 0 : Math.max(0, Math.min(h - ch, Math.round(pos * h - ch * 0.3)));
    await p.screenshot({ path: dst, type: 'jpeg', quality: 72, clip: { x: 0, y, width: w, height: ch }, captureBeyondViewport: true });
  } finally { await p.close(); }
  return dst;
}
export const dataUri = (f) => f && fs.existsSync(f) ? `data:image/jpeg;base64,${fs.readFileSync(f).toString('base64')}` : '';

export async function htmlToPdf(htmlFile, pdfFile, footerTitle) {
  const b = await headless(); const p = await b.newPage();
  try {
    await p.goto('file:///' + htmlFile.replace(/\\/g, '/'), { waitUntil: 'networkidle0', timeout: 90000 });
    await p.pdf({ path: pdfFile, format: 'A4', printBackground: true, margin: { top: '14mm', bottom: '14mm', left: '13mm', right: '13mm' }, displayHeaderFooter: true, headerTemplate: '<div></div>',
      footerTemplate: `<div style="font-size:8px;color:#888;width:100%;text-align:center;font-family:sans-serif">${esc(footerTitle)} · <span class="pageNumber"></span>/<span class="totalPages"></span></div>` });
  } finally { await p.close(); }
  return pdfFile;
}

// 리포트 공통 스타일(사이트 하늘색 톤)
export const REPORT_CSS = `
:root{--navy:#0b2545;--sky:#1e88e5;--sky2:#e8f3fd;--green:#14804a;--amber:#b26a00;--line:#dde6f0;--muted:#5d6b7c}
*{box-sizing:border-box}body{font-family:'Pretendard Variable',Pretendard,'Malgun Gothic',sans-serif;color:#18202c;margin:0;font-size:10.4pt;line-height:1.6;word-break:keep-all}
.head{border-left:8px solid var(--sky);padding:2mm 0 2mm 7mm;margin-bottom:6mm}.head .k{color:var(--sky);font-weight:800;letter-spacing:.08em;font-size:9pt}.head h1{font-size:21pt;margin:4px 0;color:var(--navy)}.head .meta{color:var(--muted);font-size:9.6pt}
h2{font-size:13.5pt;color:var(--navy);border-bottom:2.5px solid var(--navy);padding-bottom:3px;margin:16px 0 8px;page-break-after:avoid}h3{font-size:11pt;color:var(--navy);margin:10px 0 4px;page-break-after:avoid}
table{width:100%;border-collapse:collapse;font-size:9.4pt;margin:6px 0}tr{page-break-inside:avoid}th,td{border:1px solid var(--line);padding:4px 6px;text-align:left;vertical-align:top}th{background:var(--sky2);color:var(--navy)}
td.c,th.c{text-align:center}.mx td{text-align:center;padding:3px 2px}.mx td:first-child{text-align:left;font-weight:700;white-space:nowrap}
.kpi{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin:8px 0}.kpi div{border:1px solid var(--line);border-radius:6px;padding:7px 9px}.kpi b{display:block;font-size:19pt;color:var(--navy);line-height:1.2}.kpi span{font-size:8.8pt;color:var(--muted)}
.item{border:1px solid var(--line);border-radius:8px;padding:6px 10px;margin:6px 0;page-break-inside:avoid}.ih{display:flex;gap:8px;align-items:baseline;flex-wrap:wrap}.kw{font-weight:800;font-size:11.5pt;color:var(--navy)}.en{background:var(--sky2);color:var(--sky);border-radius:4px;padding:0 6px;font-size:9pt;font-weight:700}.chg{font-size:9.4pt;color:var(--muted)}.chg b{color:var(--green)}
.q{background:#f6f9fc;border-left:3px solid var(--sky);padding:5px 8px;font-size:9pt;margin:6px 0}
figure{margin:6px 0 0}figure img{width:100%;border:1px solid var(--line);border-radius:5px;display:block}figcaption{font-size:8.6pt;color:var(--muted)}
.two{display:grid;grid-template-columns:1fr 1fr;gap:8px}.tag{display:inline-block;font-size:8.5pt;font-weight:800;border-radius:4px;padding:0 6px;margin-bottom:2px}.tag.before{background:#eef0f3;color:#5d6b7c}.tag.after{background:#e3f4ea;color:var(--green)}
.ok{color:var(--green);font-weight:800}.old{color:#6a4fb3;font-weight:800}.warn{color:var(--amber);font-weight:800}.muted{color:var(--muted)}.small{font-size:9pt}
.note{background:#f2f8fe;border-left:4px solid var(--sky);padding:6px 10px;border-radius:0 6px 6px 0;font-size:9.3pt;margin:6px 0}
ul{margin:4px 0;padding-left:18px}li{margin:2px 0}
@page{size:A4;margin:14mm 13mm}`;
export const FONT_LINK = '<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">';
// 현황표 칸: ● 신규 사이트 노출 / ◆ 기존 사이트(.com)만 / △ 상호·번호만 / — 없음 / · 미측정·차단
export const mark = (c, old) => !c ? '<span class="muted">·</span>' : c.site ? '<span class="ok">●</span>' : old ? '<span class="old">◆</span>' : c.brand ? '<span class="warn">△</span>' : '<span class="muted">—</span>';
export const state = (c, old) => !c ? '미측정' : c.site ? '노출' : old ? '기존 사이트만' : c.brand ? '상호 언급' : '없음';
export const LEGEND = '<p class="small muted">● 퀵서비스다.kr 노출(링크·주소) · ◆ 기존 사이트 퀵서비스다.com만 · △ 상호·대표번호만 언급 · — 없음 · · 미측정(차단·로그인 필요)</p>';
