// 하위 페이지 본문
import { SITE, SERVICES, START_FARES, FARE_RULES, SAVE_TIPS, MARKET, CHECKLIST, FAQ, FAQ_CATS, SMALL_VEHICLES, TRUCKS, TRUCK_LIMITS, BODY_TYPES, CARGO_TYPES, INTERCITY, INTERCITY_NOTE, MOTO_TIME, MOTO_SIZE, BUSINESS, PAYMENT, COMPANY_INTRO, ASOF, ASOF_LABEL, avg } from './data.mjs';
import { esc, won, kdate } from './lib.mjs';
import { ico, vehicle, vehicleFit, koreaMap } from './art.mjs';
import { subHero, ctaBand, faqList } from './layout.mjs';
import { postCard, catIcon } from './home.mjs';

const faqFor = id => FAQ.filter(f => f.pages.includes(id));
const crumbsSvc = s => [{ name: '홈', href: '' }, { name: '서비스', href: SERVICES[0].slug }, { name: s.name, href: s.slug }];

function related(u, posts, tags) {
  const list = posts.filter(p => p.tags.some(t => tags.some(k => t.includes(k) || k.includes(t)))).slice(0, 3);
  const use = list.length ? list : posts.slice(0, 3);
  if (!use.length) return '';
  return `<section class="sec sec-soft"><div class="wrap"><div class="sec-hd sec-hd-row"><div><p class="eyebrow">물류 가이드</p><h2>함께 읽으면 좋은 글</h2></div><a class="link-arrow" href="${u('blog/')}">전체 글${ico('arrow', 'ico-s')}</a></div><div class="post-grid">${use.map(p => postCard(p, u)).join('')}</div></div></section>`;
}
function otherServices(u, cur) {
  return `<section class="sec"><div class="wrap"><div class="sec-hd"><p class="eyebrow">다른 서비스</p><h2>물건에 따라 이런 방법도 있습니다</h2></div>
  <div class="svc-grid svc-grid-3">${SERVICES.filter(s => s.id !== cur).map(s => `<a class="svc svc-link" href="${u(s.slug)}"><div class="svc-ico">${ico({ motorcycle: 'moto', 'damas-labo': 'van', truck: 'truck', intercity: 'rail' }[s.id])}</div><h3>${s.name}</h3><p>${s.card}</p><p class="svc-price"><span>시작 요금</span><strong>${won(s.from)}~</strong></p></a>`).join('')}</div></div></section>`;
}
const faqBlock = (id, title = '자주 묻는 질문') => `<section class="sec" id="faq"><div class="wrap faq-grid"><div class="sec-hd sec-hd-left"><p class="eyebrow">FAQ</p><h2>${title}</h2><p class="sec-lead">24시간 ${SITE.phone}로 물어보셔도 됩니다.</p></div><div>${faqList(faqFor(id), { id: 'faq-' + id })}</div></div></section>`;
const specCard = (art, rows) => `<aside class="spec-card">${art}<dl>${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl></aside>`;
const fareRuleList = () => `<ul class="ticks">${FARE_RULES.surchargeWhen.map(s => `<li><strong>${s.k}</strong><span>${s.v}</span></li>`).join('')}</ul>`;

// ── 오토바이 퀵 ─────────────────────────────────────
export function motorcycle(u, posts) {
  const s = SERVICES.find(x => x.id === 'motorcycle');
  return [
    subHero({}, u, { eyebrow: '오토바이 퀵서비스', h1: '오토바이 퀵, 서류부터 25kg 소형 물품까지', lead: s.lead, crumbs: crumbsSvc(s),
      aside: specCard(vehicleFit('moto', '배달 오토바이'), [['시작 요금', '8,000원~'], ['최대 무게', '25kg'], ['크기', '세 변 합 150cm 이내'], ['픽업', '보통 5~20분']]) }),
    `<section class="sec"><div class="wrap prose-grid">
      <div class="prose">
        <h2 id="size">오토바이로 보낼 수 있는 물건은 어디까지인가요?</h2>
        <p><strong>가로·세로·높이를 더해 150cm 이내, 무게 25kg 이하</strong>라면 오토바이로 보낼 수 있습니다. 원통형 물건은 지름 30cm, 길이 150cm까지 됩니다. 오토바이에 실을 수 있는 물건이면 종류는 가리지 않습니다.</p>
        <table class="tbl"><thead><tr><th scope="col">구분</th><th scope="col">크기 기준</th><th scope="col">최대 무게</th></tr></thead><tbody>${MOTO_SIZE.map(m => `<tr><th scope="row">${m.k}</th><td>${m.v}</td><td>${m.w}kg</td></tr>`).join('')}</tbody></table>
        <p class="note">${FARE_RULES.overload}</p>
        <h2 id="time">얼마나 걸리나요?</h2>
        <p>배차가 되면 기사가 <strong>보통 5~20분 안에</strong> 물건을 받으러 갑니다. 받은 뒤 도착까지는 거리에 따라 다릅니다.</p>
        <ol class="timeline">${MOTO_TIME.map(t => `<li><span>${t.k}</span><strong>${t.v}</strong></li>`).join('')}</ol>
        <h2 id="fare">요금은 얼마인가요?</h2>
        <p>오토바이 퀵은 <strong>8,000원부터</strong>입니다(${SITE.vat}). 기본요금은 거리별로 정해지고, 중간 상자 1개·20kg을 기준으로 합니다. 출발 동과 도착 동을 알려 주시면 접수할 때 확정 요금을 먼저 안내합니다.</p>
        <table class="tbl"><tbody>
          <tr><th scope="row">기본요금</th><td>거리별 적용 요금(중간 상자 1개 / 20kg 기준)</td></tr>
          <tr><th scope="row">과적 요금</th><td>라면 상자(세 변 합 1m)보다 크면 5,000원 추가</td></tr>
          <tr><th scope="row">왕복 요금</th><td>적용 요금의 90%(백 원 단위 반올림)</td></tr>
          <tr><th scope="row">할증 요금</th><td>영업 외 시간(평일 18시·주말 16시 이후), 기상 악화, 대기 20분 이상</td></tr>
          <tr><th scope="row">취소 요금</th><td>기사가 건물에 도착한 뒤 취소하면 3,000원</td></tr>
        </tbody></table>
        <h2 id="use">이럴 때 많이 보냅니다</h2>
        <ul class="ticks ticks-2">
          <li><strong>계약서·서류</strong><span>당일 날인이 필요한 계약서, 입찰 서류</span></li>
          <li><strong>도장·카드·열쇠</strong><span>사람이 직접 가기 어려울 때</span></li>
          <li><strong>샘플·시제품</strong><span>거래처 미팅 전에 먼저 보낼 때</span></li>
          <li><strong>소형 부품</strong><span>생산 라인이 멈추기 전에 급히</span></li>
          <li><strong>꽃다발·케이크</strong><span>시간을 맞춰야 하는 선물</span></li>
          <li><strong>노트북·태블릿</strong><span>두고 온 업무용 기기</span></li>
        </ul>
        <h2 id="how">접수는 어떻게 하나요?</h2>
        <p>24시간 대표전화 <a href="tel:${SITE.tel}">${SITE.phone}</a>로 전화하시거나, 카카오톡 채널에서 ‘퀵서비스다’를 검색해 상담하시면 됩니다. 온라인 접수 페이지에서 직접 주문을 넣을 수도 있습니다. 두 곳 이상 보낼 때는 경유와 각각 편도 중에서 고르시면 됩니다.</p>
      </div>
      <nav class="toc-side" aria-label="이 페이지 목차"><p>이 페이지에서</p><a href="#size">보낼 수 있는 크기</a><a href="#time">걸리는 시간</a><a href="#fare">요금</a><a href="#use">이용 사례</a><a href="#how">접수 방법</a><a href="#faq">자주 묻는 질문</a></nav>
    </div></section>`,
    faqBlock('motorcycle'), otherServices(u, s.id), related(u, posts, s.keywords.concat(['오토바이', '서류'])), ctaBand(u),
  ].join('\n');
}

