// 공통 레이아웃: <head>, 헤더, 푸터, 모달·드로어·토스트 레이어
import { SITE, NAV, SERVICES, BUSINESS, PAYMENT, START_FARES } from './data.mjs';
import { esc, won, jsonld } from './lib.mjs';
import { sprite, ico } from './art.mjs';

export const logoImg = (u, cls = 'logo-img') => `<img class="${cls}" src="${u('assets/img/brand/logo.webp')}" alt="퀵서비스다 QUICKEY SERVICE" width="698" height="296">`;
export const logoWhite = u => `<img class="ft-logo" src="${u('assets/img/brand/logo-white.webp')}" alt="퀵서비스다 QUICKEY SERVICE" width="335" height="142" loading="lazy">`;

export function head(p, u) {
  const robots = p.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1';
  const og = SITE.url + (p.ogImage || 'assets/img/og-default.png');
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.description)}">
<link rel="canonical" href="${p.url}">
<meta name="robots" content="${robots}">
<meta name="theme-color" content="#1FA3E0">
<meta name="format-detection" content="telephone=no">
<meta property="og:type" content="${p.ogType || 'website'}">
<meta property="og:site_name" content="${SITE.name}">
<meta property="og:locale" content="ko_KR">
<meta property="og:title" content="${esc(p.ogTitle || p.title)}">
<meta property="og:description" content="${esc(p.description)}">
<meta property="og:url" content="${p.url}">
<meta property="og:image" content="${og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(p.ogTitle || p.title)}">
<meta name="twitter:description" content="${esc(p.description)}">
<meta name="twitter:image" content="${og}">
${p.published ? `<meta property="article:published_time" content="${p.published}">` : ''}
${SITE.naverVerification ? `<meta name="naver-site-verification" content="${SITE.naverVerification}">` : ''}
<link rel="icon" href="${u('favicon.ico')}" sizes="any">
<link rel="apple-touch-icon" href="${u('assets/img/brand/apple-touch-icon.png')}">
<link rel="alternate" type="application/rss+xml" title="${SITE.name} 물류 가이드" href="${SITE.url}blog/feed.xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;800;900&display=swap">
<link rel="stylesheet" href="${u('assets/css/style.css')}?v=${p.v}">
${jsonld(p.schema)}
</head>`;
}

export function header(p, u) {
  const navItems = NAV.map(n => {
    const cur = p.section && n.href.startsWith(p.section) ? ' aria-current="page"' : '';
    if (!n.children) return `<li><a href="${u(n.href)}"${cur}>${n.label}</a></li>`;
    return `<li class="has-sub"><button class="nav-sub-btn" type="button" aria-expanded="false" aria-haspopup="true"${p.section === 'services' ? ' data-current' : ''}>${n.label}${ico('down', 'ico-s')}</button>
<div class="nav-sub" role="menu">${n.children.map(c => `<a role="menuitem" href="${u(c.href)}"><strong>${c.label}</strong><span>${c.sub}</span></a>`).join('')}</div></li>`;
  }).join('');
  return `<body class="${p.bodyClass || ''}">
${sprite()}
<a class="skip" href="#main">본문 바로가기</a>
<header class="hd" id="hd">
  <div class="hd-in wrap">
    <a class="logo" href="${u('')}" aria-label="${SITE.name} 홈">${logoImg(u)}</a>
    <nav class="gnb" aria-label="주 메뉴"><ul>${navItems}</ul></nav>
    <div class="hd-cta">
      <a class="btn btn-ghost btn-sm hd-order" href="${SITE.order}" target="_blank" rel="noopener">${ico('online')}온라인 접수</a>
      <a class="btn btn-signal btn-sm hd-tel" href="tel:${SITE.tel}" data-track="tel">${ico('phone')}<span>${SITE.phone}</span></a>
      <button class="hd-menu" type="button" aria-label="메뉴 열기" aria-controls="drawerMenu" data-open="drawerMenu">${ico('menu')}</button>
    </div>
  </div>
