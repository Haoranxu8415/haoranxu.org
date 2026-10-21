/**
 * notes.js — renders Notes page from POSTS data
 * Depends on: data.js (POSTS global), marked.js (sync script in <head>)
 *
 * To add a new note:
 *   1. Drop a .md file in /posts/
 *   2. Add one entry to POSTS in data.js
 *   → Timeline, post cards, and home preview all update automatically.
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
    card.innerHTML =
      `<h2 class="post-title">${p.title}</h2>` +
      `<div class="post-meta">` +
        `<time datetime="${p.date}">${formatDate(p.date)}</time>` +
        `<span>${p.tags}</span>` +
      `</div>` +
      `<div class="post-divider"></div>` +
      `<div id="${bodyId}" class="post-body"></div>`;
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

  /* ── Timeline: highlight the post being read ────────── */
  // The active post is the last one whose top has passed a line 35% down the
  // screen (or the last post once the page bottom is reached — a short final
  // post may never get that high). Time-throttled scroll checks, no rAF, as in main.js.
  if (timeline) {
    const entries  = [...timeline.querySelectorAll('.timeline-entry')];
    const cards    = [...cardCol.querySelectorAll('.post-card')];
    const scroller = document.querySelector('.page-wrapper');
    let current = null;

    function spy() {
      if (!cards.length) return;
      let active = cards[0];
      const atBottom = scroller && scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2;
      if (atBottom) active = cards[cards.length - 1];
      else {
        const line = innerHeight * 0.35;
        for (const c of cards) {
          if (c.getBoundingClientRect().top <= line) active = c;
          else break;
        }
      }
      if (active === current) return;
      current = active;
      entries.forEach(a => {
        const on = a.getAttribute('href') === `#${active.id}`;
        a.classList.toggle('is-active', on);
        if (on) a.setAttribute('aria-current', 'location');
        else    a.removeAttribute('aria-current');
      });
    }

    let lastSpy = 0, trailingSpy = 0;
    (scroller || window).addEventListener('scroll', () => {
      const now = performance.now();
      if (now - lastSpy > 100) { lastSpy = now; spy(); }
      clearTimeout(trailingSpy);
      trailingSpy = setTimeout(spy, 120);
    }, { passive: true });
    Promise.allSettled(loads).then(spy);   // posts above change height as bodies load
    spy();
  }

  // Arriving via notes.html#post-N (home panel links): posts above the target
  // grow as their bodies load and web fonts swap in, so re-align after both.
  const target = location.hash && document.getElementById(location.hash.slice(1));
  if (target) {
    Promise.allSettled([...loads, document.fonts.ready])
      .then(() => requestAnimationFrame(() => target.scrollIntoView({ block: 'start' })));
  }
});
