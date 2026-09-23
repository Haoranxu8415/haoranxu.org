/**
 * main.js — haoranxu.org
 *
 * 0. Progress bar      — gold line on page load/navigate
 * 1. Page transitions  — 0.18 s fade-out on leave; CSS fade-in on arrive
 * 2. Stagger entrance  — assigns --stagger-i to .work-card and .post-card
 * 3. Mobile nav toggle — hamburger
 * 4. Latest button     — scrolls .page-wrapper to top (mobile-safe)
 * 5. Lightbox          — gallery image viewer (← → / Escape)
 * 6. Gallery entrance  — reveals .masonry-item in DOM order after load
 */

document.addEventListener('DOMContentLoaded', () => {


  /* ── 0. Progress Bar ─────────────────────────────────────── */
  // pbStart: crawls to 75% on navigate; pbComplete: snaps to 100% then fades
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

  pbComplete(); // complete on every page arrival


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


  /* ── 2. Stagger entrance ─────────────────────────────────── */
  // Sets --stagger-i (0-based index) so CSS animation-delay cascades each item.
  // Covers static card lists (works.html, notes.html); home panel entries are
  // handled in home.js which creates them dynamically.
  [
    [...document.querySelectorAll('.work-card')],
    [...document.querySelectorAll('.post-card')],
    [...document.querySelectorAll('.contact-card, .social-card')],
  ].forEach(list => {
    list.forEach((el, i) => el.style.setProperty('--stagger-i', i));
  });


  /* ── 3. Mobile Hamburger ─────────────────────────────────── */
  const toggle  = document.querySelector('.menu-toggle');
  const wrapper = document.querySelector('.nav-wrapper');

  if (toggle && wrapper) {
    function setMenuOpen(open) {
      if (!open && wrapper.classList.contains('open')) {
        // Animate links back down before fading the overlay
        wrapper.classList.add('closing');
        wrapper.classList.remove('open');
        setTimeout(() => wrapper.classList.remove('closing'), 320);
      } else {
        wrapper.classList.remove('closing');
        wrapper.classList.toggle('open', open);
      }
      toggle.setAttribute('aria-expanded', open);
      document.body.style.overflow = open ? 'hidden' : '';
    }

    toggle.addEventListener('click', () => setMenuOpen(!wrapper.classList.contains('open')));

    // Close on link tap or Escape
    wrapper.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => setMenuOpen(false))
    );
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && wrapper.classList.contains('open')) setMenuOpen(false);
    });
  }


  /* ── 4a. Navbar auto-hide on scroll ─────────────────────── */
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    let lastScrollY = window.scrollY;
    window.addEventListener('scroll', () => {
      // Don't hide when the mobile menu is open
      if (wrapper?.classList.contains('open')) return;
      const y = window.scrollY;
      navbar.classList.toggle('hidden', y > lastScrollY && y > 80);
      lastScrollY = y;
    }, { passive: true });
  }


  /* ── 4. Latest button — scrolls .page-wrapper to top ───────── */
  const latestBtn = document.querySelector('.newest-button');
  if (latestBtn) {
    latestBtn.addEventListener('click', e => {
      e.preventDefault();
      const pw = document.querySelector('.page-wrapper');
      if (pw) pw.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }


  /* ── 5. Lightbox ─────────────────────────────────────────── */
  /*
    Collects all .masonry-item img elements on the page.
    Click → open lightbox at that index.
    Arrow buttons / keyboard ← → to navigate; Escape or click-outside to close.
    Touch: drag preview (live translate) · pinch to zoom · swipe to navigate/close.
  */
  const lightbox  = document.getElementById('lightbox');
  if (!lightbox) return;  // not on gallery page — bail early

  const lbImg     = document.getElementById('lightbox-img');
  const lbClose   = document.getElementById('lightbox-close');
  const lbPrev    = document.getElementById('lightbox-prev');
  const lbNext    = document.getElementById('lightbox-next');
  const lbCounter = document.getElementById('lightbox-counter');

  // All gallery images (DOM order, constant)
  const allImgs = [...document.querySelectorAll('.masonry-item img')];
  // Visual order snapshot — rebuilt each time the lightbox opens
  let sortedImgs = [];
  let current = 0;
  let _scale = 1;  // current pinch-zoom level

  // Sort by screen position: top→bottom, then left→right (row-major visual order)
  function buildVisualOrder() {
    sortedImgs = [...allImgs].sort((a, b) => {
      const ra = a.closest('.masonry-item').getBoundingClientRect();
      const rb = b.closest('.masonry-item').getBoundingClientRect();
      if (Math.abs(ra.top - rb.top) > 30) return ra.top - rb.top;
      return ra.left - rb.left;
    });
  }

  // dir: 1 = forward (next), -1 = backward (prev), 0 = first open
  function openAt(idx, dir = 0) {
    current = (idx + sortedImgs.length) % sortedImgs.length;
    const src = sortedImgs[current].dataset.full || sortedImgs[current].src;
    const alt = sortedImgs[current].alt || '';

    // Preload adjacent images
    [-1, 1].forEach(d => {
      const i = (current + d + sortedImgs.length) % sortedImgs.length;
      new Image().src = sortedImgs[i].dataset.full || sortedImgs[i].src;
    });

    function loadAndShow() {
      _scale = 1;
      lbImg.style.transition = 'none';
      // New image starts offset + scaled down; restores with CSS transition
      lbImg.style.transform = dir !== 0
        ? `translateX(${dir * 28}px) scale(0.96)`
        : 'scale(0.96)';
      lbImg.alt = alt;
      lbImg.src = src;
      const restore = () => requestAnimationFrame(() => {
        lbImg.style.transition = '';   // hand back to CSS (opacity + transform)
        lbImg.style.opacity    = '1';
        lbImg.style.transform  = 'scale(1)';
      });
      if (lbImg.complete && lbImg.naturalWidth) restore();
      else {
        lbImg.addEventListener('load',  restore, { once: true });
        lbImg.addEventListener('error', restore, { once: true });
      }
    }

    if (!lightbox.classList.contains('open')) {
      // First open — just set counter text, no tick animation yet
      if (lbCounter) lbCounter.textContent = `${current + 1} / ${sortedImgs.length}`;
      lbImg.style.opacity = '0';
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
      loadAndShow();
    } else {
      // Navigating — counter digit slips in, current image slides out
      if (lbCounter) {
        lbCounter.classList.remove('tick');
        void lbCounter.offsetWidth;  // force reflow to restart animation
        lbCounter.textContent = `${current + 1} / ${sortedImgs.length}`;
        lbCounter.classList.add('tick');
      }
      if (dir !== 0) {
        lbImg.style.transition = 'opacity .16s ease, transform .16s ease';
        lbImg.style.transform  = `translateX(${-dir * 28}px) scale(0.96)`;
        lbImg.style.opacity    = '0';
      } else {
        lbImg.style.transition = '';
        lbImg.style.transform  = '';
        lbImg.style.opacity    = '0';
      }
      setTimeout(loadAndShow, 180);
    }
  }

  function close() {
    _scale = 1;
    if (lbCounter) lbCounter.classList.remove('tick');
    lbImg.style.transition = 'opacity .18s ease, transform .22s ease';
    lbImg.style.transform  = 'scale(0.95)';
    lbImg.style.opacity    = '0';
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(() => {
      lbImg.src = '';
      lbImg.style.transition = '';
      lbImg.style.transform  = '';
      lbImg.style.opacity    = '0';
    }, 250);
  }

  // Attach click to each thumbnail — build visual order on open
  allImgs.forEach((img) => {
    img.closest('.masonry-item').addEventListener('click', () => {
      buildVisualOrder();
      openAt(sortedImgs.indexOf(img));
    });
  });

  lbClose.addEventListener('click', close);
  lbPrev.addEventListener('click',  () => openAt(current - 1, -1));
  lbNext.addEventListener('click',  () => openAt(current + 1,  1));

  // Click the dark backdrop (not the image) to close
  lightbox.addEventListener('click', e => {
    if (e.target === lightbox) close();
  });

  // Keyboard navigation
  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape')      close();
    if (e.key === 'ArrowLeft')   openAt(current - 1, -1);
    if (e.key === 'ArrowRight')  openAt(current + 1,  1);
  });

  // Touch: drag preview + pinch-to-zoom + swipe-to-navigate/close
  let _tx = 0, _ty = 0, _pinchDist0 = 0, _scale0 = 1;

  lightbox.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
      _tx = e.touches[0].clientX;
      _ty = e.touches[0].clientY;
      lbImg.style.transition = 'none';
    } else if (e.touches.length === 2) {
      _pinchDist0 = Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY
      );
      _scale0 = _scale;
      lbImg.style.transition = 'none';
    }
  }, { passive: true });

  lightbox.addEventListener('touchmove', e => {
    if (e.touches.length === 2 && _pinchDist0 > 0) {
      const dist = Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY
      );
      _scale = Math.max(0.5, Math.min(4, _scale0 * dist / _pinchDist0));
      lbImg.style.transform = `scale(${_scale})`;
    } else if (e.touches.length === 1 && _scale <= 1.05) {
      // Live drag preview — only when not zoomed in
      const dx = e.touches[0].clientX - _tx;
      lbImg.style.transform = `translateX(${dx * 0.6}px)`;
    }
  }, { passive: true });

  lightbox.addEventListener('touchend', e => {
    if (e.touches.length === 1 && _pinchDist0 > 0) {
      // One finger released from pinch — snap back if near 1x, update anchor
      _pinchDist0 = 0;
      if (_scale < 1.1) {
        _scale = 1;
        lbImg.style.transition = 'transform .35s var(--spring)';
        lbImg.style.transform  = '';
      }
      _tx = e.touches[0].clientX;
      _ty = e.touches[0].clientY;
      return;
    }
    if (e.touches.length > 0) return;

    if (_pinchDist0 > 0) {
      _pinchDist0 = 0;
      if (_scale < 1.1) {
        _scale = 1;
        lbImg.style.transition = 'transform .35s var(--spring)';
        lbImg.style.transform  = '';
      }
      return;
    }

    // Single-finger swipe completed
    const dx = e.changedTouches[0].clientX - _tx;
    const dy = e.changedTouches[0].clientY - _ty;

    if (_scale > 1.05) {
      // Zoomed in — restore scale transform, no navigation
      lbImg.style.transition = 'transform .35s var(--spring)';
      lbImg.style.transform  = `scale(${_scale})`;
      return;
    }

    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 80) {
      close();
    } else if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) {
      dx > 0 ? openAt(current - 1, -1) : openAt(current + 1, 1);
    } else {
      // Snap back with spring overshoot
      lbImg.style.transition = 'transform .4s var(--spring)';
      lbImg.style.transform  = '';
    }
  }, { passive: true });

});