</header>`;
}

export function footer(p, u) {
  return `<footer class="ft">
  <div class="wrap">
    <div class="ft-top">
      <div class="ft-brand">
        <a class="logo" href="${u('')}" aria-label="${SITE.name} 홈">${logoWhite(u)}</a>
        <p>${SITE.slogan}. 서울·인천·경기 퀵서비스와 전국 화물운송을 24시간 접수합니다.</p>
        <a class="ft-tel" href="tel:${SITE.tel}">${SITE.phone}</a>
      </div>
      <nav class="ft-nav" aria-label="하단 메뉴">
        <div><h2>서비스</h2>${SERVICES.map(s => `<a href="${u(s.slug)}">${s.name}</a>`).join('')}</div>
        <div><h2>안내</h2><a href="${u('pricing/')}">요금 안내</a><a href="${u('vehicles/')}">차량 제원</a><a href="${u('business/')}">기업 월 정산</a><a href="${u('faq/')}">자주 묻는 질문</a></div>
        <div><h2>퀵서비스다</h2><a href="${u('about/')}">회사 소개</a><a href="${u('blog/')}">물류 가이드</a><a href="${SITE.order}" target="_blank" rel="noopener">온라인 접수</a><a href="${SITE.kakaoChat}" target="_blank" rel="noopener">카카오톡 상담</a></div>
      </nav>
    </div>
    <div class="ft-info">
      <p><span>상호 ${SITE.name}</span><span>사업자등록번호 ${SITE.bizNo}</span><span>${SITE.freightLicense}</span><span>${SITE.mailOrder}</span></p>
      <p><span>주소 ${SITE.address.full}</span><span>전화 ${SITE.phone}</span><span>팩스 ${SITE.fax}</span><span>이메일 ${SITE.email}</span></p>
      <p class="ft-legal"><a href="${u('privacy/')}"><strong>개인정보처리방침</strong></a><a href="${u('terms/')}">이용약관(이륜차 퀵서비스)</a><span>© 2021 ${SITE.name}. All rights reserved.</span></p>
    </div>
  </div>
</footer>`;
}

// 모든 페이지 공통 레이어
export function layers(p, u) {
  const nav = NAV.map(n => n.children
    ? `<div class="dm-group"><button class="acc-btn dm-acc" type="button" aria-expanded="false" aria-controls="dm-sub">${n.label}${ico('down', 'acc-ico')}</button><div class="acc-panel" id="dm-sub" hidden><div>${n.children.map(c => `<a href="${u(c.href)}">${c.label}<small>${c.sub}</small></a>`).join('')}</div></div></div>`
    : `<a class="dm-link" href="${u(n.href)}">${n.label}${ico('arrow', 'ico-s')}</a>`).join('');
  return `
<div class="drawer drawer-right" id="drawerMenu" role="dialog" aria-modal="true" aria-label="전체 메뉴" hidden>
  <div class="drawer-scrim" data-close></div>
  <div class="drawer-panel">
    <div class="drawer-hd"><a class="logo" href="${u('')}" aria-label="${SITE.name} 홈">${logoImg(u)}</a><button class="icon-btn" type="button" data-close aria-label="메뉴 닫기">${ico('x')}</button></div>
    <nav class="dm-nav" aria-label="모바일 메뉴">${nav}</nav>
    <div class="dm-cta">
      <a class="btn btn-signal btn-block" href="tel:${SITE.tel}">${ico('phone')}${SITE.phone} 전화 접수</a>
      <a class="btn btn-line btn-block" href="${SITE.kakaoChat}" target="_blank" rel="noopener">${ico('chat')}카카오톡 상담</a>
      <a class="btn btn-line btn-block" href="${SITE.order}" target="_blank" rel="noopener">${ico('online')}온라인 접수</a>
    </div>
    <p class="dm-meta">${SITE.hours} · ${SITE.vat}</p>
  </div>
</div>

