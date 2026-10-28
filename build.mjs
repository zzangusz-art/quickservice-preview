// 퀵서비스다 정적 사이트 빌드
//   node build.mjs                       → dist/ (운영: 검색 노출 허용, 대행사 스크립트 포함)
//   node build.mjs --preview <주소>       → dist/ (미리보기: 모든 페이지 noindex, robots Disallow)
//   node build.mjs --out <폴더>           → 출력 폴더 변경
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = n => { const i = args.indexOf(n); return i > -1 ? args[i + 1] : null; };
const PREVIEW = opt('--preview');
if (PREVIEW) process.env.SITE_URL = PREVIEW;
const OUT = path.resolve(ROOT, opt('--out') || 'dist');

const D = await import('./src/data.mjs');
const { SITE, SERVICES, FAQ, START_FARES, INTERCITY, TRUCKS, SMALL_VEHICLES, FARE_RULES, MARKET, BUSINESS, PAYMENT, BLOG_CATEGORIES, ASOF, avg } = D;
const { makeUrl, pageUrl, esc, won, webpSize } = await import('./src/lib.mjs');
const S = await import('./src/schema.mjs');
const { page } = await import('./src/layout.mjs');
const { setTracking, trackingTools } = await import('./src/analytics.mjs');
setTracking(!PREVIEW); // 미리보기(GitHub Pages)에는 분석 태그를 넣지 않는다
const { homeBody } = await import('./src/home.mjs');
const P = await import('./src/pages.mjs');
const { loadPosts, renderMarkdown } = await import('./tools/blog/lib.mjs');

const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date());
const nowKST = today + ' ' + new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()); // 예약 글 공개 기준

// ── 준비 ──
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const copyDir = (src, dst) => { fs.mkdirSync(dst, { recursive: true }); for (const e of fs.readdirSync(src, { withFileTypes: true })) { const s = path.join(src, e.name), d = path.join(dst, e.name); e.isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d); } };
copyDir(path.join(ROOT, 'assets'), path.join(OUT, 'assets'));
for (const f of ['favicon.ico']) if (fs.existsSync(path.join(ROOT, f))) fs.copyFileSync(path.join(ROOT, f), path.join(OUT, f));
const V = crypto.createHash('md5').update(fs.readFileSync(path.join(ROOT, 'assets/css/style.css'))).update(fs.readFileSync(path.join(ROOT, 'assets/js/app.js'))).digest('hex').slice(0, 8);

const write = (rel, html) => { const f = path.join(OUT, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, html); };
const pages = []; // sitemap용 {out, mod, pri}
const agency = !PREVIEW && SITE.agencyScript ? `<script src="${SITE.agencyScript}" async></script>` : '';

