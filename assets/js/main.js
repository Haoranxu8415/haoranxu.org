/**
 * main.js — haoranxu.org
 *
 * 0. Progress bar      — real arrival progress (images / fonts / fetches actually loading);
 *                        indeterminate "waiting" sweep only if leaving takes > 300 ms
 * 1. Page transitions  — native cross-document View Transitions (pure CSS, see style.css §5);
 *                        JS only starts the waiting state on internal link clicks
 * 2. Stagger entrance  — assigns --stagger-i to .work-card and .post-card
 * 3. Mobile nav toggle — hamburger
 * 4. Navbar auto-hide · Latest button · Contact local time
 * 5. Lightbox          — zooms from / back to its thumbnail (FLIP), ← → / Escape,
 *                        swipe sideways to navigate, swipe down to close, pinch to zoom
 * 6. Gallery           — JS masonry columns (WebKit-safe) + staggered entrance
 */

const REDUCED_MOTION = matchMedia('(prefers-reduced-motion: reduce)');
// Mirrors --dur-fast / --dur-base / --dur-slow in style.css
const DUR = { fast: 150, base: 240, slow: 450 };
const dur = ms => (REDUCED_MOTION.matches ? 0 : ms);


/* ── 0. Progress bar ───────────────────────────────────────── */
/*
  Arrival: tracks what this page is really waiting for — images that will load
  now (eager, or lazy but already on screen), web fonts, and anything registered
  through window.pbTrack(promise) (notes.js registers its Markdown fetches).
  Width = settled / total. Only appears if the page isn't ready within 150 ms,
  so fast (cached) loads show nothing at all.
  Runs at top level (not in DOMContentLoaded) so pbTrack exists before notes.js runs.
*/
const progress = (() => {
  const bar = document.createElement('div');
  bar.className = 'progress-bar';
  bar.setAttribute('aria-hidden', 'true');
  document.body.prepend(bar);

  let total = 0, settled = 0, armed = false, shown = false, finished = false, waitTimer = 0;

  function render() {
    if (shown && !finished) bar.style.transform = `scaleX(${Math.max(0.06, settled / total)})`;
  }
  function finish() {
    finished = true;
    if (!shown) return;
    bar.style.transform = 'scaleX(1)';
    setTimeout(() => { bar.style.opacity = '0'; }, DUR.base);
  }
  function check() {
    if (armed && !finished && settled >= total) finish();
  }
  function track(p) {
    if (finished) return;
    total++;
    const done = () => { settled++; render(); check(); };
    Promise.resolve(p).then(done, done);
  }

  const fold = innerHeight;
  document.querySelectorAll('img').forEach(img => {
    if (img.complete) return;
    if (img.loading === 'lazy' && img.getBoundingClientRect().top > fold) return;  // not needed yet
    track(new Promise(r => {
      img.addEventListener('load',  r, { once: true });
      img.addEventListener('error', r, { once: true });
    }));
  });
  if (document.fonts && document.fonts.status !== 'loaded') track(document.fonts.ready);

  // Arm after every DOMContentLoaded handler has had the chance to register work
  document.addEventListener('DOMContentLoaded', () => setTimeout(() => {
    armed = true;
    check();
    setTimeout(() => {
      if (finished) return;
      shown = true;
      bar.style.opacity = '1';
      render();
    }, 150);
  }));

  return {
    track,
    // Leaving: the next document's progress can't be observed from here — be honest about it
    wait() {
      clearTimeout(waitTimer);
      waitTimer = setTimeout(() => {
        bar.style.opacity = '';
        bar.style.transform = '';
        bar.classList.add('waiting');
      }, 300);
    },
    reset() {
      clearTimeout(waitTimer);
      bar.classList.remove('waiting');
      bar.style.opacity = '0';
    },
  };
})();
window.pbTrack = progress.track;