<div class="modal" id="modalQuote" role="dialog" aria-modal="true" aria-labelledby="mqTitle" hidden>
  <div class="modal-scrim" data-close></div>
  <div class="modal-box">
    <div class="modal-hd"><h2 id="mqTitle">요금 문의</h2><button class="icon-btn" type="button" data-close aria-label="닫기">${ico('x')}</button></div>
    <form class="mq-form" id="quoteForm" novalidate>
      <p class="mq-lead">아래 내용을 채우면 상담원에게 보낼 문의 글이 만들어집니다. 입력한 내용은 이 브라우저 밖으로 전송되지 않습니다.</p>
      <div class="f-row f-2">
        <label class="f"><span>출발지 <em>동 이름</em></span><input name="from" required placeholder="예: 장안동" autocomplete="off"></label>
        <label class="f"><span>도착지 <em>동 이름</em></span><input name="to" required placeholder="예: 가산동" autocomplete="off"></label>
      </div>
      <fieldset class="f seg-f"><legend>보낼 물건</legend>
        <div class="seg" role="radiogroup">
          <label><input type="radio" name="item" value="서류·소형 물품" checked><span>서류·소형</span></label>
          <label><input type="radio" name="item" value="상자·소형 가전"><span>상자·가전</span></label>
          <label><input type="radio" name="item" value="큰 짐·가구"><span>큰 짐·가구</span></label>
          <label><input type="radio" name="item" value="화물(파레트·자재)"><span>화물</span></label>
        </div>
      </fieldset>
      <div class="f-row f-2">
        <label class="f"><span>대략 무게</span><select name="weight"><option>25kg 이하</option><option>25~350kg</option><option>350~450kg</option><option>450kg~1톤</option><option>1톤 이상</option><option>모름</option></select></label>
        <label class="f"><span>언제 보내나요</span><select name="when"><option>지금 바로(급송)</option><option>오늘 중 여유 있게</option><option>예약(날짜 지정)</option></select></label>
      </div>
      <label class="f"><span>크기·메모 <em>선택</em></span><textarea name="memo" rows="2" placeholder="예: 60×40×40cm 상자 2개, 엘리베이터 있음"></textarea></label>
      <label class="chk"><input type="checkbox" name="round"><span>왕복으로 다녀와야 해요</span></label>
      <button class="btn btn-signal btn-block" type="submit">문의 글 만들기${ico('arrow')}</button>
    </form>
    <div class="mq-done" id="quoteDone" hidden>
      <div class="mq-preview" id="quotePreview" aria-live="polite"></div>
      <p class="mq-hint">${ico('info', 'ico-s')}상담원이 거리와 차량을 확인해 확정 요금을 안내합니다. ${SITE.vat}.</p>
      <div class="mq-actions">
        <a class="btn btn-signal" href="tel:${SITE.tel}">${ico('phone')}전화로 문의</a>
        <button class="btn btn-dark" type="button" data-copy-quote>${ico('chat')}복사하고 카카오톡 열기</button>
        <button class="btn btn-text" type="button" data-quote-back>다시 쓰기</button>
      </div>
    </div>
  </div>
</div>

<div class="drawer drawer-right drawer-wide" id="drawerBiz" role="dialog" aria-modal="true" aria-labelledby="dbTitle" hidden>
  <div class="drawer-scrim" data-close></div>
  <div class="drawer-panel">
    <div class="drawer-hd"><h2 id="dbTitle">기업 월 정산 안내</h2><button class="icon-btn" type="button" data-close aria-label="닫기">${ico('x')}</button></div>
    <div class="drawer-body prose">
      <h3>대상</h3><ul>${BUSINESS.who.map(x => `<li>${x}</li>`).join('')}</ul>
      <h3>제공 서비스</h3><ul>${BUSINESS.services.map(x => `<li>${x}</li>`).join('')}</ul>
      <h3>신용 거래 혜택</h3><ul>${BUSINESS.benefits.map(x => `<li>${x}</li>`).join('')}</ul>
      <h3>계약 방법</h3><p>${BUSINESS.contract}</p>
      <h3>결제 계좌</h3>
      <div class="acct"><span>${SITE.bank.name}</span><strong>${SITE.bank.no}</strong><span>예금주 ${SITE.bank.holder}</span><button class="btn btn-line btn-sm" type="button" data-copy="${SITE.bank.no}" data-copy-msg="계좌번호를 복사했습니다">${ico('copy')}복사</button></div>
      <p class="muted">${PAYMENT.invoice}</p>
    </div>
    <div class="drawer-ft"><a class="btn btn-signal btn-block" href="tel:${SITE.tel}">${ico('phone')}월 정산 계약 문의 ${SITE.phone}</a></div>
  </div>
</div>

<div class="modal" id="modalInfo" role="dialog" aria-modal="true" aria-labelledby="miTitle" hidden>
  <div class="modal-scrim" data-close></div>
  <div class="modal-box">
    <div class="modal-hd"><h2 id="miTitle"></h2><button class="icon-btn" type="button" data-close aria-label="닫기">${ico('x')}</button></div>
    <div class="modal-body" id="miBody"></div>
  </div>
