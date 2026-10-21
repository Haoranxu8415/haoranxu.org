#!/usr/bin/env node
/*
  tools/build.mjs — keeps the parts that repeat across the static pages in sync, each from one source.

    node tools/build.mjs           rewrite the generated blocks in place
    node tools/build.mjs --check   change nothing; exit 1 if any page is out of date

  A generated block sits between <!-- build:NAME … --> and <!-- /build:NAME --> in a page.
  Edit the source, never the block:
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

/* ── Pages that carry generated blocks ── */
const PAGES = ['works.html'];

/* ── Renderers ── */
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

let stale = 0;
for (const file of PAGES) {
  const before = read(file);
  let after = before;
  if (file === 'works.html') after = fill(after, 'works', works(), file);
  if (after === before) continue;
  stale++;
  if (CHECK) console.log(`out of date: ${file}`);
  else { writeFileSync(join(ROOT, file), after); console.log(`updated: ${file}`); }
}
if (CHECK && stale) { console.error(`\n${stale} page(s) out of date — run: node tools/build.mjs`); process.exit(1); }
if (!stale) console.log(`all ${PAGES.length} pages up to date`);
