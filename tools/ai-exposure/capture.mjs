// AI 검색·검색엔진 노출 일일 캡처 — 엔진×질의 화면을 저장하고 우리 사이트 노출·상호 언급·인용 출처를 기록한다.
//   node tools/ai-exposure/capture.mjs                     → 측정/AI검색/<오늘>/ 에 캡처(jpg)·본문(txt)·result.json·요약 md, 추이.csv 누적
//   node tools/ai-exposure/capture.mjs --engines google,naver --queries "서울퀵,다마스 퀵"   (--no-wait: 하나회원권 캡처 대기 생략)
// 판정: 노출 = 결과 본문·링크에 퀵서비스다.kr(퓨니코드 포함), 상호 언급 = '퀵서비스다' 또는 대표번호(브랜드 질의는 대표번호·주소만)
// 사람이 보는 화면 그대로 남기려고 창을 띄운 크롬 + 전용 프로필(로그인·쿠키 동의 유지)을 쓴다. 봇 확인·차단 화면은 우회하지 않는다 —
// 나오면 그 엔진은 그날 '차단'으로 기록하고 남은 질의를 건너뛴다. 요청 사이에는 일정 간격을 둔다.
// ChatGPT는 로그인 없이, Claude·Gemini는 전용 프로필에 한 번 로그인해 두면 측정된다(안 돼 있으면 '로그인 필요'로 기록하고 그 엔진은 그날 건너뜀).
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { AI_DIR, CSV, CSV_HEAD, ENG, QUERIES, BRAND_QUERY, SITE_RE, BRAND_WORD_RE, PHONE_RE, HOST, kstDate, safe, arg, flag, findChrome } from './lib.mjs';

const ENGINES = {
  google: { url: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}&hl=ko&gl=kr`, wait: 4000 },
  naver: { url: (q) => `https://search.naver.com/search.naver?query=${encodeURIComponent(q)}`, wait: 4000 },
  naverai: { url: (q) => `https://search.naver.com/search.naver?ssc=tab.ait.all&query=${encodeURIComponent(q)}`, wait: 15000 }, // 네이버 AI탭(로그인 불필요)
  bing: { url: (q) => `https://www.bing.com/search?q=${encodeURIComponent(q)}&setlang=ko&cc=KR`, wait: 5000 },
  perplexity: { url: (q) => `https://www.perplexity.ai/search?q=${encodeURIComponent(q)}`, wait: 18000 },
  // 대화형 AI: 질의를 입력창에 넣고 답변 길이가 멈출 때까지 대기. 사이드바(지난 대화 제목) 오탐을 막으려 대화 영역만 본다
  chatgpt: { url: (q) => `https://chatgpt.com/?q=${encodeURIComponent(q)}&hints=search`, wait: 6000, chat: true, area: 'main', input: '#prompt-textarea, div[contenteditable="true"], textarea' },
  claude: { url: (q) => `https://claude.ai/new?q=${encodeURIComponent(q)}`, wait: 6000, chat: true, area: 'main', input: 'div[contenteditable="true"], textarea' },
  gemini: { url: () => 'https://gemini.google.com/app?hl=ko', wait: 6000, chat: true, area: 'chat-window', input: 'rich-textarea div[contenteditable="true"], div[contenteditable="true"], textarea' },
};
const sleep = (ms) => new Promise(res => setTimeout(res, ms));
const LOGIN_RE = /\/login|signin|accounts\.google\.com|\/auth/i;
const BLOCK_RE = /unusual traffic|비정상적인 트래픽|robot|보안 확인|verify you are human|Cloudflare|마지막 한 단계|과제 해결|One last step|solve the challenge|captcha/i;
const areaText = (page, E) => page.evaluate(sel => ((document.querySelector(sel) || document.body).innerText || '').slice(0, 200000), E.area);

async function runChat(page, E, q) {
  if (LOGIN_RE.test(page.url())) return 'login';
  const input = await page.waitForSelector(E.input, { visible: true, timeout: 25000 }).catch(() => null);
  if (!input) return LOGIN_RE.test(page.url()) ? 'login' : 'noinput';
  await sleep(2500);
  const mainText = () => areaText(page, E).catch(() => ''); // 자동 전송 직후 /c/… 로 이동하면 컨텍스트가 바뀌므로 실패는 빈 값
  const cur = await page.evaluate(el => (el.value !== undefined ? el.value : el.innerText || '').trim(), input).catch(() => '');
  const already = (await mainText()).split(q).length > 2; // 질의가 대화 영역에 이미 올라갔으면 자동 전송된 것
  if (!already) {
    if (cur !== q) { await input.click(); if (cur) { await page.keyboard.down('Control'); await page.keyboard.press('KeyA'); await page.keyboard.up('Control'); await page.keyboard.press('Backspace'); } await page.keyboard.type(q, { delay: 60 }); }
    await sleep(800); await page.keyboard.press('Enter');
  }
  await sleep(8000);
  let prev = -1, same = 0;
  for (let i = 0; i < 40 && same < 3; i++) { const n = (await mainText()).length; same = n === prev ? same + 1 : 0; prev = n; await sleep(3000); }
  return LOGIN_RE.test(page.url()) ? 'login' : '';
}

