#!/usr/bin/env node
/*
  tools/build.mjs — keeps the parts that repeat across the static pages in sync, each from one source.

    node tools/build.mjs           rewrite the generated blocks in place
    node tools/build.mjs --check   change nothing; exit 1 if any page is out of date

  A generated block sits between <!-- build:NAME … --> and <!-- /build:NAME --> in a page.
  Edit the source, never the block:
    nav    ← _partials/nav.html            (every page; links prefixed per folder, current section marked)
                                           — a new page goes into PAGES below (works/*.html are picked up)
    works  ← WORKS in assets/js/data.js    (the cards in works.html)

  The pages stay plain static HTML (no runtime includes), so they work without JS and
  locally as-is. The deploy workflow runs this too, so a forgotten local run can't ship stale pages.
*/
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';

const ROOT  = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const read  = f => readFileSync(join(ROOT, f), 'utf8');

/* ── Sources ── */
// data.js is a browser script (top-level consts); evaluate it and lift the arrays out
const data = {};
runInNewContext(`${read('assets/js/data.js')}\n;this.WORKS = WORKS;`, data);

// the partial minus its leading comment
const NAV = read('_partials/nav.html').replace(/^<!--[\s\S]*?-->\n/, '').replace(/\n+$/, '');

/* ── Pages: [file, path prefix to the site root, current section] ── */
const PAGES = [
  ['index.html',   '',  'home'],
  ['gallery.html', '',  'gallery'],
  ['works.html',   '',  'works'],
  ['notes.html',   '',  'notes'],
  ['contact.html', '',  'contact'],
  ['404.html',     '/', null],          // served at any missing path, so links are absolute
  ...readdirSync(join(ROOT, 'works')).filter(f => f.endsWith('.html')).sort()
    .map(f => [`works/${f}`, '../', 'works']),
];

/* ── Renderers ── */
function nav(root, current) {
  const out = NAV
    .replaceAll('{home}', root || './')
    .replaceAll('{root}', root)
    .replace(/\{active:(\w+)\}/g, (_, key) => (key === current ? ' class="active"' : ''));
  if (/\{[a-z:]+\}/.test(out)) throw new Error('nav: unknown placeholder in _partials/nav.html');
  return out;
}

function works() {
  const cards = [...data.WORKS]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(w => {
      for (const k of ['title', 'tag', 'date', 'href', 'excerpt'])
        if (!w[k]) throw new Error(`works: "${w.title || w.href}" has no ${k} in data.js`);
      return `        <a href="${w.href}" class="card work-card">
          <div class="work-card-body">
            <div class="work-card-header">
              <p class="work-card-meta">${w.tag}</p>
              <span class="work-card-date">${w.date.slice(0, 4)}</span>
            </div>
            <h2 class="work-card-title">${w.title}</h2>
            <p class="work-card-excerpt">${w.excerpt}</p>
          </div>
          <span class="work-card-arrow">→</span>
        </a>`;
    });
  return cards.join('\n\n');
}

/* ── Replace the blocks ── */
function fill(html, name, content, file) {
  const re = new RegExp(`(<!-- build:${name}\\b[^>]*-->\\n)[\\s\\S]*?(\\n[ \\t]*<!-- /build:${name} -->)`);
  if (!re.test(html)) throw new Error(`${file}: no <!-- build:${name} --> … <!-- /build:${name} --> markers`);
  return html.replace(re, (_, open, close) => open + content + close);
}

// A page with a navbar that isn't listed above would silently keep a stale copy — refuse instead
const listed = new Set(PAGES.map(([f]) => f));
const htmlFiles = [...readdirSync(ROOT).filter(f => f.endsWith('.html')),
                   ...readdirSync(join(ROOT, 'works')).filter(f => f.endsWith('.html')).map(f => `works/${f}`)];
for (const f of htmlFiles)
  if (!listed.has(f) && read(f).includes('class="navbar"'))
    throw new Error(`${f} has a navbar but isn't in PAGES in tools/build.mjs`);

// Render everything first, write only if every page succeeded — never leave the site half-updated
const changed = PAGES.map(([file, root, current]) => {
  const before = read(file);
  let after = fill(before, 'nav', nav(root, current), file);
  if (file === 'works.html') after = fill(after, 'works', works(), file);
  return [file, before, after];
}).filter(([, before, after]) => after !== before);

if (CHECK) {
  changed.forEach(([file]) => console.log(`out of date: ${file}`));
  if (changed.length) { console.error(`\n${changed.length} page(s) out of date — run: node tools/build.mjs`); process.exit(1); }
} else {
  changed.forEach(([file, , after]) => { writeFileSync(join(ROOT, file), after); console.log(`updated: ${file}`); });
}
if (!changed.length) console.log(`all ${PAGES.length} pages up to date`);
