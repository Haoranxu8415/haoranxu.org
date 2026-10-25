/**
 * main.js — haoranxu.org
 *
 * 0. Progress bar      — real arrival progress (images / fonts / fetches actually loading);
 *                        indeterminate "waiting" sweep only if leaving takes > 300 ms
 * 1. Page transitions  — native cross-document View Transitions (pure CSS, see style.css §5);
 *                        JS only starts the waiting state on internal link clicks
 * 2. Stagger entrance  — assigns --stagger-i to .file and .post-card
 * 3. Mobile nav toggle — hamburger
 * 4. Navbar auto-hide · Latest button · Contact local time
 * 5. Lightbox          — zooms from / back to its thumbnail (FLIP), ← → / Escape,
 *                        swipe sideways to navigate, swipe down to close, pinch to zoom
 * 6. Gallery           — rolls in justified rows + staggered entrance
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
  // Covers the works files and the notes entries.
  [
    [...document.querySelectorAll('.file')],
    [...document.querySelectorAll('.post-card')],
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


  /* ── 4c. Navbar: frosted once content is under it · gold ink under the current page ── */
  if (navbar && wrapper) {
    const getY = () => (scroller ? scroller.scrollTop : window.scrollY);
    const setScrolled = () => navbar.classList.toggle('scrolled', getY() > 4);
    (scroller || window).addEventListener('scroll', setScrolled, { passive: true });
    setScrolled();

    const links  = [...wrapper.querySelectorAll('.nav-links a')];
    const active = links.find(a => a.classList.contains('active'));
    const ink = document.createElement('span');
    ink.className = 'nav-ink no-anim';
    ink.setAttribute('aria-hidden', 'true');
    wrapper.appendChild(ink);
    // Sits under the label text (not the padded hit area); hidden on pages with no active link
    const place = (a, animate = true) => {
      if (!a) { ink.style.opacity = '0'; return; }
      const r = document.createRange();
      r.selectNodeContents(a.querySelector('.nav-label') || a);
      const t = r.getBoundingClientRect(), w = wrapper.getBoundingClientRect();
      ink.classList.toggle('no-anim', !animate);
      ink.style.opacity = '1';
      ink.style.width = t.width + 'px';
      ink.style.transform = `translateX(${t.left - w.left}px)`;
    };
    place(active, false);
    document.fonts?.ready.then(() => place(active, false));
    window.addEventListener('resize', () => place(active, false));
    links.forEach(a => {
      a.addEventListener('pointerenter', () => place(a));
      a.addEventListener('focus', () => place(a));
      a.addEventListener('click', () => place(a));   // the ink leaves for the new page
    });
    wrapper.querySelector('.nav-links').addEventListener('pointerleave', () => place(active));
    wrapper.addEventListener('focusout', e => { if (!wrapper.contains(e.relatedTarget)) place(active); });
  }

  /* ── 4d. Home: the small name appears only once the big one has scrolled away ── */
  const bigName = document.querySelector('.page-home .h-name');
  if (navbar && bigName) {
    document.documentElement.classList.add('nav-home');
    const checkName = () => document.documentElement.classList.toggle('logo-on',
      bigName.getBoundingClientRect().bottom < navbar.getBoundingClientRect().bottom);
    window.addEventListener('scroll', checkName, { passive: true });
    checkName();
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
  const lbCaption = document.getElementById('lightbox-caption');

  const allImgs = [...document.querySelectorAll('.shot img')];
  let sortedImgs = [];   // visual order snapshot — rebuilt each time the lightbox opens
  let current = 0;
  let _scale = 1;        // pinch-zoom level
  let _navTimer = 0, _closeTimer = 0, _returnFocus = null;

  const isOpen = () => lightbox.classList.contains('open');
  const wrap   = i => (i + sortedImgs.length) % sortedImgs.length;

  // Sort by screen position: top→bottom, then left→right (row-major visual order)
  function buildVisualOrder() {
    sortedImgs = [...allImgs].sort((a, b) => {
      const ra = a.closest('.shot').getBoundingClientRect();
      const rb = b.closest('.shot').getBoundingClientRect();
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
    if (lbCaption) {
      lbCaption.textContent = thumb.alt || '';
      // shooting notes follow the title on the same line (desktop; hidden on phones)
      const ex = thumb.closest('.shot')?.querySelector('.exif');
      if (ex) lbCaption.append(Object.assign(ex.cloneNode(true), { className: 'exif lb-exif' }));
    }
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
    // came in on a #photoN link: drop it, so a refresh shows the gallery rather than reopening the photo
    if (/^#photo\d+$/.test(location.hash)) history.replaceState(null, '', location.pathname + location.search);
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
    const item = img.closest('.shot');
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

  // Deep link (the home film strip links here): gallery.html#photoN scrolls to that frame and opens it
  const deep = location.hash.match(/^#photo(\d+)$/);
  const deepImg = deep && allImgs.find(im => im.getAttribute('src').endsWith(`/photo${deep[1]}.webp`));
  if (deepImg) {
    const item = deepImg.closest('.shot');
    item.scrollIntoView({ block: 'center' });
    item.classList.add('visible');                 // skip its entrance: the viewer opens out of a visible frame
    setTimeout(() => item.click(), 350);           // after the page's own entrance has settled
  }

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


/* ── 6. Gallery — rolls in justified rows + entrance (visual row-major order, 70 ms apart) ── */
(function () {
  const items = [...document.querySelectorAll('.shot')];
  if (!items.length) return;

  /* Rows: within each roll, every photo in a row shares one height and every row runs edge to
     edge (greedy fill; a short last row shares its frames with the row above so both fill).
     Ratios come from the width/height attributes — no image load needed. Height follows the
     width only, so iOS toolbar resizes don't reflow the page. Without JS, CSS wraps them at a fixed height. */
  const rolls = [...document.querySelectorAll('.roll-frames')];
  const ratio = it => { const img = it.querySelector('img'); return (+img.getAttribute('width') / +img.getAttribute('height')) || 1.5; };
  const arSum = part => part.reduce((t, it) => t + ratio(it), 0);

  function rowsFor(list, W, H, gap) {
    const rows = [];
    let cur = [];
    list.forEach(it => {
      cur.push(it);
      if (arSum(cur) * H + gap * (cur.length - 1) >= W) { rows.push(cur); cur = []; }
    });
    if (cur.length) {
      const fill = (arSum(cur) * H + gap * (cur.length - 1)) / W;
      if (fill < .85 && rows.length) {
        const all = [...rows.pop(), ...cur];
        let best = 1, bestD = Infinity;
        for (let k = 1; k < all.length; k++) {
          const d = Math.abs((W - gap * (k - 1)) / arSum(all.slice(0, k)) - (W - gap * (all.length - k - 1)) / arSum(all.slice(k)));
          if (d < bestD) { bestD = d; best = k; }
        }
        rows.push(all.slice(0, best), all.slice(best));
      } else rows.push(cur);
    }
    // a short roll may not fill the width: it stays short rather than growing huge
    return rows.map(r => ({ items: r, h: Math.min((W - gap * (r.length - 1)) / arSum(r), H * 1.5) }));
  }

  let lastW = 0;
  function layout() {
    const W = rolls[0].clientWidth;
    if (!W || W === lastW) return;
    lastW = W;
    const narrow = innerWidth <= 720;
    const H = narrow ? 150 : innerWidth <= 1100 ? 220 : Math.min(280, Math.max(210, W * .19));
    const gap = narrow ? 8 : 14;
    rolls.forEach(roll => {
      const list = [...roll.querySelectorAll('.shot')].filter(it => it.style.display !== 'none');
      roll.replaceChildren(...rowsFor(list, W, H, gap).map(r => {
        const row = document.createElement('div');
        row.className = 'shot-row';
        r.items.forEach(it => {
          const w = ratio(it) * r.h;
          it.style.width = `${w}px`;
          it.querySelector('.print').style.height = `${r.h}px`;
          it.classList.toggle('cap-short', w < 120);   // too narrow for its title: number only
          row.appendChild(it);
        });
        return row;
      }));
    });
    document.documentElement.classList.add('rows-ready');
  }
  layout();
  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { layout(); check(); }, 100);
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
  // Throttled on time, not rAF: rAF pauses whenever the page isn't being painted
  // (background tab, iOS momentum / app switch), which left items stuck invisible.
  // A trailing call catches whatever settled into view after scrolling stopped.
  let lastCheck = 0, trailing = 0;
  (document.querySelector('.page-wrapper') || window).addEventListener('scroll', () => {
    const now = performance.now();
    if (now - lastCheck > 100) { lastCheck = now; check(); }
    clearTimeout(trailing);
    trailing = setTimeout(check, 150);
  }, { passive: true });
  document.addEventListener('visibilitychange', check);
  window.addEventListener('load', check);
  check();   // deferred script: styles are applied, layout is readable now
}());