// 결과 화면에서 링크·표시 주소(cite)를 모아 인용 출처 도메인 목록과 우리 링크 위치를 구한다(브라우저 안에서 실행)
function scanPage(sel, host) {
  const root = (sel && document.querySelector(sel)) || document.body;
  const top0 = sel ? root.getBoundingClientRect().top + window.scrollY : 0;
  const H = sel ? root.scrollHeight : document.documentElement.scrollHeight;
  const real = (href) => { try { const u = new URL(href, location.href);
    if (/(^|\.)google\./.test(u.hostname) && u.pathname === '/url') return new URL(u.searchParams.get('q') || u.searchParams.get('url'));
    if (/bing\.com$/.test(u.hostname) && u.pathname.startsWith('/ck/')) { const v = (u.searchParams.get('u') || '').replace(/^a1/, ''); return new URL(atob(v.replace(/-/g, '+').replace(/_/g, '/'))); }
    return u; } catch (_) { return null; } };
  const OWN = /(^|\.)(google\.[a-z.]+|gstatic\.com|googleusercontent\.com|googleadservices\.com|googlesyndication\.com|doubleclick\.net|naver\.com|naver\.net|pstatic\.net|bing\.com|bing\.net|microsoft\.com|msn\.com|live\.com|perplexity\.ai|pplx\.ai|chatgpt\.com|openai\.com|oaistatic\.com|claude\.ai|anthropic\.com|navercorp\.com|openstreetmap\.org|mapbox\.com|kakaocorp\.com|w3\.org|schema\.org)$/i; // 엔진 자체·지도 저작권 등 바닥 링크
  const hosts = []; let siteEl = null;
  for (const a of root.querySelectorAll('a[href]')) {
    const u = real(a.getAttribute('href')); if (!u || !/^https?:$/.test(u.protocol)) continue;
    const h = u.hostname.replace(/^www\./, '').toLowerCase();
    if (h === host) { if (!siteEl && a.getBoundingClientRect().height) siteEl = a; continue; }
    if (!OWN.test(h) && !hosts.includes(h)) hosts.push(h);
  }
  for (const c of root.querySelectorAll('cite')) { const m = (c.textContent || '').match(/([a-z0-9-]+\.)+[a-z]{2,}/i); if (m) { const h = m[0].replace(/^www\./, '').toLowerCase(); if (h !== host && !OWN.test(h) && !hosts.includes(h)) hosts.push(h); } }
  let hitEl = siteEl;
  if (!hitEl) for (const re of [/xn--2j1bs9sn9b30bc55a|퀵서비스다\.kr/i, /1661[-\s.]?7462/, /퀵서비스다/]) {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n;
    while ((n = w.nextNode())) if (re.test(n.textContent) && n.parentElement.getBoundingClientRect().height) { hitEl = n.parentElement; break; }
    if (hitEl) break;
  }
  const hit = hitEl ? { y: Math.round(hitEl.getBoundingClientRect().top + window.scrollY - top0), h: H } : null;
  return { hosts: hosts.slice(0, 12), siteLink: !!siteEl, hit };
}

const engines = arg('engines', Object.keys(ENGINES).join(',')).split(',').map(s => s.trim()).filter(e => ENGINES[e]);
const queries = arg('queries', QUERIES.join(',')).split(',').map(s => s.trim()).filter(Boolean);
const date = arg('date', kstDate());
const outDir = path.join(AI_DIR, date); fs.mkdirSync(outDir, { recursive: true });

// 하나회원권 캡처(같은 PC, 매일 10:30)와 동시에 돌면 크롬 창 두 개가 겹치므로 그쪽이 끝날 때까지 기다린다(최대 90분)
const HANA_LOCK = 'C:/Users/user/Desktop/하나회원권 홈페이지/측정/AI검색/.capture.lock';
const alive = (pid) => { try { process.kill(pid, 0); return true; } catch (_) { return false; } };
const lockPid = (f) => { try { return Number(fs.readFileSync(f, 'utf8')) || 0; } catch (_) { return 0; } };

