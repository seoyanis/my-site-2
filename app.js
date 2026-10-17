/* ==========================================================================
   COSMIC STUDIOS — Direction C "Immersive Orbit"
   GSAP 3.12.5 + ScrollTrigger + Lenis 1.1.18
   ========================================================================== */
(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const pad = (n) => String(n).padStart(2, '0');
  const sineInOut = (t) => -(Math.cos(Math.PI * t) - 1) / 2;

  const html = document.documentElement;
  const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  html.classList.add('js');
  if (REDUCE) html.classList.add('reduced');

  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: 'sine.inOut' });
  ScrollTrigger.config({ ignoreMobileResize: true });

  /* ------------------------------------------------------------------------
     Lenis smooth scroll, driven by the GSAP ticker
     ------------------------------------------------------------------------ */
  let lenis = null;
  if (!REDUCE) {
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  function scrollTo(target, opts = {}) {
    if (lenis) {
      lenis.scrollTo(target, { duration: 1.5, easing: sineInOut, ...opts });
      return;
    }
    let y = 0;
    if (typeof target === 'number') y = target;
    else if (target) y = target.getBoundingClientRect().top + window.scrollY + (opts.offset || 0);
    window.scrollTo({ top: y, behavior: 'auto' });
  }

  /* ------------------------------------------------------------------------
     Starfield — ≤300 white points, slow drift, scroll + pointer parallax.
     Paused when the tab is hidden or the canvas leaves the viewport.
     ------------------------------------------------------------------------ */
  const Stars = (() => {
    const canvas = $('#stars');
    const ctx = canvas.getContext('2d');
    const COUNT = 300;
    const stars = [];
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    let W = 1, H = 1, running = false, inView = true;

    for (let i = 0; i < COUNT; i++) {
      const z = Math.pow(Math.random(), 1.7); // depth: most stars far away
      stars.push({
        x: Math.random(), y: Math.random(), z,
        r: 0.45 + z * 1.25,
        a: 0.1 + z * 0.5,
        vx: (Math.random() - 0.5) * 0.0045 * (0.3 + z),
        vy: (Math.random() - 0.5) * 0.0025 * (0.3 + z),
        ph: Math.random() * Math.PI * 2,
      });
    }

    function draw(time, dt) {
      const sy = window.scrollY;
      pointer.x += (pointer.tx - pointer.x) * 0.035;
      pointer.y += (pointer.ty - pointer.y) * 0.035;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < COUNT; i++) {
        const s = stars[i];
        if (dt) {
          s.x = (((s.x + s.vx * dt) % 1) + 1) % 1;
          s.y = (((s.y + s.vy * dt) % 1) + 1) % 1;
        }
        const px = ((((s.x - pointer.x * 0.02 * s.z) % 1) + 1) % 1) * W;
        const py = ((((s.y - (sy / H) * 0.09 * s.z - pointer.y * 0.02 * s.z) % 1) + 1) % 1) * H;
        const tw = REDUCE ? 1 : 0.8 + 0.2 * Math.sin(time * 0.9 + s.ph);
        ctx.globalAlpha = s.a * tw;
        ctx.beginPath();
        ctx.arc(px, py, s.r, 0, 6.2832);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function resize() {
      W = window.innerWidth; H = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (REDUCE || !running) draw(0, 0);
    }

    const tick = (time, deltaTime) => draw(time, Math.min(deltaTime, 100) / 1000);
    function start() { if (running || REDUCE) return; running = true; gsap.ticker.add(tick); }
    function stop() { if (!running) return; running = false; gsap.ticker.remove(tick); }
    function sync() { if (document.hidden || !inView) stop(); else start(); }

    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', sync);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => { inView = entries[0].isIntersecting; sync(); }).observe(canvas);
    }
    window.addEventListener('pointermove', (e) => {
      pointer.tx = (e.clientX / W - 0.5) * 2;
      pointer.ty = (e.clientY / H - 0.5) * 2;
    }, { passive: true });

    resize();
    sync();
    return { resize };
  })();

  /* ------------------------------------------------------------------------
     Navigation (anchors, incl. the Studio stop inside the pinned hero)
     ------------------------------------------------------------------------ */
  const Nav = {
    heroST: null,
    go(id) {
      if (!id || id === 'home') { scrollTo(0, { duration: 1.8 }); return; }
      if (id === 'studio' && Nav.heroST) {
        const st = Nav.heroST;
        scrollTo(st.start + (st.end - st.start) * 0.8, { duration: 1.8 });
        return;
      }
      const el = document.getElementById(id);
      if (el) scrollTo(el, { duration: 1.8 });
    },
  };

  /* ------------------------------------------------------------------------
     Menu drawer (focus-trapped, Esc closes)
     ------------------------------------------------------------------------ */
  const Menu = (() => {
    const btn = $('.menu-btn');
    const root = $('#menu');
    const panel = $('.menu__panel');
    const backdrop = $('.menu__backdrop');
    const items = [...$$('.menu__list li', root), $('.menu__foot', root)];
    const D = REDUCE ? 0 : 1;
    let open = false, tl = null;

    gsap.set(panel, { x: 0, xPercent: -100 });
    const focusables = () => [btn, ...$$('a[href], button', panel)];

    function show() {
      if (open) return;
      open = true;
      root.style.visibility = 'visible';
      root.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
      if (lenis) lenis.stop();
      if (tl) tl.kill();
      tl = gsap.timeline()
        .to(backdrop, { opacity: 1, duration: 0.7 * D, ease: 'sine.inOut' }, 0)
        .to(panel, { xPercent: 0, duration: 0.85 * D, ease: 'sine.inOut' }, 0)
        .fromTo(items, { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 * D, stagger: 0.06 * D, ease: 'sine.out' }, 0.25 * D);
      const first = $('a', panel);
      if (first) setTimeout(() => first.focus({ preventScroll: true }), 60);
    }

    function hide(returnFocus = true) {
      if (!open) return;
      open = false;
      btn.setAttribute('aria-expanded', 'false');
      if (tl) tl.kill();
      tl = gsap.timeline({ onComplete: () => { root.style.visibility = 'hidden'; root.classList.remove('is-open'); } })
        .to(items, { opacity: 0, y: 10, duration: 0.3 * D, ease: 'sine.in' }, 0)
        .to(panel, { xPercent: -100, duration: 0.7 * D, ease: 'sine.inOut' }, 0.05 * D)
        .to(backdrop, { opacity: 0, duration: 0.6 * D, ease: 'sine.inOut' }, 0.1 * D);
      if (lenis) lenis.start();
      if (returnFocus) btn.focus({ preventScroll: true });
    }

    btn.addEventListener('click', () => (open ? hide() : show()));
    backdrop.addEventListener('click', () => hide());
    document.addEventListener('keydown', (e) => {
      if (!open) return;
      if (e.key === 'Escape') { e.preventDefault(); hide(); return; }
      if (e.key !== 'Tab') return;
      const f = focusables();
      const first = f[0], last = f[f.length - 1];
      const cur = document.activeElement;
      if (e.shiftKey && cur === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && cur === last) { e.preventDefault(); first.focus(); }
      else if (!f.includes(cur)) { e.preventDefault(); first.focus(); }
    });
    $$('a[href^="#"]', panel).forEach((a) => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const id = a.getAttribute('href').slice(1);
        hide(false);
        setTimeout(() => Nav.go(id), REDUCE ? 0 : 120);
      });
    });

    return { show, hide, isOpen: () => open };
  })();

  /* ------------------------------------------------------------------------
     Hero — the sun. Full-bleed ring video settles into a circular mask.
     ------------------------------------------------------------------------ */
  const hero = $('.hero');
  const stage = $('.stage');
  const sun = $('.sun');
  const sunVideo = $('.sun video');
  const sunRing = $('.sun-ring');
  const heroOrbits = $('.hero .orbits');
  const lockup = $('.lockup');
  const hint = $('.hint');
  const studioLabel = $('.studio .label');
  const studioLine = $('.studio .label__line');
  const studioTitle = $('.studio .title');
  const studioPs = $$('.studio .copy p');

  // The ring in the footage spans ~53% of the video height (radius ≈ 0.266 × rendered height).
  function heroGeom(desktop) {
    const w = stage.clientWidth, h = stage.clientHeight;
    const vidH = w / h > 16 / 9 ? (w * 9) / 16 : h; // rendered height under object-fit: cover
    const ringR = 0.266 * vidH;
    const R0 = Math.hypot(w, h) / 2 + 24; // covers the whole stage
    let R, cx, cy, vScale, vx;
    if (desktop) {
      R = Math.min(ringR * 1.28, h * 0.42, w * 0.26);
      cx = w * 0.32; cy = h * 0.5;
      vScale = Math.min(0.86, (R * 0.7) / ringR);
      vx = cx - w / 2;
    } else {
      R = Math.min(w * 0.36, h * 0.3);
      cx = w / 2; cy = h / 2;
      vScale = Math.min(0.9, (R * 0.72) / ringR);
      vx = 0;
    }
    return { w, h, R, R0, cx, cy, vScale, vx };
  }
  function applyGeom(g) {
    stage.style.setProperty('--sunX', g.cx + 'px');
    stage.style.setProperty('--sunY', g.cy + 'px');
    stage.style.setProperty('--sunD', g.R * 2 + 'px');
  }

  function setupHeroPinned() {
    html.classList.add('pinned-hero');
    let g = heroGeom(true);
    applyGeom(g);
    const onRefreshInit = () => { g = heroGeom(true); applyGeom(g); };
    ScrollTrigger.addEventListener('refreshInit', onRefreshInit);

    gsap.set(studioTitle, { transformPerspective: 900, transformOrigin: '50% 100%' });
    const tl = gsap.timeline({
      defaults: { ease: 'sine.inOut' },
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: () => '+=' + Math.round(window.innerHeight * 2.3),
        pin: true,
        scrub: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });
    tl.to(lockup, { opacity: 0, scale: 0.9, duration: 0.22 }, 0)
      .to(hint, { opacity: 0, duration: 0.12 }, 0)
      .fromTo(sun,
        { clipPath: () => `circle(${g.R0}px at ${g.w / 2}px ${g.h / 2}px)` },
        { clipPath: () => `circle(${g.R}px at ${g.cx}px ${g.cy}px)`, duration: 0.5 }, 0.06)
      .fromTo(sunVideo, { x: 0, scale: 1 }, { x: () => g.vx, scale: () => g.vScale, duration: 0.5 }, 0.06)
      .fromTo([sunRing, heroOrbits], { opacity: 0 }, { opacity: 1, duration: 0.22, stagger: 0.06 }, 0.42)
      .fromTo(studioLabel, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.2 }, 0.4)
      .fromTo(studioLine, { scaleX: 0 }, { scaleX: 1, duration: 0.25 }, 0.44)
      .fromTo(studioTitle, { rotationX: 42, y: 44, opacity: 0 }, { rotationX: 0, y: 0, opacity: 1, duration: 0.32 }, 0.44)
      .fromTo(studioPs, { y: 36, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, stagger: 0.09 }, 0.54)
      .to({}, { duration: 0.3 }); // hold — the system stays pinned for a beat

    Nav.heroST = tl.scrollTrigger;
    return () => {
      ScrollTrigger.removeEventListener('refreshInit', onRefreshInit);
      html.classList.remove('pinned-hero');
      Nav.heroST = null;
    };
  }

  function setupHeroMobile() {
    let g = heroGeom(false);
    applyGeom(g);
    const onRefreshInit = () => { g = heroGeom(false); applyGeom(g); };
    ScrollTrigger.addEventListener('refreshInit', onRefreshInit);

    const tl = gsap.timeline({
      defaults: { ease: 'sine.inOut' },
      scrollTrigger: { trigger: stage, start: 'top top', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
    });
    tl.to(lockup, { opacity: 0, y: -30, duration: 0.35 }, 0)
      .to(hint, { opacity: 0, duration: 0.15 }, 0)
      .fromTo(sun,
        { clipPath: () => `circle(${g.R0}px at ${g.cx}px ${g.cy}px)` },
        { clipPath: () => `circle(${g.R}px at ${g.cx}px ${g.cy}px)`, duration: 0.7 }, 0)
      .fromTo(sunVideo, { scale: 1 }, { scale: () => g.vScale, duration: 0.7 }, 0)
      .fromTo([sunRing, heroOrbits], { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.35);

    return () => ScrollTrigger.removeEventListener('refreshInit', onRefreshInit);
  }

  /* ------------------------------------------------------------------------
     Section entrances (scrubbed): titles float in with rotateX
     ------------------------------------------------------------------------ */
  function setupEnter(pinned) {
    $$('[data-enter]').forEach((el) => {
      if (pinned && el.closest('.studio')) return; // handled by the hero timeline
      const kind = el.dataset.enter;
      if (kind === 'title') {
        gsap.set(el, { transformPerspective: 900, transformOrigin: '50% 100%' });
        gsap.fromTo(el, { rotationX: 42, y: 44, opacity: 0 }, {
          rotationX: 0, y: 0, opacity: 1,
          scrollTrigger: { trigger: el, start: 'top 94%', end: 'top 58%', scrub: 0.8 },
        });
      } else if (kind === 'label') {
        const line = el.querySelector('.label__line');
        const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 94%', end: 'top 70%', scrub: 0.8 } });
        tl.fromTo(el, { opacity: 0, y: 14 }, { opacity: 1, y: 0 }, 0);
        if (line) tl.fromTo(line, { scaleX: 0 }, { scaleX: 1 }, 0.2);
      } else if (kind === 'copy') {
        gsap.fromTo($$('p', el), { y: 36, opacity: 0 }, {
          y: 0, opacity: 1, stagger: 0.15,
          scrollTrigger: { trigger: el, start: 'top 92%', end: 'top 50%', scrub: 0.8 },
        });
      } else if (kind === 'orbits') {
        gsap.fromTo(el, { opacity: 0 }, {
          opacity: 1,
          scrollTrigger: { trigger: el.parentElement, start: 'top 85%', end: 'top 30%', scrub: 0.8 },
        });
      }
    });
  }

  /* ------------------------------------------------------------------------
     Services — orbital carousel (3D ring scrubbed by scroll) with a
     horizontal snap-carousel fallback for touch / narrow / reduced motion.
     ------------------------------------------------------------------------ */
  const Services = (() => {
    const section = $('.services');
    const orbit = $('.orbit3d');
    const ring = $('.ring');
    const cards = $$('.card', ring);
    const prev = $('.ctrl--prev');
    const next = $('.ctrl--next');
    const counter = $('.counter b');
    const live = $('.services__live');
    const dialog = $('#member');
    const n = cards.length;
    const step = 360 / n;
    const api = { st: null, setup3D, setupFlat };
    let active = -1;
    let goTo = () => {};

    function setActive(i) {
      if (i === active) return;
      active = i;
      cards.forEach((c, k) => c.classList.toggle('is-active', k === i));
      counter.textContent = pad(i + 1);
      live.textContent = $('.card__title', cards[i]).textContent;
    }

    prev.addEventListener('click', () => goTo(active - 1));
    next.addEventListener('click', () => goTo(active + 1));
    cards.forEach((c, i) => c.addEventListener('click', () => { if (i !== active) goTo(i); }));
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      if (Menu.isOpen() || dialog.open) return;
      const focused = section.contains(document.activeElement);
      const inStage = api.st && api.st.isActive;
      if (!focused && !inStage) return;
      e.preventDefault();
      goTo(active + (e.key === 'ArrowRight' ? 1 : -1));
    });

    function setup3D() {
      orbit.classList.remove('is-flat');
      orbit.removeAttribute('data-lenis-prevent');
      cards.forEach((c, i) => c.style.setProperty('--a', i * step + 'deg'));
      const radius = () => parseFloat(getComputedStyle(orbit).getPropertyValue('--R')) || 500;
      let R = radius();
      const state = { rot: 0 };

      const render = () => {
        ring.style.transform = `translateZ(${-R}px) rotateY(${-state.rot}deg)`;
        for (let i = 0; i < n; i++) {
          const a = ((((i * step - state.rot) % 360) + 540) % 360) - 180; // angle from the front, -180..180
          const vis = Math.max(0, Math.cos((a * Math.PI) / 180));
          cards[i].style.opacity = (0.12 + 0.88 * Math.pow(vis, 1.5)).toFixed(3);
        }
        setActive(clamp(Math.round(state.rot / step), 0, n - 1));
      };

      const tween = gsap.to(state, {
        rot: (n - 1) * step,
        ease: 'none',
        onUpdate: render,
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => '+=' + Math.round(window.innerHeight * 3.2),
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onRefresh: () => { R = radius(); render(); },
        },
      });
      api.st = tween.scrollTrigger;
      goTo = (i) => {
        i = clamp(i, 0, n - 1);
        const st = tween.scrollTrigger;
        scrollTo(st.start + ((st.end - st.start) * i) / (n - 1), { duration: 1.1 });
      };
      render();

      return () => {
        api.st = null;
        ring.style.transform = '';
        cards.forEach((c) => { c.style.opacity = ''; c.style.removeProperty('--a'); });
      };
    }

    function setupFlat() {
      orbit.classList.add('is-flat');
      orbit.setAttribute('data-lenis-prevent', '');
      let raf = 0;
      const nearest = () => {
        const mid = orbit.scrollLeft + orbit.clientWidth / 2;
        let best = 0, bd = Infinity;
        cards.forEach((c, i) => {
          const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid);
          if (d < bd) { bd = d; best = i; }
        });
        setActive(best);
      };
      const onScroll = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; nearest(); }); };
      orbit.addEventListener('scroll', onScroll, { passive: true });
      goTo = (i) => {
        i = clamp(i, 0, n - 1);
        const c = cards[i];
        orbit.scrollTo({ left: c.offsetLeft + c.offsetWidth / 2 - orbit.clientWidth / 2, behavior: REDUCE ? 'auto' : 'smooth' });
      };
      nearest();
      return () => {
        orbit.removeEventListener('scroll', onScroll);
        orbit.classList.remove('is-flat');
        orbit.removeAttribute('data-lenis-prevent');
      };
    }

    return api;
  })();

  /* ------------------------------------------------------------------------
     Team — planets + member dialog (focus-trapped, Esc closes)
     ------------------------------------------------------------------------ */
  const Team = (() => {
    const cluster = $('.cluster');
    const planets = $$('.planet');
    const btns = $$('.planet__btn');
    const dlg = $('#member');
    const inner = $('.member__inner', dlg);
    const img = $('.member__img', dlg);
    const name = $('.member__name', dlg);
    const bio = $('.member__bio', dlg);
    const num = $('.member__num', dlg);
    const closeBtn = $('.member__close', dlg);
    let opener = null;

    function open(i) {
      const p = planets[i];
      img.src = $('.planet__img', p).src;
      name.textContent = $('.planet__name', p).textContent;
      bio.textContent = $('.planet__bio', p).textContent;
      num.textContent = pad(i + 1);
      opener = btns[i];
      if (typeof dlg.showModal === 'function') dlg.showModal();
      else dlg.setAttribute('open', '');
      if (lenis) lenis.stop();
      bio.scrollTop = 0;
      if (bio.scrollHeight > bio.clientHeight) bio.setAttribute('tabindex', '0');
      else bio.removeAttribute('tabindex');
      gsap.fromTo(inner, { opacity: 0, y: 14, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: REDUCE ? 0 : 0.6, ease: 'sine.out', clearProps: 'transform' });
      inner.focus({ preventScroll: true });
    }
    function close() { if (dlg.open) dlg.close(); }

    dlg.addEventListener('close', () => {
      if (lenis) lenis.start();
      if (opener) opener.focus({ preventScroll: true });
    });
    closeBtn.addEventListener('click', close);
    dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); });
    dlg.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; } // also covers the non-showModal fallback
      if (e.key !== 'Tab') return;
      const f = $$('button, a[href], [tabindex="0"]', inner);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      const cur = document.activeElement;
      if (e.shiftKey && (cur === first || cur === inner)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && cur === last) { e.preventDefault(); first.focus(); }
    });
    btns.forEach((b, i) => b.addEventListener('click', () => open(i)));

    function setupMotion(desktop) {
      if (desktop) {
        planets.forEach((p) => {
          const s = parseFloat(p.dataset.speed || '1');
          gsap.fromTo(p, { y: 70 * s }, {
            y: -70 * s, ease: 'none',
            scrollTrigger: { trigger: cluster, start: 'top bottom', end: 'bottom top', scrub: 1 },
          });
        });
      }
      gsap.fromTo(planets, { opacity: 0, scale: 0.7 }, {
        opacity: 1, scale: 1, stagger: 0.08,
        scrollTrigger: { trigger: cluster, start: 'top 88%', end: 'top 40%', scrub: 0.8 },
      });
    }

    return { setupMotion };
  })();

  /* ------------------------------------------------------------------------
     Band divider + footer depth layers
     ------------------------------------------------------------------------ */
  function setupBand() {
    const band = $('.band');
    gsap.fromTo($('img', band), { yPercent: -9 }, {
      yPercent: 9, ease: 'none',
      scrollTrigger: { trigger: band, start: 'top bottom', end: 'bottom top', scrub: 1 },
    });
  }

  function setupFooter() {
    const footer = $('.footer');
    const tl = gsap.timeline({
      scrollTrigger: { trigger: footer, start: 'top bottom', end: 'bottom bottom', scrub: 1, invalidateOnRefresh: true },
    });
    tl.fromTo($('.footer__sky'), { yPercent: -6 }, { yPercent: 5, ease: 'none', duration: 1 }, 0)
      .fromTo($('.footer__ground'), { yPercent: 9 }, { yPercent: -2, ease: 'none', duration: 1 }, 0)
      .fromTo($('.footer__logo'), { y: 0, yPercent: 115 }, { yPercent: -6, ease: 'sine.out', duration: 0.75 }, 0.15)
      .fromTo($('.footer__content'), { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.35 }, 0.6);
  }

  /* ------------------------------------------------------------------------
     Responsive / reduced-motion orchestration
     ------------------------------------------------------------------------ */
  const mm = gsap.matchMedia();
  mm.add({
    desktop: '(min-width: 900px) and (hover: hover) and (pointer: fine)',
    mobile: '(max-width: 899px), (hover: none), (pointer: coarse), (pointer: none)',
    reduce: '(prefers-reduced-motion: reduce)',
  }, (ctx) => {
    const { desktop, reduce } = ctx.conditions;
    const cleanups = [];
    if (reduce) {
      cleanups.push(Services.setupFlat());
      return () => cleanups.forEach((fn) => fn && fn());
    }
    if (desktop) cleanups.push(setupHeroPinned(), Services.setup3D());
    else cleanups.push(setupHeroMobile(), Services.setupFlat());
    setupEnter(desktop);
    Team.setupMotion(desktop);
    setupBand();
    setupFooter();
    return () => cleanups.forEach((fn) => fn && fn());
  });

  /* ------------------------------------------------------------------------
     Misc wiring
     ------------------------------------------------------------------------ */
  $('.hint').addEventListener('click', () => Nav.go('studio'));
  $('.to-top').addEventListener('click', () => Nav.go('home'));
  $$('video').forEach((v) => {
    const p = v.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  });

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