// ── 다마스·라보 ─────────────────────────────────────
export function damasLabo(u, posts) {
  const s = SERVICES.find(x => x.id === 'damas-labo');
  const [, d, l] = SMALL_VEHICLES;
  return [
    subHero({}, u, { eyebrow: '다마스·라보 퀵', h1: '오토바이에 안 실리는 짐은 다마스·라보로', lead: s.lead, crumbs: crumbsSvc(s),
      aside: specCard(`<div class="spec-pair">${vehicleFit('damas', '다마스')}${vehicleFit('labo', '라보')}</div>`, [['다마스', '350kg 미만 · 20,000원~'], ['라보', '450kg 미만'], ['접수', '24시간'], ['취소(도착 후)', '5,000원']]) }),
    `<section class="sec"><div class="wrap prose-grid">
      <div class="prose">
        <h2 id="diff">다마스와 라보, 무엇이 다른가요?</h2>
        <p><strong>다마스는 지붕이 있는 밴, 라보는 적재함이 열린 소형 트럭입니다.</strong> 젖으면 안 되는 물건이나 가전은 다마스, 길거나 무거운 자재는 라보가 맞습니다.</p>
        <table class="tbl tbl-compare"><thead><tr><th scope="col"></th><th scope="col">다마스</th><th scope="col">라보</th></tr></thead><tbody>
          <tr><th scope="row">형태</th><td>지붕 있는 소형 밴</td><td>적재함이 열린 소형 트럭</td></tr>
          <tr><th scope="row">최대 적재</th><td>${d.max} · ${d.size}</td><td>${l.max} · ${l.size}</td></tr>
          <tr><th scope="row">맞는 물건</th><td>${d.use}</td><td>${l.use}</td></tr>
          <tr><th scope="row">기본요금</th><td>오토바이 기본요금 + 10,000원<br><strong>20,000원부터</strong></td><td>오토바이 기본요금 + 15,000원</td></tr>
          <tr><th scope="row">취소(기사 도착 후)</th><td>5,000원</td><td>5,000원</td></tr>
        </tbody></table>
        <h2 id="choose">어떤 차를 부를지 고르는 순서</h2>
        <ol class="steps-num">
          <li><strong>오토바이로 되는지 먼저 봅니다.</strong> 세 변 합 150cm, 25kg 이하면 오토바이가 가장 저렴합니다.</li>
          <li><strong>350kg 미만, 상자 20개 안팎이면 다마스.</strong> 비·눈을 피해야 하거나 고가 장비라면 지붕 있는 다마스가 안전합니다.</li>
          <li><strong>450kg 미만이거나 길이가 긴 물건은 라보.</strong> 건축 자재, 장롱, 진열장, 화환처럼 높이나 길이가 있는 물건입니다.</li>
          <li><strong>그 이상은 1톤 화물차.</strong> 적재함 길이 270~285cm, 폭 160cm입니다. <a href="${u('services/truck/')}">화물운송 안내</a>를 보세요.</li>
        </ol>
        <h2 id="fare">요금과 추가 비용</h2>
        <p>다마스는 <strong>20,000원부터</strong>입니다(${SITE.vat}). 다마스·라보 기본요금은 오토바이 기본요금에 각각 10,000원, 15,000원이 더해지는 구조이고, 거리가 늘면 함께 오릅니다.</p>
        ${fareRuleList()}
        <p>왕복은 적용 요금의 90%를 기준으로 계산합니다. 기사가 건물에 도착한 뒤 취소하면 5,000원이 추가됩니다.</p>
        <h2 id="area">어디까지 가나요?</h2>
        <p>서울·인천·경기 전 지역은 물론, 일부 도서 지역을 빼면 전국으로 갑니다. 장거리로 고가 장비를 옮길 때도 다마스를 많이 씁니다.</p>
      </div>
      <nav class="toc-side" aria-label="이 페이지 목차"><p>이 페이지에서</p><a href="#diff">다마스와 라보 차이</a><a href="#choose">차량 고르는 순서</a><a href="#fare">요금</a><a href="#area">운행 지역</a><a href="#faq">자주 묻는 질문</a></nav>
    </div></section>`,
    faqBlock('damas-labo'), otherServices(u, s.id), related(u, posts, s.keywords.concat(['다마스', '라보'])), ctaBand(u),
  ].join('\n');
}