(async () => {
  const chrome = findChrome(); if (!chrome) { console.error('크롬을 찾지 못했습니다.'); process.exit(1); }
  const lockFile = path.join(AI_DIR, '.capture.lock');
  const mine = lockPid(lockFile); if (mine && mine !== process.pid && alive(mine)) { console.log(`다른 캡처가 실행 중입니다(pid ${mine}). 끝난 뒤 다시 실행하세요.`); process.exit(0); }
  fs.writeFileSync(lockFile, String(process.pid));
  process.on('exit', () => { if (lockPid(lockFile) === process.pid) try { fs.unlinkSync(lockFile); } catch (_) { /* no-op */ } });
  for (let i = 0; i < 90 && !flag('no-wait'); i++) { const h = lockPid(HANA_LOCK); if (!h || !alive(h)) break; if (i === 0) console.log(`하나회원권 캡처(pid ${h}) 진행 중 — 끝날 때까지 대기`); await sleep(60000); }

  // 이전 실행이 남긴 캡처용 크롬(같은 프로필)만 정리 — 프로필 이름이 달라 하나회원권 캡처 크롬은 건드리지 않는다
  const profileDir = path.join(AI_DIR, '.qs-capture-profile'); fs.mkdirSync(profileDir, { recursive: true });
  if (process.platform === 'win32') { try { const cmd = "Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'chrome.exe' -and $_.CommandLine -like '*qs-capture-profile*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"; execSync('powershell -NoProfile -EncodedCommand ' + Buffer.from(cmd, 'utf16le').toString('base64'), { stdio: 'ignore', timeout: 20000 }); } catch (_) { /* no-op */ } }

  const { default: puppeteer } = await import('puppeteer-core');
  const launch = () => puppeteer.launch({ executablePath: chrome, headless: flag('headless'), userDataDir: profileDir, defaultViewport: null,
    args: ['--window-size=1366,900', '--lang=ko-KR', '--no-first-run', '--no-default-browser-check'] });
  let browser = await launch();
  const results = []; const needLogin = new Set(); const stopped = new Set();
  for (const q of queries) {
    for (const e of engines) {
      const E = ENGINES[e];
      const r = { date, engine: e, query: q, url: E.url(q), file: '', site: false, brand: false, domains: [], blocked: false, error: '', hit: null };
      if (needLogin.has(e)) { r.blocked = true; r.error = '로그인 필요'; results.push(r); continue; }
      if (stopped.has(e)) { r.blocked = true; r.error = '차단 화면(그날 건너뜀)'; results.push(r); continue; }
      for (let attempt = 0; attempt < 2; attempt++) {
        if (!browser.isConnected()) { console.log('(크롬 연결 끊김 — 다시 띄움)'); await sleep(5000); browser = await launch(); }
        const page = await browser.newPage(); r.error = '';
        try {
          await page.setViewport({ width: 1366, height: 900, deviceScaleFactor: 1 });
          await page.setExtraHTTPHeaders({ 'Accept-Language': 'ko-KR,ko;q=0.9' });
          if (results.length) await sleep(8000); // 요청 사이 일정 간격(검색엔진 부담 줄이기)
          await page.goto(r.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
          await sleep(E.wait);
          if (e === 'perplexity' || e === 'google') for (let i = 0; i < 6; i++) { const t = await page.evaluate(() => document.body.innerText || ''); if (t.length > 800) break; await sleep(2000); }
          // 네이버 AI탭: 답변이 스트리밍되므로 본문 길이가 더 안 늘 때까지 스크롤하며 대기(최대 +30초)
          if (e === 'naverai') { let prev = -1; for (let i = 0; i < 10; i++) { const n = await page.evaluate(() => { window.scrollTo(0, document.body.scrollHeight); return (document.body.innerText || '').length; }); if (n === prev && n > 800) break; prev = n; await sleep(3000); } await page.evaluate(() => window.scrollTo(0, 0)); }
          if (E.chat) {
            const st = await runChat(page, E, q);
            if (st === 'login') { r.blocked = true; r.error = '로그인 필요'; needLogin.add(e); } else if (st === 'noinput') r.error = '입력창 없음';
            await page.setViewport({ width: 1366, height: 2400, deviceScaleFactor: 1 });
            await page.addStyleTag({ content: 'nav,aside,[role=navigation],bard-sidenav{display:none!important}' }).catch(() => {}); await sleep(1500);
          }
          if (e === 'perplexity') { // 쿠키 배너 닫기(필수만) + 긴 뷰포트로 답변 전체가 보이게
            try { for (const b of await page.$$('button')) { const t = await page.evaluate(el => el.textContent.trim(), b); if (/필수 항목만|Reject|거부/.test(t)) { await b.click(); break; } } } catch (_) { /* no-op */ }
            await page.setViewport({ width: 1366, height: 2400, deviceScaleFactor: 1 }); await sleep(1500);
          }
          const read = async () => E.chat ? (await areaText(page, E)).split(q).join(' ') : await page.evaluate(() => (document.body.innerText || '').slice(0, 200000));
          const T = await read();
          if (!E.chat && ((BLOCK_RE.test(T) && T.length < 3000) || T.length < 300)) { r.blocked = true; r.error = '차단 화면'; stopped.add(e); } // 우회하지 않고 그 엔진은 그날 중단
          const scan = await page.evaluate(scanPage, E.chat ? E.area : null, HOST).catch(() => ({ hosts: [], siteLink: false, hit: null }));
          r.site = SITE_RE.test(T) || scan.siteLink;
          r.brand = r.site || PHONE_RE.test(T) || (q !== BRAND_QUERY && BRAND_WORD_RE.test(T)); // 브랜드 질의는 검색어 자체가 화면에 나오므로 번호·주소만 본다
          r.domains = scan.hosts; if (r.site || r.brand) r.hit = scan.hit;
          fs.writeFileSync(path.join(outDir, `${e}_${safe(q)}.txt`), T.slice(0, 20000), 'utf8');
          r.file = path.join(outDir, `${e}_${safe(q)}.jpg`);
          const areaEl = E.chat ? await page.$(E.area) : null;
          if (areaEl) await areaEl.screenshot({ path: r.file, type: 'jpeg', quality: 70 }).catch(async () => { await page.screenshot({ path: r.file, type: 'jpeg', quality: 70 }); });
          else await page.screenshot({ path: r.file, type: 'jpeg', quality: 70, fullPage: true, captureBeyondViewport: true }).catch(async () => { await page.screenshot({ path: r.file, type: 'jpeg', quality: 70 }); });
        } catch (err) { r.error = err.message.slice(0, 200); }
        finally { await page.close().catch(() => {}); }
        if (r.error && r.error !== '로그인 필요' && !browser.isConnected() && attempt === 0) continue; // 크롬이 죽어서 난 오류면 한 번 더
        break;
      }
      results.push(r);
      console.log(`${e} | ${q} | 우리사이트 ${r.site ? 'O' : '-'} | 상호 ${r.brand ? 'O' : '-'} | 출처 ${r.domains.slice(0, 3).join(',') || '-'}${r.blocked && r.error !== '로그인 필요' ? ' | 차단' : ''}${r.error ? ' | ERR ' + r.error : ''}`);
    }
  }
  await browser.close().catch(() => {});

  // 같은 날 엔진만 다시 돌린 경우 result.json은 합친다(뒤 결과 우선)
  const resFile = path.join(outDir, 'result.json');
  const prev = (() => { try { return JSON.parse(fs.readFileSync(resFile, 'utf8')); } catch (_) { return []; } })();
  const key = (x) => x.engine + '|' + x.query; const merged = new Map(prev.map(x => [key(x), x])); for (const x of results) merged.set(key(x), x);
  const all = [...merged.values()];
  fs.writeFileSync(resFile, JSON.stringify(all, null, 1), 'utf8');

  const lines = [`# AI 검색·검색 노출 캡처 — ${date}`, '', '| 질의 | 엔진 | 우리 사이트 | 상호 언급 | 주요 인용 출처 | 비고 |', '|---|---|---|---|---|---|'];
  for (const x of all) lines.push(`| ${x.query} | ${ENG[x.engine]} | ${x.site ? '✅' : '—'} | ${x.brand ? '✅' : '—'} | ${x.domains.slice(0, 3).join(', ') || '—'} | ${x.error ? (x.error === '로그인 필요' || x.error.startsWith('차단') ? x.error : '오류: ' + x.error) : ''} |`);
  const ok = all.filter(x => !x.error && !x.blocked);
  lines.push('', `- 유효 캡처 ${ok.length}/${all.length} · 우리 사이트 노출 ${ok.filter(x => x.site).length} · 상호 언급 ${ok.filter(x => x.brand).length}`, `- 캡처: \`측정/AI검색/${date}/\``);
  fs.writeFileSync(path.join(outDir, `요약_${date}.md`), lines.join('\n') + '\n', 'utf8');

  if (!fs.existsSync(CSV)) fs.writeFileSync(CSV, '\uFEFF' + CSV_HEAD + '\n', 'utf8');
  fs.appendFileSync(CSV, results.map(x => [x.date, x.engine, x.query, x.site ? 1 : 0, x.brand ? 1 : 0, x.domains.slice(0, 5).join('|'), x.blocked ? 1 : 0, x.error.replace(/[,\r\n]/g, ' ')].join(',')).join('\n') + '\n', 'utf8');
  console.log(`완료: ${results.length}건 → ${outDir}`);
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
