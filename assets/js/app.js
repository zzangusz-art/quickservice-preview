/* 퀵서비스다 — 인터랙션: 모달·드로어·토스트·아코디언·탭·스켈레톤·스크롤 시퀀스·히어로 관제망·차량 추천 */
(() => {
  'use strict';
  const d = document, html = d.documentElement;
  html.classList.add('js');
  const $ = (s, r = d) => r.querySelector(s);
  const $$ = (s, r = d) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const KAKAO = 'http://pf.kakao.com/_xkHCqb/chat';
  const TEL = '1661-7462';

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
    setTimeout(() => { el.hidden = true; if (!stack.length) d.body.classList.remove('locked'); }, reduce ? 0 : 380);
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
  $$('.ic-map').forEach(map => $$('.km-city', map).forEach(c => c.classList.toggle('on', c.dataset.modes.split(' ').includes(map.dataset.mode))));

  // ── 헤더 · 드롭다운 · 맨 위로 ─────────────────────────
  const hd = $('#hd'), totop = $('.totop');
  let lastY = 0;
  function onScrollHeader() {
    const y = scrollY;
    hd && hd.classList.toggle('scrolled', y > 8);
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

  // ── 스크롤 시퀀스: 접수 5단계 ─────────────────────────
  const seq = $('.seq');
  if (seq && !reduce && innerHeight >= 520) {
    html.classList.add('js-seq');
    const steps = $$('.seq-step', seq), chips = $$('.cs-chip', seq), bar = $('#seqBar');
    const route = $('#cmRoute'), veh = $('#cmVehicle');
    const L = route.getTotalLength();
    route.style.strokeDasharray = L; route.style.strokeDashoffset = L;
    const A = route.getPointAtLength(0), START = { x: 60, y: 210 };
    const vEl = $('#csVeh'), eEl = $('#csEta'), pEl = $('#csPay');
    let cur = -1;
    function render() {
      const r = seq.getBoundingClientRect();
      const total = seq.offsetHeight - innerHeight;
      const p = clamp(-r.top / total);
      const f = p * 5, step = Math.min(4, Math.floor(f)), sub = clamp(f - step);
      if (step !== cur) {
        steps.forEach((s, i) => s.classList.toggle('on', i === step));
        chips.forEach((c, i) => { c.classList.toggle('on', i === step); c.classList.toggle('done', i < step); });
        vEl.textContent = step === 0 ? '확인 중' : '다마스';
        pEl.textContent = step === 4 ? '카드 결제 완료' : step >= 1 ? '카드·계좌·월 정산' : '—';
        cur = step;
      }
      const rp = step < 2 ? 0 : step === 2 ? sub * .06 : step === 3 ? .06 + sub * .94 : 1;
      route.style.strokeDashoffset = L * (1 - rp);
      let pt;
      if (step < 2) pt = START;
      else if (step === 2 && sub < .7) { const k = sub / .7; pt = { x: START.x + (A.x - START.x) * k, y: START.y + (A.y - START.y) * k }; }
      else pt = route.getPointAtLength(L * rp);
      veh.setAttribute('transform', `translate(${pt.x} ${pt.y})`);
      eEl.textContent = step < 2 ? '—' : step === 2 ? `픽업까지 ${Math.max(1, Math.round(15 * (1 - sub)))}분` : step === 3 ? `도착까지 ${Math.max(1, Math.round(45 * (1 - sub)))}분` : '도착 완료';
      if (bar) bar.style.width = (p * 100).toFixed(1) + '%';
    }
    let tk = false;
    addEventListener('scroll', () => { if (!tk) { tk = true; requestAnimationFrame(() => { render(); tk = false; }); } }, { passive: true });
    addEventListener('resize', render);
    render();
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
    });
    d.addEventListener('click', async e => {
      if (e.target.closest('[data-copy-quote]')) {
        const ok = await copy(quoteText);
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
      setTimeout(() => { ro.innerHTML = result(pick(long, sum, kg, need)); ro.removeAttribute('aria-busy'); }, reduce ? 0 : 650);
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

  // 전화 버튼: 데스크톱(전화 불가 환경)에서는 번호 복사 안내
  d.addEventListener('click', async e => {
    const a = e.target.closest('a[href^="tel:"]');
    if (!a || matchMedia('(pointer:coarse)').matches) return;
    const ok = await copy(TEL);
    toast(ok ? `대표번호 ${TEL}를 복사했습니다. 24시간 접수합니다` : `대표번호 ${TEL} (24시간)`, 'ok', 3200);
  });
})();
