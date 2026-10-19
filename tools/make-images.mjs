// 공유 이미지(OG 1200×630)를 HTML로 그려 헤드리스 크롬으로 캡처한다. 로고·사진이 바뀌었을 때만 다시 돌리면 된다.
//   node tools/make-images.mjs
// 로고(assets/img/brand)·사진(assets/img/photo)은 tools/prepare_photos.py 가 기존 홈페이지 이미지로 만든다.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'assets/img');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'qs-img-'));
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome'].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome/Edge를 찾지 못했습니다. CHROME 환경변수로 경로를 지정하세요.');

const file = rel => pathToFileURL(path.join(ROOT, rel)).href;
const font = `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@500;700;900&display=block">`;
const og = ({ title, sub, chips, photoRel }) => `<!doctype html><meta charset="utf-8">${font}<style>
*{margin:0;box-sizing:border-box}body{width:1200px;height:630px;overflow:hidden;font-family:'Noto Sans KR',sans-serif;color:#0F2233;letter-spacing:-.02em;
background:radial-gradient(700px 420px at 90% 0%,#CFEDFC 0%,transparent 60%),linear-gradient(180deg,#E6F6FE 0%,#FFFFFF 100%);position:relative}
body:before{content:'';position:absolute;inset:0;background:repeating-linear-gradient(-12deg,transparent 0 46px,rgba(31,163,224,.07) 46px 48px)}
.in{position:absolute;left:70px;top:58px;width:560px;bottom:56px;display:flex;flex-direction:column}
.logo{width:250px}
h1{margin-top:34px;font-size:60px;font-weight:900;line-height:1.16;letter-spacing:-.045em}h1 em{font-style:normal;color:#0F8ACB}
p{margin-top:18px;font-size:24px;color:#44556A;font-weight:500;line-height:1.5}
.chips{margin-top:auto;display:flex;gap:10px;align-items:center}.chip{font-size:20px;font-weight:700;padding:9px 16px;border-radius:12px;background:#fff;border:1.5px solid #C3E7F9;color:#0B5888}
.ph{position:absolute;right:56px;top:58px;width:470px;height:514px;border-radius:28px;overflow:hidden;box-shadow:0 30px 60px -22px rgba(11,66,104,.45)}
.ph img{width:100%;height:100%;object-fit:cover}
.tel{position:absolute;right:86px;bottom:86px;font-size:40px;font-weight:900;color:#1C1400;background:#FFB400;padding:8px 24px;border-radius:16px;letter-spacing:0;box-shadow:0 10px 24px -10px rgba(0,0,0,.4)}
</style><body><div class="in"><img class="logo" src="${file('assets/img/brand/logo.png')}"><h1>${title}</h1><p>${sub}</p><div class="chips">${chips.map(c => `<span class="chip">${c}</span>`).join('')}</div></div>
<div class="ph"><img src="${file(photoRel)}"></div><span class="tel">1661-7462</span></body>`;

const jobs = [
  ['og-default.png', og({ title: '지금 접수하면,<br><em>바로 출발합니다.</em>', sub: '서울·인천·경기 퀵서비스 · 전국 화물운송<br>24시간 365일 접수', chips: ['오토바이 8,000원~', 'KTX 연계 25,000원~'], photoRel: 'assets/img/photo/hero-ride-m.webp' })],
  ['og-blog.png', og({ title: '퀵서비스다<br><em>물류 가이드</em>', sub: '퀵 요금, 차량 고르는 법, 지방 당일 배송까지<br>접수 현장에서 자주 받는 질문', chips: ['요금 가이드', '차량·화물', '지방·연계'], photoRel: 'assets/img/photo/hero-ride-m.webp' })],
];
for (const [name, src] of jobs) {
  const f = path.join(TMP, name + '.html');
  fs.writeFileSync(f, src);
  const out = path.join(OUT, name);
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files', '--force-device-scale-factor=1', '--window-size=1200,630', '--virtual-time-budget=6000', `--screenshot=${out}`, pathToFileURL(f).href], { stdio: 'ignore' });
  console.log('만듦', name, fs.statSync(out).size, 'bytes');
}
fs.rmSync(TMP, { recursive: true, force: true });
