/* home.js — Home: a photographer's field notes.
   One print (the portrait) that "Haoran" and "Xu" cross with depth, the kit drawn in gold line
   and scattered into the empty space around it, one alternating latest line, and a drifting film strip. */
(() => {
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pad = n => String(n).padStart(2, '0');
  const now = new Date();
  document.getElementById('stamp').textContent = `'${String(now.getFullYear()).slice(2)} ${pad(now.getMonth() + 1)} ${pad(now.getDate())}`;
  document.getElementById('entry').textContent = 'Field notes · ' + now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  /* ── Latest work / note, one alternating line ── */
  const work = [...WORKS].sort((a, b) => localDate(b.date) - localDate(a.date))[0];
  const note = [...POSTS].sort((a, b) => localDate(b.date) - localDate(a.date))[0];
  document.getElementById('lt3').innerHTML =
    `<a href="${work.href}" class="on"><span class="lt-k">Now researching</span><span class="lt-t">${work.title} →</span></a>` +
    `<a href="notes.html#${note.id}"><span class="lt-k">Lately writing</span><span class="lt-t">${note.title} →</span></a>`;
  if (!REDUCED) {
    const items = [...document.querySelectorAll('#lt3 a')]; let i = 0;
    setInterval(() => { if (document.hidden) return; items[i].classList.remove('on'); i = (i + 1) % items.length; items[i].classList.add('on'); }, 2800);
  }

  const ridges = (x0, x1, y0, y1, step = 3) => { let s = ''; for (let x = x0; x <= x1; x += step) s += `M${x} ${y0}V${y1}`; return `<path class="d" d="${s}"/>`; };
  const KIT = [
    { span: 4, wide: true, name: '70–200mm', what: 'Telephoto zoom', vb: [220, 80], svg:
      `<path d="M84 61V69H72V74H104V69H92V61"/>` +
      `<rect x="8" y="27" width="7" height="26" rx="1"/><rect x="15" y="22" width="150" height="36" rx="3"/>` +
      `<rect x="38" y="19.5" width="36" height="41" rx="2"/>${ridges(41, 71, 22, 58)}` +
      `<rect x="82" y="19" width="10" height="42" rx="1.5"/>` +
      `<rect x="112" y="19.5" width="28" height="41" rx="2"/>${ridges(115, 137, 22, 58, 2.5)}` +
      `<path d="M165 18L210 11V69L165 62Z"/><path class="d" d="M204 12V68"/>` },
    { span: 3, name: 'Sony α7R III', what: 'Full-frame mirrorless', vb: [160, 100], svg:
      `<path d="M76 34L80 21H104L108 34"/>` +
      `<rect x="26" y="30" width="11" height="4" rx="1"/><rect x="118" y="30" width="14" height="4" rx="1"/>` +
      `<path d="M32 34H128Q140 34 140 46V78Q140 84 134 84H26Q16 84 16 74V46Q16 34 32 34Z"/>` +
      `<path class="o" d="M42 36Q35 59 42 82"/>` +
      `<circle cx="92" cy="60" r="20"/><circle class="d" cx="92" cy="60" r="15"/><circle class="d" cx="92" cy="60" r="8"/>` +
      `<circle cx="51" cy="44" r="2.4"/><circle cx="119" cy="72" r="2"/>` },
    { span: 3, name: 'Canon 5D Mark IV', what: 'Full-frame DSLR', vb: [160, 100], svg:
      `<path d="M80 16V12H104V16"/><path d="M68 40L76 16H108L116 40"/>` +
      `<rect x="20" y="35" width="15" height="5" rx="1"/>` +
      `<path d="M26 40H134Q146 40 146 52V84Q146 92 138 92H22Q10 92 10 80V52Q10 40 26 40Z"/>` +
      `<path class="o" d="M38 42Q30 66 38 90"/>` +
      `<circle cx="92" cy="66" r="22"/><circle class="d" cx="92" cy="66" r="17"/>` +
      `<path class="d" d="M80 58H104L100 76H84Z"/><circle cx="122" cy="80" r="2.2"/>` },
    { span: 2, name: '50mm f/1.2', what: 'Fast prime', vb: [110, 80], svg:
      `<rect x="6" y="26" width="7" height="28" rx="1"/><rect x="13" y="13" width="74" height="54" rx="4"/>` +
      `<rect x="20" y="11" width="13" height="58" rx="1.5"/><path class="d" d="M23 11V8M27 11V8M31 11V8"/>` +
      `<rect x="44" y="11" width="32" height="58" rx="2"/>${ridges(47, 73, 13, 67, 2.5)}` +
      `<rect x="87" y="9" width="8" height="62" rx="1.5"/>` },
    { span: 3, name: '24–105mm', what: 'Standard zoom', vb: [140, 80], svg:
      `<rect x="6" y="27" width="7" height="26" rx="1"/><rect x="13" y="21" width="95" height="38" rx="3"/>` +
      `<rect x="28" y="18.5" width="36" height="43" rx="2"/>${ridges(31, 61, 21, 59)}` +
      `<rect x="76" y="19.5" width="20" height="41" rx="2"/>${ridges(79, 93, 22, 58, 2.5)}` +
      `<rect x="108" y="18" width="12" height="44" rx="2"/><path class="d" d="M117 20V60"/>` },
    { span: 2, name: 'iPhone 17 Pro Max', what: 'Always in the pocket', vb: [80, 150], svg:
      `<rect x="10" y="4" width="60" height="142" rx="11"/>` +
      `<rect x="13" y="8" width="54" height="36" rx="8"/>` +
      `<circle cx="24" cy="18" r="6.5"/><circle class="d" cx="24" cy="18" r="3.2"/>` +
      `<circle cx="24" cy="34" r="6.5"/><circle class="d" cx="24" cy="34" r="3.2"/>` +
      `<circle cx="39" cy="26" r="6.5"/><circle class="d" cx="39" cy="26" r="3.2"/>` +
      `<circle cx="56" cy="17" r="2.6"/><circle cx="56" cy="34" r="2.6"/>` +
      `<circle class="d" cx="40" cy="92" r="17" stroke-dasharray="2 3"/>` },
    { span: 2, name: 'DJI Pocket 4P', what: 'Pocket gimbal camera', vb: [70, 140], svg:
      `<path class="o" d="M44 52V26Q44 16 34 16"/>` +
      `<rect x="22" y="50" width="26" height="86" rx="9"/><rect x="26" y="58" width="18" height="26" rx="2"/>` +
      `<circle cx="35" cy="100" r="3.2"/><circle cx="35" cy="112" r="2.4"/>` +
      `<circle cx="31" cy="27" r="11"/><circle class="d" cx="31" cy="27" r="5.5"/><circle class="s" cx="31" cy="27" r="2"/>` },
    { span: 2, name: 'DJI RS 3', what: 'Gimbal stabilizer', vb: [130, 150], svg:
      `<path class="o" d="M104 63V76Q104 84 96 84H76"/><path class="o" d="M78 54H95"/>` +
      `<rect x="12" y="45" width="22" height="20" rx="2"/><rect x="34" y="40" width="44" height="29" rx="3"/><rect x="48" y="34" width="14" height="6" rx="1"/>` +
      `<circle cx="104" cy="54" r="9"/><circle class="d" cx="104" cy="54" r="4"/>` +
      `<rect x="54" y="80" width="24" height="10" rx="3"/>` +
      `<rect x="57" y="90" width="18" height="56" rx="6"/><rect x="60" y="97" width="12" height="10" rx="1.5"/><circle cx="66" cy="115" r="2"/>` },
    { span: 3, name: 'DJI Avata', what: 'FPV drone', vb: [140, 120], svg:
      [[36, 36], [104, 36], [36, 88], [104, 88]].map(([cx, cy]) =>
        `<circle cx="${cx}" cy="${cy}" r="24"/><circle class="d" cx="${cx}" cy="${cy}" r="20"/>` +
        `<path class="d" d="M${cx - 17} ${cy - 5}L${cx + 17} ${cy + 5}"/><circle cx="${cx}" cy="${cy}" r="3"/>`).join('') +
      `<rect x="50" y="26" width="40" height="70" rx="14"/><path class="d" d="M56 70H84M56 76H84M56 82H84"/>` +
      `<rect x="60" y="14" width="20" height="15" rx="4"/><circle cx="70" cy="21" r="4"/>` },
  ];
  // a slight, fixed tilt for each piece, as if set down by hand
  const TILT = [-9, 4, -3, 7, -6, 5, -4, 8, -2];
  const gear = document.getElementById('gear');
  gear.innerHTML = KIT.map((k, i) =>
    `<div class="g" role="listitem" aria-label="${k.name}"><svg viewBox="0 0 ${k.vb[0]} ${k.vb[1]}" aria-hidden="true">${k.svg}</svg>` +
    `<span class="lbl"><b>${k.name}</b></span></div>`).join('');
  const G = [...gear.children];

  /* ── Layout ── */
  const hero = document.getElementById('hero'), name = document.getElementById('name'), em = name.querySelector('em');
  const self = document.getElementById('self'), copy = document.getElementById('copy'), top_ = document.querySelector('.h-top');
  const rangeRect = node => { const r = document.createRange(); r.selectNodeContents(node); return r.getBoundingClientRect(); };

  // scatter: biggest pieces first, each into the free spot closest to the print
  function scatter(blocked, box, k, cx, cy) {
    const placed = [], GAP = 16 * k + 10, STEP = 8; let missed = 0;
    const hit = (a, b, m) => a.x < b.x + b.w + m && a.x + a.w + m > b.x && a.y < b.y + b.h + m && a.y + a.h + m > b.y;
    const order = KIT.map((it, i) => i).sort((a, b) => KIT[b].vb[0] * KIT[b].vb[1] - KIT[a].vb[0] * KIT[a].vb[1]);
    for (const i of order) {
      const w = KIT[i].vb[0] * k, h = KIT[i].vb[1] * k, lab = 22;          // room for the name under it
      let best = null, bestS = Infinity;
      for (let y = box.y; y + h + lab <= box.y + box.h; y += STEP)
        for (let x = box.x; x + w <= box.x + box.w; x += STEP) {
          const r = { x, y, w, h: h + lab };
          if (blocked.some(b => hit(r, b, 18)) || placed.some(p => hit(r, p, GAP))) continue;
          // near the print, with a little fixed noise so the pieces don't line up in rows
          const n = Math.sin(x * 12.9898 + y * 78.233 + i * 37.719) * 43758.5453;
          const s = Math.hypot(x + w / 2 - cx, (y + h / 2 - cy) * 1.25) + (n - Math.floor(n)) * 90;
          if (s < bestS) { bestS = s; best = r; }
        }
      const el = G[i];
      if (!best) { el.style.display = 'none'; missed++; continue; }
      placed.push(best);
      Object.assign(el.style, { display: '', width: w + 'px', height: h + 'px',
        transform: `translate(${best.x}px, ${best.y}px) rotate(${TILT[i]}deg)` });
    }
    return missed;
  }

  function layout() {
    for (const el of [self, copy]) el.removeAttribute('style');
    name.style.transform = ''; self.style.transform = ''; gear.style.transform = '';
    name.style.fontSize = '120px'; em.style.paddingLeft = '';
    const wordW = rangeRect(name.firstChild).width, xuW = rangeRect(em).width;
    const hs = getComputedStyle(hero), padL = parseFloat(hs.paddingLeft), padB = parseFloat(hs.paddingBottom);
    const W = hero.clientWidth, L = padL, R = W - padL, hr = hero.getBoundingClientRect();
    const toHero = r => ({ x: r.left - hr.left, y: r.top - hr.top, w: r.width, h: r.height });

    if (innerWidth <= 900) {
      const fs = Math.min(120 * (W - 2 * padL) * .97 / wordW, innerHeight * .42 / 1.72);
      name.style.fontSize = Math.max(56, fs) + 'px';
      // print under the name, right of centre; kit scattered around it; copy below
      const sw = Math.min(W * .56, 300), nb = name.offsetTop + name.offsetHeight;
      self.style.setProperty('--cap', Math.max(11, sw * .045) + 'px');
      Object.assign(self.style, { width: sw + 'px', left: (R - sw - W * .04) + 'px', top: (nb - fs * .35) + 'px' });
      const sh = self.offsetHeight, k0 = Math.min(.55, W / 700);
      const blk = [toHero(rangeRect(name.firstChild)), toHero(rangeRect(em)), toHero(self.getBoundingClientRect())];
      for (let k = k0; k > .3; k -= .04) {
        const box = { x: L, y: nb + 4, w: R - L, h: sh + fs * .35 + 260 * k };
        if (!scatter(blk, box, k, parseFloat(self.style.left) + sw / 2, parseFloat(self.style.top) + sh / 2)) break;
      }
      const used = Math.max(...G.filter(g => g.style.display !== 'none').map(g => g.getBoundingClientRect().bottom - hr.top), parseFloat(self.style.top) + sh);
      copy.style.marginTop = (used - nb + 28) + 'px';
      G.forEach(g => g.classList.add('in'));
      return;
    }

    const T = top_.offsetTop + top_.offsetHeight + 8, B = hero.clientHeight - padB, rowH = B - T;
    const ph = rowH * .9, sw = ph / 1.36;                                 // the print: ~90% of the row tall
    self.style.setProperty('--cap', Math.max(12, sw * .042) + 'px');
    // name size: limited by height (stays above the copy) and by width (print + some desk to its right)
    const fsW = 120 * (R - W * .2 - sw * .75 - L) / wordW;
    let fs = fsW, xuL = 0, pl = 0;
    for (let i = 0; i < 6; i++) {
      pl = L + wordW * fs / 120 - sw * .24;                               // "…an" runs ~quarter into the print
      xuL = pl + sw * .3 - xuW * fs / 120;                                 // "Xu" ends ~30% into the print
      copy.style.maxWidth = Math.max(300, Math.min(520, xuL - L - 36)) + 'px';
      fs = Math.min(fsW, (rowH - copy.offsetHeight - 18) / .98, rowH / 1.9);
    }
    pl = L + wordW * fs / 120 - sw * .24; xuL = pl + sw * .3 - xuW * fs / 120;
    name.style.fontSize = fs + 'px';
    em.style.paddingLeft = Math.max(0, xuL - L) + 'px';
    copy.style.maxWidth = Math.max(300, Math.min(520, xuL - L - 36)) + 'px';
    self.style.width = sw + 'px';
    let st = T + fs * .22; const sh = self.offsetHeight;
    if (st + sh > B) st = B - sh;
    Object.assign(self.style, { left: pl + 'px', top: st + 'px' });

    // the desk: everything the text and print don't use
    const k = Math.max(.5, Math.min(.85, rowH / 640));
    // glyph boxes, not line boxes: cap height of "Haoran", x-height-ish body of "Xu"
    const nr = name.getBoundingClientRect(), er = em.getBoundingClientRect();
    const blocked = [{ x: L, y: nr.top - hr.top + fs * .05, w: wordW * fs / 120, h: fs * .78 },
      { x: xuL, y: er.top - hr.top + fs * .02, w: xuW * fs / 120 + fs * .05, h: fs * .8 },
      (r => ({ x: r.x, y: r.y - 20, w: r.w + 60, h: r.h + 20 }))(toHero(copy.getBoundingClientRect())),
      toHero(self.getBoundingClientRect()), toHero(top_.getBoundingClientRect())];
    // very wide screens (≥1800): keep the kit together around the print, nothing stranded left of "Xu"
    const deskX = innerWidth >= 1800 ? pl - sw * .35 : L;
    for (let kk = k; scatter(blocked, { x: deskX, y: T - 4, w: R - deskX, h: B - T + 4 }, kk, pl + sw / 2, st + sh / 2) && kk > .4; kk -= .05);   // everything must fit
    G.forEach((g, i) => setTimeout(() => g.classList.add('in'), REDUCED ? 0 : 120 + i * 70));
  }

  /* ── Depth: name, print and desk drift apart with the pointer (desktop) ── */
  if (!REDUCED && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      name.style.transform = `translate3d(${x * 14}px, ${y * 8}px, 0)`;
      self.style.transform = `translate3d(${x * -6}px, ${y * -4}px, 0) rotateY(${x * 2}deg) rotateX(${y * -1.5}deg)`;
      gear.style.transform = `translate3d(${x * -3}px, ${y * -2}px, 0)`;
    });
    hero.addEventListener('pointerleave', () => { name.style.transform = ''; self.style.transform = ''; gear.style.transform = ''; });
  }

  /* ── Film: endless slow drift; eases to a stop on hover ── */
  const P = [[6,'Bamboo Strips in the Rain',720,481],[2,'Trees and Roadmark',720,1077],[8,'Hongcun Village',720,480],[17,'Sunset Over the River',720,540],
    [3,'Maple Leaves',720,1077],[13,'Seagull in the Sky',720,480],[5,'Splitting Bamboo',720,1077],[9,'Stone in the River',720,480],
    [14,'Fireworks',720,480],[15,'Abstract Leaves',720,1077],[1,'Lamp by the Riverside',720,480],[18,'Reaching for Seagulls',720,960],
    [11,'Baking Tea',720,481],[12,"Suzhou's Sunset",720,481],[7,'Painting with a Brush',720,481],[10,'Holding Tea',720,481]];
  const set = (rep) => P.map(([n, t, w, h], i) => `<a href="gallery.html" style="aspect-ratio:${w}/${h}" aria-label="${t}"${rep ? ' aria-hidden="true" tabindex="-1"' : ''}>` +
    `<img src="assets/images/gallery/mini/photo${n}.webp" alt="${rep ? '' : t}" draggable="false" decoding="async">` +
    `<span class="edge n">${i === 0 ? 'HX 400  ' : ''}${pad(i + 1)} ▸ ${pad(i + 1)}A</span><span class="ttl">${t}</span></a>`).join('');
  const track = document.getElementById('track'), film = document.getElementById('film');
  track.innerHTML = set(false) + set(true);
  let x = 0, v = 0, target = REDUCED ? 0 : 1, last = performance.now(), loopW = 0, dragging = false, dragX = 0, dragStart = 0;
  const SPEED = 22;
  const measureLoop = () => { loopW = track.scrollWidth / 2; };
  function frame(now) {
    const dt = Math.min(64, now - last) / 1000; last = now;
    v += (target - v) * Math.min(1, dt * 3.2);
    if (!dragging) x -= v * SPEED * dt;
    if (loopW) { if (x <= -loopW) x += loopW; if (x > 0) x -= loopW; }
    track.style.transform = `translate3d(${x}px,0,0)`;
    requestAnimationFrame(frame);
  }
  film.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') target = 0; });
  film.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && !REDUCED) target = 1; dragging = false; film.classList.remove('dragging'); });
  film.addEventListener('pointerdown', e => { dragging = true; dragStart = e.clientX; dragX = x; target = 0; film.classList.add('dragging'); film.setPointerCapture(e.pointerId); });
  film.addEventListener('pointermove', e => { if (dragging) x = dragX + (e.clientX - dragStart); });
  const endDrag = e => { if (!dragging) return; dragging = false; film.classList.remove('dragging');
    if (Math.abs(e.clientX - dragStart) > 5) film.addEventListener('click', ev => ev.preventDefault(), { once: true, capture: true });
    if (e.pointerType !== 'mouse' && !REDUCED) setTimeout(() => { target = 1; }, 1200); };
  film.addEventListener('pointerup', endDrag); film.addEventListener('pointercancel', endDrag);

  function relayout() { layout(); measureLoop(); }
  Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 600))]).then(() => {
    relayout(); requestAnimationFrame(t => { last = t; frame(t); });
  });
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(relayout, 120); });
  [...track.querySelectorAll('img')].forEach(im => im.addEventListener('load', measureLoop, { once: true }));

})();
