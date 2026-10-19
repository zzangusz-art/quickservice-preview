// 홈: 히어로 → 접수 5단계 스크롤 시퀀스 → 서비스 → 차량 가로 시퀀스 → 후기 → 요금 → 타사 비교 → 기업 → FAQ → 가이드 → 문의
import { SITE, SERVICES, PROCESS, START_FARES, FARE_RULES, SAVE_TIPS, REVIEWS, MARKET, CHECKLIST, FAQ, FAQ_CATS, SMALL_VEHICLES, TRUCKS, INTERCITY, MOTO_TIME, ASOF_LABEL, avg } from './data.mjs';
import { esc, won, nl2br, kdate } from './lib.mjs';
import { ico, vehicle, vehicleFit, consoleMap, koreaMap } from './art.mjs';
import { ctaBand, faqList } from './layout.mjs';

const svcIcon = { motorcycle: 'moto', 'damas-labo': 'van', truck: 'truck', intercity: 'rail' };

function hero(u) {
  return `<section class="hero" id="top">
  <canvas class="hero-canvas" id="heroCanvas" aria-hidden="true"></canvas>
  <div class="hero-shade" aria-hidden="true"></div>
  <div class="wrap hero-in">
    <div class="hero-copy">
      <p class="eyebrow eyebrow-light"><span class="live-dot" aria-hidden="true"></span>서울·인천·경기 퀵서비스 · 전국 화물운송</p>
      <h1 class="hero-h1"><span class="sr-only">퀵서비스다 — 서울·경기·인천 퀵서비스와 전국 화물운송. </span><span class="h1-line">오토바이 한 대부터</span> <span class="h1-line">25톤 트럭까지,</span> <span class="h1-line h1-accent">전화 한 통이면 됩니다.</span></h1>
      <p class="hero-lead">24시간 접수합니다. 출발지와 도착지 동 이름, 물건 크기만 알려 주시면 맞는 차량과 요금을 바로 안내해 드립니다.</p>
      <div class="hero-cta">
        <a class="btn btn-signal btn-lg" href="tel:${SITE.tel}" data-track="tel">${ico('phone')}<span>${SITE.phone}</span></a>
        <button class="btn btn-ghost-light btn-lg" type="button" data-open="modalQuote">${ico('receipt')}요금 문의</button>
        <a class="btn btn-text-light" href="${SITE.kakaoChat}" target="_blank" rel="noopener">${ico('chat')}카카오톡 상담</a>
      </div>
      <ul class="hero-meta">
        <li>${ico('shield', 'ico-s')}${SITE.freightLicense}</li>
        <li>${ico('card', 'ico-s')}카드 결제 · 세금계산서 · 월 정산</li>
      </ul>
    </div>
    <aside class="hero-card" aria-label="요금 안내 예시">
      <div class="hc-hd"><span>요금 문의에 필요한 세 가지</span><span class="hc-tag">예시</span></div>
      <ol class="hc-steps">
        <li><span class="hc-k">출발</span><strong>장안동</strong><em>동대문구</em></li>
        <li><span class="hc-k">도착</span><strong>가산동</strong><em>금천구</em></li>
        <li><span class="hc-k">물건</span><strong>상자 3개 · 약 40kg</strong><em>오토바이 초과</em></li>
      </ol>
      <div class="hc-result">
        <div class="hc-veh">${vehicleFit('damas', '다마스')}</div>
        <div><span class="hc-k">추천 차량</span><strong>다마스</strong><em>350kg 미만 · 라면 상자 약 20개</em></div>
      </div>
      <button class="btn btn-dark btn-block" type="button" data-open="modalQuote">내 물건으로 문의하기${ico('arrow')}</button>
    </aside>
  </div>
  <div class="hero-stats wrap" role="list">
    <div role="listitem"><strong>24<small>시간</small></strong><span>365일 접수·배차</span></div>
    <div role="listitem"><strong><span data-count="25">25</span><small>톤</small></strong><span>오토바이부터 전 차종</span></div>
    <div role="listitem"><strong>최대 4<small>시간</small></strong><span>항공 연계 지방 당일 배송</span></div>
    <div role="listitem"><strong><span data-count="8000">8,000</span><small>원~</small></strong><span>오토바이 퀵 시작 요금</span></div>
  </div>
  <a class="hero-scroll" href="#process" aria-label="접수 과정 보기"><span></span></a>
</section>`;
}