/* ── 1. Page transitions ───────────────────────────────────── */
// The visual transition is CSS (@view-transition). Here: flag a real navigation
// so the waiting sweep can appear if the next page is slow.
document.addEventListener('click', e => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target.closest('a[href]');
  if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin) return;
  if (url.pathname === location.pathname && url.search === location.search) return;  // in-page anchor
  progress.wait();
});
// Back/forward restores this page from bfcache — clear any waiting state it was frozen in
window.addEventListener('pageshow', e => { if (e.persisted) progress.reset(); });


document.addEventListener('DOMContentLoaded', () => {


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
  // Inner pages scroll inside .page-wrapper, not the window — listen to whichever scrolls
  const navbar   = document.querySelector('.navbar');
  const scroller = document.querySelector('.page-wrapper');
  if (navbar) {
    const getY = () => (scroller ? scroller.scrollTop : window.scrollY);
    let lastY = getY();
    (scroller || window).addEventListener('scroll', () => {
      if (wrapper?.classList.contains('open')) return;   // never hide under the open mobile menu
      const y = getY();
      if (Math.abs(y - lastY) < 6) return;                // ignore jitter / momentum tails
      navbar.classList.toggle('hidden', y > lastY && y > 80);
      lastY = y;
    }, { passive: true });
  }


  /* ── 4b. Latest button — scrolls .page-wrapper to top ───── */
  const latestBtn = document.querySelector('.newest-button');
  if (latestBtn) {
    latestBtn.addEventListener('click', e => {
      e.preventDefault();
      const behavior = REDUCED_MOTION.matches ? 'auto' : 'smooth';
      if (scroller) scroller.scrollTo({ top: 0, behavior });
    });
  }


  /* ── 4c. Contact local time — live Vancouver time, PDT/PST switches itself ── */
  const localTime = document.querySelector('[data-local-time]');
  if (localTime) {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Vancouver', hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
    });
    const tick = () => { localTime.textContent = fmt.format(new Date()); };
    tick();
    setInterval(tick, 30000);
  }


  /* ── 5. Lightbox ─────────────────────────────────────────── */
  /*
    Open: the photo grows out of its thumbnail (FLIP) while the backdrop fades in.
    The thumbnail (already decoded) shows instantly; the 2400 px version swaps in
    once decoded — the viewer box is sized from the aspect ratio, so nothing jumps.
    Close: flies back into the (current) thumbnail if it's on screen, else fades.
    Touch: axis-locked drag — sideways previews/navigates, down follows the finger
    and dims the backdrop, pinch zooms.
  */
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;  // not on gallery page — bail early

  const lbImg     = document.getElementById('lightbox-img');
  const lbClose   = document.getElementById('lightbox-close');
  const lbPrev    = document.getElementById('lightbox-prev');
  const lbNext    = document.getElementById('lightbox-next');
  const lbCounter = document.getElementById('lightbox-counter');

  const allImgs = [...document.querySelectorAll('.masonry-item img')];
  let sortedImgs = [];   // visual order snapshot — rebuilt each time the lightbox opens
  let current = 0;
  let _scale = 1;        // pinch-zoom level
  let _navTimer = 0, _closeTimer = 0, _returnFocus = null;

  const isOpen = () => lightbox.classList.contains('open');
  const wrap   = i => (i + sortedImgs.length) % sortedImgs.length;

  // Sort by screen position: top→bottom, then left→right (row-major visual order)
  function buildVisualOrder() {
    sortedImgs = [...allImgs].sort((a, b) => {
      const ra = a.closest('.masonry-item').getBoundingClientRect();
      const rb = b.closest('.masonry-item').getBoundingClientRect();
      if (Math.abs(ra.top - rb.top) > 30) return ra.top - rb.top;
      return ra.left - rb.left;
    });
  }

  // Viewer box: fits 92 % × 88 % of the lightbox at the thumbnail's aspect ratio
  function fitBox(thumb) {
    const ar = (+thumb.getAttribute('width') / +thumb.getAttribute('height'))
            || (thumb.naturalWidth / thumb.naturalHeight) || 1.5;
    const width = Math.min(lightbox.clientWidth * 0.92, lightbox.clientHeight * 0.88 * ar);
    return { width, height: width / ar };
  }
  // Untransformed rect of the viewer image (flex-centred in the lightbox)
  function layoutRect() {
    const width = parseFloat(lbImg.style.width), height = parseFloat(lbImg.style.height);
    return { left: (lightbox.clientWidth - width) / 2, top: (lightbox.clientHeight - height) / 2, width, height };
  }
  // Transform that makes the viewer image cover `r` (screen rect)
  function coverRect(r) {
    const to = layoutRect();
    const dx = (r.left + r.width / 2) - (to.left + to.width / 2);
    const dy = (r.top + r.height / 2) - (to.top + to.height / 2);
    return `translate(${dx}px, ${dy}px) scale(${r.width / to.width}, ${r.height / to.height})`;
  }
  const onScreen = r => r.width > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;

  function setTransition(value) {
    lbImg.style.transition = value;
  }

  // Put `thumb` into the viewer: instant thumbnail, full-res when decoded, warm neighbours
  function show(thumb) {
    const box = fitBox(thumb);
    lbImg.style.width  = `${box.width}px`;
    lbImg.style.height = `${box.height}px`;
    lbImg.alt = thumb.alt || '';
    lbImg.src = thumb.currentSrc || thumb.src;
    const full = thumb.dataset.full;
    if (full) {
      const hi = new Image();
      hi.src = full;
      hi.decode().then(() => {
        if (isOpen() && sortedImgs[current] === thumb) lbImg.src = full;
      }, () => {});
    }
    [-1, 1].forEach(d => {
      const n = sortedImgs[wrap(current + d)];
      if (n.dataset.full) new Image().src = n.dataset.full;
    });
  }

  function setCounter(animate) {
    if (!lbCounter) return;
    lbCounter.textContent = `${current + 1} / ${sortedImgs.length}`;
    if (!animate) return;
    lbCounter.classList.remove('tick');
    void lbCounter.offsetWidth;  // restart the tick animation
    lbCounter.classList.add('tick');
  }

  function open(idx) {
    clearTimeout(_closeTimer);
    clearTimeout(_navTimer);
    current = idx;
    _scale = 1;
    const thumb = sortedImgs[current];
    setCounter(false);
    show(thumb);

    const from = thumb.getBoundingClientRect();
    setTransition('none');
    lbImg.style.opacity   = '1';
    lbImg.style.transform = onScreen(from) && !REDUCED_MOTION.matches ? coverRect(from) : 'scale(.96)';
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';

    lbImg.getBoundingClientRect();  // commit the start frame
    setTransition(`transform ${dur(DUR.slow)}ms var(--ease-out)`);
    lbImg.style.transform = 'none';
  }

  // delta: +1 next, -1 previous
  function go(delta) {
    if (!isOpen()) return;
    clearTimeout(_navTimer);
    current = wrap(current + delta);
    _scale = 1;
    const thumb = sortedImgs[current];
    setCounter(true);

    const out = dur(140);
    setTransition(`opacity ${out}ms var(--ease-inout), transform ${out}ms var(--ease-inout)`);
    lbImg.style.opacity   = '0';
    lbImg.style.transform = `translateX(${-delta * 28}px) scale(.97)`;

    _navTimer = setTimeout(() => {
      show(thumb);
      setTransition('none');
      lbImg.style.transform = `translateX(${delta * 28}px) scale(.97)`;
      lbImg.getBoundingClientRect();
      setTransition(`opacity ${dur(DUR.base)}ms var(--ease-out), transform ${dur(DUR.slow)}ms var(--ease-out)`);
      lbImg.style.opacity   = '1';
      lbImg.style.transform = 'none';
    }, out);
  }

  function close() {
    if (!isOpen()) return;
    clearTimeout(_navTimer);
    const to = sortedImgs[current].getBoundingClientRect();

    lightbox.classList.remove('open', 'dragging');
    lightbox.style.removeProperty('--lb-drag');
    document.body.style.overflow = '';
    if (lbCounter) lbCounter.classList.remove('tick');

    if (onScreen(to) && !REDUCED_MOTION.matches) {
      // Fly back into the thumbnail, fading only for the last beat so it lands on it
      setTransition(`transform ${DUR.slow}ms var(--ease-out), opacity ${DUR.fast}ms linear ${DUR.slow - DUR.fast}ms`);
      lbImg.style.transform = coverRect(to);
    } else {
      setTransition(`transform ${dur(DUR.base)}ms var(--ease-out), opacity ${dur(DUR.base)}ms var(--ease-inout)`);
      lbImg.style.transform = 'scale(.96)';
    }
    lbImg.style.opacity = '0';

    if (_returnFocus) { _returnFocus.focus({ preventScroll: true }); _returnFocus = null; }

    _closeTimer = setTimeout(() => {
      lbImg.removeAttribute('src');
      setTransition('none');
      lbImg.style.transform = '';
    }, DUR.slow);
  }

  // Attach click + keyboard (Enter / Space) to each thumbnail — build visual order on open
  allImgs.forEach(img => {
    const item = img.closest('.masonry-item');
    const openThis = () => {
      _returnFocus = item;
      buildVisualOrder();
      open(sortedImgs.indexOf(img));
      lbClose.focus({ preventScroll: true });
    };
    item.tabIndex = 0;
    item.setAttribute('role', 'button');
    item.setAttribute('aria-label', `View photo: ${img.alt}`);
    item.addEventListener('click', openThis);
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openThis(); }
    });
  });

  lbClose.addEventListener('click', close);
  lbPrev.addEventListener('click', () => go(-1));
  lbNext.addEventListener('click', () => go(1));

  // Click the dark backdrop (not the image) to close
  lightbox.addEventListener('click', e => {
    if (e.target === lightbox) close();
  });

  // Keyboard navigation
  document.addEventListener('keydown', e => {
    if (!isOpen()) return;
    if (e.key === 'Tab') {
      // Keep focus inside the viewer
      const f = [lbClose, lbPrev, lbNext];
      const i = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(i + (e.shiftKey ? f.length - 1 : 1)) % f.length].focus();
    }
    if (e.key === 'Escape')     close();
    if (e.key === 'ArrowLeft')  go(-1);
    if (e.key === 'ArrowRight') go(1);
  });

  // Touch: axis-locked drag preview + pinch-to-zoom + swipe to navigate / close
  let _tx = 0, _ty = 0, _axis = null, _pinchDist0 = 0, _scale0 = 1;

  function springBack() {
    lightbox.classList.remove('dragging');
    lightbox.style.removeProperty('--lb-drag');
    setTransition(`transform ${dur(400)}ms var(--spring)`);
    lbImg.style.transform = _scale > 1.05 ? `scale(${_scale})` : 'none';
  }

  lightbox.addEventListener('touchstart', e => {
    setTransition('none');
    if (e.touches.length === 1) {
      _tx = e.touches[0].clientX;
      _ty = e.touches[0].clientY;
      _axis = null;
    } else if (e.touches.length === 2) {
      _pinchDist0 = Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY
      );
      _scale0 = _scale;
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
      return;
    }
    if (e.touches.length !== 1 || _scale > 1.05) return;  // zoomed in: no drag preview

    const dx = e.touches[0].clientX - _tx;
    const dy = e.touches[0].clientY - _ty;
    if (!_axis && Math.hypot(dx, dy) > 8) _axis = Math.abs(dy) > Math.abs(dx) ? 'y' : 'x';

    if (_axis === 'x') {
      lbImg.style.transform = `translateX(${dx * 0.6}px)`;
    } else if (_axis === 'y') {
      // Follow the finger; shrink slightly and let the gallery show through
      const p = Math.min(Math.abs(dy) / 320, 1);
      lightbox.classList.add('dragging');
      lightbox.style.setProperty('--lb-drag', 1 - p * 0.8);
      lbImg.style.transform = `translate(${dx * 0.35}px, ${dy}px) scale(${1 - p * 0.18})`;
    }
  }, { passive: true });

  lightbox.addEventListener('touchend', e => {
    if (_pinchDist0 > 0) {
      // Pinch released (one or both fingers) — snap back if near 1×
      _pinchDist0 = 0;
      if (_scale < 1.1) _scale = 1;
      springBack();
      if (e.touches.length === 1) {
        _tx = e.touches[0].clientX;
        _ty = e.touches[0].clientY;
        _axis = null;
      }
      return;
    }
    if (e.touches.length > 0) return;
    if (_scale > 1.05) { springBack(); return; }

    const dx = e.changedTouches[0].clientX - _tx;
    const dy = e.changedTouches[0].clientY - _ty;

    if (_axis === 'y' && Math.abs(dy) > 80)      close();
    else if (_axis === 'x' && Math.abs(dx) > 55) go(dx > 0 ? -1 : 1);
    else                                          springBack();
  }, { passive: true });

});