function emit({ out, title, description, body, schema, section, ogImage, ogType, published, mod = ASOF, pri = '0.7', darkTop = false, bodyClass = '' }) {
  const u = makeUrl(out);
  const url = pageUrl(out);
  const html = page({ title, description, url, schema, section, ogImage, ogType, published, v: V, noindex: !!PREVIEW, darkTop, bodyClass, extraScripts: agency }, u, body(u))
    // 표는 모두 가로 스크롤 영역으로 감싼다(모바일에서 칸이 찌그러지지 않게)
    .replace(/(<div class="tbl-scroll">)?(<table class="tbl[\s\S]*?<\/table>)/g, (m, w, t) => w ? m : `<div class="tbl-scroll">${t}</div>`);
  write(out, html);
  pages.push({ out, mod, pri });
}
const bc = items => S.breadcrumb(items.map(([name, rel]) => ({ name, url: SITE.url + rel })));

// ── 블로그 글 ──
const BLOG = path.join(ROOT, 'content/blog');
const posts = loadPosts(BLOG, { now: process.env.BUILD_NOW || nowKST }).map(p => {
  const link = h => h.startsWith('#') || h.startsWith('tel:') ? h : '../../' + h; // blog/<slug>/index.html 기준
  const r = renderMarkdown(p.main, link);
  const faq = p.faq.map(f => ({ ...f }));
  return { ...p, html: r.html, toc: r.toc, faq };
});
// 글마다 주제에 맞는 사진: 머리말 image 지정 → 제목·태그 단어 → 설명 단어 → 서비스 → 카테고리 순.
// 목록에서 바로 앞 두 글과 같은 사진이면 다음 후보로 바꿔 같은 그림이 이어지지 않게 한다.
{
  const { BLOG_IMAGES, BLOG_IMAGE_FALLBACK } = D;
  const byKey = k => BLOG_IMAGES.find(x => x.key === k);
  const svcKey = { motorcycle: 'rider', 'damas-labo': 'damas-labo', truck: 'truck1', intercity: 'ktx' };
  const recent = [];
  for (const p of [...posts].reverse()) { // 오래된 글부터 정해야 새 글이 추가돼도 기존 글 사진이 바뀌지 않는다
    if (p.image && byKey(p.image)) { p.image = byKey(p.image); recent.push(p.image.key); continue; }
    const head = `${p.title} ${p.tags.join(' ')}`;
    const cands = [
      ...BLOG_IMAGES.filter(im => im.words.some(w => head.includes(w))),
      ...BLOG_IMAGES.filter(im => im.words.some(w => p.description.includes(w))),
      byKey(svcKey[p.service]), byKey(BLOG_IMAGE_FALLBACK[p.category]), byKey('rider'), byKey('ride'),
    ].filter((x, i, a) => x && a.indexOf(x) === i);
    p.image = cands.find(c => !recent.slice(-2).includes(c.key)) || cands[0];
    recent.push(p.image.key);
  }
}
const lastPost = posts[0]?.date || ASOF;

// ── 홈 ──
{
  const out = 'index.html', url = pageUrl(out);
  const homeFaq = FAQ.filter(f => f.pages.includes('home'));
  emit({ out, pri: '1.0', mod: lastPost > ASOF ? lastPost : ASOF, bodyClass: 'home',
    title: '퀵서비스다 | 서울퀵·인천·경기 퀵서비스, 오토바이·다마스 퀵부터 화물까지 24시간',
    description: '오토바이 퀵 8,000원부터, 다마스 20,000원부터, 1톤 40,000원부터(부가세 별도). KTX·고속버스·항공 연계로 지방도 당일 배송. 24시간 접수 1661-7462, 화물운송주선 허가 제90143호.',
    schema: S.graph(S.organization(), S.website(), S.webpage({ url, title: '퀵서비스다 — 서울·경기·인천 퀵서비스와 전국 화물운송', description: '오토바이 퀵부터 25톤 화물, KTX·항공 연계배송까지 24시간 접수' }), S.faqPage(homeFaq, url)),
    body: u => homeBody(u, posts) });
}

// ── 서비스 4종 ──
const svcRender = { motorcycle: P.motorcycle, 'damas-labo': P.damasLabo, truck: P.truck, intercity: P.intercity };
for (const s of SERVICES) {
  const out = s.slug + 'index.html', url = pageUrl(out);
  emit({ out, section: 'services', pri: '0.9', title: `${s.title} | 퀵서비스다`, description: s.desc,
    schema: S.graph(S.organization(), S.website(), S.webpage({ url, title: s.title, description: s.desc }), S.service(s), bc([['홈', ''], ['서비스', SERVICES[0].slug], [s.name, s.slug]]), S.faqPage(FAQ.filter(f => f.pages.includes(s.id)), url)),
    body: u => svcRender[s.id](u, posts) });
}

// ── 안내 페이지 ──
const info = [
  { id: 'pricing', out: 'pricing/index.html', name: '요금 안내', render: P.pricing, pri: '0.9',
    title: '퀵서비스 요금 안내 — 시작 요금·할증·취소·왕복 기준과 타사 비교 | 퀵서비스다',
    description: '오토바이 8,000원, 다마스 20,000원, 1톤 40,000원, KTX·고속버스 연계 25,000원부터. 할증 네 가지, 취소·왕복 기준, 같은 날 공개 요금표 비교까지 정리했습니다.' },
  { id: 'vehicles', out: 'vehicles/index.html', name: '차량 제원', render: P.vehicles, pri: '0.8',
    title: '차량 제원과 추천 — 오토바이·다마스·라보·1톤~25톤 적재함 크기 | 퀵서비스다',
    description: '1톤 길이 270~285cm, 2.5톤 430cm, 5톤 620cm, 11톤 900cm. 카고·탑차·윙바디 제원표와, 크기·무게를 넣으면 맞는 차를 골라 주는 추천 도구.' },
  { id: 'business', out: 'business/index.html', name: '기업 고객', render: P.business, pri: '0.7',
    title: '기업 고객 월 정산 — 세금계산서, 정산일 지정 | 퀵서비스다',
    description: '월 50만 원 이상 이용하는 법인·사업자는 원하는 날짜에 한 달 이용액을 모아 정산하고 세금계산서를 받습니다. 서울·수도권 당일부터 전국·제주까지.' },
];
for (const it of info) {
  const url = pageUrl(it.out);
  emit({ out: it.out, section: it.out.split('/')[0] + '/', pri: it.pri, title: it.title, description: it.description,
    schema: S.graph(S.organization(), S.website(), S.webpage({ url, title: it.title, description: it.description }), bc([['홈', ''], [it.name, it.out.replace('index.html', '')]]), S.faqPage(FAQ.filter(f => f.pages.includes(it.id)), url)),
    body: u => it.render(u, posts) });
}
{
  const out = 'about/index.html', url = pageUrl(out);
  const t = '회사 소개 — 서울 동대문구 장안동 퀵서비스·화물운송 주선 | 퀵서비스다';
  const d = '퀵서비스다(QUICKEY SERVICE)는 화물자동차운송주선사업 허가 제90143호 업체입니다. 사업자 정보, 연락처, 오시는 길을 안내합니다.';
  emit({ out, section: 'about/', pri: '0.6', title: t, description: d, schema: S.graph(S.organization(), S.website(), S.webpage({ url, title: t, description: d, type: 'AboutPage' }), bc([['홈', ''], ['회사 소개', 'about/']])), body: u => P.about(u) });
}
{
  const out = 'faq/index.html', url = pageUrl(out);
  const t = `퀵서비스 자주 묻는 질문 ${FAQ.length}가지 — 요금·할증·취소·지방 배송 | 퀵서비스다`;
  const d = '퀵 요금 계산, 할증 시간, 취소비, 두 곳 이상 보내기, 지방·제주 배송, 세금계산서와 월 정산까지 자주 묻는 질문에 답합니다.';
  emit({ out, section: 'faq/', pri: '0.8', title: t, description: d, schema: S.graph(S.organization(), S.website(), S.webpage({ url, title: t, description: d }), bc([['홈', ''], ['자주 묻는 질문', 'faq/']]), S.faqPage(FAQ, url)), body: u => P.faqPageBody(u) });
}
{
  // 서비스 지역 허브: 구·시·군 목록과 공개된 지역 글 링크(예약 글은 공개 시각이 지나야 링크됨)
  const out = 'area/index.html', url = pageUrl(out);
  const t = '서울·인천·경기 지역별 퀵서비스 — 구·시·군 전 지역 24시간 | 퀵서비스다';
  const d = '서울 25개 구, 인천 9개 구·2개 군, 경기 31개 시·군 어디서든 오토바이·다마스·라보·화물차 퀵을 24시간 접수합니다. 지방은 KTX·고속버스·항공 연계로 당일 배송합니다.';
  const areaMod = posts.filter(p => D.AREAS.some(a => a.hub === p.slug || a.units.some(x => x[1] === p.slug))).map(p => p.date).sort().pop();
  emit({ out, section: 'area/', pri: '0.8', mod: areaMod && areaMod > ASOF ? areaMod : ASOF, title: t, description: d,
    schema: S.graph(S.organization(), S.website(), S.webpage({ url, title: t, description: d }), bc([['홈', ''], ['서비스 지역', 'area/']]), S.faqPage(D.AREA_FAQ, url)),
    body: u => P.areaPage(u, posts) });
}
for (const [id, name, render] of [['privacy', '개인정보처리방침', P.privacyBody], ['terms', '이용약관(이륜차 퀵서비스)', P.termsBody]]) {
  const out = `${id}/index.html`, url = pageUrl(out);
  const raw = fs.readFileSync(path.join(ROOT, `content/legal/${id}.txt`), 'utf8');
  const desc = id === 'privacy'
    ? '퀵서비스다가 퀵서비스·화물운송 접수와 배송 과정에서 처리하는 개인정보의 항목, 처리 목적, 보유 기간, 파기 절차와 이용자의 권리를 안내합니다.'
    : '퀵서비스다 이륜차(오토바이) 퀵서비스 이용약관입니다. 운송 접수와 요금, 화물 사고 때의 손해배상 기준 등 이용자와 회사의 권리·의무를 정합니다.';
  emit({ out, pri: '0.2', title: `${name} | 퀵서비스다`, description: desc, schema: S.graph(S.website(), S.webpage({ url, title: name, description: desc })), body: u => render(u, raw) });
}

// ── 블로그 ──
{
  const out = 'blog/index.html', url = pageUrl(out);
  const t = '물류 가이드 — 퀵 요금, 차량 고르는 법, 지방 당일 배송 | 퀵서비스다';
  const d = '퀵서비스 요금 계산, 다마스·라보·화물차 고르는 법, KTX·항공 연계배송, 기업 물류 정산까지 접수 현장에서 자주 받는 질문을 정리합니다.';
  emit({ out, section: 'blog/', pri: '0.8', mod: lastPost, title: t, description: d, ogImage: 'assets/img/og-blog.png',
    schema: S.graph(S.organization(), S.website(), { ...S.webpage({ url, title: t, description: d, type: 'CollectionPage', modified: lastPost }), mainEntity: { '@type': 'ItemList', itemListElement: posts.slice(0, 30).map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: SITE.url + `blog/${p.slug}/` })) } }, bc([['홈', ''], ['물류 가이드', 'blog/']])),
    body: u => P.blogIndex(u, posts, BLOG_CATEGORIES) });
  // 더 보기용 목록
  fs.writeFileSync(path.join(OUT, 'blog/posts.json'), JSON.stringify(posts.map(p => { const [w, h] = webpSize('assets/img/photo/' + p.image.file); return { slug: p.slug, title: p.title, description: p.description, category: p.category, date: p.date, minutes: p.minutes, img: { src: '../assets/img/photo/' + p.image.file, w, h, alt: p.image.alt, fit: p.image.fit } }; })));
}
for (const p of posts) {
  const out = `blog/${p.slug}/index.html`, url = pageUrl(out);
  emit({ out, section: 'blog/', pri: '0.6', mod: p.updated || p.date, ogType: 'article', published: p.date, ogImage: 'assets/img/og-blog.png',
    title: `${p.title} | 퀵서비스다`, description: p.description,
    schema: S.graph(S.organization(), S.website(), S.blogPosting(p, url), bc([['홈', ''], ['물류 가이드', 'blog/'], [p.title, `blog/${p.slug}/`]]), p.faq.length ? S.faqPage(p.faq, url) : null),
    body: u => P.blogPost(u, p, posts) });
}
// RSS
{
  const items = posts.slice(0, 30).map(p => `<item><title>${esc(p.title)}</title><link>${SITE.url}blog/${p.slug}/</link><guid isPermaLink="true">${SITE.url}blog/${p.slug}/</guid><pubDate>${new Date(p.date + 'T' + (p.time || '09:00') + ':00+09:00').toUTCString()}</pubDate><category>${esc(p.category)}</category><description>${esc(p.description)}</description></item>`).join('\n');
  write('blog/feed.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${SITE.name} 물류 가이드</title><link>${SITE.url}blog/</link><atom:link href="${SITE.url}blog/feed.xml" rel="self" type="application/rss+xml"/><description>퀵서비스·화물운송 이용 가이드</description><language>ko</language>\n${items}\n</channel></rss>\n`);
}

// ── 404 (어느 경로에서나 열리므로 절대 주소) ──
{
  const abs = to => /^(https?:|tel:|mailto:|#)/.test(to) ? to : SITE.url + to.replace(/^\//, '');
  const html = page({ title: '페이지를 찾을 수 없습니다 | 퀵서비스다', description: '요청한 페이지를 찾을 수 없습니다. 주소를 다시 확인하거나 홈, 요금 안내, 자주 묻는 질문에서 필요한 정보를 찾아보세요.', url: SITE.url + '404.html', noCanonical: true, schema: S.graph(S.website()), v: V, noindex: true }, abs, P.notFound(abs));
  write('404.html', html);
}

// ── sitemap · robots · llms ──
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(p => `<url><loc>${pageUrl(p.out)}</loc><lastmod>${p.mod}</lastmod><priority>${p.pri}</priority></url>`).join('\n')}\n</urlset>\n`);
write('robots.txt', PREVIEW
  ? 'User-agent: *\nDisallow: /\n'
  : ['# 검색엔진과 AI 검색·답변 엔진의 수집을 모두 허용합니다', 'User-agent: *', 'Allow: /', '',
    ...['Googlebot', 'Bingbot', 'Yeti', 'Daumoa', 'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot', 'Applebot-Extended', 'CCBot'].flatMap(b => [`User-agent: ${b}`, 'Allow: /', '']),
    `Sitemap: ${SITE.url}sitemap.xml`, ...(SITE.daumVerification ? ['', SITE.daumVerification] : []), ''].join('\n'));

const fareLines = START_FARES.map(f => `- ${f.label}: ${won(f.from)}부터 — ${f.note}`).join('\n');
const llms = `# ${SITE.name} (${SITE.nameEn})

> 서울·인천·경기 퀵서비스와 전국 화물운송 주선 업체. 오토바이 퀵, 다마스·라보, 1톤~25톤 화물차, KTX·고속버스·항공 연계 당일배송을 24시간 365일 접수한다. 대표전화 ${SITE.phone}. ${SITE.freightLicense}.

## 핵심 사실 (${ASOF} 기준, 요금은 ${SITE.vat})
${fareLines}
- 할증: ${FARE_RULES.surchargeWhen.map(s => s.k).join(', ')}
- 왕복: ${FARE_RULES.roundTrip}
- 취소: ${FARE_RULES.cancelRule} 오토바이 3,000원, 다마스·라보 5,000원
- 오토바이 적재: 세 변 합 150cm 이내, 최대 25kg. 다마스 350kg 미만(라면 상자 약 20개), 라보 450kg 미만
- 오토바이 소요: 픽업 5~20분, 근거리 30~50분, 단거리 1시간~1시간 30분, 장거리 2시간~2시간 30분
- 연계배송: ${INTERCITY.map(m => `${m.name} 최대 ${m.hours}시간·${won(m.from)}부터(${m.routes})`).join(' / ')}
- 결제: ${PAYMENT.methods.join(', ')}. ${PAYMENT.invoice}
- 기업 월 정산: ${BUSINESS.who.join(', ')}. 원하는 날짜 정산, 세금계산서 발행
- 공개 요금 비교(${MARKET.date}): ${MARKET.sets.map(s => `${s.label} 퀵서비스다 ${won(s.ours)} vs 비교 업체 평균 ${won(avg(s.others.map(o => o.v)))}`).join('; ')}
- 사업자: 상호 ${SITE.name}, 사업자등록번호 ${SITE.bizNo}, ${SITE.mailOrder}, 주소 ${SITE.address.full}, 팩스 ${SITE.fax}, 이메일 ${SITE.email}

## 주요 페이지
- [홈](${SITE.url}): 서비스 요약, 접수 과정, 요금, 타사 비교, FAQ
${SERVICES.map(s => `- [${s.name}](${SITE.url}${s.slug}): ${s.desc}`).join('\n')}
- [요금 안내](${SITE.url}pricing/): 시작 요금, 할증·취소·왕복 기준, 공개 요금표 비교
- [차량 제원](${SITE.url}vehicles/): 톤수별 적재함 크기, 차량 추천
- [서비스 지역](${SITE.url}area/): 서울 25개 구·인천 9개 구 2개 군·경기 31개 시군 지역별 퀵서비스, 지방 연계배송 도시
- [기업 고객](${SITE.url}business/): 월 정산·세금계산서
- [자주 묻는 질문](${SITE.url}faq/)
- [회사 소개](${SITE.url}about/)

## 물류 가이드(블로그)
${posts.slice(0, 50).map(p => `- [${p.title}](${SITE.url}blog/${p.slug}/): ${p.description}`).join('\n')}

## 더 자세한 내용
- [llms-full.txt](${SITE.url}llms-full.txt): FAQ 전체와 차량 제원표
`;
write('llms.txt', llms);
const full = `${llms}
## 자주 묻는 질문 전체
${FAQ.map(f => `### ${f.q}\n${f.a}`).join('\n\n')}

## 차량 제원 (cm)
${SMALL_VEHICLES.map(v => `- ${v.name}: ${v.max}, ${v.size}. ${v.use}`).join('\n')}
${TRUCKS.map(t => `- ${t.ton}: 폭 ${t.w}, 길이 ${t.len[0] === t.len[1] ? t.len[0] : t.len.join('~')}, 지상고 ${t.deck}${t.cbm ? `, ${t.cbm}CBM` : ''}, 탑차 높이 ${t.top.join('~')}`).join('\n')}
`;
write('llms-full.txt', full);
if (!PREVIEW && SITE.indexNowKey) write(`${SITE.indexNowKey}.txt`, SITE.indexNowKey);
if (!PREVIEW && /xn--/.test(SITE.url) && opt('--cname') !== 'no') write('CNAME', new URL(SITE.url).hostname + '\n');

// ── 검증: 내부 링크·자원, JSON-LD ──
let broken = 0, ld = 0;
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
for (const f of walk(OUT).filter(f => f.endsWith('.html') && !f.endsWith('404.html'))) {
  const html = fs.readFileSync(f, 'utf8');
  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    let h = m[1];
    if (/^(https?:|\/\/|tel:|mailto:|sms:|#|data:)/.test(h)) continue;
    h = h.split('#')[0].split('?')[0];
    if (!h) continue;
    let t = path.resolve(path.dirname(f), h);
    if (h.endsWith('/') || h === '.' || h === './' || /\.\.$/.test(h)) t = path.join(t, 'index.html');
    if (!fs.existsSync(t)) { broken++; if (broken < 20) console.warn(`깨진 참조: ${path.relative(OUT, f)} → ${m[1]}`); }
  }
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) { JSON.parse(m[1]); ld++; }
}
console.log(`빌드 완료 → ${path.relative(ROOT, OUT) || '.'}${PREVIEW ? ' (미리보기 noindex)' : ''} · 페이지 ${pages.length + 1} · 글 ${posts.length} · JSON-LD ${ld} · 깨진 참조 ${broken}`);
if (broken) process.exitCode = 1;