function sequence() {
  return `<section class="seq" id="process" aria-labelledby="seqTitle">
  <div class="seq-pin">
    <div class="wrap seq-grid">
      <div class="seq-copy">
        <p class="eyebrow">보내는 과정</p>
        <h2 id="seqTitle">접수부터 도착까지,<br>다섯 단계입니다</h2>
        <ol class="seq-steps">${PROCESS.map((s, i) => `
          <li class="seq-step${i ? '' : ' on'}" data-step="${i}">
            <div class="seq-no">${s.no}</div>
            <div><h3>${s.title} <span>— ${s.head}</span></h3><p>${s.body}</p></div>
          </li>`).join('')}
        </ol>
        <div class="seq-bar" aria-hidden="true"><span id="seqBar"></span></div>
      </div>
      <div class="seq-visual" aria-hidden="true">
        <div class="console">
          <div class="cs-top"><span class="cs-dot"></span><span class="cs-dot"></span><span class="cs-dot"></span><span class="cs-title">배차 관제 화면 · 흐름 예시</span></div>
          <div class="cs-map">${consoleMap()}
            <div class="cs-pin cs-pin-a"><b>출발</b>장안동</div>
            <div class="cs-pin cs-pin-b"><b>도착</b>가산동</div>
          </div>
          <div class="cs-status">${PROCESS.map((s, i) => `<span class="cs-chip${i ? '' : ' on'}" data-chip="${i}">${s.status}</span>`).join('')}</div>
          <div class="cs-rows">
            <div><span>차량</span><strong id="csVeh">확인 중</strong></div>
            <div><span>예상</span><strong id="csEta">—</strong></div>
            <div><span>결제</span><strong id="csPay">—</strong></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>`;
}

function services(u) {
  return `<section class="sec" id="services" aria-labelledby="svcTitle">
  <div class="wrap">
    <div class="sec-hd">
      <p class="eyebrow">서비스</p>
      <h2 id="svcTitle">무엇을, 어디까지 보내시나요?</h2>
      <p class="sec-lead">물건 크기와 거리로 방법이 갈립니다. 시내 소형 물품은 오토바이, 큰 짐은 다마스·라보, 화물은 1톤부터 25톤, 지방 당일은 KTX·고속버스·항공 연계입니다.</p>
    </div>
    <div class="svc-grid">${SERVICES.map((s, i) => `
      <article class="svc reveal" style="--d:${i * 70}ms">
        <div class="svc-ico">${ico(svcIcon[s.id])}</div>
        <h3>${s.name}</h3>
        <p>${s.card}</p>
        <p class="svc-price"><span>시작 요금</span><strong>${won(s.from)}~</strong></p>
        <div class="svc-act">
          <button class="btn btn-line btn-sm" type="button" data-open="drawerSvc-${s.id}" aria-controls="drawerSvc-${s.id}">요약 보기</button>
          <a class="link-arrow" href="${u(s.slug)}">자세히${ico('arrow', 'ico-s')}</a>
        </div>
      </article>`).join('')}
    </div>
  </div>
</section>`;
}

