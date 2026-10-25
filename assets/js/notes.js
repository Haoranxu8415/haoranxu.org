/**
 * notes.js — renders Notes page from POSTS data
 * Depends on: data.js (POSTS global), marked.js (deferred in <head>, runs before this)
 *
 * To add a new note:
 *   1. Drop a .md file in /posts/
 *   2. Add one entry to POSTS in data.js
 *   → Timeline, entries, and the home "Lately writing" line all update automatically.
 */

function stripFrontmatter(text) {
  return text
    .replace(/^title:.*$/gim, '')
    .replace(/^date:.*$/gim,  '')
    .replace(/^tags:.*$/gim,  '')
    .trim();
}

document.addEventListener('DOMContentLoaded', () => {
  if (typeof POSTS === 'undefined') return;

  // Newest first
  const sorted = [...POSTS].sort((a, b) => localDate(b.date) - localDate(a.date));

  // "06 entries · 2024 – 2026" beside the title
  const count = document.getElementById('notes-count');
  if (count) {
    const ys = sorted.map(p => p.date.slice(0, 4));
    count.textContent = `${String(sorted.length).padStart(2, '0')} entries · ${ys[ys.length - 1]} – ${ys[0]}`;
  }

  /* ── Timeline sidebar ────────────────────────────────── */
  const timeline = document.querySelector('.timeline-col');
  if (timeline) {
    timeline.innerHTML = '';

    // Group entries by year
    const years = [...new Set(sorted.map(p => localDate(p.date).getFullYear()))];
    years.forEach(year => {
      const yEl = document.createElement('p');
      yEl.className   = 'timeline-year';
      yEl.textContent = year;
      timeline.appendChild(yEl);

      sorted
        .filter(p => localDate(p.date).getFullYear() === year)
        .forEach(p => {
          const label = localDate(p.date).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric',
          });
          const a = document.createElement('a');
          a.className = 'timeline-entry';
          a.href      = `#${p.id}`;
          a.innerHTML = `<span class="timeline-dot"></span>${label}`;
          a.addEventListener('click', e => {
            e.preventDefault();
            const target = document.getElementById(p.id);
            if (!target) return;
            // Align the post's top (title) under the navbar — 'center' landed mid-article
            // on any post taller than the screen
            target.scrollIntoView({
              behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
              block: 'start',
            });
            history.replaceState(null, '', `#${p.id}`);   // shareable link to this post
          });
          timeline.appendChild(a);
        });
    });
  }

  /* ── Post cards ──────────────────────────────────────── */
  const cardCol = document.querySelector('.blog-layout .card-col');
  if (!cardCol) return;
  cardCol.innerHTML = '';

  const loads = sorted.map((p, i) => {
    const bodyId = `post-body-${p.id.replace('post-', '')}`;
    const card   = document.createElement('div');
    card.id        = p.id;
    card.className = 'card post-card';
    card.style.setProperty('--stagger-i', i);
    // An entry in the notebook: numbered in the order written, dated with the gold stamp
    const num = String(sorted.length - i).padStart(2, '0');
    const [yy, mm, dd] = p.date.split('-');
    card.innerHTML =
      `<header class="entry-head"><span class="edge-k">Entry ${num}</span>` +
        `<time class="stamp-g" datetime="${p.date}" title="${formatDate(p.date)}">'${yy.slice(2)} ${mm} ${dd}</time></header>` +
      `<h2 class="post-title">${p.title}</h2>` +
      `<div class="post-meta"><span>${p.tags}</span></div>` +
      `<div id="${bodyId}" class="post-body"></div>` +
      `<p class="entry-end">— end of entry ${num}</p>`;
    if (i > 0) cardCol.insertAdjacentHTML('beforeend', '<div class="perf-rule entry-rule" aria-hidden="true"></div>');
    cardCol.appendChild(card);

    // Fetch and render markdown body
    return fetch(p.file)
      .then(res => {
        if (!res.ok) throw new Error(`${res.status} — ${p.file}`);
        return res.text();
      })
      .then(md => {
        const el = document.getElementById(bodyId);
        const cleaned = stripFrontmatter(md);
        if (el) {
          el.innerHTML = marked.parse(cleaned);
          // Inject reading time into post-meta
          const wordCount = cleaned.replace(/[#*`[\]()>_~-]/g, '').split(/\s+/).filter(Boolean).length;
          const mins = Math.max(1, Math.ceil(wordCount / 200));
          const metaEl = card.querySelector('.post-meta');
          if (metaEl) {
            const span = document.createElement('span');
            span.className = 'read-time';
            span.textContent = `${mins} min read`;
            metaEl.appendChild(span);
          }
        }
      })
      .catch(err => {
        const el = document.getElementById(bodyId);
        if (el) el.innerHTML =
          `<p style="color:var(--text-muted);font-size:12px;">` +
          `Could not load post. (${err.message})</p>`;
      });
  });

  loads.forEach(p => window.pbTrack?.(p));  // drive the arrival progress bar

  /* ── Timeline: a gold marker that follows the reading ──── */
  // One marker slides along the rail, tied to the scroll position: it sits on a post's date
  // when that post's title reaches the top of the page (where a timeline click lands it) and
  // slides toward the next date as you read on. A click's smooth scroll therefore carries it
  // through every post on the way, at the scroll's own pace. The date being read is lit too.
  if (timeline) {
    const entries  = [...timeline.querySelectorAll('.timeline-entry')];
    const cards    = [...cardCol.querySelectorAll('.post-card')];
    const scroller = document.querySelector('.page-wrapper');
    const marker   = document.createElement('span');
    marker.className = 'timeline-marker';
    marker.setAttribute('aria-hidden', 'true');
    timeline.appendChild(marker);

    // Cached geometry, re-measured when layout can change: the scroll position at which each
    // post "arrives" (title under the navbar, as a click lands it) and each date's height on the rail
    let arrive = [], dotY = [], current = -1;
    function measure() {
      if (!scroller) return;
      const max = scroller.scrollHeight - scroller.clientHeight;
      const top = scroller.getBoundingClientRect().top - scroller.scrollTop;
      const land = parseFloat(getComputedStyle(scroller).scrollPaddingTop) || 0;
      arrive = cards.map(c => {
        const cs = getComputedStyle(c);
        // minus any entrance-animation offset still running (the rect includes the transform, layout doesn't)
        const shift = cs.transform && cs.transform !== 'none' ? new DOMMatrixReadOnly(cs.transform).m42 : 0;
        const at = c.getBoundingClientRect().top - shift - top - land - (parseFloat(cs.scrollMarginTop) || 0);
        return Math.min(max, Math.max(0, at));
      });
      dotY = entries.map(a => a.offsetTop + a.offsetHeight / 2);
      follow();
    }

    function follow() {
      if (!arrive.length) return;
      const y = scroller.scrollTop + 2;                        // 2 px of slack for rounding
      let i = 0;
      while (i < arrive.length - 1 && arrive[i + 1] <= y) i++;
      // between post i's arrival and post i+1's, slide between their dates
      let pos = dotY[i];
      if (i < arrive.length - 1 && arrive[i + 1] > arrive[i]) {
        const f = Math.min(1, Math.max(0, (y - arrive[i]) / (arrive[i + 1] - arrive[i])));
        pos += f * (dotY[i + 1] - dotY[i]);
      }
      marker.style.transform = `translateY(${pos}px)`;
      if (i !== current) {
        current = i;
        entries.forEach((a, k) => {
          a.classList.toggle('is-active', k === i);
          if (k === i) a.setAttribute('aria-current', 'location');
          else         a.removeAttribute('aria-current');
        });
      }
    }

    // Every scroll event (one per frame at most) — reads only scrollTop, so it stays cheap
    (scroller || window).addEventListener('scroll', follow, { passive: true });
    window.addEventListener('resize', measure);
    // post bodies arriving, fonts swapping in, images loading — anything that changes the column's height
    if ('ResizeObserver' in window) new ResizeObserver(() => measure()).observe(cardCol);
    Promise.allSettled([...loads, document.fonts.ready]).then(measure);
    measure();
  }

  // Arriving via notes.html#post-N (the home "Lately writing" link): posts above the target
  // grow as their bodies load and web fonts swap in, so re-align after both.
  const target = location.hash && document.getElementById(location.hash.slice(1));
  if (target) {
    Promise.allSettled([...loads, document.fonts.ready])
      .then(() => requestAnimationFrame(() => target.scrollIntoView({ block: 'start' })));
  }
});
