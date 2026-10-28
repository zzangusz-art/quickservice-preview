/* 퀵서비스다 — 인터랙션: 모달·드로어·토스트·아코디언·탭·스켈레톤·스크롤 시퀀스·히어로 관제망·차량 추천 */
(() => {
  'use strict';
  const d = document, html = d.documentElement;
  html.classList.add('js');
  const $ = (s, r = d) => r.querySelector(s);
  const $$ = (s, r = d) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const KAKAO = 'https://pf.kakao.com/_xkHCqb/chat';
  const TEL = '1661-7462';
  const trackEv = (name, p) => { if (window.qsTrack) window.qsTrack(name, p); }; // 방문 분석(맨 아래 「방문 분석 이벤트」)

  // ── 토스트 ──────────────────────────────────────
  const toastBox = $('#toasts');
  function toast(msg, type = 'ok', ms = 2800) {
    if (!toastBox) return;
    const t = d.createElement('div');
    t.className = 'toast toast-' + type;
    t.innerHTML = `<svg class="ico" aria-hidden="true"><use href="#i-${type === 'ok' ? 'check' : 'info'}"/></svg><span></span>`;
    t.querySelector('span').textContent = msg;
    toastBox.appendChild(t);
    requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('show')));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 350); }, ms);
  }
  window.qsToast = toast;

  async function copy(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) {
      const ta = d.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0';
      d.body.appendChild(ta); ta.select();
      let ok = false; try { ok = d.execCommand('copy'); } catch (_) { /* 무시 */ }
      ta.remove(); return ok;
    }
  }

  // ── 레이어(모달·드로어): 포커스 가두기, Esc, 바깥 클릭 ──────────
  const stack = [];
  const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';
  function openLayer(id, opener) {
    const el = d.getElementById(id);
    if (!el || stack.includes(el)) return;
    clearTimeout(el._hideT);  // 닫히는 중에 다시 열면 숨김 예약을 취소
    el._opener = opener || d.activeElement;
    el.hidden = false;
    stack.push(el);
    d.body.classList.add('locked');
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('open')));
    const first = $$(FOCUSABLE, el).find(x => x.offsetParent !== null && !x.closest('[hidden]') && !x.hasAttribute('data-close'))
      || $('[data-close]:not(.modal-scrim):not(.drawer-scrim)', el);
    setTimeout(() => first && first.focus({ preventScroll: true }), 60);
    $$(`[aria-controls="${id}"]`).forEach(b => b.setAttribute('aria-expanded', 'true'));
  }
  function closeLayer(el) {
    if (!el) return;
    el.classList.remove('open');
    stack.splice(stack.indexOf(el), 1);
    $$(`[aria-controls="${el.id}"]`).forEach(b => b.setAttribute('aria-expanded', 'false'));
    el._hideT = setTimeout(() => { if (!stack.includes(el)) el.hidden = true; if (!stack.length) d.body.classList.remove('locked'); }, reduce ? 0 : 380);
    if (el._opener && el._opener.focus) el._opener.focus({ preventScroll: true });
  }
  d.addEventListener('click', e => {
    const op = e.target.closest('[data-open]');
    if (op) { e.preventDefault(); const top = stack[stack.length - 1]; if (top && op.closest('.drawer,.modal') === top && top.id !== op.dataset.open) closeLayer(top); openLayer(op.dataset.open, op); return; }
    const cl = e.target.closest('[data-close]');
    if (cl) { closeLayer(cl.closest('.modal,.drawer')); return; }
    const lk = e.target.closest('.drawer a[href]');
    if (lk && !lk.target) closeLayer(lk.closest('.drawer'));
  });
  d.addEventListener('keydown', e => {
    const top = stack[stack.length - 1];
    if (!top) return;
    if (e.key === 'Escape') { e.preventDefault(); closeLayer(top); return; }
    if (e.key !== 'Tab') return;
    const f = $$(FOCUSABLE, top).filter(x => x.offsetParent !== null && !x.closest('[hidden]'));
    if (!f.length) return;
    const a = f[0], z = f[f.length - 1];
    if (e.shiftKey && d.activeElement === a) { e.preventDefault(); z.focus(); }
    else if (!e.shiftKey && d.activeElement === z) { e.preventDefault(); a.focus(); }
  });

  // 안내 모달(내용은 여기서 채운다)
  const INFO = {
    review: {
      t: '후기 남기는 곳',
      b: `<p>이용해 보신 경험을 남겨 주시면 다른 분들이 업체를 고를 때 큰 도움이 됩니다. 좋았던 점도, 아쉬웠던 점도 그대로 적어 주세요.</p>
      <p><a class="btn btn-dark" href="https://www.daangn.com/kr/local-profile/1661-7462-5iys719cqyib/" target="_blank" rel="noopener">당근 동네업체 후기</a><a class="btn btn-line" href="${KAKAO}" target="_blank" rel="noopener">카카오톡 채널로 보내기</a></p>
      <p class="muted">홈페이지의 후기는 공개된 글을 원문 그대로 옮기며, 내용을 고치거나 골라 쓰지 않습니다.</p>`,
    },
  };
  d.addEventListener('click', e => {
    const b = e.target.closest('[data-info]');
    if (!b) return;
    const c = INFO[b.dataset.info]; if (!c) return;
    $('#miTitle').textContent = c.t; $('#miBody').innerHTML = c.b;
    openLayer('modalInfo', b);
  });

  // ── 복사 ──
  d.addEventListener('click', async e => {
    const b = e.target.closest('[data-copy]');
    if (!b) return;
    const ok = await copy(b.dataset.copy);
    toast(ok ? (b.dataset.copyMsg || '복사했습니다') : '복사하지 못했습니다. 길게 눌러 직접 복사해 주세요', ok ? 'ok' : 'info');
  });

  // ── 아코디언 ──────────────────────────────────────
  $$('.acc-panel').forEach(p => {
    const btn = d.querySelector(`[aria-controls="${p.id}"]`);
    const item = p.closest('.acc-item, .dm-group');
    const open = btn && btn.getAttribute('aria-expanded') === 'true';
    p.hidden = false;
    if (item) item.classList.toggle('open', open);
  });
  d.addEventListener('click', e => {
    const b = e.target.closest('.acc-btn');
    if (!b) return;
    const item = b.closest('.acc-item, .dm-group');
    const open = !item.classList.contains('open');
    item.classList.toggle('open', open);
    b.setAttribute('aria-expanded', String(open));
  });

  // ── 탭(가로 화살표 이동 지원) ─────────────────────────
  function selectTab(tab) {
    const list = tab.closest('[role="tablist"]');
    $$('[role="tab"]', list).forEach(t => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1;
      const pid = t.getAttribute('aria-controls'); const p = pid && d.getElementById(pid);
      if (p) { p.hidden = !on; if (on) { p.classList.remove('in'); requestAnimationFrame(() => requestAnimationFrame(() => p.classList.add('in'))); } }
    });
    // 연계 지도 탭
    if (tab.dataset.mode) {
      const sec = tab.closest('section');
      const m = tab.dataset.mode;
      $$('.ic-panel', sec).forEach(p => { p.hidden = p.dataset.panel !== m; });
      const map = $('.ic-map', sec);
      if (map) { map.dataset.mode = m; $$('.km-city', map).forEach(c => c.classList.toggle('on', c.dataset.modes.split(' ').includes(m))); }
    }
  }
  d.addEventListener('click', e => { const t = e.target.closest('[role="tab"]'); if (t) selectTab(t); });
  d.addEventListener('keydown', e => {
    const t = e.target.closest('[role="tab"]');
    if (!t || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    const tabs = $$('[role="tab"]', t.closest('[role="tablist"]'));
    let i = tabs.indexOf(t);
    i = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    e.preventDefault(); tabs[i].focus(); selectTab(tabs[i]);
  });
  // 지도 허브 깜박임은 화면에 보일 때만
  $$('.ic-map').forEach(m => new IntersectionObserver(es => es.forEach(en => m.classList.toggle('live', en.isIntersecting))).observe(m));
  $$('.ic-map').forEach(map => $$('.km-city', map).forEach(c => c.classList.toggle('on', c.dataset.modes.split(' ').includes(map.dataset.mode))));

  // ── 헤더 · 드롭다운 · 맨 위로 ─────────────────────────
  const hd = $('#hd'), totop = $('.totop');
  let lastY = 0;
  const small = matchMedia('(max-width: 1023px)');
  function onScrollHeader() {
    const y = scrollY;
    hd && hd.classList.toggle('scrolled', y > 8);
    // 모바일: 내려 읽을 때는 헤더를 숨겨 화면을 넓게, 조금이라도 올리면 다시 보이기(하단 바에 전화·문의가 있음)
    if (hd && small.matches && !d.body.classList.contains('locked')) {
      if (y > 240 && y > lastY + 6) hd.classList.add('hd-hide');
      else if (y < lastY - 6 || y <= 240) hd.classList.remove('hd-hide');
    } else if (hd) hd.classList.remove('hd-hide');
    totop && totop.classList.toggle('show', y > 900);
    lastY = y;
  }
  addEventListener('scroll', onScrollHeader, { passive: true }); onScrollHeader();
  totop && totop.addEventListener('click', () => scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));
  $$('.has-sub').forEach(li => {
    const b = $('.nav-sub-btn', li);
    const set = v => { li.classList.toggle('open', v); b.setAttribute('aria-expanded', String(v)); };
    b.addEventListener('click', () => set(!li.classList.contains('open')));
    li.addEventListener('mouseenter', () => matchMedia('(hover:hover)').matches && set(true));
    li.addEventListener('mouseleave', () => matchMedia('(hover:hover)').matches && set(false));
    d.addEventListener('click', e => { if (!li.contains(e.target)) set(false); });
    li.addEventListener('keydown', e => { if (e.key === 'Escape') { set(false); b.focus(); } });
  });

  // ── 등장 효과 · 숫자 올리기 ───────────────────────────
  const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -8% 0px' });
  $$('.reveal, .rv-tags, .cp-panel:not([hidden])').forEach(el => io.observe(el));
  const fmt = n => Math.round(n).toLocaleString('ko-KR');
  const cio = new IntersectionObserver(es => es.forEach(en => {
    if (!en.isIntersecting) return;
    cio.unobserve(en.target);
    const el = en.target, to = +el.dataset.count;
    if (reduce) { el.textContent = fmt(to); return; }
    const t0 = performance.now(), dur = 1200;
    const step = t => { const k = clamp((t - t0) / dur); el.textContent = fmt(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }), { threshold: .6 });
  $$('[data-count]').forEach(el => cio.observe(el));

  // ── 히어로: 빠른 접수 → 요금 문의 모달로 이어 쓰기 ─────────
  const qb = $('#quickBook');
  if (qb) qb.addEventListener('submit', e => {
    e.preventDefault();
    const from = qb.elements.from, to = qb.elements.to;
    let bad = null;
    [from, to].forEach(inp => { const v = inp.value.trim(); inp.setAttribute('aria-invalid', v ? 'false' : 'true'); if (!v && !bad) bad = inp; });
    if (bad) { bad.focus(); toast('출발지와 도착지 동 이름을 적어 주세요', 'info'); return; }
    const qf2 = $('#quoteForm');
    qf2.elements.from.value = from.value.trim();
    qf2.elements.to.value = to.value.trim();
    $$('input[name=item]', qf2).forEach(r => { r.checked = r.value === qb.querySelector('[name=item]').value; });
    const when = (qb.querySelector('input[name=when]:checked') || {}).value;
    if (when) [...qf2.elements.when.options].forEach(o => { o.selected = o.text === when; });
    $('#quoteDone').hidden = true; qf2.hidden = false;
    openLayer('modalQuote', qb.querySelector('button[type=submit]'));
    trackEv('quick_book', { item: qb.querySelector('[name=item]').value, when: when || '' });
    setTimeout(() => qf2.elements.weight.focus({ preventScroll: true }), 120);
    toast('출발·도착을 옮겨 적었습니다. 무게만 고르면 접수 글이 완성됩니다', 'ok', 3200);
  });

  // ── 히어로 벤토: 타일 위에서 마우스를 따라오는 스포트라이트 ─────
  const bento = $('#bento');
  if (bento && !reduce && matchMedia('(hover: hover)').matches) {
    bento.addEventListener('pointermove', e => {
      const t = e.target.closest('.bt');
      if (!t) return;
      const r = t.getBoundingClientRect();
      t.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      t.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { passive: true });
  }

  // ── 사진 썸네일: 로딩 중엔 스켈레톤, 다 받으면 보이기 ─────────
  function watchImgs(root = d) {
    $$('.pc-cover img', root).forEach(img => {
      const done = () => img.closest('.pc-cover').classList.add('is-loaded');
      if (img.complete) done(); else { img.addEventListener('load', done, { once: true }); img.addEventListener('error', done, { once: true }); }
    });
  }
  watchImgs();

  // ── 차량 제원 카드: 일반 카고 / 탑차·윙바디 전환 ───────────
  d.addEventListener('click', e => {
    const b = e.target.closest('.vtabs button');
    if (!b) return;
    const card = b.closest('[data-vcard]'), v = b.dataset.v;
    $$('.vtabs button', card).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    $$('[data-variant]', card).forEach(el => { el.hidden = el.dataset.variant !== v; });
  });

  // ── 보내는 과정: 자동으로 천천히 넘어가는 실제 지도 내비 ─────────
  // 단계별 시간(ms): 접수·차량 결정·배차·운송·도착. 운송 단계에서 실제 도로 경로(assets/data/route.json)를 따라 이동한다.
  const seq = $('.seq'), navi = $('#navi');
  if (seq && navi) {
    html.classList.add('js-seq');
    const DUR = [4000, 4000, 5000, 20000, 5000], HOLD = 1500, N = DUR.length;
    const START_AT = DUR.map((_, i) => DUR.slice(0, i).reduce((a, b) => a + b, 0));
    const TOTAL = DUR.reduce((a, b) => a + b, 0);
    const LEAD = 1800, ZOOM = 14.6, PITCH = 55;
    const TRIP_MIN = 35;  // 화면 예상 시간: 경로 데이터(OSRM)는 막힘 없는 승용차 기준이라 짧다. 사이트 안내(근거리 30~50분)에 맞춘 예시값
    const DRIVE_PAD = () => ({ top: navi.clientHeight * .38, bottom: 30, left: 0, right: 0 }); // 차를 화면 아래쪽에 두어 앞길이 보이게
    const MAPLIBRE = 'https://cdnjs.cloudflare.com/ajax/libs/maplibre-gl/4.7.1/maplibre-gl.min';
    const STYLE = 'https://tiles.openfreemap.org/styles/liberty';
    const steps = $$('.seq-step', seq), segs = $$('.seq-bar b', seq), playBtn = $('#seqPlay');
    const byId = id => d.getElementById(id);
    const ntIcon = byId('ntIcon'), ntDist = byId('ntDist'), ntText = byId('ntText'), ntNext = byId('ntNext');
    const card = byId('naviCard'), ncChip = byId('ncChip'), ncTitle = byId('ncTitle'), ncSub = byId('ncSub'), ncVeh = byId('ncVeh');
    const nbEta = byId('nbEta'), nbTime = byId('nbTime'), nbDist = byId('nbDist');
    const ARROW = {
      straight: '<path d="M12 21V4M6 10l6-6 6 6"/>',
      right: '<path d="M7 21v-8a4 4 0 0 1 4-4h9M16 5l4 4-4 4"/>',
      left: '<path d="M17 21v-8a4 4 0 0 0-4-4H4M8 5L4 9l4 4"/>',
      'slight right': '<path d="M9 21v-7l8-9M11 5h6v6"/>',
      'slight left': '<path d="M15 21v-7L7 5M13 5H7v6"/>',
      'sharp right': '<path d="M7 21V9l10 9M17 11v7h-7"/>',
      'sharp left': '<path d="M17 21V9L7 18M7 11v7h7"/>',
      uturn: '<path d="M8 21V9a4 4 0 0 1 8 0v5M12 11l4 4 4-4"/>',
      arrive: '<path d="M6 21V4M6 4h11l-2.5 4L17 12H6"/>',
    };
    const fmtD = m => m < 1000 ? `${Math.max(10, Math.round(m / 10) * 10)}m` : `${(m / 1000).toFixed(1)}km`;
    const clock = min => new Intl.DateTimeFormat('ko-KR', { hour: 'numeric', minute: '2-digit' }).format(new Date(Date.now() + min * 60000));
    const ease = x => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
    // 운송 구간: 앞뒤 15%만 가감속하고 나머지는 같은 속도로 달린다(중간에 급히 빨라지지 않게)
    const cruise = (x, a = .15) => { const v = 1 / (1 - a); return x < a ? .5 * v / a * x * x : x > 1 - a ? 1 - .5 * v / a * (1 - x) * (1 - x) : .5 * v * a + v * (x - a); };
    const toRad = Math.PI / 180;
    const bearing = (a, b) => { const y = Math.sin((b[0] - a[0]) * toRad) * Math.cos(b[1] * toRad), x = Math.cos(a[1] * toRad) * Math.sin(b[1] * toRad) - Math.sin(a[1] * toRad) * Math.cos(b[1] * toRad) * Math.cos((b[0] - a[0]) * toRad); return (Math.atan2(y, x) / toRad + 360) % 360; };
    const turnBy = (from, to) => ((to - from + 540) % 360) - 180;

    let R = null, map = null, mapReady = false, carMk = null, carEl = null;
    let t = 0, cur = -1, camB = 0, following = false;
    let playing = !reduce, hovering = false, visible = false, raf = 0, last = 0;

    function posAt(dist) {
      const c = R.cum, xs = R.coords, n = c.length - 1;
      if (dist <= 0) return { p: xs[0], i: 0 };
      if (dist >= c[n]) return { p: xs[n], i: n - 1 };
      let lo = 0, hi = n;
      while (hi - lo > 1) { const m = (lo + hi) >> 1; if (c[m] <= dist) lo = m; else hi = m; }
      const k = (dist - c[lo]) / (c[hi] - c[lo] || 1);
      return { p: [xs[lo][0] + (xs[hi][0] - xs[lo][0]) * k, xs[lo][1] + (xs[hi][1] - xs[lo][1]) * k], i: lo };
    }
    const headAt = dist => bearing(posAt(Math.max(0, dist - 20)).p, posAt(dist + 220).p);
    const line = cs => ({ type: 'Feature', geometry: { type: 'LineString', coordinates: cs.length > 1 ? cs : [R.coords[0], R.coords[0]] } });
    // 경로선은 한 번만 넣고, 지나온 구간(회색)·남은 구간(파랑)의 경계만 line-progress 로 바꾼다
    let lastF = -1;
    const grad = (f, a, b) => f <= 0 ? b : f >= 1 ? a : ['step', ['line-progress'], a, f, b];
    function setRoute(dist) {
      if (!mapReady) return;
      const f = Math.round(Math.max(0, Math.min(1, dist / R.cum[R.cum.length - 1])) * 4000) / 4000;
      if (f === lastF) return; lastF = f;
      map.setPaintProperty('route-casing', 'line-gradient', grad(f, '#7D8FA3', '#0A5BA8'));
      map.setPaintProperty('route-line', 'line-gradient', grad(f, '#B4C3D2', '#1FA3E0'));
    }
    function setCar(p, deg, show = true) {
      if (!carMk) return;
      carEl.style.visibility = show ? 'visible' : 'hidden';
      carMk.setLngLat(p).setRotation(deg);
    }
    function overview(dur) {
      if (!mapReady) return;
      following = false;
      const xs = R.coords.map(c => c[0]), ys = R.coords.map(c => c[1]);
      map.setPadding({ top: 0, right: 0, bottom: 0, left: 0 });
      const H = navi.clientHeight, small = navi.clientWidth < 480;
      const bottom = Math.min(H * .62, H - card.offsetTop + 14);  // 단계 카드 위쪽에만 경로가 오도록
      map.fitBounds([[Math.min(...xs), Math.min(...ys)], [Math.max(...xs), Math.max(...ys)]], { padding: { top: 86, bottom, left: small ? 34 : 50, right: small ? 34 : 50 }, bearing: 0, pitch: 0, duration: reduce ? 0 : dur });
    }

    const CARDS = () => [
      { chip: '접수 완료', title: `${R ? R.from.name : '장안동'} → ${R ? R.to.name : '역삼동'}`, sub: '상자 3개 · 약 40kg · 지금 바로', veh: false },
      { chip: '차량 확정', title: '다마스로 배차합니다', sub: '오토바이 기준(25kg)을 넘어 350kg 미만 다마스로', veh: true },
      { chip: '배차 완료', title: '가까운 기사를 배정했습니다', sub: '픽업까지 8분', veh: false },
      null,
      { chip: '배송 완료', title: '받는 분께 전달했습니다', sub: '카드 결제 완료 · 세금계산서 발행 가능', veh: false, done: true },
    ];
    function enterStep(s) {
      cur = s;
      steps.forEach((el, i) => { el.classList.toggle('on', i === s); const b = $('.seq-head', el); if (i === s) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
      navi.classList.toggle('driving', s === 3);
      const c = CARDS()[s];
      if (c) {
        ncChip.textContent = c.chip; ncChip.classList.toggle('done', !!c.done);
        ncTitle.textContent = c.title; ncSub.textContent = c.sub;
        ncVeh.classList.toggle('show', c.veh);
        card.classList.remove('swap'); void card.offsetWidth; card.classList.add('swap');
      }
      if (!R) return;
      if (s === 3) {
        following = false;
        if (mapReady) map.easeTo({ center: R.coords[0], zoom: ZOOM, pitch: PITCH, bearing: headAt(0), padding: DRIVE_PAD(), duration: reduce ? 0 : LEAD - 100 });
        camB = headAt(0);
        setTimeout(() => { if (cur === 3) following = true; }, reduce ? 0 : LEAD);
      } else overview(s === 0 ? 900 : 1400);
    }

    function frame(s, ts, sub) {
      if (!R) return;
      const total = R.cum[R.cum.length - 1];
      if (s === 1) ncVeh.querySelectorAll('span').forEach(x => x.classList.toggle('on', x.dataset.v === 'damas' && sub > .35));
      if (s < 3) {
        nbDist.textContent = fmtD(total); nbTime.textContent = `약 ${TRIP_MIN}분`; nbEta.textContent = s === 2 ? clock(8 + TRIP_MIN) : '—';
        setRoute(0);
        if (s === 2) {
          const k = ease(Math.min(1, sub / .8)), back = 650 * (1 - k);  // 경로 시작점 쪽에서 기사가 다가오는 모습(예시)
          const { p } = posAt(back);
          setCar(p, (headAt(back) + 180) % 360);
          ncSub.textContent = k < 1 ? `픽업까지 ${Math.max(1, Math.ceil(8 * (1 - k)))}분` : '기사가 출발지에 도착했습니다';
        } else setCar(R.coords[0], 0, false);
        return;
      }
      if (s === 3) {
        const prog = cruise(Math.max(0, Math.min(1, (ts - LEAD) / (DUR[3] - LEAD - 500))));
        const dist = prog * total;
        const { p } = posAt(dist), head = headAt(dist);
        setRoute(dist);
        setCar(p, head);
        const nx = R.steps.findIndex(st => st.at > dist + 8);
        const st = R.steps[nx] || R.steps[R.steps.length - 1];
        const icon = ARROW[st.icon] || ARROW.straight;
        if (ntIcon.dataset.k !== st.icon) { ntIcon.innerHTML = icon; ntIcon.dataset.k = st.icon; }
        ntDist.textContent = fmtD(Math.max(0, st.at - dist));
        ntText.textContent = st.text;
        const nn = R.steps[nx + 1];
        ntNext.textContent = nn ? `다음 ${nn.text}` : '';
        const remain = total - dist, mins = Math.max(0, Math.ceil(TRIP_MIN * remain / total));
        nbDist.textContent = remain < 5 ? '0m' : fmtD(remain); nbTime.textContent = mins ? `${mins}분` : '도착'; nbEta.textContent = clock(mins);
        if (following && mapReady) { camB += turnBy(camB, head) * .06; map.jumpTo({ center: p, bearing: camB, zoom: ZOOM, pitch: PITCH, padding: DRIVE_PAD() }); }
        return;
      }
      setRoute(0); setCar(R.coords[R.coords.length - 1], headAt(total));  // 도착 후에는 다녀온 경로 전체를 파랑으로
      nbDist.textContent = '0m'; nbTime.textContent = '도착'; nbEta.textContent = '배송 완료';
    }

    function render() {
      const tt = Math.min(t, TOTAL - 1);
      let s = 0; while (s < N - 1 && tt >= START_AT[s + 1]) s++;
      const ts = tt - START_AT[s], sub = Math.min(1, ts / DUR[s]);
      if (s !== cur) enterStep(s);
      segs.forEach((b, i) => { b.style.width = (i < s ? 100 : i === s ? sub * 100 : 0) + '%'; });
      frame(s, ts, sub);
    }
    function tick(now) {
      const dt = last ? Math.min(100, now - last) : 0; last = now;
      t += dt; if (t >= TOTAL + HOLD) { t = 0; cur = -1; }
      render(); raf = requestAnimationFrame(tick);
    }
    function sync() {
      cancelAnimationFrame(raf); last = 0;
      if (playing && visible && !hovering && !d.hidden) raf = requestAnimationFrame(tick);
    }
    function setPlaying(v) {
      playing = v;
      playBtn.classList.toggle('paused', !v);
      $('.seq-play-t', playBtn).textContent = v ? '일시정지' : '자동 재생';
      playBtn.setAttribute('aria-label', v ? '자동 넘김 일시정지' : '자동 넘김 다시 시작');
      sync();
    }
    playBtn.addEventListener('click', () => setPlaying(!playing));
    steps.forEach((el, i) => $('.seq-head', el).addEventListener('click', () => {
      t = START_AT[i] + (i === 3 ? LEAD + (DUR[3] - LEAD) * .3 : DUR[i] * .55);
      cur = -1; render();
      if (i === 3 && mapReady) { following = true; }
    }));
    const list = $('.seq-steps', seq);
    if (matchMedia('(hover: hover)').matches) {
      list.addEventListener('mouseenter', () => { hovering = true; sync(); });
      list.addEventListener('mouseleave', () => { hovering = false; sync(); });
    }
    seq.addEventListener('focusin', e => { if (e.target.closest('.seq-head')) { hovering = true; sync(); } });
    seq.addEventListener('focusout', () => { hovering = false; sync(); });
    d.addEventListener('visibilitychange', sync);
    new IntersectionObserver(es => es.forEach(en => { visible = en.isIntersecting; sync(); }), { threshold: .3 }).observe(navi);
    if (!playing) setPlaying(false);

    // 경로 데이터 → 지도(화면 근처에 왔을 때만 불러온다)
    fetch(navi.dataset.route).then(r => r.json()).then(data => { R = data; cur = -1; render(); }).catch(() => {});
    function initMap() {
      if (!window.maplibregl || !R) return;
      try {
        map = new maplibregl.Map({
          container: 'naviMap', style: STYLE, interactive: false, attributionControl: false, fadeDuration: 0,
          pixelRatio: Math.min(window.devicePixelRatio || 1, 2),  // 3배 화면 휴대폰에서 GPU 부담 줄이기
          center: R.coords[0], zoom: 12, localIdeographFontFamily: "'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif",
        });
      } catch (e) { return; }
      map.on('load', () => {
        for (const l of map.getStyle().layers) {
          if (l.type === 'symbol' && l.layout && l.layout['text-field']) map.setLayoutProperty(l.id, 'text-field', ['coalesce', ['get', 'name:ko'], ['get', 'name']]);
        }
        const lay = { 'line-join': 'round', 'line-cap': 'round' };
        const w = (a, b) => ['interpolate', ['linear'], ['zoom'], 11, a, 16, b];
        map.addSource('route', { type: 'geojson', data: line(R.coords), lineMetrics: true });
        map.addLayer({ id: 'route-casing', type: 'line', source: 'route', layout: lay, paint: { 'line-gradient': grad(0, '#7D8FA3', '#0A5BA8'), 'line-width': w(7, 16) } });
        map.addLayer({ id: 'route-line', type: 'line', source: 'route', layout: lay, paint: { 'line-gradient': grad(0, '#B4C3D2', '#1FA3E0'), 'line-width': w(4, 10) } });
        const pin = (cls, label) => { const e = d.createElement('div'); e.className = 'nv-pin ' + cls; e.innerHTML = `<b>${label}</b><i></i>`; return e; };
        new maplibregl.Marker({ element: pin('from', `출발 ${R.from.name}`), anchor: 'bottom' }).setLngLat(R.coords[0]).addTo(map);
        new maplibregl.Marker({ element: pin('to', `도착 ${R.to.name}`), anchor: 'bottom' }).setLngLat(R.coords[R.coords.length - 1]).addTo(map);
        carEl = d.createElement('div'); carEl.className = 'nv-car';
        carEl.innerHTML = '<svg viewBox="0 0 30 30"><circle cx="15" cy="15" r="13" fill="#1FA3E0" stroke="#fff" stroke-width="3"/><path d="M15 6.5l6.5 14-6.5-3.6-6.5 3.6z" fill="#fff"/></svg>';
        carMk = new maplibregl.Marker({ element: carEl, rotationAlignment: 'map', pitchAlignment: 'map' }).setLngLat(R.coords[0]).addTo(map);
        mapReady = true; navi.classList.add('ready');
        cur = -1; render();
        if (cur === 3) following = true;
      });
    }
    // 데이터 절약 모드나 2G 연결이면 실제 지도(약 0.6MB)를 받지 않고 그림 지도로 둔다
    const conn = navigator.connection || {};
    const lite = !!conn.saveData || /2g/.test(conn.effectiveType || '');
    let mapAsked = lite;
    new IntersectionObserver((es, ob) => {
      if (!es.some(en => en.isIntersecting) || mapAsked) return;
      mapAsked = true; ob.disconnect();
      const css = d.createElement('link'); css.rel = 'stylesheet'; css.href = MAPLIBRE + '.css'; d.head.appendChild(css);
      const js = d.createElement('script'); js.src = MAPLIBRE + '.js'; js.async = true;
      js.onload = () => { const wait = () => R ? initMap() : setTimeout(wait, 100); wait(); };
      d.head.appendChild(js);
    }, { rootMargin: innerWidth < 768 ? '250px 0px' : '600px 0px' }).observe(navi);
  }

  // ── 차량 가로 시퀀스 ─────────────────────────────────
  const fleet = $('.fleet'), track = $('#fleetTrack');
  if (fleet && track && !reduce) {
    const fbar = $('#fleetBar');
    let dist = 0, enabled = false;
    function setup() {
      const want = innerWidth >= 1024 && innerHeight >= 600;
      html.classList.toggle('js-fleet', want);
      enabled = want;
      track.style.transform = '';
      if (!want) { fleet.style.removeProperty('--fleet-h'); return; }
      dist = Math.max(0, track.scrollWidth - innerWidth);
      fleet.style.setProperty('--fleet-h', (innerHeight + dist + 120) + 'px');
      move();
    }
    function move() {
      if (!enabled) return;
      const r = fleet.getBoundingClientRect();
      const p = clamp(-r.top / (fleet.offsetHeight - innerHeight));
      track.style.transform = `translate3d(${-p * dist}px,0,0)`;
      if (fbar) fbar.style.width = (p * 100).toFixed(1) + '%';
    }
    let tk = false;
    addEventListener('scroll', () => { if (!tk) { tk = true; requestAnimationFrame(() => { move(); tk = false; }); } }, { passive: true });
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(setup, 150); });
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(setup); addEventListener('load', setup); setup();
  }

  // ── 요금 문의 모달 ───────────────────────────────────
  const qf = $('#quoteForm'), qd = $('#quoteDone'), qp = $('#quotePreview');
  let quoteText = '';
  if (qf) {
    qf.addEventListener('submit', e => {
      e.preventDefault();
      const f = new FormData(qf);
      let bad = null;
      ['from', 'to'].forEach(k => { const inp = qf.elements[k]; const v = (f.get(k) || '').trim(); inp.setAttribute('aria-invalid', v ? 'false' : 'true'); if (!v && !bad) bad = inp; });
      if (bad) { bad.focus(); toast('출발지와 도착지 동 이름을 적어 주세요', 'info'); return; }
      const lines = [
        '[퀵서비스다 요금 문의]',
        `출발: ${f.get('from').trim()}`,
        `도착: ${f.get('to').trim()}`,
        `물건: ${f.get('item')} (${f.get('weight')})`,
        `시간: ${f.get('when')}`,
        f.get('round') ? '왕복: 예' : null,
        (f.get('memo') || '').trim() ? `메모: ${f.get('memo').trim()}` : null,
      ].filter(Boolean);
      quoteText = lines.join('\n');
      qp.textContent = quoteText;
      qf.hidden = true; qd.hidden = false;
      $('[data-copy-quote]', qd).focus();
      trackEv('quote_submit', { item: f.get('item'), weight: f.get('weight'), when: f.get('when'), round: f.get('round') ? 'yes' : 'no' });
    });
    d.addEventListener('click', async e => {
      if (e.target.closest('[data-copy-quote]')) {
        const ok = await copy(quoteText);
        trackEv('quote_kakao', { copied: ok ? 'yes' : 'no' });
        toast(ok ? '문의 내용을 복사했습니다. 카카오톡 채팅창에 붙여 넣어 주세요' : '복사하지 못했습니다. 내용을 길게 눌러 복사해 주세요', ok ? 'ok' : 'info', 3600);
        window.open(KAKAO, '_blank', 'noopener');
      }
      if (e.target.closest('[data-quote-back]')) { qd.hidden = true; qf.hidden = false; qf.elements.from.focus(); }
    });
  }

  // ── FAQ 분류 ──
  d.addEventListener('click', e => {
    const c = e.target.closest('[data-faq-cat]');
    if (!c) return;
    const bar = c.parentElement, list = bar.nextElementSibling;
    $$('.chip', bar).forEach(x => { x.classList.toggle('on', x === c); x.setAttribute('aria-pressed', String(x === c)); });
    $$('.acc-item', list).forEach(it => it.classList.toggle('is-hidden', c.dataset.faqCat !== 'all' && it.dataset.cat !== c.dataset.faqCat));
  });

  // ── 블로그 목록: 분류, 더 보기(스켈레톤) ─────────────────
  const grid = $('#postGrid'), more = $('#moreBtn');
  const escH = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const kd = s => s.replace(/-/g, '.');
  let allPosts = null, shown = grid ? $$('.post-card', grid).length : 0, curCat = 'all';
  const card = p => `<article class="post-card reveal in" data-cat="${escH(p.category)}"><a href="${escH(p.slug)}/"><div class="pc-cover${p.img.fit === 'cover' ? ' fit-cover' : ''}"><img src="${escH(p.img.src)}" alt="${escH(p.img.alt)}" width="${p.img.w}" height="${p.img.h}" loading="lazy" decoding="async"><span class="pc-cat">${escH(p.category)}</span></div><div class="pc-body"><h3>${escH(p.title)}</h3><p>${escH(p.description)}</p><span class="pc-meta"><time datetime="${p.date}">${kd(p.date)}</time> · ${p.minutes}분</span></div></a></article>`;
  const skel = n => Array.from({ length: n }, () => '<div class="post-skel" aria-hidden="true"><div class="skel skel-cover"></div><div class="skel-body"><div class="skel skel-line h20 w80"></div><div class="skel skel-line"></div><div class="skel skel-line w60"></div><div class="skel skel-line w40"></div></div></div>').join('');
  async function loadAll() {
    if (allPosts) return allPosts;
    grid.insertAdjacentHTML('beforeend', skel(3));
    grid.setAttribute('aria-busy', 'true');
    try {
      const [res] = await Promise.all([fetch(more ? more.dataset.src : 'posts.json'), new Promise(r => setTimeout(r, 450))]);
      allPosts = await res.json();
    } catch (e) { toast('글 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요', 'info'); allPosts = null; }
    $$('.post-skel', grid).forEach(s => s.remove());
    grid.removeAttribute('aria-busy');
    return allPosts;
  }
  function renderFiltered() {
    const list = allPosts.filter(p => curCat === 'all' || p.category === curCat);
    grid.innerHTML = list.slice(0, shown).map(card).join('');
    watchImgs(grid);
    if (more) more.parentElement.hidden = list.length <= shown;
  }
  if (more && grid) more.addEventListener('click', async () => {
    more.disabled = true;
    if (!(await loadAll())) { more.disabled = false; return; }
    shown += 9; renderFiltered(); more.disabled = false;
    toast(`글 ${Math.min(shown, allPosts.length)}편을 보고 있습니다`, 'ok', 1800);
  });
  d.addEventListener('click', async e => {
    const c = e.target.closest('[data-blog-cat]');
    if (!c || !grid) return;
    $$('[data-blog-cat]').forEach(x => { x.classList.toggle('on', x === c); x.setAttribute('aria-pressed', String(x === c)); });
    curCat = c.dataset.blogCat;
    if (!allPosts && more) { if (!(await loadAll())) return; }
    if (allPosts) { shown = Math.max(shown, 9); renderFiltered(); }
    else $$('.post-card', grid).forEach(pc => pc.classList.toggle('is-hidden', curCat !== 'all' && pc.dataset.cat !== curCat));
  });

  // ── 차량 추천 ────────────────────────────────────────
  const rf = $('#recForm'), ro = $('#recOut'), rdEl = $('#recData');
  if (rf && ro && rdEl) {
    const RD = JSON.parse(rdEl.textContent);
    rf.addEventListener('submit', e => {
      e.preventDefault();
      const g = n => Number(rf.elements[n].value) || 0;
      const long = g('long'), sum = g('sum'), kg = g('kg');
      const need = { rain: rf.elements.rain.checked, pallet: rf.elements.pallet.checked, lift: rf.elements.lift.checked, cold: rf.elements.cold.checked };
      let bad = null;
      [['long', long], ['kg', kg]].forEach(([k, v]) => { rf.elements[k].setAttribute('aria-invalid', v > 0 ? 'false' : 'true'); if (!(v > 0) && !bad) bad = rf.elements[k]; });
      if (bad) { bad.focus(); toast('가장 긴 변과 무게를 숫자로 넣어 주세요', 'info'); return; }
      ro.setAttribute('aria-busy', 'true');
      ro.innerHTML = '<div class="rec-skel" aria-hidden="true"><div class="skel skel-veh"></div><div class="skel skel-line h20 w40"></div><div class="skel skel-line w80"></div><div class="skel skel-line w60"></div></div>';
      const picked = pick(long, sum, kg, need);
      trackEv('vehicle_recommend', { vehicle: picked.name, kg, long });
      setTimeout(() => { ro.innerHTML = result(picked); ro.removeAttribute('aria-busy'); }, reduce ? 0 : 650);
    });
    function pick(long, sum, kg, need) {
      const why = [];
      const fitsMoto = kg <= 25 && long <= 150 && (sum ? sum <= 150 : long <= 60);
      if (fitsMoto && !need.pallet && !need.cold && !need.lift) {
        why.push(`무게 ${kg}kg, ${sum ? `세 변 합 ${sum}cm` : `가장 긴 변 ${long}cm`} — 오토바이 기준(세 변 합 150cm·25kg) 안에 들어갑니다.`);
        if (sum && sum > 100) why.push('라면 상자(세 변 합 약 1m)보다 커서 과적 요금 5,000원이 붙을 수 있습니다.');
        if (!sum) why.push('세 변의 합을 함께 넣으면 더 정확하게 확인할 수 있습니다.');
        if (need.rain) why.push('비가 오면 방수 포장을 권합니다. 젖으면 안 되는 물건은 다마스도 고려하세요.');
        return { id: 'moto', name: '오토바이 퀵', tag: '8,000원부터', why };
      }
      if (kg < 350 && long <= 180 && !need.pallet && !need.cold && !need.lift) {
        why.push(`${kg}kg — 다마스 적재 한도(350kg 미만) 안입니다.`);
        if (kg <= 25) why.push('무게는 오토바이 기준이지만 크기가 커서 다마스로 보냅니다.');
        why.push('지붕이 있는 밴이라 비·눈에도 물건이 젖지 않습니다.');
        return { id: 'damas', name: '다마스', tag: '20,000원부터', why };
      }
      if (kg < 450 && long <= 220 && !need.rain && !need.pallet && !need.cold && !need.lift) {
        why.push(`${kg}kg — 라보 적재 한도(450kg 미만) 안입니다.`);
        why.push('적재함이 열린 소형 트럭이라 길거나 높은 물건을 싣기 좋습니다.');
        return { id: 'labo', name: '라보', tag: '오토바이 기본요금 + 15,000원', why };
      }
      const t = RD.trucks.find(x => x.cap >= kg && x.lenMax >= long);
      if (t) {
        why.push(`가장 긴 변 ${long}cm, 무게 ${kg.toLocaleString()}kg — ${t.ton} 적재함(길이 ${t.lenLabel}cm, 폭 ${t.w}cm)에 맞습니다.`);
        const body = need.cold ? '냉동탑차' : need.pallet ? '윙바디' : need.lift ? '리프트' : need.rain ? '탑차' : '카고';
        if (need.cold) why.push('냉장·냉동 화물은 냉동기가 달린 냉동탑차로 배차합니다.');
        if (need.pallet) why.push('지게차로 파레트를 싣고 내리려면 옆면이 열리는 윙바디가 편합니다.');
        if (need.lift) why.push('상하차 인력이 없으면 100~500kg을 들어 올리는 리프트(파워게이트) 차량이 맞습니다.');
        if (need.rain && !need.cold) why.push('지붕과 뒷문이 있는 탑차로 비·눈을 막습니다.');
        if (t.id === 't1') why.push('1톤 용달은 40,000원부터입니다.');
        const art = need.cold ? 'cold' : need.lift ? 'lift' : body !== '카고' && t.top ? t.id + '-top' : t.id;
        return { id: art, name: `${t.ton} ${body}`, tag: t.id === 't1' ? '40,000원부터' : '견적 상담', why };
      }
      if (long <= 1600 && kg <= 27000) {
        why.push('일반 화물차 적재함을 넘는 크기·무게입니다. 츄레라(폭 3.6m, 길이 16m, 27톤, 장재물 허가 차량)로 운송합니다.');
        return { id: 't25t', name: '츄레라·특수 차량', tag: '견적 상담', why };
      }
      why.push('일반 차량 제원을 넘습니다. 허가를 받은 특수 차량으로 운송해야 하니 전화로 화물 정보를 알려 주세요.');
      return { id: 't25t', name: '특수 화물 상담', tag: '전화 상담', why };
    }
    function result(r) {
      const art = d.getElementById('veh-' + r.id);
      return `<div class="rec-res"><span class="rec-tag">${r.tag}</span><h3>${r.name}</h3>${art ? `<div class="rec-photo">${art.innerHTML}</div>` : ''}<ul>${r.why.map(w => `<li>${escH(w)}</li>`).join('')}</ul>
      <p class="muted" style="margin-top:12px">추천은 공개된 적재 기준으로 계산한 참고값입니다. 실제 차량은 상담할 때 확정합니다.</p>
      <div class="mq-actions"><a class="btn btn-signal" href="tel:${TEL.replace(/-/g, '')}"><svg class="ico" aria-hidden="true"><use href="#i-phone"/></svg>${TEL} 확정 문의</a><button class="btn btn-line" type="button" data-open="modalQuote">요금 문의 글 만들기</button></div></div>`;
    }
  }

  // ── 공유 ──
  d.addEventListener('click', async e => {
    if (!e.target.closest('[data-share]')) return;
    const data = { title: d.title, url: location.href };
    if (navigator.share) { try { await navigator.share(data); } catch (_) { /* 취소 */ } return; }
    toast((await copy(location.href)) ? '글 주소를 복사했습니다' : '주소를 복사하지 못했습니다', 'ok');
  });

  // ── 읽기 진행률 · 목차 위치 표시 ──────────────────────
  const rb = $('#readBar'), body = $('.post-body');
  if (rb && body) {
    const upd = () => { const r = body.getBoundingClientRect(); rb.style.width = (clamp((innerHeight * .4 - r.top) / r.height) * 100).toFixed(1) + '%'; };
    addEventListener('scroll', upd, { passive: true }); upd();
  }
  const tocLinks = $$('.post-toc a, .toc-side a');
  if (tocLinks.length) {
    const map = new Map(tocLinks.map(a => [decodeURIComponent(a.hash.slice(1)), a]));
    const tio = new IntersectionObserver(es => es.forEach(en => {
      if (!en.isIntersecting) return;
      tocLinks.forEach(a => a.classList.remove('on'));
      const a = map.get(en.target.id); a && a.classList.add('on');
    }), { rootMargin: '-20% 0px -70% 0px' });
    map.forEach((_, id) => { const t = d.getElementById(id); t && tio.observe(t); });
  }

  // ── 방문 분석 이벤트: 운영 빌드에서 GA4·GTM·네이버 애널리틱스가 켜졌을 때만 보낸다(없으면 아무것도 안 함) ──
  //  GA4 「주요 이벤트」로 표시할 것: contact_call(전화), contact_kakao(카카오톡), quote_submit(요금 문의 글 완성), order_online(온라인 접수).
  //  GTM은 같은 이름의 dataLayer 이벤트로 받는다. 네이버 애널리틱스는 문의 행동을 전환(4: 신청)으로 기록한다.
  const QA = window.QS_ANALYTICS;
  if (QA) {
    const where = el => { const w = el.closest('.mbar, .hd, .bento, .drawer, .modal, .ft, section[id], section[class]'); return w ? (w.id || w.classList[0]) : ''; };
    const LEADS = new Set(['contact_call', 'contact_kakao', 'quote_submit', 'order_online']);
    window.qsTrack = (name, p = {}) => {
      const params = { page_path: location.pathname, ...p };
      (window.dataLayer = window.dataLayer || []).push({ event: name, ...params });
      if (QA.ga4 && window.gtag) gtag('event', name, params);
      if (QA.naver && LEADS.has(name) && window.wcs && window.wcs_do) { try { wcs_do({ cnv: wcs.cnv('4', '1') }); } catch (_) { /* 네이버 전환 스크립트 없음 */ } }
    };
    d.addEventListener('click', e => {
      const a = e.target.closest('a[href]');
      if (a) {
        const href = a.getAttribute('href');
        if (href.startsWith('tel:')) trackEv('contact_call', { placement: where(a) });
        else if (/pf\.kakao\.com/.test(a.href)) trackEv('contact_kakao', { placement: where(a) });
        else if (/1661-7462\.com/.test(a.href)) trackEv('order_online', { placement: where(a) });
        else if (/map\.(kakao|naver)\.com/.test(a.href)) trackEv('map_open', { map: /kakao/.test(a.href) ? 'kakao' : 'naver' });
        else if (/daangn\.com/.test(a.href)) trackEv('review_site', { site: 'daangn' });
      }
      const t = e.target.closest('[data-open],[data-info],[data-share],[data-copy],.acc-btn,[data-faq-cat],[data-blog-cat],.seq-head,#seqPlay,.vtabs button,[role=tab]');
      if (!t) return;
      const label = t.textContent.trim().replace(/\s+/g, ' ').slice(0, 60);
      if (t.matches('[data-open]')) {
        const id = t.dataset.open;
        if (id === 'modalQuote') trackEv('quote_start', { placement: where(t) });
        else if (id.startsWith('drawerSvc-')) trackEv('service_detail', { service: id.slice(10) });
        else if (id === 'drawerBiz') trackEv('business_info');
        else if (id === 'drawerMenu') trackEv('menu_open');
      } else if (t.matches('[data-info]')) trackEv('review_write_info');
      else if (t.matches('[data-share]')) trackEv('share', { method: navigator.share ? 'native' : 'copy' });
      else if (t.matches('[data-copy]')) trackEv('copy_info', { item: t.dataset.copyMsg || label });
      else if (t.matches('.acc-btn')) { if (t.getAttribute('aria-expanded') === 'true') trackEv('faq_open', { question: ((t.querySelector('.acc-t') || t).textContent || '').trim().slice(0, 80) }); } // 클릭으로 열린 뒤 상태
      else if (t.matches('[data-faq-cat]')) trackEv('list_filter', { list: 'faq', category: label });
      else if (t.matches('[data-blog-cat]')) trackEv('list_filter', { list: 'blog', category: label });
      else if (t.matches('.seq-head')) trackEv('process_step', { step: label.split('—')[0].trim() });
      else if (t.id === 'seqPlay') trackEv('process_autoplay', { playing: t.classList.contains('paused') ? 'no' : 'yes' });
      else if (t.matches('.vtabs button')) trackEv('vehicle_spec_view', { body: label });
      else if (t.matches('[role=tab]')) trackEv('tab_select', { tab: label });
    });
    // 물류 가이드 글: 읽은 깊이(25·50·75·100%)
    const pb = $('.post-body');
    if (pb) {
      const marks = [25, 50, 75, 100], sent = new Set();
      addEventListener('scroll', () => {
        const r = pb.getBoundingClientRect();
        const pct = clamp(-r.top / Math.max(1, r.height - innerHeight)) * 100;
        for (const m of marks) if (pct >= m - 1 && !sent.has(m)) { sent.add(m); trackEv('read_progress', { percent: m, post: location.pathname.split('/').filter(Boolean).pop() || '' }); }
      }, { passive: true });
    }
  }

  // 전화 버튼: 데스크톱(전화 불가 환경)에서는 번호 복사 안내
  d.addEventListener('click', async e => {
    const a = e.target.closest('a[href^="tel:"]');
    if (!a || matchMedia('(pointer:coarse)').matches) return;
    const ok = await copy(TEL);
    toast(ok ? `대표번호 ${TEL}를 복사했습니다. 24시간 접수합니다` : `대표번호 ${TEL} (24시간)`, 'ok', 3200);
  });
})();