// ── 화물운송 ────────────────────────────────────────
export function truck(u, posts) {
  const s = SERVICES.find(x => x.id === 'truck');
  return [
    subHero({}, u, { eyebrow: '화물운송 1톤~25톤', h1: '1톤 용달부터 25톤, 특수 화물까지 한 번에 배차', lead: s.lead, crumbs: crumbsSvc(s),
      aside: specCard(vehicleFit('t5', '5톤 윙바디'), [['1톤 용달', '40,000원~'], ['차종', '1톤~25톤, 츄레라'], ['적재함', '카고·윙바디·탑차·냉동'], ['지역', '전국·제주']]) }),
    `<section class="sec"><div class="wrap prose-grid">
      <div class="prose">
        <h2 id="kinds">어떤 화물을 운송하나요?</h2>
        <p><strong>1톤부터 25톤까지 전 차종을 배차합니다.</strong> 츄레라나 노브이처럼 특수 차량이 필요한 화물, 허가를 받은 차량만 실을 수 있는 특수 화물도 운송합니다.</p>
        <div class="acc acc-line" id="cargoAcc">${CARGO_TYPES.map((c, i) => `<div class="acc-item"><h3 class="acc-h"><button class="acc-btn" type="button" aria-expanded="${i ? 'false' : 'true'}" aria-controls="cg${i}">${c.k}${ico('plus', 'acc-ico')}</button></h3><div class="acc-panel" id="cg${i}" role="region"${i ? ' hidden' : ''}><div class="acc-body"><p>${c.v}</p></div></div></div>`).join('')}</div>
        <h2 id="body">적재함은 화물에 맞춰 고릅니다</h2>
        <div class="body-grid">${BODY_TYPES.map(b => `<div class="body-item">${ico({ cargo: 'truck', long: 'ruler', wing: 'box', lift: 'lift', top: 'shield', cold: 'snow' }[b.id])}<strong>${b.name}</strong><p>${b.desc}</p></div>`).join('')}</div>
        <h2 id="size">톤수별 적재함 크기</h2>
        <p>가장 긴 화물의 길이와 전체 무게로 톤수를 고릅니다. 아래는 일반 카고 기준입니다.</p>
        <div class="tbl-scroll"><table class="tbl"><thead><tr><th scope="col">차종</th><th scope="col">폭</th><th scope="col">길이</th><th scope="col">지상고</th><th scope="col">부피</th></tr></thead><tbody>${TRUCKS.map(t => `<tr><th scope="row">${t.ton}</th><td>${t.w}cm</td><td>${t.len[0] === t.len[1] ? t.len[0].toLocaleString() : t.len.map(x => x.toLocaleString()).join('~')}cm</td><td>${t.deck}cm</td><td>${t.cbm ? t.cbm + 'CBM' : '—'}</td></tr>`).join('')}</tbody></table></div>
        <p><a class="link-arrow" href="${u('vehicles/')}">탑차·윙바디 높이까지 전체 제원 보기${ico('arrow', 'ico-s')}</a></p>
        <ul class="note-list">${TRUCK_LIMITS.map(t => `<li>${t}</li>`).join('')}</ul>
        <h2 id="save">지방 화물 운송비를 줄이는 방법</h2>
        <p>경상권·전라권처럼 먼 곳으로 갈 때는 <strong>도착 지역의 현지 차량을 수배</strong>하거나, 같은 방향 화물과 함께 싣는 <strong>혼적</strong>으로 보내면 빈 차로 돌아오는 비용이 줄어듭니다. 화물이 작다면 KTX·고속버스 연계가 더 저렴할 수 있습니다.</p>
        <h2 id="fare">요금</h2>
        <p>1톤 용달은 <strong>40,000원부터</strong>이며(${SITE.vat}), 1톤은 용달 협정 요금을 따릅니다. 2.5톤 이상은 거리·화물·상하차 조건을 듣고 견적을 드립니다. ${FARE_RULES.nextDay}</p>
      </div>
      <nav class="toc-side" aria-label="이 페이지 목차"><p>이 페이지에서</p><a href="#kinds">운송 종류</a><a href="#body">적재함 형태</a><a href="#size">톤수별 크기</a><a href="#save">운송비 줄이기</a><a href="#fare">요금</a><a href="#faq">자주 묻는 질문</a></nav>
    </div></section>`,
    faqBlock('truck'), otherServices(u, s.id), related(u, posts, s.keywords.concat(['화물', '톤', '용달'])), ctaBand(u),
  ].join('\n');
}

// ── 연계배송 ────────────────────────────────────────
export function intercity(u, posts) {
  const s = SERVICES.find(x => x.id === 'intercity');
  return [
    subHero({}, u, { eyebrow: '전국 당일 연계배송', h1: 'KTX·고속버스·항공 연계로 지방도 오늘 받습니다', lead: s.lead, crumbs: crumbsSvc(s),
      aside: specCard(`<div class="spec-icons">${ico('rail')}${ico('bus')}${ico('plane')}</div>`, INTERCITY.map(m => [m.short, `최대 ${m.hours}시간 · ${won(m.from)}~`])) }),
    `<section class="sec"><div class="wrap ic-grid">
      <div class="ic-copy">
        <h2>세 가지 방법 중 고르세요</h2>
        <p class="sec-lead"><strong>가장 급하면 항공(최대 4시간), 가장 경제적이면 KTX·고속버스(25,000원부터)</strong>입니다. KTX가 서지 않는 도시는 고속버스로 갑니다.</p>
        <div class="ic-tabs" role="tablist" aria-label="연계 수단">${INTERCITY.map((m, i) => `<button role="tab" type="button" data-mode="${m.id}" aria-selected="${i ? 'false' : 'true'}"${i ? ' tabindex="-1"' : ''}>${ico(m.id === 'ktx' ? 'rail' : m.id === 'bus' ? 'bus' : 'plane')}${m.short}</button>`).join('')}</div>
        ${INTERCITY.map((m, i) => `<div class="ic-panel" data-panel="${m.id}"${i ? ' hidden' : ''}><p>${m.desc}</p>
          <dl class="ic-dl"><div><dt>도착</dt><dd>최대 ${m.hours}시간 이내 문전 배송</dd></div><div><dt>시작 요금</dt><dd>${won(m.from)}~ (차등 있음)</dd></div><div><dt>구간</dt><dd>${m.routes}</dd></div><div><dt>접수 때 확인</dt><dd>${m.check}</dd></div></dl></div>`).join('')}
      </div>
      <div class="ic-map" data-mode="ktx">${koreaMap(INTERCITY)}</div>
    </div></section>
    <section class="sec sec-soft"><div class="wrap prose-grid">
      <div class="prose">
        <h2 id="flow">어떻게 진행되나요?</h2>
        <ol class="steps-num">
          <li><strong>전화 접수</strong> — 연계배송은 전화로만 받습니다(${SITE.phone}). 출발·도착 행정동, 무게, 가로·세로·높이를 알려 주세요.</li>
          <li><strong>문 앞 픽업</strong> — 기사가 출발지에서 물건을 받아 역·터미널·공항으로 갑니다.</li>
          <li><strong>탁송</strong> — KTX, 고속버스, 항공편에 실어 도착 지역으로 보냅니다.</li>
          <li><strong>문 앞 배달</strong> — 도착지의 협약 업체가 물건을 받아 받는 분 주소까지 전합니다.</li>
        </ol>
        <h2 id="fare">요금과 할증</h2>
        <table class="tbl"><thead><tr><th scope="col">방법</th><th scope="col">최대 소요</th><th scope="col">시작 요금</th><th scope="col">주요 구간</th></tr></thead><tbody>${INTERCITY.map(m => `<tr><th scope="row">${m.name}</th><td>${m.hours}시간</td><td>${won(m.from)}~</td><td>${m.routes}</td></tr>`).join('')}</tbody></table>
        <p>${FARE_RULES.intercitySurcharge}</p>
        <p>${INTERCITY_NOTE}</p>
        <h2 id="why">화물차 대신 연계배송을 쓰는 이유</h2>
        <p>상자 몇 개를 부산으로 보내려고 1톤 차량을 왕복으로 쓰면 빈 차로 돌아오는 비용까지 내야 합니다. 연계배송은 정기 운행하는 열차·버스·비행기에 짐만 실어 보내기 때문에, 작은 짐일수록 비용 차이가 커집니다. 반대로 부피가 크거나 무거운 화물은 현지 차량 수배나 혼적이 맞습니다.</p>
      </div>
      <nav class="toc-side" aria-label="이 페이지 목차"><p>이 페이지에서</p><a href="#flow">진행 과정</a><a href="#fare">요금과 할증</a><a href="#why">연계배송을 쓰는 이유</a><a href="#faq">자주 묻는 질문</a></nav>
    </div></section>`,
    faqBlock('intercity'), otherServices(u, s.id), related(u, posts, s.keywords.concat(['KTX', '지방', '제주'])), ctaBand(u),
  ].join('\n');
}