/* ── 6. Gallery — masonry columns + entrance (visual row-major order, 70 ms apart) ── */
/*
  Items are spread over columns, but the user reads left→right across each
  row. We sort by visual position (top then left, with a 30 px threshold for
  "same row") after layout so the stagger sweeps across each row rather than
  down each column.
*/
(function () {
  const items = [...document.querySelectorAll('.masonry-item')];
  if (!items.length) return;

  /* Masonry: distribute items into --cols flex columns, each into the currently
     shortest one (heights from the width/height attributes — no image load needed).
     Replaces CSS multi-column, which WebKit mis-renders once items animate. */
  const grid = document.getElementById('masonry-grid');
  let cols = 0;
  function split() {
    const n = parseInt(getComputedStyle(grid).getPropertyValue('--cols'), 10) || 4;
    if (n === cols) return;
    cols = n;
    const columns = Array.from({ length: n }, () => {
      const c = document.createElement('div');
      c.className = 'masonry-col';
      return c;
    });
    const heights = new Array(n).fill(0);
    items.forEach(item => {
      if (item.style.display === 'none') return;          // failed image (onerror)
      const img = item.querySelector('img');
      const ratio = (+img.getAttribute('height') / +img.getAttribute('width')) || 0.67;
      const i = heights.indexOf(Math.min(...heights));
      columns[i].appendChild(item);                       // moves the node; listeners stay attached
      heights[i] += ratio;
    });
    grid.replaceChildren(...columns);
    grid.classList.add('is-split');
  }
  split();
  let resizeRaf = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => { split(); check(); });
  });

  /* Entrance: each item fades in once it is on screen and its photo has loaded,
     staggered 70 ms apart in visual (row-major) order. Items never wait on each
     other, and visibility comes from getBoundingClientRect on load / scroll —
     no IntersectionObserver or rAF chain that can stall the whole queue. */
  const pending = new Set(items);
  let lastAt = 0;

  function reveal(item) {
    pending.delete(item);
    const now = performance.now();
    const at  = Math.max(now, lastAt + 70);
    lastAt = at;
    setTimeout(() => item.classList.add('visible'), at - now);
  }

  function check() {
    if (!pending.size) return;
    const vh = innerHeight;
    [...pending]
      .map(el => [el, el.getBoundingClientRect()])
      .filter(([el, r]) => r.top < vh && r.bottom > 0 && el.querySelector('img').complete)
      .sort(([, a], [, b]) => (Math.abs(a.top - b.top) > 30 ? a.top - b.top : a.left - b.left))
      .forEach(([el]) => reveal(el));
  }

  items.forEach(item => {
    const img = item.querySelector('img');
    img.addEventListener('load',  check);
    img.addEventListener('error', () => pending.delete(item));  // onerror hides the item
  });
  let scrollRaf = 0;
  (document.querySelector('.page-wrapper') || window).addEventListener('scroll', () => {
    cancelAnimationFrame(scrollRaf);
    scrollRaf = requestAnimationFrame(check);
  }, { passive: true });
  window.addEventListener('load', check);
  check();   // deferred script: styles are applied, layout is readable now
}());
