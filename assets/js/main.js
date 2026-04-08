/**
 * main.js — haoranxu.org v2.1
 *
 * 1. Page transitions  — 0.18 s fade-out on leave; CSS handles the 0.5 s fade-in on arrive
 * 2. Navbar auto-hide  — hides on scroll-down, reappears on scroll-up
 * 3. Mobile nav toggle — hamburger
 * 4. Lightbox          — for gallery.html masonry images
 */

document.addEventListener('DOMContentLoaded', () => {


  /* ── 0. Progress Bar ─────────────────────────────────────── */
  /*
    pbStart()    — called on link click: bar appears at 2 % then crawls toward 75 %
    pbComplete() — called on page arrival: snaps to 100 % then fades out
    Fast load  → bar flashes gold and disappears (~0.5 s total)
    Slow load  → bar crawls on departure, then completes on arrival
  */
  const _pb = document.createElement('div');
  _pb.className = 'progress-bar';
  document.body.prepend(_pb);

  function pbStart() {
    _pb.style.transition = 'none';
    _pb.style.opacity    = '1';
    _pb.style.transform  = 'scaleX(0.02)';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      _pb.style.transition = 'transform 2.5s cubic-bezier(0.08, 0.04, 0.2, 1)';
      _pb.style.transform  = 'scaleX(0.75)';
    }));
  }

  function pbComplete() {
    _pb.style.transition = 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)';
    _pb.style.opacity    = '1';
    _pb.style.transform  = 'scaleX(1)';
    setTimeout(() => {
      _pb.style.transition = 'opacity 0.35s ease';
      _pb.style.opacity    = '0';
      setTimeout(() => { _pb.style.transform = 'scaleX(0)'; }, 400);
    }, 200);
  }

  // Complete bar on every page arrival
  pbComplete();


  /* ── 1. Page Transitions ─────────────────────────────────── */
  document.querySelectorAll('.nav-links a, .back-link, .panel-link, .works-entry, .btn-cta').forEach(el => {
    el.addEventListener('click', e => {
      const href = el.getAttribute('href') || el.closest('a')?.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto')) return;
      e.preventDefault();
      pbStart();
      document.body.classList.add('fade-out');
      setTimeout(() => { window.location.href = href; }, 200);
    });
  });


  /* ── 2. Navbar Hide / Show ───────────────────────────────── */
  const navbar = document.querySelector('.navbar');

  // Inner pages use .page-wrapper for scroll; home page uses window
  const scrollEl = document.querySelector('.page-wrapper') || window;
  let lastY = 0;

  const onScroll = () => {
    const y = scrollEl === window ? window.scrollY : scrollEl.scrollTop;
    const delta = y - lastY;
    if (delta > 6 && y > 40) {
      navbar?.classList.add('hidden');
    } else if (delta < -6) {
      navbar?.classList.remove('hidden');
    }
    lastY = Math.max(0, y);
  };

  scrollEl.addEventListener('scroll', onScroll, { passive: true });


  /* ── 3. Mobile Hamburger ─────────────────────────────────── */
  const toggle  = document.querySelector('.menu-toggle');
  const wrapper = document.querySelector('.nav-wrapper');

  if (toggle && wrapper) {
    toggle.addEventListener('click', () => {
      const open = wrapper.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
    });
    // Close when a link is tapped
    wrapper.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        wrapper.classList.remove('open');
        toggle.setAttribute('aria-expanded', false);
      });
    });
  }


  /* ── 4. Lightbox ─────────────────────────────────────────── */
  /*
    Collects all .masonry-item img elements on the page.
    Click → open lightbox at that index.
    Arrow buttons / keyboard ← → to navigate; Escape or click-outside to close.
  */
  const lightbox  = document.getElementById('lightbox');
  if (!lightbox) return;  // not on gallery page — bail early

  const lbImg   = document.getElementById('lightbox-img');
  const lbClose = document.getElementById('lightbox-close');
  const lbPrev  = document.getElementById('lightbox-prev');
  const lbNext  = document.getElementById('lightbox-next');

  // Collect all gallery images in DOM order
  const imgs = [...document.querySelectorAll('.masonry-item img')];
  let current = 0;

  function openAt(idx) {
    current = (idx + imgs.length) % imgs.length;
    // Use data-full for hi-res, fall back to src
    lbImg.src = imgs[current].dataset.full || imgs[current].src;
    lbImg.alt = imgs[current].alt || '';
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
    // Clear src after transition so browser doesn't keep image in memory
    setTimeout(() => { lbImg.src = ''; }, 250);
  }

  // Attach click to each thumbnail
  imgs.forEach((img, i) => {
    img.closest('.masonry-item').addEventListener('click', () => openAt(i));
  });

  lbClose.addEventListener('click', close);
  lbPrev.addEventListener('click',  () => openAt(current - 1));
  lbNext.addEventListener('click',  () => openAt(current + 1));

  // Click the dark backdrop (not the image) to close
  lightbox.addEventListener('click', e => {
    if (e.target === lightbox) close();
  });

  // Keyboard navigation
  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape')      close();
    if (e.key === 'ArrowLeft')   openAt(current - 1);
    if (e.key === 'ArrowRight')  openAt(current + 1);
  });

});


/* ── 5. Gallery image entrance (runs on all pages, no-op if no items) ── */
/*
  Reveals .masonry-item elements in strict DOM order (= visual row order)
  and only after each image has actually finished downloading.

  Fast load  → items appear left-to-right, top-to-bottom, 70 ms apart.
  Slow load  → items queue up behind any slow image; reveal as soon as
               the blocker finishes. Error images never block the chain.
*/
(function () {
  const items = [...document.querySelectorAll('.masonry-item')];
  if (!items.length) return;

  // loaded[i] becomes true once item i's image is ready (or errored)
  const loaded   = new Array(items.length).fill(false);
  let nextReveal = 0;
  // initialised so the very first item gets delay = 0
  let lastSchedAt = performance.now() - 70;

  function tryFlush() {
    while (nextReveal < items.length && loaded[nextReveal]) {
      const item  = items[nextReveal];
      const now   = performance.now();
      // guarantee at least 70 ms between successive reveals
      const delay = Math.max(0, lastSchedAt + 70 - now);
      lastSchedAt = now + delay;
      ;(function (el, d) {
        setTimeout(() => el.classList.add('visible'), d);
      })(item, delay);
      nextReveal++;
    }
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      const idx  = items.indexOf(entry.target);
      const img  = entry.target.querySelector('img');
      const mark = () => { loaded[idx] = true; tryFlush(); };
      // If browser already has the image (cache hit), reveal immediately
      if (img.complete) mark();
      else {
        img.addEventListener('load',  mark, { once: true });
        img.addEventListener('error', mark, { once: true }); // broken img won't block chain
      }
    });
  }, { threshold: 0.08 });

  items.forEach(item => observer.observe(item));
}());