// ── 요금 안내 ───────────────────────────────────────
export function pricing(u, posts) {
  const crumbs = [{ name: '홈', href: '' }, { name: '요금 안내', href: 'pricing/' }];
  return [
    subHero({}, u, { eyebrow: `요금 안내 · ${ASOF_LABEL} 기준`, h1: '퀵서비스 요금, 무엇으로 정해지고 언제 달라지나', lead: `${FARE_RULES.basis} 아래 금액은 모두 시작 요금이며 ${SITE.vat}입니다.`, crumbs,
      aside: specCard(`<div class="spec-big"><span>오토바이 퀵</span><strong>8,000원~</strong></div>`, [['다마스', '20,000원~'], ['1톤 용달', '40,000원~'], ['KTX·고속버스 연계', '25,000원~'], ['항공 연계', '40,000원~']]) }),
    `<section class="sec"><div class="wrap">
      <div class="sec-hd"><h2>서비스별 시작 요금</h2><p class="sec-lead">시작 요금은 가장 가까운 구간의 기본요금입니다. 실제 요금은 접수할 때 거리와 물건을 확인하고 먼저 안내합니다.</p></div>
      <div class="fare-grid">${START_FARES.map(f => `<a class="fare" href="${u(f.href)}"><span class="fare-k">${f.label}</span><strong class="fare-v">${f.from.toLocaleString('ko-KR')}원<small>~</small></strong><span class="fare-n">${f.note}</span></a>`).join('')}</div>
    </div></section>
    <section class="sec sec-soft"><div class="wrap prose-grid">
      <div class="prose">
        <h2 id="add">추가 요금은 언제 붙나요?</h2>
        <p>추가 요금이 붙는 경우는 정해져 있습니다. 아래에 없는 이유로 요금이 오르지 않습니다.</p>
        <table class="tbl"><thead><tr><th scope="col">항목</th><th scope="col">기준</th></tr></thead><tbody>
          ${FARE_RULES.surchargeWhen.map(s => `<tr><th scope="row">${s.v}</th><td>${s.k}</td></tr>`).join('')}
          <tr><th scope="row">과적(오토바이)</th><td>라면 상자(세 변 합 1m)보다 크면 5,000원</td></tr>
          <tr><th scope="row">작업·대기</th><td>물건 부피·무게, 기사의 수작업, 작업 시간에 따라 추가 운임</td></tr>
          <tr><th scope="row">다음 날 하차</th><td>당일 상차 후 다음 날 이후 하차 시 추가 운임</td></tr>
          <tr><th scope="row">급송</th><td>긴급·급송 전문 기사 배차 시 추가 요금</td></tr>
          <tr><th scope="row">연계배송</th><td>영업 외 시간 운행 구간 30~50%, 왕복 100%</td></tr>
        </tbody></table>
        <h2 id="round">왕복·취소 요금</h2>
        <p>${FARE_RULES.roundTrip}</p>
        <p>${FARE_RULES.cancelRule}</p>
        <table class="tbl"><thead><tr><th scope="col">차량</th><th scope="col">기사 도착 후 취소 시</th></tr></thead><tbody>${FARE_RULES.cancel.map(c => `<tr><th scope="row">${c.k}</th><td>${c.v ? won(c.v) : '전화 문의'}</td></tr>`).join('')}</tbody></table>
        <h2 id="pay">결제 방법</h2>
        <p>${PAYMENT.methods.join(', ')} 중에서 고르시면 됩니다. ${PAYMENT.note} ${PAYMENT.invoice}</p>
        <h2 id="save">요금을 줄이는 방법</h2>
        <ol class="steps-num">${SAVE_TIPS.map(t => `<li><strong>${t.t}</strong> — ${t.d}</li>`).join('')}</ol>
      </div>
      <nav class="toc-side" aria-label="이 페이지 목차"><p>이 페이지에서</p><a href="#add">추가 요금 기준</a><a href="#round">왕복·취소</a><a href="#pay">결제</a><a href="#save">요금 줄이기</a><a href="#compare">타사 요금 비교</a><a href="#faq">자주 묻는 질문</a></nav>
    </div></section>
    ${compareSection()}`,
    faqBlock('pricing', '요금에 관해 자주 묻는 질문'), related(u, posts, ['요금', '할증', '비용']), ctaBand(u),
  ].join('\n');
}

