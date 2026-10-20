# haoranxu.org

Personal portfolio of Haoran Xu — student at UBC Sauder BUCS, building at the intersection of business, design, and technology.

**Live site:** [haoranxu.org](https://haoranxu.org)

---

## Design System

Emerald × Champagne Gold. Two typefaces: Cormorant Garamond (display/identity) and DM Sans (UI text). All color tokens are defined as CSS custom properties in `assets/css/style.css` under section 1 (Tokens).

## Tech Stack

- Vanilla HTML / CSS / JavaScript — no frameworks
- [marked.js](https://marked.js.org) — Markdown rendering for Notes
- Cormorant Garamond + DM Sans — self-hosted in `assets/fonts/` (SIL OFL 1.1)
- Font Awesome brand icons — inlined as SVG on the contact page
- GitHub Pages — hosting
- Cloudflare — CDN and DNS

## Project Structure

```
index.html              Home (served at /)
home.html               Redirect to / for old links
gallery.html            Photography gallery with lightbox
works.html              Works index
notes.html              Writing, rendered from Markdown
contact.html            Contact and social links

works/                  Individual work detail pages
posts/                  Markdown files for Notes articles

assets/
  css/style.css         All styles — labelled sections (§0 self-hosted fonts)
  fonts/                Cormorant Garamond + DM Sans woff2 (latin, latin-ext) + OFL licences
  js/data.js            Single source of truth: WORKS + POSTS arrays
  js/home.js            Populates home page Works + Notes panels
  js/notes.js           Renders Notes timeline and post cards
  js/main.js            Page transitions, progress bar, lightbox, mobile nav
  images/
    gallery/            Originals (archive) + thumbs/ (720w) + large/ (2400) + mini/ (320w, home strip)
    kexue/              Photos for A Winter's Light work page
    bubbles/            Screenshots for Information Bubbles work page
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
3. The timeline, post cards, and home preview panel all update automatically.

### Add a Work

1. Create a detail page in `works/` — copy an existing file as template.
2. Add one entry to the `WORKS` array in `assets/js/data.js`:
   ```js
   {
     title: 'Your Work Title',
     tag:   'Category · Label',
     date:  '2026-01-01',       // year only matters for display order
     href:  'works/your-page.html',
   }
   ```
3. Add a `.card.work-card` block to `works.html` pointing to the new page.

### Add a Gallery Photo

1. Keep the original in `assets/images/gallery/` (archive only — never loaded by the site).
2. Export two WebP versions (EXIF rotation applied):
   - `thumbs/photoN.webp` — 720px wide, quality ~78 (masonry grid, home strip)
   - `large/photoN.webp` — 2400px long edge, quality ~82 (lightbox)
   - `mini/photoN.webp` — 320px wide, quality ~72 (only if it goes in the home strip)
3. Add a `.masonry-item` block to `gallery.html` (width/height = the thumb's pixel size, prevents layout shift):
   ```html
   <div class="masonry-item">
     <img src="assets/images/gallery/thumbs/photoN.webp" width="720" height="480" decoding="async"
          data-full="assets/images/gallery/large/photoN.webp"
          alt="Description" loading="lazy"
          onerror="this.closest('.masonry-item').style.display='none'" />
   </div>
   ```
4. Optionally add it to the home page gallery strip in `index.html` (use the `mini/` version).

## TODO

**Works**
- [ ] Add cover images to the work cards on `works.html`
- [ ] Generate `works.html` cards from `WORKS` in `assets/js/data.js` (add `excerpt` + `cover` fields) so a new work only needs one entry instead of two

## Deployment

Pushing to `main` triggers the GitHub Actions workflow (`.github/workflows/static.yml`), which deploys the site to GitHub Pages automatically.

If CSS or JS files are updated and the changes don't appear on the live site, purge the Cloudflare cache: **Dashboard → haoranxu.org → Caching → Configuration → Purge Cache**.

---

## License

**Code** (HTML, CSS, JavaScript): [MIT License](LICENSE)

**Content** (photography, writing, design work): [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) — attribution required, non-commercial, share-alike.

© 2026 Haoran Xu
