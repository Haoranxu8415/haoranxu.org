#!/usr/bin/env node
/*
  tools/build.mjs — keeps the parts that repeat across the static pages in sync, each from one source.

    node tools/build.mjs           rewrite the generated blocks in place
    node tools/build.mjs --check   change nothing; exit 1 if any page is out of date

  A generated block sits between <!-- build:NAME … --> and <!-- /build:NAME --> in a page.
  Edit the source, never the block:
    nav    ← _partials/nav.html            (every page; links prefixed per folder, current section marked)
                                           — a new page goes into PAGES below (works/*.html are picked up)
    works, works-count            ← WORKS in assets/js/data.js   (the file list and its count in works.html)
    file-head, file-next          ← WORKS in assets/js/data.js   (each works/ page: its file label, the next file)

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

// Works are "files", numbered in the order they were made (File 01 = oldest); listed newest first
const FILES = (() => {
  for (const w of data.WORKS)
    for (const k of ['title', 'tag', 'date', 'href', 'excerpt'])
      if (!w[k]) throw new Error(`works: "${w.title || w.href}" has no ${k} in data.js`);
  const newest = [...data.WORKS].sort((a, b) => b.date.localeCompare(a.date));
  return newest.map((w, i) => ({ ...w, num: String(newest.length - i).padStart(2, '0'), year: w.date.slice(0, 4) }));
})();

function works() {
  return FILES.map(w => {
    const stats = w.stats
      ? `\n            <dl class="file-stats">${w.stats.map(([v, k]) => `<div><dd>${v}</dd><dt>${k}</dt></div>`).join('')}</dl>`
      : '';
    return `        <a href="${w.href}" class="file">
          <div class="file-k"><span class="edge-k">File ${w.num} ▸ ${w.year}</span><span class="edge-k">${w.tag}</span></div>
          <div class="file-b">
            <h2 class="file-t">${w.title}</h2>
            <p class="file-x">${w.excerpt}</p>${stats}
          </div>
          <span class="file-ar">→</span>
        </a>`;
  }).join('\n        <div class="perf-rule" aria-hidden="true"></div>\n');
}

function worksCount() {
  const years = FILES.map(w => w.year);
  return `        <span class="gallery-count">${String(FILES.length).padStart(2, '0')} files · ${years[years.length - 1]} – ${years[0]}</span>`;
}

const fileFor = page => {
  const w = FILES.find(f => f.href === page);
  if (!w) throw new Error(`${page} has no entry in WORKS (assets/js/data.js)`);
  return w;
};
function fileHead(page) {
  const w = fileFor(page);
  return `        <div class="file-head"><span class="edge-k">File ${w.num}</span><span class="edge-k">${w.tag}</span><span class="edge-k">${w.year}</span></div>`;
}
// The next file is the next one back in time; after the oldest, round to the newest
function fileNext(page) {
  const i = FILES.indexOf(fileFor(page)), n = FILES[(i + 1) % FILES.length];
  return `        <div class="perf-rule" aria-hidden="true"></div>
        <a class="next-file" href="${n.href.replace(/^works\//, '')}"><span class="edge-k">Next ▸ File ${n.num} · ${n.year}</span><b>${n.title}</b></a>`;
}

/* ── Replace the blocks ── */
function fill(html, name, content, file) {
  // the name must end at a space or the comment's end, so "works" never matches "works-count"
  const re = new RegExp(`(<!-- build:${name}(?=[ \\t]|-->)[^>]*-->)[\\s\\S]*?([ \\t]*<!-- /build:${name} -->)`);
  if (!re.test(html)) throw new Error(`${file}: no <!-- build:${name} --> … <!-- /build:${name} --> markers`);
  return html.replace(re, (_, open, close) => `${open}\n${content}\n${close}`);
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
  if (file === 'works.html') after = fill(fill(after, 'works', works(), file), 'works-count', worksCount(), file);
  if (file.startsWith('works/')) after = fill(fill(after, 'file-head', fileHead(file), file), 'file-next', fileNext(file), file);
  return [file, before, after];
}).filter(([, before, after]) => after !== before);

if (CHECK) {
  changed.forEach(([file]) => console.log(`out of date: ${file}`));
  if (changed.length) { console.error(`\n${changed.length} page(s) out of date — run: node tools/build.mjs`); process.exit(1); }
} else {
  changed.forEach(([file, , after]) => { writeFileSync(join(ROOT, file), after); console.log(`updated: ${file}`); });
}
if (!changed.length) console.log(`all ${PAGES.length} pages up to date`);
