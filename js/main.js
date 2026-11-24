/* =========================================================
   ANGIO Peinture & Rénovation — Interactions & animations
   GSAP + ScrollTrigger + Lenis
   ========================================================= */
(() => {
  const q = (s, c = document) => c.querySelector(s);
  const qa = (s, c = document) => [...c.querySelectorAll(s)];

  const yearEl = q('[data-year]');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Without GSAP (CDN blocked): show the page as-is.
  if (!window.gsap || !window.ScrollTrigger) {
    q('.loader')?.remove();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  const motion = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const isMobile = () => window.innerWidth <= 900;

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  /* ---------------------------------------------------------
     Smooth scroll (Lenis) synced with ScrollTrigger
     --------------------------------------------------------- */
  let lenis = null;
  if (motion && window.Lenis) {
    lenis = new Lenis({
      duration: 1.15,
      easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  const scrollToTarget = target => {
    if (lenis) {
      lenis.scrollTo(target, { duration: 1.6, easing: t => 1 - Math.pow(1 - t, 4) });
    } else if (target === 0) {
      window.scrollTo({ top: 0, behavior: motion ? 'smooth' : 'auto' });
    } else {
      q(target)?.scrollIntoView({ behavior: motion ? 'smooth' : 'auto' });
    }
  };

  /* ---------------------------------------------------------
     Mobile menu
     --------------------------------------------------------- */
  const menu = q('.menu');
  const burger = q('.nav__burger');
  let menuOpen = false;
  gsap.set(menu, { clipPath: 'inset(0% 0% 100% 0% round 0px 0px 40px 40px)' });
  const menuTl = gsap.timeline({ paused: true })
    .set(menu, { visibility: 'visible' })
    .to(menu, { clipPath: 'inset(0% 0% 0% 0% round 0px 0px 0px 0px)', duration: 0.9, ease: 'expo.inOut' })
    .from(qa('.menu__links a span'), { yPercent: 110, duration: 0.9, stagger: 0.06, ease: 'expo.out' }, '-=0.35')
    .from(qa('.menu .label, .menu__foot'), { autoAlpha: 0, y: 16, duration: 0.6, ease: 'power3.out' }, '<0.2');

  const setMenu = open => {
    menuOpen = open;
    burger.setAttribute('aria-expanded', String(open));
    q('.nav__burger-label', burger).textContent = open ? 'Fermer' : 'Menu';
    menu.setAttribute('aria-hidden', String(!open));
    if (open) { menuTl.timeScale(1).play(); lenis?.stop(); }
    else { menuTl.timeScale(1.4).reverse(); lenis?.start(); }
  };
  burger.addEventListener('click', () => setMenu(!menuOpen));
  window.addEventListener('keydown', e => { if (e.key === 'Escape' && menuOpen) setMenu(false); });
  window.addEventListener('resize', () => { if (menuOpen && !isMobile()) setMenu(false); });

  /* Anchor links */
  qa('[data-scroll]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (!href || !href.startsWith('#')) return;
      e.preventDefault();
      const wasOpen = menuOpen;
      if (wasOpen) setMenu(false);
      gsap.delayedCall(wasOpen ? 0.5 : 0, () => scrollToTarget(href === '#top' ? 0 : href));
    });
  });
  q('[data-totop]')?.addEventListener('click', () => scrollToTarget(0));

  /* ---------------------------------------------------------
     Nav: hide on scroll down, show on scroll up + active link
     --------------------------------------------------------- */
  const nav = q('[data-nav]');
  const callfab = q('.callfab');
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: self => {
      const y = self.scroll();
      nav.classList.toggle('is-hidden', self.direction === 1 && y > window.innerHeight * 0.6 && !menuOpen);
      callfab.classList.toggle('is-visible', y > window.innerHeight * 0.7);
    },
  });
  qa('.nav__links a').forEach(link => {
    const target = q(link.getAttribute('href'));
    if (!target) return;
    ScrollTrigger.create({
      trigger: target,
      start: 'top 50%',
      end: 'bottom 50%',
      onToggle: self => link.classList.toggle('is-active', self.isActive),
    });
  });

  /* ---------------------------------------------------------
     Magnetic buttons (desktop)
     --------------------------------------------------------- */
  if (motion && finePointer) {
    qa('[data-magnetic]').forEach(el => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.22);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.32);
      });
      el.addEventListener('mouseleave', () => { xTo(0); yTo(0); });
    });
  }

  /* ---------------------------------------------------------
     Services accordion + synced media
     --------------------------------------------------------- */
  const accs = qa('.acc');
  const frameImgs = qa('.services__frame img');
  const chipNum = q('.services__current');
  const chipName = q('.services__chip-name');
  let currentMedia = 0;
  gsap.set(frameImgs, { autoAlpha: 0 });
  gsap.set(frameImgs[0], { autoAlpha: 1 });

  const setMedia = i => {
    if (i === currentMedia || !frameImgs[i]) return;
    const prev = frameImgs[currentMedia];
    const next = frameImgs[i];
    gsap.killTweensOf(frameImgs);
    frameImgs.forEach(im => { if (im !== prev && im !== next) gsap.set(im, { autoAlpha: 0, zIndex: 0 }); });
    gsap.set(prev, { autoAlpha: 1, zIndex: 1, clipPath: 'inset(0% 0% 0% 0%)', scale: 1 });
    gsap.set(next, { zIndex: 2, autoAlpha: 1 });
    gsap.fromTo(next,
      { clipPath: 'inset(100% 0% 0% 0%)', scale: 1.18 },
      { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: motion ? 1.1 : 0, ease: 'expo.inOut' });
    gsap.to(prev, { scale: 1.06, duration: motion ? 1.1 : 0, ease: 'expo.inOut' });
    currentMedia = i;

    // Chip text swap
    const title = q('.acc__title', accs[i]).textContent;
    gsap.timeline()
      .to([chipNum, chipName], { yPercent: -60, autoAlpha: 0, duration: 0.25, ease: 'power2.in' })
      .add(() => { chipNum.textContent = String(i + 1).padStart(2, '0'); chipName.textContent = title; })
      .fromTo([chipNum, chipName], { yPercent: 60, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.5, ease: 'expo.out' });
  };

  let refreshCall;
  const queueRefresh = () => { refreshCall?.kill(); refreshCall = gsap.delayedCall(0.1, () => ScrollTrigger.refresh()); };

  const toggleAcc = i => {
    accs.forEach((acc, k) => {
      const panel = q('.acc__panel', acc);
      const btn = q('.acc__head', acc);
      const isOpen = acc.classList.contains('is-open');
      if (k === i && !isOpen) {
        acc.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
        gsap.fromTo(panel, { height: 0 }, { height: 'auto', duration: 0.9, ease: 'expo.out', onComplete: queueRefresh });
        gsap.fromTo(q('.acc__body', panel).children, { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.06, ease: 'power3.out', delay: 0.08 });
      } else if (isOpen) {
        // closes the other open item, or the clicked one if it was already open
        acc.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
        gsap.fromTo(panel, { height: panel.offsetHeight }, { height: 0, duration: 0.7, ease: 'expo.inOut', onComplete: queueRefresh });
      }
    });
    setMedia(i);
  };
  accs.forEach((acc, i) => q('.acc__head', acc).addEventListener('click', () => toggleAcc(i)));

  /* ---------------------------------------------------------
     Word split for manifesto
     --------------------------------------------------------- */
  qa('[data-words]').forEach(el => {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    words.forEach((w, i) => {
      const s = document.createElement('span');
      s.className = 'w';
      s.textContent = w;
      el.appendChild(s);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
  });

  /* ---------------------------------------------------------
     Reduced motion: skip intro & scroll choreography
     --------------------------------------------------------- */
  const loader = q('.loader');
  if (!motion) {
    loader.remove();
    return;
  }

  /* ---------------------------------------------------------
     Réalisations — horizontal pinned gallery (desktop)
     --------------------------------------------------------- */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 901px)', () => {
    const track = q('.works__track');
    const bar = q('.works__bar i');
    const counter = q('.works__current');
    const total = qa('.work', track).length;
    const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);

    const tween = gsap.to(track, {
      x: () => -dist(),
      ease: 'none',
      scrollTrigger: {
        trigger: '.works__pin',
        start: 'top top',
        end: () => `+=${dist()}`,
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
        onUpdate: self => {
          gsap.set(bar, { scaleX: self.progress });
          counter.textContent = String(Math.min(total, Math.floor(self.progress * total) + 1)).padStart(2, '0');
        },
      },
    });

    qa('.work__img img', track).forEach(img => {
      gsap.fromTo(img, { xPercent: -7, scale: 1.18 }, {
        xPercent: 7, scale: 1.18, ease: 'none',
        scrollTrigger: { trigger: img.parentElement, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true },
      });
    });

    return () => gsap.set(track, { clearProps: 'x' });
  });

  /* ---------------------------------------------------------
     Scroll reveals
     --------------------------------------------------------- */
  // Line-by-line headline reveal
  qa('[data-reveal="lines"]').forEach(el => {
    const spans = qa('.line > span', el);
    gsap.set(spans, { yPercent: 115 });
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      once: true,
      onEnter: () => gsap.to(spans, { yPercent: 0, duration: 1.3, stagger: 0.1, ease: 'expo.out' }),
    });
  });

  // Soft fade-up
  const fades = qa('[data-reveal="fade"]');
  gsap.set(fades, { autoAlpha: 0, y: 40 });
  ScrollTrigger.batch(fades, {
    start: 'top 92%',
    once: true,
    onEnter: batch => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.08, ease: 'power3.out', overwrite: true }),
  });

  // Image porthole reveal (clip grows to full radius) + inner zoom-out
  qa('[data-reveal="img"]').forEach(el => {
    const img = q('img', el);
    const radius = () => parseFloat(getComputedStyle(el).borderTopLeftRadius) || 80;
    const baseScale = img.hasAttribute('data-speed') ? 1.18 : 1;
    gsap.set(el, { clipPath: `inset(14% 14% 14% 14% round ${radius()}px)` });
    gsap.set(img, { scale: baseScale + 0.3 });
    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        gsap.to(el, {
          clipPath: `inset(0% 0% 0% 0% round ${radius()}px)`,
          duration: 1.5,
          ease: 'expo.out',
          onComplete: () => gsap.set(el, { clearProps: 'clipPath' }),
        });
        gsap.to(img, { scale: baseScale, duration: 1.8, ease: 'expo.out' });
      },
    });
  });

  // Parallax inside image cards
  qa('img[data-speed]').forEach(img => {
    const speed = parseFloat(img.dataset.speed) || 8;
    gsap.fromTo(img, { yPercent: -speed }, {
      yPercent: speed,
      ease: 'none',
      scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });

  // Manifesto words: ink in as you scroll
  qa('[data-words]').forEach(el => {
    gsap.fromTo(qa('.w', el), { opacity: 0.14 }, {
      opacity: 1,
      stagger: 0.05,
      ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 48%', scrub: true },
    });
  });

  // Counters
  qa('[data-count]').forEach(el => {
    const end = parseInt(el.dataset.count, 10);
    const obj = { v: 0 };
    el.textContent = '0';
    ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      once: true,
      onEnter: () => gsap.to(obj, {
        v: end, duration: 1.8, ease: 'power3.out',
        onUpdate: () => { el.textContent = Math.round(obj.v); },
      }),
    });
  });

  // Offset image pair drift
  gsap.to('.pair__item--b', {
    y: -110, ease: 'none',
    scrollTrigger: { trigger: '.pair', start: 'top bottom', end: 'bottom top', scrub: true },
  });
  gsap.to('.about__img--sub', {
    y: -90, ease: 'none',
    scrollTrigger: { trigger: '.about__media', start: 'top bottom', end: 'bottom top', scrub: true },
  });

  // Regions marquee driven by scroll
  qa('[data-marquee]').forEach(row => {
    const dir = parseFloat(row.dataset.marquee);
    gsap.fromTo(row, { xPercent: dir < 0 ? 0 : -28 }, {
      xPercent: dir < 0 ? -28 : 0,
      ease: 'none',
      scrollTrigger: { trigger: '.zones', start: 'top bottom', end: 'bottom top', scrub: 0.6 },
    });
  });

  // Principles: stacked cards recede as the next one arrives
  const cards = qa('.principle');
  cards.forEach((card, i) => {
    const next = cards[i + 1];
    if (!next) return;
    const depth = cards.length - 1 - i;
    const inner = q('.principle__inner', card);
    gsap.to(inner, {
      scale: 1 - 0.04 * depth,
      ease: 'none',
      scrollTrigger: {
        trigger: next,
        start: 'top bottom',
        end: () => `top ${parseFloat(getComputedStyle(next).top) || 120}px`,
        scrub: true,
        invalidateOnRefresh: true,
      },
    });
    // content dims while the card itself stays opaque
    gsap.to(inner.children, {
      opacity: 0.25,
      ease: 'none',
      scrollTrigger: {
        trigger: next,
        start: 'top bottom',
        end: () => `top ${parseFloat(getComputedStyle(next).top) || 120}px`,
        scrub: true,
        invalidateOnRefresh: true,
      },
    });
  });

  // Contact card rises & settles into place
  gsap.fromTo('[data-contact-card]', { scale: 0.92, y: 80 }, {
    scale: 1, y: 0, ease: 'none',
    scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'top 25%', scrub: true },
  });

  // Footer wordmark rises from the floor
  gsap.fromTo('.footer__logo img', { yPercent: 100 }, {
    yPercent: 0, ease: 'none',
    scrollTrigger: { trigger: '.footer__logo', start: 'top bottom', end: 'bottom bottom', scrub: true },
  });

  /* ---------------------------------------------------------
     Intro — loader → porthole → full-bleed hero
     --------------------------------------------------------- */
  const heroMedia = q('.hero__media');
  const heroImg = q('.hero__img');
  const heroLines = qa('.hero__title .line > span');
  const heroFades = qa('[data-hero-fade]');
  const heroCard = q('[data-hero-card]');
  const navEls = qa('.nav__logo, .nav__pill');
  const loaderImg = q('.loader__mark img');
  const loaderNum = q('.loader__num');

  const CLIP_ZERO = 'inset(50% 50% 50% 50% round 80px)';
  const CLIP_PORT = () => (isMobile()
    ? 'inset(30% 22% 30% 22% round 60px)'
    : 'inset(28% 36% 28% 36% round 80px)');
  const CLIP_FULL = 'inset(0% 0% 0% 0% round 0px)';

  lenis?.stop();
  gsap.set(heroMedia, { clipPath: CLIP_ZERO });
  gsap.set(heroImg, { scale: 1.6 });
  gsap.set(heroLines, { yPercent: 115 });
  gsap.set(heroFades, { autoAlpha: 0, y: 24 });
  gsap.set(heroCard, { autoAlpha: 0, y: 40, clipPath: 'inset(0% 0% 100% 0% round 12px)' });
  gsap.set(navEls, { yPercent: -160 });

  const counter = { v: 0 };
  const loaderTl = gsap.timeline()
    .to(loaderImg, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'expo.out' }, 0.15)
    .to('.loader__bar span', { scaleX: 1, duration: 1.8, ease: 'power2.inOut' }, 0)
    .to(counter, { v: 100, duration: 1.8, ease: 'power2.inOut', onUpdate: () => { loaderNum.textContent = Math.round(counter.v); } }, 0);

  const imgReady = new Promise(res => {
    if (heroImg.complete && heroImg.naturalWidth) return res();
    heroImg.addEventListener('load', res, { once: true });
    heroImg.addEventListener('error', res, { once: true });
    setTimeout(res, 4000);
  });
  // Never let a slow font or network request hold the intro hostage
  const fontsReady = Promise.race([
    document.fonts ? document.fonts.ready.catch(() => {}) : Promise.resolve(),
    new Promise(res => setTimeout(res, 2500)),
  ]);

  Promise.all([loaderTl.then(), imgReady, fontsReady]).then(() => {
    gsap.timeline({ onComplete: afterIntro })
      .to(loaderImg, { clipPath: 'inset(0% 0% 100% 0%)', yPercent: -12, duration: 0.8, ease: 'expo.in' })
      .to('.loader__meta, .loader__bar', { autoAlpha: 0, duration: 0.4, ease: 'power2.in' }, '<0.2')
      .set(loader, { autoAlpha: 0 })
      // porthole opens …
      .to(heroMedia, { clipPath: CLIP_PORT(), duration: 0.9, ease: 'expo.out' })
      .to(heroImg, { scale: 1.35, duration: 0.9, ease: 'expo.out' }, '<')
      // … then expands to full-bleed
      .to(heroMedia, { clipPath: CLIP_FULL, duration: 1.5, ease: 'expo.inOut' }, '-=0.15')
      .to(heroImg, { scale: 1, duration: 2, ease: 'expo.inOut' }, '<')
      .to(navEls, { yPercent: 0, duration: 1.2, stagger: 0.08, ease: 'expo.out' }, '-=0.7')
      .to(heroLines, { yPercent: 0, duration: 1.4, stagger: 0.12, ease: 'expo.out' }, '<0.05')
      .to(heroFades, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.1, ease: 'power3.out' }, '<0.25')
      .to(heroCard, { autoAlpha: 1, y: 0, clipPath: 'inset(0% 0% 0% 0% round 12px)', duration: 1.3, ease: 'expo.out' }, '<0.1');
  });

  function afterIntro() {
    loader.remove();
    gsap.set(heroCard, { clearProps: 'clipPath' });
    lenis?.start();

    // Hero recedes into a porthole while scrolling away
    gsap.timeline({
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
    })
      .fromTo(heroMedia, { clipPath: CLIP_FULL }, {
        clipPath: () => (isMobile() ? 'inset(5% 3% 0% 3% round 40px)' : 'inset(9% 3% 0% 3% round 80px)'),
        ease: 'none',
      }, 0)
      .to(heroImg, { yPercent: 14, scale: 1.08, ease: 'none' }, 0)
      .to('.hero__content', { yPercent: -35, autoAlpha: 0, ease: 'none' }, 0)
      .to('.hero__card, .hero__scroll', { y: -80, autoAlpha: 0, ease: 'none' }, 0);

    ScrollTrigger.sort();
    ScrollTrigger.refresh();
  }

  window.addEventListener('load', () => { ScrollTrigger.sort(); ScrollTrigger.refresh(); });
})();
