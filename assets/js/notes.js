/**
 * notes.js — haoranxu.org v2.1
 *
 * Loads markdown post files and renders them into the Notes page.
 *
 * To add a new note:
 *   1. Drop a .md file into /posts/  (with optional title/date/tags frontmatter)
 *   2. Add a new entry to POSTS below
 *   3. Add the matching .card.post-card block + timeline entry in notes.html
 *
 * Frontmatter lines (title:, date:, tags:) are stripped before rendering —
 * those fields are displayed in the HTML card header, not in the body text.
 */

const POSTS = [
  { file: 'posts/post1.md', bodyId: 'post-body-1' },
  { file: 'posts/post2.md', bodyId: 'post-body-2' },
  { file: 'posts/post3.md', bodyId: 'post-body-3' },
];

function stripFrontmatter(text) {
  return text
    .replace(/^title:.*$/gim, '')
    .replace(/^date:.*$/gim,  '')
    .replace(/^tags:.*$/gim,  '')
    .trim();
}

function loadPost({ file, bodyId }) {
  const el = document.getElementById(bodyId);
  if (!el) return;

  fetch(file)
    .then(res => {
      if (!res.ok) throw new Error(`${res.status} — ${file}`);
      return res.text();
    })
    .then(md => {
      el.innerHTML = marked.parse(stripFrontmatter(md));
    })
    .catch(err => {
      el.innerHTML = `<p style="color:var(--text-muted);font-size:12px;">Could not load post. (${err.message})</p>`;
    });
}

POSTS.forEach(loadPost);