export function compareSection() {
  return `<section class="sec sec-dark" id="compare"><div class="wrap">
    <div class="sec-hd"><p class="eyebrow eyebrow-light">비교 자료</p><h2>공개 요금표로 본 시작 요금 비교</h2><p class="sec-lead">${MARKET.note}</p></div>
    <div class="tbl-scroll"><table class="tbl tbl-dark"><thead><tr><th scope="col">항목</th><th scope="col">퀵서비스다</th><th scope="col">비교 업체(시작 요금)</th><th scope="col">비교 업체 평균</th><th scope="col">차이</th></tr></thead><tbody>
      ${MARKET.sets.map(s => { const a = avg(s.others.map(o => o.v)); return `<tr><th scope="row">${s.label}</th><td><strong>${won(s.ours)}~</strong></td><td>${s.others.map(o => `${o.k} ${won(o.v)}${o.f ? `(${o.f})` : ''}`).join(', ')}</td><td>${won(a)}</td><td>${Math.round((1 - s.ours / a) * 100)}% 낮음</td></tr>`; }).join('')}
    </tbody></table></div>
    <h3 class="h-sub h-sub-light">왕복 요금 계산 방식</h3>
    <ul class="ticks ticks-light">${MARKET.roundTrip.map(r => `<li><strong>${r.k}</strong><span>${r.v}</span></li>`).join('')}</ul>
    <div class="cl"><h3 class="h-sub h-sub-light">비교할 때 확인할 일곱 가지</h3><div class="cl-grid">${CHECKLIST.map(c => `<div class="cl-item">${ico('check', 'cl-ico')}<div><strong>${c.k}</strong><p>${c.v}</p></div></div>`).join('')}</div></div>
  </div></section>`;
}

// ── 차량 제원 + 추천 ─────────────────────────────────
export function vehicles(u, posts) {
  const crumbs = [{ name: '홈', href: '' }, { name: '차량 제원', href: 'vehicles/' }];
  const lineup = ['moto', 'damas', 'labo', 't1', 't25', 't35', 't5', 't5p', 't11', 't25t'];
  const names = { moto: '오토바이', damas: '다마스', labo: '라보' };
  return [
    subHero({}, u, { eyebrow: '차량 제원', h1: '차종별 적재함 크기와 고르는 법', lead: '오토바이부터 25톤 트럭까지 적재 가능한 크기를 한 곳에 정리했습니다. 물건 크기와 무게를 넣으면 맞는 차를 추천해 드립니다.', crumbs,
      aside: specCard(vehicleFit('t11', '11톤 윙바디'), [['소형', '오토바이·다마스·라보'], ['화물차', '1톤~25톤'], ['특수', '츄레라 16m·27톤'], ['적재 한도', '높이 4.3m · 폭 2.4m']]) }),
    `<section class="sec" id="recommend"><div class="wrap rec">
      <div class="rec-copy"><p class="eyebrow">차량 추천</p><h2>내 물건엔 어떤 차가 맞을까요?</h2><p class="sec-lead">가장 긴 변, 세 변의 합, 전체 무게를 넣어 보세요. 기존 홈페이지에 공개된 적재 기준으로 계산합니다. 최종 차량은 상담할 때 확정합니다.</p></div>
      <form class="rec-form" id="recForm" novalidate>
        <div class="f-row f-3">
          <label class="f"><span>가장 긴 변 <em>cm</em></span><input type="number" name="long" min="1" inputmode="numeric" placeholder="예: 120" required></label>
          <label class="f"><span>세 변의 합 <em>cm</em></span><input type="number" name="sum" min="1" inputmode="numeric" placeholder="예: 200"></label>
          <label class="f"><span>전체 무게 <em>kg</em></span><input type="number" name="kg" min="1" inputmode="numeric" placeholder="예: 80" required></label>
        </div>
        <fieldset class="f"><legend>필요한 조건 <em>선택</em></legend>
          <div class="checks">
            <label class="chk"><input type="checkbox" name="rain"><span>비·눈을 막아야 해요</span></label>
            <label class="chk"><input type="checkbox" name="pallet"><span>지게차로 파레트를 실어요</span></label>
            <label class="chk"><input type="checkbox" name="lift"><span>상하차 인력이 없어요</span></label>
            <label class="chk"><input type="checkbox" name="cold"><span>냉장·냉동이 필요해요</span></label>
          </div>
        </fieldset>
        <button class="btn btn-signal" type="submit">추천 받기${ico('arrow')}</button>
      </form>
      <div class="rec-out" id="recOut" aria-live="polite">
        <div class="rec-empty">${ico('truck')}<p>크기와 무게를 넣으면 여기에 추천 차량이 나옵니다.</p></div>
      </div>
      <script type="application/json" id="recData">${JSON.stringify({ trucks: TRUCKS.map(t => ({ id: t.id, art: t.id, ton: t.ton, cap: t.cap, w: t.w, lenMax: Math.max(t.len[1], Number(t.topLen) || 0), lenLabel: t.len[0] === t.len[1] ? t.len[0].toLocaleString() : t.len.map(x => x.toLocaleString()).join('~') })) }).replace(/</g, '\\u003c')}</script>
      ${['moto', 'damas', 'labo', 't1top', 'cold', ...TRUCKS.map(t => t.id)].map(id => `<template id="veh-${id}">${vehicleFit(id, names[id] || (id === 't1top' ? '1톤 탑차' : id === 'cold' ? '냉동탑차' : TRUCKS.find(t => t.id === id).ton))}</template>`).join('')}
    </div></section>
    <section class="sec sec-soft"><div class="wrap">
      <div class="sec-hd"><h2>같은 배율로 본 차량 크기</h2><p class="sec-lead">모든 그림을 1cm당 같은 픽셀로 그렸습니다. 화면이 좁으면 좌우로 밀어 보세요.</p></div>
      <div class="lineup" tabindex="0" aria-label="차량 크기 비교, 좌우로 스크롤">${lineup.map(id => { const t = TRUCKS.find(x => x.id === id); return `<figure>${vehicle(id, { scale: 0.26, label: names[id] || t.ton })}<figcaption>${names[id] || t.ton}</figcaption></figure>`; }).join('')}</div>
    </div></section>
    <section class="sec"><div class="wrap prose-grid">
      <div class="prose">
        <h2 id="small">오토바이·다마스·라보</h2>
        <div class="tbl-scroll"><table class="tbl"><thead><tr><th scope="col">차량</th><th scope="col">최대 적재</th><th scope="col">크기 기준</th><th scope="col">맞는 물건</th></tr></thead><tbody>${SMALL_VEHICLES.map(v => `<tr><th scope="row">${v.name}</th><td>${v.max}</td><td>${v.size}</td><td>${v.use}</td></tr>`).join('')}</tbody></table></div>
        <h2 id="truck">화물차 적재함 제원</h2>
        <p>카고는 적재함이 열린 형태, 탑차·윙바디는 지붕이 있어 높이 제한이 있습니다. 단위는 cm입니다.</p>
        <div class="tbl-scroll"><table class="tbl tbl-spec"><thead><tr><th scope="col">차종</th><th scope="col">형태</th><th scope="col">폭</th><th scope="col">길이</th><th scope="col">지상고</th><th scope="col">탑 높이</th><th scope="col">부피</th></tr></thead><tbody>
          ${TRUCKS.map(t => {
            const L = t.len[0] === t.len[1] ? t.len[0].toLocaleString() : t.len.map(x => x.toLocaleString()).join('~');
            return `<tr><th scope="row" rowspan="2">${t.ton}</th><td>일반 카고</td><td>${t.w}</td><td>${L}</td><td>${t.deck}</td><td>—</td><td>${t.cbm ? t.cbm + 'CBM' : '—'}</td></tr>
            <tr><td>탑차·윙바디</td><td>${t.topW || t.w}</td><td>${t.topLen ? Number.isFinite(t.topLen) ? t.topLen.toLocaleString() : t.topLen : L}</td><td>${t.topDeck || t.deck}</td><td>${t.top[0] === t.top[1] ? t.top[0] : t.top.join('~')}</td><td>${t.topCbm ? t.topCbm + 'CBM' : '—'}</td></tr>`; }).join('')}
        </tbody></table></div>
        <ul class="note-list">${TRUCK_LIMITS.map(t => `<li>${t}</li>`).join('')}</ul>
        <h2 id="body">적재함 형태</h2>
        <div class="body-grid">${BODY_TYPES.map(b => `<div class="body-item">${ico({ cargo: 'truck', long: 'ruler', wing: 'box', lift: 'lift', top: 'shield', cold: 'snow' }[b.id])}<strong>${b.name}</strong><p>${b.desc}</p></div>`).join('')}</div>
      </div>
      <nav class="toc-side" aria-label="이 페이지 목차"><p>이 페이지에서</p><a href="#recommend">차량 추천</a><a href="#small">오토바이·다마스·라보</a><a href="#truck">화물차 제원</a><a href="#body">적재함 형태</a><a href="#faq">자주 묻는 질문</a></nav>
    </div></section>`,
    faqBlock('vehicles'), related(u, posts, ['차량', '톤', '다마스', '용달']), ctaBand(u),
  ].join('\n');
}

