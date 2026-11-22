# Changelog

## 0.1.0

The first release.

- **The carousel:** Embla Carousel's API, options and events on the browser's own scrolling: `align`, `axis`, `container`, `slides`, `containScroll`, `direction`, `slidesToScroll`, `inViewThreshold`, `breakpoints`, `dragFree`, `dragThreshold`, `skipSnaps`, `duration`, `startIndex`, `active`, `watchDrag`, `watchResize`, `watchSlides`, `watchFocus` (no `loop`).
- **Native scroll underneath:** a finger and a trackpad scroll it as any scrolling box (momentum, CSS scroll snap); a mouse drags it; a moving carousel is an eased animation of the scroll, never a `transform`.
- **Plugins:** Autoplay, ClassNames, AutoHeight — as Embla's, with their options, methods and events; your own in Embla's shape.
- **Attributes:** `SpillAuto` builds every `[data-spill-carousel]` and wires its controls (previous / next, dots, progress, go-to, play), inside the carousel or anywhere on the page; its labels in any language.
- **No dependencies, no stylesheet file:** what it needs it writes inline and takes away on `destroy()`. `containScroll: false` (room before the first slide and after the last) and an older WebKit's scrollbar get a few rules from JavaScript as a constructed stylesheet — nothing a Content Security Policy blocks.
- **Entry points:** `@bozdev/spill` (every part), `@bozdev/spill/core` (the carousel alone), `@bozdev/spill/attributes`, `@bozdev/spill/auto` (built by attributes, the plugins registered), `@bozdev/spill/plugins/*`; built files in `dist/` for a `<script>` tag.
- **Types:** `types/`, made from the source's JSDoc.
