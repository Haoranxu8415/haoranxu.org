/**
 * blog.js — haoranxu.org v2
 *
 * Loads markdown post files and renders them into the DOM.
 *
 * To add a new post:
 *   1. Drop the .md file into /posts/
 *   2. Add an entry to POSTS below with the file path, element id,
 *      and the matching timeline anchor id.
 *   3. Add the matching card + timeline entry markup in blog.html.
 *
 * Each post's frontmatter fields (title:, date:, tags:) are stripped
 * before rendering so they don't appear in the visible body text.
 */

const POSTS = [
  { file: 'posts/post1.md', bodyId: 'post-body-1' },
  { file: 'posts/post2.md', bodyId: 'post-body-2' },
  { file: 'posts/post3.md', bodyId: 'post-body-3' },
];

/**
 * Strip frontmatter key:value lines (title, date, tags) from raw markdown.
 * These are displayed separately in the HTML card header, not in the body.
 */
function stripFrontmatter(text) {
  return text
    .replace(/^title:.*$/gim, '')
    .replace(/^date:.*$/gim,  '')
    .replace(/^tags:.*$/gim,  '')
    .trim();
}

/**
 * Fetch one markdown file and render it into the target element.
 */
function loadPost({ file, bodyId }) {
  const el = document.getElementById(bodyId);
  if (!el) return;  // guard: card not in DOM (e.g. post not yet added to HTML)

  fetch(file)
    .then(res => {
      if (!res.ok) throw new Error(`${res.status} loading ${file}`);
      return res.text();
    })
    .then(md => {
      el.innerHTML = marked.parse(stripFrontmatter(md));
    })
    .catch(err => {
      el.innerHTML = `<p style="color:var(--text-muted);font-size:12px;">Could not load post. (${err.message})</p>`;
    });
}

// Load all posts
POSTS.forEach(loadPost);