// ── 기업 고객 ───────────────────────────────────────
export function business(u, posts) {
  const crumbs = [{ name: '홈', href: '' }, { name: '기업 고객', href: 'business/' }];
  return [
    subHero({}, u, { eyebrow: '기업 고객 월 정산', h1: '자주 보내는 회사라면 월 정산으로', lead: '건마다 결제하지 않고, 원하는 날짜에 한 달 이용액을 모아 정산합니다. 세금계산서를 발행해 물류비 지출을 투명하게 관리하고 부가세 환급을 받을 수 있습니다.', crumbs,
      aside: specCard(`<div class="spec-icons">${ico('building')}${ico('receipt')}${ico('calendar')}</div>`, [['대상', '월 50만 원 이상'], ['정산', '원하는 날짜'], ['증빙', '세금계산서'], ['계약', '방문 체결']]) }),
    `<section class="sec"><div class="wrap prose-grid">
      <div class="prose">
        <h2 id="who">누가 이용할 수 있나요?</h2>
        <ul class="ticks">${BUSINESS.who.map(x => `<li><strong>${x}</strong></li>`).join('')}</ul>
        <h2 id="what">어떤 서비스가 포함되나요?</h2>
        <ul class="ticks">${BUSINESS.services.map(x => `<li><strong>${x}</strong></li>`).join('')}</ul>
        <p>건별 이용과 같은 차량, 같은 접수 창구를 씁니다. 오토바이 퀵부터 화물차, 연계배송까지 한 거래처로 묶어 정산합니다.</p>
        <h2 id="benefit">월 정산의 장점</h2>
        <ol class="steps-num">${BUSINESS.benefits.map(x => `<li>${x}</li>`).join('')}<li>담당자가 매번 카드 결제나 송금을 할 필요가 없습니다.</li></ol>
        <h2 id="contract">계약은 어떻게 하나요?</h2>
        <p>${BUSINESS.contract}</p>
        <div class="acct acct-inline"><span>${SITE.bank.name}</span><strong>${SITE.bank.no}</strong><span>예금주 ${SITE.bank.holder}</span><button class="btn btn-line btn-sm" type="button" data-copy="${SITE.bank.no}" data-copy-msg="계좌번호를 복사했습니다">${ico('copy')}계좌 복사</button></div>
        <p><button class="btn btn-dark" type="button" data-open="drawerBiz">월 정산 조건 한눈에 보기${ico('arrow')}</button></p>
      </div>
      <nav class="toc-side" aria-label="이 페이지 목차"><p>이 페이지에서</p><a href="#who">이용 대상</a><a href="#what">포함 서비스</a><a href="#benefit">장점</a><a href="#contract">계약 방법</a><a href="#faq">자주 묻는 질문</a></nav>
    </div></section>`,
    faqBlock('business'), related(u, posts, ['기업', '정산', '세금계산서']), ctaBand(u, '월 정산 계약은 전화 한 통으로 시작합니다.'),
  ].join('\n');
}

