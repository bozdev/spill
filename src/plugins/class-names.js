/**
 * ClassNames — Spill's (embla-carousel-class-names' options): classes for the state, to style it with CSS — the
 * selected snap's slides, the slides in view, a carousel a mouse can drag, and while it does.
 *
 *   Spill(viewport, {}, [ClassNames({ snapped: "is-active" })]);
 */

/**
 * @typedef {object} ClassNamesOptions
 * @property {boolean} [active]
 * @property {Record<string, ClassNamesOptions>} [breakpoints]
 * @property {string | string[]} [snapped] on the selected snap's slides
 * @property {string | string[]} [inView] on the slides in view
 * @property {string | string[]} [draggable] on the viewport, when a mouse can drag it
 * @property {string | string[]} [dragging] on the viewport, while a pointer is down on it
 */

/** @type {Readonly<Required<ClassNamesOptions>>} */
export const classNamesDefaults = Object.freeze({
  active: true,
  breakpoints: {},
  snapped: "is-snapped",
  inView: "is-in-view",
  draggable: "is-draggable",
  dragging: "is-dragging",
});

/** @param {string | string[]} value */
const list = (value) => (Array.isArray(value) ? value : String(value || "").split(/\s+/)).filter(Boolean);

/** @param {ClassNamesOptions} [userOptions] */
export default function ClassNames(userOptions = {}) {
  /** @type {any} */
  let options = {};
  /** @type {any} */
  let api = null;
  /** @type {(() => void)[]} */
  let cleanups = [];

  /** @param {Element} node @param {string | string[]} names @param {boolean} on */
  const toggle = (node, names, on) => list(names).forEach((name) => node.classList.toggle(name, on));

  const snapped = () => {
    const chosen = new Set(api.internalEngine().slideRegistry[api.selectedScrollSnap()] ?? []);
    api.slideNodes().forEach((/** @type {Element} */ slide, /** @type {number} */ index) => toggle(slide, options.snapped, chosen.has(index)));
  };
  const inView = () => {
    const seen = new Set(api.slidesInView());
    api.slideNodes().forEach((/** @type {Element} */ slide, /** @type {number} */ index) => toggle(slide, options.inView, seen.has(index)));
  };
  const down = () => toggle(api.rootNode(), options.dragging, true);
  const up = () => toggle(api.rootNode(), options.dragging, false);

  const self = {
    name: "classNames",
    options: userOptions,
    /** @param {any} carousel @param {any} handler */
    init(carousel, handler) {
      api = carousel;
      options = handler.optionsAtMedia(handler.mergeOptions(handler.mergeOptions(classNamesDefaults, ClassNames.globalOptions ?? {}), userOptions));
      if (!options.active) return;
      toggle(api.rootNode(), options.draggable, api.internalEngine().options.watchDrag !== false);
      snapped();
      inView();
      api.on("select", snapped).on("reInit", snapped).on("slidesInView", inView).on("pointerDown", down).on("pointerUp", up);
      cleanups.push(() => api.off("select", snapped).off("reInit", snapped).off("slidesInView", inView).off("pointerDown", down).off("pointerUp", up));
    },
    destroy() {
      cleanups.forEach((cleanup) => cleanup());
      cleanups = [];
      if (!api) return;
      toggle(api.rootNode(), options.draggable, false);
      toggle(api.rootNode(), options.dragging, false);
      api.slideNodes().forEach((/** @type {Element} */ slide) => {
        toggle(slide, options.snapped, false);
        toggle(slide, options.inView, false);
      });
    },
  };
  return self;
}

/** Options every ClassNames starts from @type {ClassNamesOptions | undefined} */
ClassNames.globalOptions = undefined;
