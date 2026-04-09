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
  const sorted = [...POSTS].sort((a, b) => new Date(b.date) - new Date(a.date));

  /* ── Timeline sidebar ────────────────────────────────── */
  const timeline = document.querySelector('.timeline-col');
  if (timeline) {
    timeline.innerHTML = '';

    // Group entries by year
    const years = [...new Set(sorted.map(p => new Date(p.date).getFullYear()))];
    years.forEach(year => {
      const yEl = document.createElement('p');
      yEl.className   = 'timeline-year';
      yEl.textContent = year;
      timeline.appendChild(yEl);

      sorted
        .filter(p => new Date(p.date).getFullYear() === year)
        .forEach(p => {
          const label = new Date(p.date).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric',
          });
          const a = document.createElement('a');
          a.className = 'timeline-entry';
          a.href      = `#${p.id}`;
          a.innerHTML = `<span class="timeline-dot"></span>${label}`;
          a.addEventListener('click', e => {
            e.preventDefault();
            const target = document.getElementById(p.id);
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          });
          timeline.appendChild(a);
        });
    });
  }

  /* ── Post cards ──────────────────────────────────────── */
  const cardCol = document.querySelector('.blog-layout .card-col');
  if (!cardCol) return;
  cardCol.innerHTML = '';

  sorted.forEach(p => {
    const bodyId = `post-body-${p.id.replace('post-', '')}`;
    const card   = document.createElement('div');
    card.id        = p.id;
    card.className = 'card post-card';
    card.innerHTML =
      `<h2 class="post-title">${p.title}</h2>` +
      `<div class="post-meta">` +
        `<span>${p.date}</span>` +
        `<span>${p.tags}</span>` +
      `</div>` +
      `<div class="post-divider"></div>` +
      `<div id="${bodyId}" class="post-body"></div>`;
    cardCol.appendChild(card);

    // Fetch and render markdown body
    fetch(p.file)
      .then(res => {
        if (!res.ok) throw new Error(`${res.status} — ${p.file}`);
        return res.text();
      })
      .then(md => {
        const el = document.getElementById(bodyId);
        if (el) el.innerHTML = marked.parse(stripFrontmatter(md));
      })
      .catch(err => {
        const el = document.getElementById(bodyId);
        if (el) el.innerHTML =
          `<p style="color:var(--text-muted);font-size:12px;">` +
          `Could not load post. (${err.message})</p>`;
      });
  });
});
