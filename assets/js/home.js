/**
 * home.js — populates Works and Notes preview panels on index.html
 * Depends on: data.js  (WORKS + POSTS globals, loaded before this script)
 *
 * Both panels show the 3 most recent entries sorted by date.
 * Works entries link directly to their detail pages.
 * Notes entries link to notes.html#<id>.
 */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Works panel ─────────────────────────────────────── */
  const worksList = document.getElementById('home-works-list');
  if (worksList && typeof WORKS !== 'undefined') {
    const sorted = [...WORKS].sort((a, b) => new Date(b.date) - new Date(a.date));
    sorted.slice(0, 3).forEach(w => {
      const a = document.createElement('a');
      a.href      = w.href;
      a.className = 'works-entry';
      a.innerHTML =
        `<div class="works-entry-tag">${w.tag}</div>` +
        `<div class="works-entry-row">` +
          `<span class="works-entry-title">${w.title}</span>` +
          `<span class="works-arrow">→</span>` +
        `</div>`;
      worksList.appendChild(a);
    });
  }

  /* ── Notes panel ─────────────────────────────────────── */
  const notesList = document.getElementById('home-notes-list');
  if (notesList && typeof POSTS !== 'undefined') {
    const sorted = [...POSTS].sort((a, b) => new Date(b.date) - new Date(a.date));
    sorted.slice(0, 3).forEach(p => {
      const label = new Date(p.date).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric',
      });
      const a = document.createElement('a');
      a.href      = `notes.html#${p.id}`;
      a.className = 'works-entry';
      a.innerHTML =
        `<div class="works-entry-tag">${label}</div>` +
        `<div class="works-entry-row">` +
          `<span class="works-entry-title">${p.title}</span>` +
          `<span class="works-arrow">→</span>` +
        `</div>`;
      notesList.appendChild(a);
    });
  }

});