// ── 회사 소개 ───────────────────────────────────────
export function about(u) {
  const crumbs = [{ name: '홈', href: '' }, { name: '회사 소개', href: 'about/' }];
  const mapQ = encodeURIComponent('서울 동대문구 천호대로 391');
  return [
    subHero({}, u, { eyebrow: SITE.slogan, h1: '퀵서비스다를 소개합니다', lead: COMPANY_INTRO[0], crumbs,
      aside: specCard(`<div class="spec-logo">${'<svg viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="11" fill="#0B2A5B"/><circle cx="19" cy="19" r="10.5" fill="none" stroke="#2EC4D3" stroke-width="5"/><path d="M23.5 23.5 31 31" stroke="#2EC4D3" stroke-width="5" stroke-linecap="round"/></svg>'}<strong>${SITE.name}</strong><span>${SITE.nameEn}</span></div>`, [['접수', '24시간 · 365일'], ['지역', '서울·인천·경기, 전국'], ['허가', '화물운송주선 제90143호'], ['대표전화', SITE.phone]]) }),
    `<section class="sec"><div class="wrap prose-grid">
      <div class="prose">
        <h2 id="greet">인사말</h2>
        ${COMPANY_INTRO.slice(1).map(p => `<p>${p}</p>`).join('')}
        <p class="sign">— 퀵서비스다 임직원 일동</p>
        <h2 id="what">하는 일</h2>
        <ul class="ticks">${SERVICES.map(s => `<li><strong><a href="${u(s.slug)}">${s.name}</a></strong><span>${s.card}</span></li>`).join('')}</ul>
        <h2 id="info">사업자 정보</h2>
        <table class="tbl"><tbody>
          <tr><th scope="row">상호</th><td>${SITE.name} (${SITE.nameEn})</td></tr>
          <tr><th scope="row">사업자등록번호</th><td>${SITE.bizNo}</td></tr>
          <tr><th scope="row">화물자동차운송주선사업</th><td>허가 제90143호</td></tr>
          <tr><th scope="row">통신판매업 신고</th><td>제A17-211007-0264호</td></tr>
          <tr><th scope="row">주소</th><td>${SITE.address.full}</td></tr>
          <tr><th scope="row">대표전화</th><td><a href="tel:${SITE.tel}">${SITE.phone}</a> (24시간)</td></tr>
          <tr><th scope="row">팩스</th><td>${SITE.fax}</td></tr>
          <tr><th scope="row">이메일</th><td><a href="mailto:${SITE.email}">${SITE.email}</a></td></tr>
          <tr><th scope="row">카카오톡</th><td><a href="${SITE.kakaoChat}" target="_blank" rel="noopener">채널 ‘퀵서비스다’</a></td></tr>
        </tbody></table>
        <h2 id="map">오시는 길</h2>
        <p>${SITE.address.full}</p>
        <p class="map-links"><a class="btn btn-line btn-sm" href="https://map.naver.com/p/search/${mapQ}" target="_blank" rel="noopener">${ico('pin')}네이버 지도</a><a class="btn btn-line btn-sm" href="https://map.kakao.com/?q=${mapQ}" target="_blank" rel="noopener">${ico('pin')}카카오맵</a><button class="btn btn-line btn-sm" type="button" data-copy="${SITE.address.full}" data-copy-msg="주소를 복사했습니다">${ico('copy')}주소 복사</button></p>
      </div>
      <nav class="toc-side" aria-label="이 페이지 목차"><p>이 페이지에서</p><a href="#greet">인사말</a><a href="#what">하는 일</a><a href="#info">사업자 정보</a><a href="#map">오시는 길</a></nav>
    </div></section>`,
    ctaBand(u),
  ].join('\n');
}

// ── FAQ 전체 ────────────────────────────────────────
export function faqPageBody(u) {
  const crumbs = [{ name: '홈', href: '' }, { name: '자주 묻는 질문', href: 'faq/' }];
  return [
    subHero({}, u, { eyebrow: 'FAQ', h1: '자주 묻는 질문', lead: `요금, 접수, 차량, 지방 배송, 결제까지 ${FAQ.length}가지 질문을 모았습니다. 분류를 눌러 필요한 것만 볼 수 있습니다.`, crumbs }),
    `<section class="sec"><div class="wrap wrap-narrow">${faqList(FAQ, { id: 'faqAll', withCats: true, cats: FAQ_CATS })}</div></section>`,
    ctaBand(u, '여기 없는 질문은 전화로 바로 답해 드립니다.'),
  ].join('\n');
}