</div>

<div class="toasts" id="toasts" role="status" aria-live="polite"></div>

<nav class="mbar" aria-label="빠른 접수">
  <a href="tel:${SITE.tel}" class="mbar-tel">${ico('phone')}<span>전화 접수</span></a>
  <a href="${SITE.kakaoChat}" target="_blank" rel="noopener">${ico('chat')}<span>카카오톡</span></a>
  <button type="button" data-open="modalQuote">${ico('receipt')}<span>요금 문의</span></button>
  <a href="${SITE.order}" target="_blank" rel="noopener">${ico('online')}<span>온라인 접수</span></a>
</nav>
<button class="totop" type="button" aria-label="맨 위로">${ico('top')}</button>`;
}

export function page(p, u, body) {
  return `${head(p, u)}
${header(p, u)}
<main id="main">
${body}
</main>
${footer(p, u)}
${layers(p, u)}
<script src="${u('assets/js/app.js')}?v=${p.v}" defer></script>
${p.extraScripts || ''}
</body>
</html>
`;
}

// 하위 페이지 머리
export function subHero(p, u, { eyebrow, h1, lead, crumbs, aside = '' }) {
  return `<section class="sub-hero">
  <div class="wrap sub-hero-in">
    <nav class="crumbs" aria-label="현재 위치"><ol>${crumbs.map((c, i) => i < crumbs.length - 1 ? `<li><a href="${u(c.href)}">${c.name}</a></li>` : `<li aria-current="page">${c.name}</li>`).join('')}</ol></nav>
    <div class="sub-hero-grid">
      <div>
        ${eyebrow ? `<p class="eyebrow">${eyebrow}</p>` : ''}
        <h1>${h1}</h1>
        <p class="lead">${lead}</p>
        <div class="sub-hero-cta">
          <a class="btn btn-signal" href="tel:${SITE.tel}">${ico('phone')}${SITE.phone}</a>
          <button class="btn btn-line" type="button" data-open="modalQuote">${ico('receipt')}요금 문의</button>
        </div>
      </div>
      ${aside}
    </div>
  </div>
</section>`;
}

// 문의 띠
export function ctaBand(u, title = '출발지, 도착지, 물건 크기. 세 가지면 요금이 나옵니다.') {
  return `<section class="cta-band">
  <div class="wrap cta-band-in">
    <div><p class="eyebrow eyebrow-light">24시간 · 365일 접수</p><h2>${title}</h2><p>${SITE.vat}. 확정 요금은 접수할 때 먼저 안내해 드립니다.</p></div>
    <div class="cta-band-act">
      <a class="btn btn-signal btn-lg" href="tel:${SITE.tel}">${ico('phone')}${SITE.phone}</a>
      <div class="cta-band-sub"><a class="btn btn-ghost-light" href="${SITE.kakaoChat}" target="_blank" rel="noopener">${ico('chat')}카카오톡</a><a class="btn btn-ghost-light" href="${SITE.order}" target="_blank" rel="noopener">${ico('online')}온라인 접수</a></div>
    </div>
  </div>
</section>`;
}

export function faqList(faqs, { id = 'faq', withCats = false, cats = [] } = {}) {
  const chips = withCats ? `<div class="chips" role="toolbar" aria-label="질문 분류">${cats.map((c, i) => `<button type="button" class="chip${i ? '' : ' on'}" data-faq-cat="${c.id}" aria-pressed="${i ? 'false' : 'true'}">${c.name}</button>`).join('')}</div>` : '';
  return `${chips}<div class="acc faq-list" id="${id}">${faqs.map((f, i) => `
  <div class="acc-item" data-cat="${f.cat}">
    <h3 class="acc-h"><button class="acc-btn" type="button" aria-expanded="false" aria-controls="${id}-${i}" id="${id}-b${i}"><span class="acc-q">Q</span><span class="acc-t">${esc(f.q)}</span>${ico('plus', 'acc-ico')}</button></h3>
    <div class="acc-panel" id="${id}-${i}" role="region" aria-labelledby="${id}-b${i}" hidden><div class="acc-body"><p>${esc(f.a)}</p></div></div>
  </div>`).join('')}
</div>`;
}

export const fareChip = id => { const f = START_FARES.find(x => x.id === id); return f ? `${won(f.from)}~` : ''; };
