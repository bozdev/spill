# Writing for the Spill site

How the docs pages and the live examples are written. Read this before adding a page or an example.

## The site

- Astro + MDX, in `site/`. `npm run dev` (from `site/`) serves it on port 4331; `npm run build` writes `site/dist`.
- `site/src/nav.ts` — the sidebar: every page's URL and title, in reading order (the pager follows it).
- `site/src/layouts/Docs.astro` — the docs layout: the frontmatter `title` becomes the `<h1>`, `description` the lead paragraph; the sidebar, "On this page" (from h2 / h3) and previous / next come with it.
- `site/src/pages/docs/index.mdx` — the reference page: its frontmatter, imports and tone.
- `site/src/components/Callout.astro` — `<Callout kind="note|tip|warning" title="…">…</Callout>`.
- `site/src/components/ExampleFrame.astro` — a live example over its code tabs.
- `site/src/examples/base.css` — the examples' shared look (`.carousel`, `.carousel__viewport`, `__container`, `__slide`, `__card`, `__controls`, `__buttons`, `__button`, `__dots`).
- `site/src/styles/site.css` — the site's tokens (`--accent`, `--accent-text`, `--green`, `--line`, `--line-strong`, `--surface`, `--surface-2`, `--text`, `--muted`, `--strong`, `--font-display`, `--font-mono` …).
- `site/astro.config.mjs` — aliases: `@bozdev/spill` → `../src/index.js`, and `@bozdev/spill/core`, `/auto`, `/attributes`, `/plugins/autoplay`, `/plugins/class-names`, `/plugins/auto-height` — the package's own exports. Examples import the library exactly as a user would, and always run the repo's own `src/`.

## A page

- Its file: `site/src/pages/<url path>.mdx` — `/docs/guides/breakpoints/` → `site/src/pages/docs/guides/breakpoints.mdx`.
- Frontmatter: `layout` (the relative path to `site/src/layouts/Docs.astro`), `title` (as in `nav.ts`), `description` (one plain sentence: the lead).
- No h1 in the body. Sections are h2, sub-sections h3. Start with a paragraph or an example, not a heading.
- Code fences name their language (`html`, `css`, `js`, `ts`, `jsx`, `vue`, `svelte`, `astro`, `sh`). Tables are fine — they scroll in their own box.
- Internal links are absolute with a trailing slash, as in `nav.ts` (`/docs/api/options/`). An example: `/examples/#<slug>`.
- An example on a page: `import Name from "../../examples/<slug>/index.astro"` (the `../` depth from the page's folder), then `<Name />` on its own line with blank lines around it.
- MDX: braces and `<` in prose go in backticks; no HTML comments (`{/* … */}` instead); blank lines around components.

## An example

A folder, `site/src/examples/<slug>/`:

- `meta.json` — `{ "title", "description" (one sentence), "order" }`; `/examples/` lists them by `order`.
- `markup.html` — the root has `class="carousel carousel--<slug>"`, then `.carousel__viewport > .carousel__container > .carousel__slide` (a `.carousel__card` with a number, or your own content). Real `<button type="button">`s with an `aria-label` when they hold only an icon; inline SVG icons; valid HTML; no inline scripts; no external images or fonts.
- `style.css` (optional) — only selectors under `.carousel--<slug>`, the site's tokens with fallbacks (`var(--line, #333)`); any animation respects `prefers-reduced-motion`.
- `script.js` — imports from `@bozdev/spill`, finds its root with `document.querySelector(".carousel--<slug>")`, builds and wires it. Plain, readable, briefly commented — people copy it. No globals; no console output.
- `index.astro` — as `basic/index.astro`; with a `style.css` it also imports it (`?raw` for the tab, and plain for the page) and passes `{css}` to `ExampleFrame`. Its `slug` is the folder's name.
- An example works on its own and next to any other on the same page.

## Facts and voice

- Every option, method, event, attribute, default and behavior matches `src/` — read the code, not only the README. Never invent API.
- Plain American English, short sentences, second person. No marketing words, no emoji.

Example slugs and their order: basic 1, align 2, slides-to-scroll 3, drag-free 4, skip-snaps 5, variable-widths 6, vertical 7, right-to-left 8, breakpoints 9, progress 10, events 11, attributes 12, autoplay 13, class-names 14, auto-height 15, thumbnails 16, scale 17, opacity 18 (and `hero`, on the home page only).
