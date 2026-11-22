/**
 * AutoHeight — Spill's (embla-carousel-auto-height's): the carousel as tall as the selected snap's tallest slide.
 * Its container gets the height; give the container `align-items: flex-start` (so the slides keep their own heights)
 * and, for a smooth change, `transition: height 0.2s`.
 *
 *   Spill(viewport, {}, [AutoHeight()]);
 */

/**
 * @typedef {object} AutoHeightOptions
 * @property {boolean} [active]
 * @property {Record<string, AutoHeightOptions>} [breakpoints]
 */

/** @type {Readonly<Required<AutoHeightOptions>>} */
export const autoHeightDefaults = Object.freeze({ active: true, breakpoints: {} });

/** @param {AutoHeightOptions} [userOptions] */
export default function AutoHeight(userOptions = {}) {
  /** @type {any} */
  let api = null;
  /** @type {(() => void)[]} */
  let cleanups = [];

  const fit = () => {
    const container = api.containerNode();
    if (!container) return;
    const slides = api.slideNodes();
    const chosen = api.internalEngine().slideRegistry[api.selectedScrollSnap()] ?? [];
    const tallest = Math.max(0, ...chosen.map((/** @type {number} */ index) => slides[index]?.offsetHeight ?? 0));
    if (tallest) container.style.height = `${tallest}px`;
  };

  const self = {
    name: "autoHeight",
    options: userOptions,
    /** @param {any} carousel @param {any} handler */
    init(carousel, handler) {
      api = carousel;
      const options = handler.optionsAtMedia(handler.mergeOptions(handler.mergeOptions(autoHeightDefaults, AutoHeight.globalOptions ?? {}), userOptions));
      if (!options.active) return;
      fit();
      api.on("select", fit).on("resize", fit).on("slideFocus", fit);
      cleanups.push(() => api.off("select", fit).off("resize", fit).off("slideFocus", fit));
    },
    destroy() {
      cleanups.forEach((cleanup) => cleanup());
      cleanups = [];
      api?.containerNode()?.style.removeProperty("height");
    },
  };
  return self;
}

/** Options every AutoHeight starts from @type {AutoHeightOptions | undefined} */
AutoHeight.globalOptions = undefined;