// 서비스 요약 드로어(홈 전용)
export function serviceDrawers(u) {
  const body = {
    motorcycle: `<table class="kv"><tbody>${MOTO_TIME.map(t => `<tr><th>${t.k}</th><td>${t.v}</td></tr>`).join('')}</tbody></table>
      <ul><li>소: 세 변 합 90cm 이내 · 중: 150cm 이내 · 대: 지름 30cm·길이 150cm 이내</li><li>최대 25kg, 라면 상자보다 크면 과적 5,000원</li><li>왕복은 적용 요금의 90%</li></ul>`,
    'damas-labo': `<ul><li>다마스: 350kg 미만, 라면 상자 약 20개. 지붕 있는 밴</li><li>라보: 450kg 미만, 적재함이 열린 소형 트럭</li><li>기본요금은 오토바이 기본요금 + 다마스 10,000원 / 라보 15,000원</li><li>기사 도착 후 취소 시 5,000원</li></ul>`,
    truck: `<ul><li>1톤~25톤 전 차종, 츄레라·노브이 등 특수 차종</li><li>카고·장축·윙바디·리프트·탑차·냉동탑차</li><li>지방은 현지 차량 수배와 혼적으로 운송비 절감</li><li>제주는 배로 들어가는 차량을 수배해 직접 운송</li></ul>`,
    intercity: `<table class="kv"><tbody>${INTERCITY.map(m => `<tr><th>${m.short}</th><td>최대 ${m.hours}시간 · ${won(m.from)}~</td></tr>`).join('')}</tbody></table><ul><li>전화 접수만 가능합니다(${SITE.phone})</li><li>왕복 100% 할증, 영업 외 시간 운행 구간 30~50% 할증</li></ul>`,
  };
  return SERVICES.map(s => `
<div class="drawer drawer-right" id="drawerSvc-${s.id}" role="dialog" aria-modal="true" aria-labelledby="ds-${s.id}" hidden>
  <div class="drawer-scrim" data-close></div>
  <div class="drawer-panel">
    <div class="drawer-hd"><h2 id="ds-${s.id}">${s.name}</h2><button class="icon-btn" type="button" data-close aria-label="닫기">${ico('x')}</button></div>
    <div class="drawer-body prose"><p class="lead-s">${s.lead}</p>${body[s.id]}<p class="muted">시작 요금 ${won(s.from)}~ · ${SITE.vat}</p></div>
    <div class="drawer-ft"><a class="btn btn-dark btn-block" href="${u(s.slug)}">${s.name} 자세히 보기${ico('arrow')}</a></div>
  </div>
</div>`).join('');
}

function fleet(u) {
  const items = [
    ...SMALL_VEHICLES.map(v => ({ id: v.id, name: v.name, a: v.max, b: v.size, c: v.note })),
    ...['t1', 't25', 't5', 't11', 't25t'].map(id => { const t = TRUCKS.find(x => x.id === id); return { id, name: t.ton, a: `적재함 길이 ${t.len[0] === t.len[1] ? t.len[0].toLocaleString() : t.len.join('~')}cm`, b: `폭 ${t.w}cm${t.cbm ? ` · 약 ${t.cbm}CBM` : ''}`, c: id === 't1' ? '용달 이사·가구·가전' : id === 't25t' ? '장거리 대량 화물' : '파레트·자재·대량 화물' }; }),
  ];
  return `<section class="fleet" id="fleet" aria-labelledby="fleetTitle">
  <div class="fleet-pin">
    <div class="wrap fleet-hd">
      <div><p class="eyebrow eyebrow-light">차량</p><h2 id="fleetTitle">오토바이부터 25톤까지,<br>실제 적재함 길이 비율로</h2></div>
      <p>그림의 차량은 같은 배율로 그렸습니다. 오른쪽으로 갈수록 실을 수 있는 길이가 늘어납니다.</p>
    </div>
    <div class="fleet-track" id="fleetTrack" tabindex="0" aria-label="차량 목록, 좌우로 스크롤">
      ${items.map(v => `<figure class="fleet-item">
        <div class="fleet-art">${vehicle(v.id, { scale: 0.34, label: v.name })}</div>
        <figcaption><strong>${v.name}</strong><span>${v.a}</span><span>${v.b}</span><em>${v.c}</em></figcaption>
      </figure>`).join('')}
      <div class="fleet-end"><p>어떤 차가 맞을지 모르겠다면</p><a class="btn btn-signal" href="${u('vehicles/')}#recommend">차량 추천 받기${ico('arrow')}</a></div>
    </div>
    <div class="wrap fleet-progress" aria-hidden="true"><span id="fleetBar"></span></div>
  </div>
</section>`;
}

