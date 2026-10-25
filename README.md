# haoranxu.org

Personal portfolio of Haoran Xu — student at UBC Sauder BUCS, building at the intersection of business, design, and technology.

**Live site:** [haoranxu.org](https://haoranxu.org)

---

## Design System

Emerald × Champagne Gold. Two typefaces: Cormorant Garamond (display/identity) and DM Sans (UI text). All color tokens are defined as CSS custom properties in `assets/css/style.css` under section 1 (Tokens).

## Tech Stack

- Vanilla HTML / CSS / JavaScript — no frameworks, no runtime dependencies
- Node 18+ — only for `tools/build.mjs` (no packages to install)
- [marked.js](https://marked.js.org) — Markdown rendering for Notes
- Cormorant Garamond + DM Sans — self-hosted in `assets/fonts/` (SIL OFL 1.1)
- GitHub Pages — hosting
- Cloudflare — CDN and DNS

## Project Structure

```
index.html              Home (served at /)
home.html               Redirect to / for old links
gallery.html            Photography, as rolls (index → rolls of prints) with lightbox
works.html              Works index
notes.html              Writing, rendered from Markdown
contact.html            Contact and social links
404.html                Not-found page (absolute links — served at any path)
sitemap.xml, robots.txt Search engines: page list; robots keeps /posts/ (note bodies) out of search

works/                  Individual work detail pages
posts/                  Markdown files for Notes articles
tools/build.mjs         Writes the generated blocks into the pages (see Build)
_partials/nav.html      The navbar, once — copied into every page by the build

assets/
  css/style.css         All styles — labelled sections (§0 self-hosted fonts)
  fonts/                Cormorant Garamond + DM Sans woff2 (latin, latin-ext) + OFL licences
  js/data.js            Single source of truth: WORKS + POSTS arrays
  js/home.js            Home: name/print layout, scattered kit drawings, latest line, film strip
  js/notes.js           Renders Notes timeline and post cards
  js/main.js            Page transitions, progress bar, lightbox, navbar (ink, frost, mobile index)
  images/
    gallery/            Originals (archive) + thumbs/ (720w) + large/ (2400) + mini/ (320w, home film strip)
    kexue/              Photos for A Winter's Light work page
    bubbles/            Screenshots for Information Bubbles work page
```

## Local Preview

Serve the folder (pages use root-relative paths, so opening the files directly won't work):

```
python3 -m http.server 8000      # then open http://localhost:8000
```

## Content Maintenance

### Add a Note

1. Create a `.md` file in `posts/` — plain prose, no frontmatter required.
2. Add one entry to the `POSTS` array in `assets/js/data.js`:
   ```js
   {
     id:    'post-7',           // unique, used as anchor on notes.html
     file:  'posts/your-file.md',
     title: 'Your Title',
     date:  '2026-05-01',       // ISO format, used for sorting
     tags:  'Tag One · Tag Two',
   }
   ```
3. The timeline, the numbered entries (Entry 01 = oldest), the count, and the home "Lately writing" line all update automatically.
   Note bodies are kept out of search on purpose (`robots.txt` disallows `/posts/`).

### Add a Work

1. Create a detail page in `works/` — copy an existing file as template.
2. Add one entry to the `WORKS` array in `assets/js/data.js`:
   ```js
   {
     title:   'Your Work Title',
     tag:     'Category · Label',
     date:    '2026-01-01',       // sorts the list; the card shows the year
     href:    'works/your-page.html',
     excerpt: 'One or two sentences for the card.',
     stats:   [['5', 'models'], ['4,800', 'API calls']],   // optional — only figures stated on the work's page
   }
   ```
3. Copy the `<!-- build:file-head -->` and `<!-- build:file-next -->` markers into the new page (from any page in `works/`), then run `node tools/build.mjs` — it writes the file into `works.html` (numbered by date: File 01 = oldest), updates the count, and fills each work page's file label and its "Next ▸" link. (The deploy runs it too, but run it locally to preview.)
4. Add the page to `sitemap.xml`.
5. The newest work (by `date`) becomes the home "Now researching" line automatically.

### Add a Gallery Photo

1. Keep the original in `assets/images/gallery/` (archive only — never loaded by the site).
2. Export WebP versions (EXIF rotation applied):
   - `thumbs/photoN.webp` — 720px wide, quality ~78 (gallery prints)
   - `large/photoN.webp` — 2400px long edge, quality ~82 (lightbox)
   - `mini/photoN.webp` — 320px wide, quality ~72 (home film strip)
3. Add a `.shot` block to its roll's `.roll-frames` in `gallery.html` (width/height = the thumb's pixel size — main.js sets the rows from them), and renumber the `.n` captions after it — numbers run across the whole gallery:
   ```html
   <div class="shot">
     <span class="print"><img src="assets/images/gallery/thumbs/photoN.webp" width="720" height="480" decoding="async"
          data-full="assets/images/gallery/large/photoN.webp" alt="Title" loading="lazy"
          onerror="this.closest('.shot').style.display='none'" /><span class="exif"><span>105mm</span><span>f/4</span><span>1/125 s</span><span>ISO 100</span></span></span>
     <span class="cap"><span class="n">19 ▸</span><span class="t">Title</span></span>
   </div>
   ```
   The `.exif` values come from the original's EXIF (`mdls photoN.JPG` on macOS); leave the span out if it has none.
   A new roll is a new `<section class="roll">` plus an entry in the `.roll-index` at the top; update the frame / roll counts there and in `.gallery-count`.
4. Optionally add it to the home film strip (the `P` list in `assets/js/home.js`, uses the `mini/` version).

### Home page

`index.html` holds the markup; everything that moves or is placed is in `assets/js/home.js`:

- **Latest line** — "Now researching" (newest `WORKS` entry) and "Lately writing" (newest `POSTS` entry) alternate every 2.8 s. Nothing to edit by hand.
- **Film strip** — the `P` list: `[photo number, title, width, height]` of the `mini/` image.
- **Kit drawings** — the `KIT` list: `name` (shown on hover), `vb` (the SVG viewBox size; all drawings share one scale, so a bigger object gets a bigger viewBox) and `svg` (the line drawing). Pieces are placed automatically into the free space around the portrait; on screens ≥ 1800 px they stay right of "Xu".
- **Date stamp / "Field notes" date** — today's date, set in the browser.

### Navigation

The navbar lives once, in `_partials/nav.html`. Edit it there — a link, the one-line notes in the phone menu (`.nav-desc`), the contact line at its foot (`.nav-foot`) — then run `node tools/build.mjs`; it copies it into every page with the right link prefix (`./`, `../` for `works/`, `/` for `404.html`) and marks the current section `class="active"` (the gold underline follows it).

A new page needs the `<!-- build:nav -->` / `<!-- /build:nav -->` markers where the navbar goes (copy them from any page) and a line in `PAGES` in `tools/build.mjs`; pages in `works/` are picked up automatically. The build refuses to run if a page has a navbar but isn't listed, so none can be left behind.

## Build

The site is plain static HTML, but a few blocks repeat or mirror `data.js`. Each has one source;
`tools/build.mjs` (Node, no dependencies) writes it into the pages between `<!-- build:NAME -->` markers:

| Block | Source | Pages |
|---|---|---|
| `nav` | `_partials/nav.html` | every page |
| `works`, `works-count` | `WORKS` in `assets/js/data.js` | `works.html` |
| `file-head`, `file-next` | `WORKS` in `assets/js/data.js` | each page in `works/` |

```
node tools/build.mjs          # rewrite the blocks
node tools/build.mjs --check  # exit 1 if a page is out of date
```

Never edit inside the markers — the next build overwrites it. The build renders every page before writing any, so an error leaves nothing half-updated. The deploy workflow runs it before publishing.

## Deployment

Pushing to `main` triggers the GitHub Actions workflow (`.github/workflows/static.yml`), which deploys the site to GitHub Pages automatically.

The workflow stamps every CSS/JS reference in the HTML with the commit (`style.css?v=<sha>`), so browsers fetch fresh files after each deploy — keep plain `assets/css/…` / `assets/js/…` paths in the source. If a change still doesn't appear, purge the Cloudflare cache: **Dashboard → haoranxu.org → Caching → Configuration → Purge Cache**.

---

## License

**Code** (HTML, CSS, JavaScript): [MIT License](LICENSE)

**Content** (photography, writing, design work): [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) — attribution required, non-commercial, share-alike.

© 2026 Haoran Xu
