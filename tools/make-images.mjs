// 공유 이미지(OG)·아이콘을 HTML로 그려 헤드리스 크롬으로 캡처한다. 한 번만 돌리면 된다.
//   node tools/make-images.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'assets/img');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'qs-img-'));
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome'].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome/Edge를 찾지 못했습니다. CHROME 환경변수로 경로를 지정하세요.');

const mark = `<svg viewBox="0 0 40 40"><rect width="40" height="40" rx="11" fill="#0B2A5B"/><circle cx="19" cy="19" r="10.5" fill="none" stroke="#2EC4D3" stroke-width="5"/><path d="M23.5 23.5 31 31" stroke="#2EC4D3" stroke-width="5" stroke-linecap="round"/><path d="M5 14h5M4 19h4M5 24h5" stroke="#5B8BD6" stroke-width="2.2" stroke-linecap="round"/></svg>`;
const font = `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@500;700;900&display=block">`;
// 관제망 느낌의 배경선(고정 시드)
function net(w, h) {
  let s = 11; const r = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  const pts = []; const g = 70;
  for (let y = -1; y < h / g + 2; y++) for (let x = -1; x < w / g + 2; x++) pts.push([x * g + (r() - .5) * 40, y * g + (r() - .5) * 40]);
  const cols = Math.ceil(w / g) + 3; let p = '';
  pts.forEach((a, i) => { const b = pts[i + 1], c = pts[i + cols]; if (b && (i + 1) % cols && r() < .75) p += `M${a[0]} ${a[1]}L${b[0]} ${b[1]}`; if (c && r() < .65) p += `M${a[0]} ${a[1]}L${c[0]} ${c[1]}`; });
  return `<svg width="${w}" height="${h}" style="position:absolute;inset:0"><path d="${p}" stroke="rgba(120,170,230,.16)" stroke-width="1.2" fill="none"/><path d="M-20 ${h * .78} C ${w * .3} ${h * .6}, ${w * .55} ${h * .92}, ${w + 20} ${h * .66}" stroke="rgba(20,62,120,.7)" stroke-width="46" fill="none"/><path d="M${w * .6} ${h * .66} L ${w * .68} ${h * .5} L ${w * .8} ${h * .45} L ${w * .9} ${h * .3}" stroke="#2EC4D3" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="${w * .6}" cy="${h * .66}" r="9" fill="#FFB400"/><circle cx="${w * .9}" cy="${h * .3}" r="9" fill="#2EC4D3"/></svg>`;
}
const og = (title, sub, chips) => `<!doctype html><meta charset="utf-8">${font}<style>
*{margin:0;box-sizing:border-box}body{width:1200px;height:630px;overflow:hidden;font-family:'Noto Sans KR',sans-serif;color:#fff;background:linear-gradient(180deg,#08172F,#050F20);position:relative;letter-spacing:-.02em}
.shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(5,15,32,.95) 0%,rgba(5,15,32,.6) 55%,rgba(5,15,32,.1) 100%)}
.in{position:absolute;left:80px;top:72px;right:80px;bottom:64px;display:flex;flex-direction:column}
.brand{display:flex;align-items:center;gap:16px}.brand svg{width:64px;height:64px}.brand b{font-size:40px;font-weight:900;letter-spacing:-.04em}.brand small{display:block;font-size:15px;letter-spacing:.16em;color:rgba(255,255,255,.55);font-weight:700}
h1{margin-top:58px;font-size:64px;font-weight:900;line-height:1.18;letter-spacing:-.045em}h1 em{font-style:normal;color:#7FDDE6}
p{margin-top:20px;font-size:26px;color:rgba(255,255,255,.75);font-weight:500}
.chips{margin-top:auto;display:flex;gap:12px;align-items:center}.chip{font-size:22px;font-weight:700;padding:10px 18px;border-radius:12px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14)}
.tel{margin-left:auto;font-size:40px;font-weight:900;color:#1C1400;background:#FFB400;padding:8px 24px;border-radius:14px;letter-spacing:0}
</style><body>${net(1200, 630)}<div class="shade"></div><div class="in"><div class="brand">${mark}<div><b>퀵서비스다</b><small>QUICKEY SERVICE</small></div></div><h1>${title}</h1><p>${sub}</p><div class="chips">${chips.map(c => `<span class="chip">${c}</span>`).join('')}<span class="tel">1661-7462</span></div></div></body>`;
const icon = (size, pad) => `<!doctype html><style>*{margin:0}body{width:${size}px;height:${size}px;background:${pad ? '#0B2A5B' : 'transparent'};display:grid;place-items:center;overflow:hidden}svg{width:${pad ? size * .86 : size}px;height:${pad ? size * .86 : size}px}</style><body>${mark}</body>`;

const jobs = [
  ['og-default.png', 1200, 630, og('오토바이 한 대부터<br><em>25톤 트럭까지</em>', '서울·인천·경기 퀵서비스 · 전국 화물운송 · 24시간 접수', ['오토바이 8,000원~', '다마스 20,000원~', 'KTX 연계 25,000원~'])],
  ['og-blog.png', 1200, 630, og('물류 가이드', '퀵 요금, 차량 고르는 법, 지방 당일 배송까지<br>접수 현장에서 자주 받는 질문을 정리합니다', ['요금 가이드', '차량·화물', '지방·연계배송'])],
  ['logo-512.png', 512, 512, icon(512, false)],
  ['apple-touch-icon.png', 180, 180, icon(180, true)],
  ['icon-48.png', 48, 48, icon(48, false)],
  ['icon-32.png', 32, 32, icon(32, false)],
  ['icon-16.png', 16, 16, icon(16, false)],
];
fs.mkdirSync(OUT, { recursive: true });
for (const [name, w, h, src] of jobs) {
  const f = path.join(TMP, name + '.html');
  fs.writeFileSync(f, src);
  const out = path.join(OUT, name);
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1', `--window-size=${w},${h}`, '--virtual-time-budget=6000', '--default-background-color=00000000', `--screenshot=${out}`, 'file:///' + f.replace(/\\/g, '/')], { stdio: 'ignore' });
  console.log('만듦', name, fs.statSync(out).size, 'bytes');
}
// favicon.ico (16·32·48) — Python Pillow
try {
  execFileSync('python', ['-c', `from PIL import Image; im=Image.open(r'${path.join(OUT, 'icon-48.png')}').convert('RGBA'); im.save(r'${path.join(ROOT, 'favicon.ico')}', sizes=[(16,16),(32,32),(48,48)])`], { stdio: 'inherit' });
  console.log('만듦 favicon.ico');
} catch (e) { console.warn('favicon.ico 생성 실패(Pillow 필요):', e.message); }
for (const n of ['icon-16.png', 'icon-32.png', 'icon-48.png']) fs.rmSync(path.join(OUT, n), { force: true });
fs.rmSync(TMP, { recursive: true, force: true });