function reviews() {
  const total = REVIEWS.items.length;
  return `<section class="sec sec-soft" id="reviews" aria-labelledby="rvTitle">
  <div class="wrap rv-grid">
    <div class="sec-hd sec-hd-left">
      <p class="eyebrow">이용 후기</p>
      <h2 id="rvTitle">이용하신 분들이<br>남긴 말</h2>
      <p class="sec-lead">공개된 후기를 고치지 않고 그대로 옮겼습니다. 후기를 남긴 ${total}명 모두 같은 세 가지를 골랐습니다.</p>
      <ul class="rv-tags">${REVIEWS.tags.map(t => `<li><span>${t.k}</span><span class="rv-bar"><i style="--w:${(t.n / total) * 100}%"></i></span><b>${t.n}/${total}</b></li>`).join('')}</ul>
      <p class="src">출처: <a href="${REVIEWS.sourceUrl}" target="_blank" rel="noopener">${REVIEWS.source}</a> · ${kdate(REVIEWS.checked)} 확인</p>
    </div>
    <div class="rv-cards">${REVIEWS.items.map((r, i) => `
      <figure class="rv reveal" style="--d:${i * 90}ms">
        ${ico('quote', 'rv-q')}
        <blockquote><p>${nl2br(r.text)}</p></blockquote>
        <figcaption><span class="rv-who">${esc(r.who)}</span><span class="rv-src">${REVIEWS.source}</span></figcaption>
        <ul class="rv-chips">${r.tags.map(t => `<li>${t}</li>`).join('')}</ul>
      </figure>`).join('')}
      <div class="rv-write">
        <p>퀵서비스다를 이용해 보셨나요?</p>
        <button class="btn btn-line btn-sm" type="button" data-info="review">후기 남기는 곳</button>
      </div>
    </div>
  </div>
</section>`;
}