// ── 약관·방침 ───────────────────────────────────────
const CIRCLED = /(?=[①②③④⑤⑥⑦⑧⑨⑩⑪⑫])/;
const paras = t => t.split(CIRCLED).map(s => s.trim()).filter(Boolean).map(s => `<p>${esc(s)}</p>`).join('');
export function privacyBody(u, raw) {
  const H = ['1. 개인정보의 처리 목적', '2. 개인정보처리 위탁', '3. 정보주체의 권리,의무 및 그 행사방법', '4. 처리하는 개인정보의 항목', '5. 개인정보 자동 수집 장치의 설치∙운영 및 거부에 관한 사항', '6. 개인정보의 파기', '7. 개인정보의 안전성 확보 조치', '8. 개인정보 보호책임자', '9. 개인정보 처리방침 변경'];
  const text = raw.replace(/http:\/\/퀵서비스다\.com\//g, SITE.url.replace('xn--2j1bs9sn9b30bc55a', '퀵서비스다'));
  const tocStart = text.indexOf(H[0]);
  const intro = text.slice(0, tocStart).trim();
  let pos = text.indexOf(H[0], tocStart + H[0].length);
  const secs = H.map((h, i) => {
    const start = text.indexOf(h, pos); const next = i < H.length - 1 ? text.indexOf(H[i + 1], start + h.length) : text.length;
    pos = next; return { h, body: text.slice(start + h.length, next).trim() };
  });
  return legalWrap(u, '개인정보처리방침', 'privacy/', `<p>${esc(intro)}</p><nav class="legal-toc"><ol>${secs.map((s, i) => `<li><a href="#p${i + 1}">${esc(s.h.replace(/^\d+\.\s*/, ''))}</a></li>`).join('')}</ol></nav>
    ${secs.map((s, i) => `<h2 id="p${i + 1}">${esc(s.h)}</h2>${paras(s.body.replace(/\s-(?=[가-힣])/g, '\n- ').replace(/ ([가-다])\. /g, '\n$1. ')).replace(/\n/g, '<br>')}`).join('')}
    <p class="muted">시행일자: 2021년 10월 14일(Ver 1.0)</p>`);
}
export function termsBody(u, raw) {
  const parts = raw.split(/(?=제\s?\d+\s?장\s)|(?=제\s?\d+\s?조\s?\()/).map(s => s.trim()).filter(Boolean);
  const html = parts.map(p => {
    const ch = p.match(/^(제\s?\d+\s?장\s[^제]+?)\s*$/) || p.match(/^(제\s?\d+\s?장\s[가-힣\s]+?)(?=\s제|$)/);
    if (/^제\s?\d+\s?장/.test(p)) return `<h2>${esc(p)}</h2>`;
    const m = p.match(/^(제\s?\d+\s?조\s?\([^)]+\))\s*([\s\S]*)$/);
    return m ? `<h3>${esc(m[1])}</h3>${paras(m[2])}` : paras(p);
  }).join('');
  return legalWrap(u, '이용약관(이륜차 퀵서비스)', 'terms/', html);
}
function legalWrap(u, title, href, inner) {
  const crumbs = [{ name: '홈', href: '' }, { name: title, href }];
  return `<section class="sub-hero sub-hero-plain"><div class="wrap"><nav class="crumbs" aria-label="현재 위치"><ol>${crumbs.map((c, i) => i < crumbs.length - 1 ? `<li><a href="${u(c.href)}">${c.name}</a></li>` : `<li aria-current="page">${c.name}</li>`).join('')}</ol></nav><h1>${title}</h1></div></section>
  <section class="sec"><div class="wrap wrap-narrow legal prose">${inner}</div></section>`;
}

// ── 블로그 ──────────────────────────────────────────
export function blogIndex(u, posts, cats) {
  const crumbs = [{ name: '홈', href: '' }, { name: '물류 가이드', href: 'blog/' }];
  const first = posts.slice(0, 9);
  return [
    `<section class="sub-hero sub-hero-plain"><div class="wrap"><nav class="crumbs" aria-label="현재 위치"><ol>${crumbs.map((c, i) => i < crumbs.length - 1 ? `<li><a href="${u(c.href)}">${c.name}</a></li>` : `<li aria-current="page">${c.name}</li>`).join('')}</ol></nav>
    <p class="eyebrow">물류 가이드</p><h1>보내기 전에 알아 두면 좋은 것</h1><p class="lead">퀵 요금, 차량 고르는 법, 지방 당일 배송, 기업 물류까지. 접수 현장에서 자주 받는 질문을 글로 정리합니다. 매일 새 글이 올라옵니다.</p></div></section>`,
    `<section class="sec"><div class="wrap">
      <div class="chips" role="toolbar" aria-label="글 분류"><button type="button" class="chip on" data-blog-cat="all" aria-pressed="true">전체 <span>${posts.length}</span></button>${cats.map(c => { const n = posts.filter(p => p.category === c).length; return n ? `<button type="button" class="chip" data-blog-cat="${esc(c)}" aria-pressed="false">${esc(c)} <span>${n}</span></button>` : ''; }).join('')}</div>
      <div class="post-grid" id="postGrid" data-total="${posts.length}">${first.map(p => postCard(p, u).replace('<article class="post-card reveal">', `<article class="post-card reveal" data-cat="${esc(p.category)}">`)).join('')}</div>
      ${posts.length > first.length ? `<div class="more-wrap"><button class="btn btn-line" type="button" id="moreBtn" data-src="${u('blog/posts.json')}">글 더 보기${ico('down')}</button></div>` : ''}
    </div></section>`,
    ctaBand(u),
  ].join('\n');
}

export function blogPost(u, p, posts) {
  const crumbs = [{ name: '홈', href: '' }, { name: '물류 가이드', href: 'blog/' }, { name: p.title, href: `blog/${p.slug}/` }];
  const rel = posts.filter(x => x.slug !== p.slug && (x.category === p.category || x.tags.some(t => p.tags.includes(t)))).slice(0, 3);
  const svc = SERVICES.find(s => s.id === p.service) || null;
  return `<div class="read-bar" aria-hidden="true"><span id="readBar"></span></div>
<article class="post">
  <header class="post-hd"><div class="wrap wrap-narrow">
    <nav class="crumbs" aria-label="현재 위치"><ol>${crumbs.slice(0, 2).map(c => `<li><a href="${u(c.href)}">${c.name}</a></li>`).join('')}<li aria-current="page">${esc(p.category)}</li></ol></nav>
    <p class="post-cat">${ico(catIcon(p.category), 'ico-s')}${esc(p.category)}</p>
    <h1>${esc(p.title)}</h1>
    <p class="post-desc">${esc(p.description)}</p>
    <div class="post-meta"><span>${esc(p.author || '퀵서비스다 운영팀')}</span><time datetime="${p.date}">${kdate(p.date)}</time><span>${p.minutes}분 읽기</span><button class="btn btn-text btn-sm" type="button" data-share>${ico('share', 'ico-s')}공유</button></div>
  </div></header>
  <div class="wrap post-grid-wrap">
    ${p.toc.length >= 3 ? `<nav class="post-toc" aria-label="글 목차"><p>목차</p><ol>${p.toc.map(t => `<li><a href="#${t.id}">${esc(t.t)}</a></li>`).join('')}</ol></nav>` : '<div></div>'}
    <div class="post-body prose">
      ${p.html}
      ${p.faq.length ? `<section class="post-faq" aria-labelledby="pfq"><h2 id="pfq">자주 묻는 질문</h2>${faqList(p.faq.map(f => ({ q: f.q, a: f.a, cat: 'x' })), { id: 'pf' })}</section>` : ''}
      <aside class="post-cta">
        <div><strong>${svc ? svc.name + ', 바로 접수하세요' : '보낼 물건이 있으신가요?'}</strong><p>출발·도착 동과 물건 크기를 알려 주시면 확정 요금을 먼저 안내합니다. 24시간 접수.</p></div>
        <div class="post-cta-act"><a class="btn btn-signal" href="tel:${SITE.tel}">${ico('phone')}${SITE.phone}</a>${svc ? `<a class="btn btn-line" href="${u(svc.slug)}">${svc.name} 안내</a>` : `<button class="btn btn-line" type="button" data-open="modalQuote">요금 문의</button>`}</div>
      </aside>
      <p class="post-tags">${p.tags.map(t => `<span>#${esc(t)}</span>`).join('')}</p>
    </div>
  </div>
</article>
${rel.length ? `<section class="sec sec-soft"><div class="wrap"><div class="sec-hd sec-hd-row"><div><p class="eyebrow">이어서 읽기</p><h2>관련 글</h2></div><a class="link-arrow" href="${u('blog/')}">전체 글${ico('arrow', 'ico-s')}</a></div><div class="post-grid">${rel.map(x => postCard(x, u)).join('')}</div></div></section>` : ''}
${ctaBand(u)}`;
}

export function notFound(u) {
  return `<section class="sub-hero sub-hero-plain nf"><div class="wrap"><p class="eyebrow">404</p><h1>찾는 페이지가 없습니다</h1><p class="lead">주소가 바뀌었거나 삭제된 페이지입니다. 급한 배송이라면 바로 전화 주세요.</p>
  <p class="sub-hero-cta"><a class="btn btn-signal" href="tel:${SITE.tel}">${ico('phone')}${SITE.phone}</a><a class="btn btn-line" href="${u('')}">홈으로</a></p></div></section>`;
}
