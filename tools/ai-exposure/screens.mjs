// 홈페이지 전후 비교 캡처 — 기존 퀵서비스다.com(전)과 신규 퀵서비스다.kr(후)의 같은 내용 페이지를 같은 크기로 찍어 날짜별로 쌓는다.
//   node tools/ai-exposure/screens.mjs [--date YYYY-MM-DD] [--old] [--full]
//   기본: 신규 사이트 페이지 첫 화면(데스크톱 1366×820, 모바일 390×844). --old: 기존 사이트도(아직 살아 있으면). --full: 전체 페이지 캡처도.
// 저장: 측정/스크린샷/<날짜>/<new|old>_<key>_<desktop|mobile>[_full].jpg + shots.json
// '전' 기준본: 측정/스크린샷/before/ — 기존 사이트를 처음 찍은 날의 사본(덮어쓰지 않음). .com이 .kr로 301 되면 기존 사이트 캡처는 멈추고 기록만 남긴다.
// 방문 분석 오염을 막으려고 GA4·GTM·네이버·Clarity·자체 기록(/api/t) 요청은 막고 찍는다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROJ, kstDate, arg, flag, findChrome } from './lib.mjs';

export const SHOT_DIR = process.env.QS_SHOT_DIR || path.join(PROJ, '측정', '스크린샷');
export const OLD = 'http://xn--2j1bs9sn9b30bc55a.com/';
export const NEW = 'https://xn--2j1bs9sn9b30bc55a.kr/';
// 같은 내용끼리 짝(old가 null이면 신규에만 있는 페이지)
export const PAGES = [
  { key: 'home', label: '홈', old: '', new: '' },
  { key: 'about', label: '회사소개', old: '?page_id=company', new: 'about/' },
  { key: 'motorcycle', label: '오토바이 퀵', old: '?page_id=quick', new: 'services/motorcycle/' },
  { key: 'damas', label: '다마스·라보', old: '?page_id=damas', new: 'services/damas-labo/' },
  { key: 'truck', label: '화물운송', old: '?page_id=cargo', new: 'services/truck/' },
  { key: 'intercity', label: '연계배송(지방 당일)', old: '?page_id=delivery', new: 'services/intercity/' },
  { key: 'vehicles', label: '차량 제원', old: '?page_id=truckinfo', new: 'vehicles/' },
  { key: 'faq', label: '자주 묻는 질문', old: '?page_id=service_center', new: 'faq/' },
  { key: 'pricing', label: '요금 안내', old: null, new: 'pricing/' },
  { key: 'area', label: '서비스 지역', old: null, new: 'area/' },
  { key: 'blog', label: '물류 가이드(블로그)', old: null, new: 'blog/' },
];
const VIEWS = { desktop: { width: 1366, height: 820, deviceScaleFactor: 1 }, mobile: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true } };
const BLOCK = /googletagmanager\.com|google-analytics\.com|analytics\.google\.com|wcs\.naver\.(net|com)|clarity\.ms|\/api\/t$/;

// 기존 사이트가 아직 자기 화면을 보여 주는지(.kr로 301 됐으면 false)
export async function oldAlive() {
  try { const r = await fetch(OLD, { redirect: 'manual', signal: AbortSignal.timeout(20000) }); return r.status === 200; } catch (_) { return false; }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const DATE = arg('date', kstDate()); const FULL = flag('full');
  const out = path.join(SHOT_DIR, DATE); fs.mkdirSync(out, { recursive: true });
  const alive = flag('old') ? await oldAlive() : false;
  const { default: puppeteer } = await import('puppeteer-core');
  const b = await puppeteer.launch({ executablePath: findChrome(), headless: true, args: ['--lang=ko-KR', '--hide-scrollbars'] });
  const shots = [];
  const take = async (site, pg, view) => {
    const url = (site === 'old' ? OLD : NEW) + pg[site];
    const p = await b.newPage();
    try {
      await p.setRequestInterception(true); p.on('request', r => (BLOCK.test(r.url()) ? r.abort() : r.continue()));
      await p.setViewport(VIEWS[view]); await p.setExtraHTTPHeaders({ 'Accept-Language': 'ko-KR,ko;q=0.9' });
      const res = await p.goto(url, { waitUntil: 'networkidle2', timeout: 60000 }).catch(() => null);
      // 스크롤해서 늦게 뜨는 그림·등장 효과를 모두 띄운 뒤 맨 위로
      await p.evaluate(async () => { const h = document.body.scrollHeight; for (let y = 0; y < h; y += 700) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 80)); } window.scrollTo(0, 0); }).catch(() => {});
      await new Promise(r => setTimeout(r, 1500));
      const base = `${site}_${pg.key}_${view}`;
      await p.screenshot({ path: path.join(out, base + '.jpg'), type: 'jpeg', quality: 78 });
      if (FULL) await p.screenshot({ path: path.join(out, base + '_full.jpg'), type: 'jpeg', quality: 68, fullPage: true, captureBeyondViewport: true }).catch(() => {});
      shots.push({ site, key: pg.key, label: pg.label, view, url, status: res ? res.status() : 0, file: base + '.jpg', full: FULL ? base + '_full.jpg' : null });
    } catch (e) { shots.push({ site, key: pg.key, view, url, error: e.message.slice(0, 160) }); }
    finally { await p.close().catch(() => {}); }
  };
  for (const pg of PAGES) for (const view of Object.keys(VIEWS)) {
    await take('new', pg, view);
    if (alive && pg.old !== null) await take('old', pg, view);
  }
  await b.close();
  fs.writeFileSync(path.join(out, 'shots.json'), JSON.stringify({ date: DATE, oldAlive: flag('old') ? alive : null, full: FULL, shots }, null, 1));
  // '전' 기준본: 처음 찍은 기존 사이트 화면을 before/ 에 고정(이미 있으면 그대로)
  const before = path.join(SHOT_DIR, 'before');
  if (alive && !fs.existsSync(path.join(before, 'old_home_desktop.jpg'))) {
    fs.mkdirSync(before, { recursive: true });
    for (const f of fs.readdirSync(out).filter(f => f.startsWith('old_'))) fs.copyFileSync(path.join(out, f), path.join(before, f));
    fs.writeFileSync(path.join(before, 'README.txt'), `기존 퀵서비스다.com '전' 기준본 — ${DATE} 촬영(이후 덮어쓰지 않음). 신규 사이트와 비교할 때 이 폴더를 쓴다.\n`);
  }
  const bad = shots.filter(s => s.error || (s.status && s.status !== 200));
  console.log(`화면 캡처 ${DATE}: ${shots.length}장${FULL ? '(+전체 페이지)' : ''} · 기존 사이트 ${flag('old') ? (alive ? '촬영' : '301 또는 접속 안 됨 — 건너뜀') : '이번엔 안 찍음'} · 문제 ${bad.length}${bad.length ? ' — ' + bad.map(s => `${s.site}/${s.key}/${s.view} ${s.error || s.status}`).join(', ') : ''}`);
}