function pricing(u) {
  return `<section class="sec" id="pricing" aria-labelledby="prTitle">
  <div class="wrap">
    <div class="sec-hd">
      <p class="eyebrow">요금</p>
      <h2 id="prTitle">퀵서비스 요금은 어떻게 정해지나요?</h2>
      <p class="sec-lead"><strong>거리와 차량으로 정해집니다.</strong> 같은 구간이라도 물건 크기·무게, 시간대, 날씨, 대기 시간에 따라 달라지기 때문에, 접수할 때 확정 금액을 먼저 말씀드립니다. 아래는 ${ASOF_LABEL} 기준 시작 요금입니다(${SITE.vat}).</p>
    </div>
    <div class="fare-grid">${START_FARES.map((f, i) => `
      <a class="fare reveal" style="--d:${i * 60}ms" href="${u(f.href)}">
        <span class="fare-k">${f.label}</span>
        <strong class="fare-v"><span data-count="${f.from}">${f.from.toLocaleString('ko-KR')}</span>원<small>~</small></strong>
        <span class="fare-n">${f.note}</span>
      </a>`).join('')}
    </div>
    <div class="pr-split">
      <div>
        <h3 class="h-sub">요금이 달라지는 경우</h3>
        <div class="acc acc-line" id="prAcc">
          <div class="acc-item"><h4 class="acc-h"><button class="acc-btn" type="button" aria-expanded="true" aria-controls="pa1">할증이 붙는 네 가지${ico('plus', 'acc-ico')}</button></h4>
            <div class="acc-panel" id="pa1" role="region"><div class="acc-body"><ul class="ticks">${FARE_RULES.surchargeWhen.map(s => `<li><strong>${s.k}</strong><span>${s.v}</span></li>`).join('')}</ul></div></div></div>
          <div class="acc-item"><h4 class="acc-h"><button class="acc-btn" type="button" aria-expanded="false" aria-controls="pa2">왕복·과적·다음 날 하차${ico('plus', 'acc-ico')}</button></h4>
            <div class="acc-panel" id="pa2" role="region" hidden><div class="acc-body"><p>${FARE_RULES.roundTrip}</p><p>${FARE_RULES.overload}</p><p>${FARE_RULES.nextDay}</p></div></div></div>
          <div class="acc-item"><h4 class="acc-h"><button class="acc-btn" type="button" aria-expanded="false" aria-controls="pa3">취소 요금${ico('plus', 'acc-ico')}</button></h4>
            <div class="acc-panel" id="pa3" role="region" hidden><div class="acc-body"><p>${FARE_RULES.cancelRule}</p><ul class="ticks">${FARE_RULES.cancel.map(c => `<li><strong>${c.k}</strong><span>${c.v ? won(c.v) : '전화 문의'}</span></li>`).join('')}</ul></div></div></div>
          <div class="acc-item"><h4 class="acc-h"><button class="acc-btn" type="button" aria-expanded="false" aria-controls="pa4">KTX·고속버스·항공 연계${ico('plus', 'acc-ico')}</button></h4>
            <div class="acc-panel" id="pa4" role="region" hidden><div class="acc-body"><p>${FARE_RULES.intercitySurcharge}</p></div></div></div>
        </div>
      </div>
      <div>
        <h3 class="h-sub">요금을 줄이는 네 가지 방법</h3>
        <ol class="tips">${SAVE_TIPS.map((t, i) => `<li class="reveal" style="--d:${i * 70}ms"><span class="tip-no">${i + 1}</span><div><strong>${t.t}</strong><p>${t.d}</p></div></li>`).join('')}</ol>
        <div class="via" aria-label="경유와 각각 편도 비교">
          <div class="via-tabs" role="tablist">
            <button role="tab" type="button" aria-selected="true" aria-controls="via1" id="viaT1">경유</button>
            <button role="tab" type="button" aria-selected="false" aria-controls="via2" id="viaT2" tabindex="-1">각각 편도</button>
          </div>
          <div class="via-panel" role="tabpanel" id="via1" aria-labelledby="viaT1">
            <svg viewBox="0 0 320 90" class="via-svg" aria-hidden="true"><path d="M30 60 H150 L290 30" class="via-r"/><circle cx="30" cy="60" r="8" class="via-a"/><circle cx="150" cy="60" r="8"/><circle cx="290" cy="30" r="8"/><text x="30" y="86">출발</text><text x="150" y="86">A</text><text x="290" y="56">B</text></svg>
            <p><strong>기사 1명</strong>이 A를 거쳐 B로. 요금 = 출발→A + A→B. 시간이 조금 더 걸리는 대신 저렴합니다.</p>
          </div>
          <div class="via-panel" role="tabpanel" id="via2" aria-labelledby="viaT2" hidden>
            <svg viewBox="0 0 320 90" class="via-svg" aria-hidden="true"><path d="M30 60 H150 M30 60 L290 30" class="via-r"/><circle cx="30" cy="60" r="8" class="via-a"/><circle cx="150" cy="60" r="8"/><circle cx="290" cy="30" r="8"/><text x="30" y="86">출발</text><text x="150" y="86">A</text><text x="290" y="56">B</text></svg>
            <p><strong>기사 2명</strong>이 각자 출발. 요금 = 출발→A + 출발→B. 두 곳 모두 가장 빨리 받습니다.</p>
          </div>
        </div>
      </div>
    </div>
    <p class="sec-more"><a class="link-arrow" href="${u('pricing/')}">요금 안내 전체 보기${ico('arrow', 'ico-s')}</a></p>
  </div>
</section>`;
}