/* ── 6. Gallery entrance — reveals items in visual row-major order, 70 ms apart ──── */
/*
  CSS columns flows top→bottom per column (DOM order), but the user sees
  items left→right across each row. We sort by visual position (top then
  left, with a 30 px threshold for "same row") after layout so the stagger
  sweeps across each row rather than down each column.
*/
(function () {
  const items = [...document.querySelectorAll('.masonry-item')];
  if (!items.length) return;

  const loadedSet = new Set();
  let sortedItems = null;   // populated after first rAF paint
  let nextReveal  = 0;
  let lastSchedAt = performance.now() - 70;

  function tryFlush() {
    if (!sortedItems) return;
    while (nextReveal < sortedItems.length && loadedSet.has(sortedItems[nextReveal])) {
      const item  = sortedItems[nextReveal];
      const now   = performance.now();
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
      const img  = entry.target.querySelector('img');
      const mark = () => { loadedSet.add(entry.target); tryFlush(); };
      if (img.complete) mark();
      else {
        img.addEventListener('load',  mark, { once: true });
        img.addEventListener('error', mark, { once: true });
      }
    });
  }, { threshold: 0.08 });

  items.forEach(item => observer.observe(item));

  // After two rAF cycles the browser has painted and getBoundingClientRect is accurate
  requestAnimationFrame(() => requestAnimationFrame(() => {
    sortedItems = [...items].sort((a, b) => {
      const ra = a.getBoundingClientRect();
      const rb = b.getBoundingClientRect();
      if (Math.abs(ra.top - rb.top) > 30) return ra.top - rb.top;
      return ra.left - rb.left;
    });
    tryFlush();
  }));
}());