function compare(u) {
  const sets = MARKET.sets;
  return `<section class="sec sec-dark" id="compare" aria-labelledby="cpTitle">
  <div class="wrap">
    <div class="sec-hd">
      <p class="eyebrow eyebrow-light">타사 비교</p>
      <h2 id="cpTitle">같은 날, 공개된 요금표로 비교했습니다</h2>
      <p class="sec-lead">퀵 요금은 업체마다 표기 방식이 달라 비교가 어렵습니다. 그래서 각 업체 홈페이지에 공개된 <strong>시작 요금</strong>만 같은 날 모았습니다. 퀵서비스다는 다섯 항목 모두에서 시작 요금이 가장 낮았고, 요금을 올리는 조건도 미리 공개합니다.</p>
    </div>
    <div class="cp-wrap">
      <div class="cp-tabs" role="tablist" aria-label="비교 항목">${sets.map((s, i) => `<button role="tab" type="button" id="cpt-${s.id}" aria-controls="cpp-${s.id}" aria-selected="${i ? 'false' : 'true'}"${i ? ' tabindex="-1"' : ''}>${s.label}</button>`).join('')}</div>
      ${sets.map((s, i) => {
        const all = [{ k: '퀵서비스다', v: s.ours, me: true }, ...s.others];
        const max = Math.max(...all.map(x => x.v));
        const a = avg(s.others.map(o => o.v));
        const diff = Math.round((1 - s.ours / a) * 100);
        return `<div class="cp-panel" role="tabpanel" id="cpp-${s.id}" aria-labelledby="cpt-${s.id}"${i ? ' hidden' : ''}>
        <div class="cp-sum"><div><span>퀵서비스다</span><strong>${won(s.ours)}~</strong></div><div><span>비교 업체 평균</span><strong>${won(a)}</strong></div><div class="cp-diff"><span>평균보다</span><strong>${diff}% 낮음</strong></div></div>
        <ul class="bars" aria-label="${s.label} ${s.unit} 비교">${all.map(x => `<li class="${x.me ? 'me' : ''}"><span class="bars-k">${x.k}</span><span class="bars-t"><i style="--w:${(x.v / max) * 100}%"></i></span><span class="bars-v">${won(x.v)}${x.f ? `<small>${x.f}</small>` : ''}</span></li>`).join('')}</ul>
      </div>`; }).join('')}
      <p class="cp-note">${ico('info', 'ico-s')}${MARKET.note} 자료: 각 사 홈페이지 공개 요금표(업체명 비공개).</p>
    </div>
    <div class="cl">
      <h3 class="h-sub h-sub-light">비교할 때 꼭 확인할 일곱 가지</h3>
      <div class="cl-grid">${CHECKLIST.map((c, i) => `<div class="cl-item reveal" style="--d:${i * 50}ms">${ico('check', 'cl-ico')}<div><strong>${c.k}</strong><p>${c.v}</p></div></div>`).join('')}</div>
    </div>
  </div>
</section>`;
}

function intercityBand(u) {
  return `<section class="sec" id="intercity" aria-labelledby="icTitle">
  <div class="wrap ic-grid">
    <div class="ic-copy">
      <p class="eyebrow">지방 당일 배송</p>
      <h2 id="icTitle">부산·광주·제주도<br>오늘 안에 받습니다</h2>
      <p class="sec-lead">작은 짐 하나를 지방으로 보내려고 화물차를 통째로 부를 필요는 없습니다. 기사가 문 앞에서 받아 KTX·고속버스·항공에 싣고, 도착지 협약 업체가 받는 분 주소까지 전합니다.</p>
      <div class="ic-tabs" role="tablist" aria-label="연계 수단">${INTERCITY.map((m, i) => `<button role="tab" type="button" data-mode="${m.id}" aria-selected="${i ? 'false' : 'true'}"${i ? ' tabindex="-1"' : ''}>${ico(m.id === 'ktx' ? 'rail' : m.id === 'bus' ? 'bus' : 'plane')}${m.short}</button>`).join('')}</div>
      ${INTERCITY.map((m, i) => `<div class="ic-panel" data-panel="${m.id}"${i ? ' hidden' : ''}>
        <dl class="ic-dl"><div><dt>도착</dt><dd>최대 ${m.hours}시간 이내</dd></div><div><dt>시작 요금</dt><dd>${won(m.from)}~</dd></div><div><dt>구간</dt><dd>${m.routes}</dd></div></dl>
        <p class="muted">접수 때 확인: ${m.check}</p>
      </div>`).join('')}
      <a class="link-arrow" href="${u('services/intercity/')}">연계배송 자세히${ico('arrow', 'ico-s')}</a>
    </div>
    <div class="ic-map" data-mode="ktx">${koreaMap(INTERCITY)}</div>
  </div>
</section>`;
}

function business() {
  return `<section class="biz" aria-labelledby="bizTitle">
  <div class="wrap biz-in">
    <div>
      <p class="eyebrow eyebrow-light">기업 고객</p>
      <h2 id="bizTitle">한 달에 50만 원 이상 쓰신다면,<br>월 정산이 편합니다</h2>
      <p>원하는 날짜에 한 달 이용액을 모아 한 번에 정산하고 세금계산서를 받습니다. 서울·수도권 오토바이·다마스·1톤 당일 배송부터 제주를 포함한 전국 당일 배송까지 같은 조건입니다.</p>
    </div>
    <div class="biz-act">
      <button class="btn btn-signal btn-lg" type="button" data-open="drawerBiz">월 정산 조건 보기${ico('arrow')}</button>
      <ul><li>${ico('building', 'ico-s')}법인·개인사업자·외국계 기업</li><li>${ico('receipt', 'ico-s')}세금계산서 발행</li><li>${ico('calendar', 'ico-s')}정산일 지정</li></ul>
    </div>
  </div>
</section>`;
}

function faqSec(u) {
  const faqs = FAQ.filter(f => f.pages.includes('home'));
  const cats = FAQ_CATS.filter(c => c.id === 'all' || faqs.some(f => f.cat === c.id));
  return `<section class="sec" id="faq" aria-labelledby="faqTitle">
  <div class="wrap faq-grid">
    <div class="sec-hd sec-hd-left">
      <p class="eyebrow">자주 묻는 질문</p>
      <h2 id="faqTitle">접수 전에 많이 물어보시는 것</h2>
      <p class="sec-lead">더 궁금한 점은 24시간 ${SITE.phone}로 물어보세요.</p>
      <a class="link-arrow" href="${u('faq/')}">질문 전체 보기${ico('arrow', 'ico-s')}</a>
    </div>
    <div>${faqList(faqs, { id: 'homeFaq', withCats: true, cats })}</div>
  </div>
</section>`;
}

function blogSec(u, posts) {
  if (!posts.length) return '';
  return `<section class="sec sec-soft" id="guide" aria-labelledby="bgTitle">
  <div class="wrap">
    <div class="sec-hd sec-hd-row">
      <div><p class="eyebrow">물류 가이드</p><h2 id="bgTitle">보내기 전에 읽어 두면 좋은 글</h2></div>
      <a class="link-arrow" href="${u('blog/')}">전체 글${ico('arrow', 'ico-s')}</a>
    </div>
    <div class="post-grid">${posts.slice(0, 3).map(p => postCard(p, u)).join('')}</div>
  </div>
</section>`;
}

export function postCard(p, u) {
  return `<article class="post-card reveal">
  <a href="${u('blog/' + p.slug + '/')}">
    <div class="pc-cover" data-cat="${esc(p.category)}"><span>${esc(p.category)}</span>${ico(catIcon(p.category), 'pc-ico')}</div>
    <div class="pc-body"><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p><span class="pc-meta"><time datetime="${p.date}">${kdate(p.date)}</time> · ${p.minutes}분</span></div>
  </a>
</article>`;
}
export const catIcon = c => ({ '요금 가이드': 'receipt', '보내는 방법': 'route', '차량·화물': 'truck', '지방·연계배송': 'rail', '기업 물류': 'building' }[c] || 'box');

export function homeBody(u, posts) {
  return [hero(u), sequence(), services(u), fleet(u), reviews(), pricing(u), compare(u), intercityBand(u), business(), faqSec(u), blogSec(u, posts), ctaBand(u)].join('\n') + serviceDrawers(u);
}
