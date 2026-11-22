/**
 * Autoplay — Spill's (embla-carousel-autoplay's options, methods and events): the next snap every `delay` ms; at the
 * last one, back to the first (or a stop: stopOnLastSnap). Paused while the page is hidden.
 *
 *   Spill(viewport, {}, [Autoplay({ delay: 5000, stopOnMouseEnter: true })]);
 *   api.plugins().autoplay.stop();
 */

/**
 * @typedef {object} AutoplayOptions
 * @property {boolean} [active]
 * @property {Record<string, AutoplayOptions>} [breakpoints]
 * @property {number | ((scrollSnaps: number[], api: any) => number[])} [delay] ms — or one per snap
 * @property {boolean} [jump] no animation between snaps
 * @property {boolean} [playOnInit]
 * @property {boolean} [stopOnFocusIn]
 * @property {boolean} [stopOnInteraction] a drag or a press stops it for good (else it starts again after)
 * @property {boolean} [stopOnMouseEnter] (starts again on mouse leave, unless an interaction stopped it)
 * @property {boolean} [stopOnLastSnap]
 * @property {((rootNode: HTMLElement) => HTMLElement | null) | null} [rootNode] where the mouse and the focus are watched
 */

/** @type {Readonly<Required<AutoplayOptions>>} */
export const autoplayDefaults = Object.freeze({
  active: true,
  breakpoints: {},
  delay: 4000,
  jump: false,
  playOnInit: true,
  stopOnFocusIn: true,
  stopOnInteraction: true,
  stopOnMouseEnter: false,
  stopOnLastSnap: false,
  rootNode: null,
});

/** @param {AutoplayOptions} [userOptions] */
export default function Autoplay(userOptions = {}) {
  /** @type {any} */
  let options = {};
  /** @type {any} */
  let api = null;
  let timer = 0;
  let due = 0;
  let playing = false;
  let interacted = false;
  let wasPlaying = false;
  /** A select of autoplay's own (not a hand's: that one starts the time again) */
  let ownSelect = false;
  /** @type {(() => void)[]} */
  let cleanups = [];

  const delayFor = () => {
    const delay = options.delay;
    if (typeof delay !== "function") return delay;
    const each = delay(api.scrollSnapList(), api);
    return each[api.selectedScrollSnap()] ?? autoplayDefaults.delay;
  };

  function clear() {
    if (!timer) return;
    clearTimeout(timer);
    timer = 0;
    due = 0;
    api.emit("autoplay:timerstopped");
  }

  function set() {
    clear();
    if (!playing || document.hidden) return;
    const delay = delayFor();
    due = Date.now() + delay;
    timer = window.setTimeout(next, delay);
    api.emit("autoplay:timerset");
  }

  function next() {
    timer = 0;
    due = 0;
    if (!playing) return;
    const last = !api.canScrollNext();
    if (last && options.stopOnLastSnap) return self.stop();
    ownSelect = true;
    if (last) api.scrollTo(0, options.jump);
    else api.scrollNext(options.jump);
    ownSelect = false;
    api.emit("autoplay:select");
    set();
  }

  const self = {
    name: "autoplay",
    options: userOptions,
    /** @param {any} carousel @param {any} handler */
    init(carousel, handler) {
      api = carousel;
      options = handler.optionsAtMedia(handler.mergeOptions(handler.mergeOptions(autoplayDefaults, Autoplay.globalOptions ?? {}), userOptions));
      if (!options.active) return;
      const root = (typeof options.rootNode === "function" ? options.rootNode(api.rootNode()) : null) ?? api.rootNode();
      const on = (/** @type {EventTarget} */ target, /** @type {string} */ type, /** @type {any} */ handler) => {
        target.addEventListener(type, handler);
        cleanups.push(() => target.removeEventListener(type, handler));
      };
      const onDown = () => {
        if (options.stopOnInteraction) {
          // Paused by the mouse over it, it counts too: it won't start again when the mouse leaves
          if (playing || wasPlaying) interacted = true;
          self.stop();
        } else if (playing) clear();
      };
      const onUp = () => {
        if (!options.stopOnInteraction && playing) set();
      };
      // A slide chosen by hand (not by autoplay): the time starts again
      const onSelect = () => {
        if (!ownSelect && playing) set();
      };
      api.on("pointerDown", onDown).on("pointerUp", onUp).on("select", onSelect);
      cleanups.push(() => api.off("pointerDown", onDown).off("pointerUp", onUp).off("select", onSelect));
      if (options.stopOnMouseEnter) {
        on(root, "mouseenter", () => {
          if (playing) {
            wasPlaying = true;
            self.stop();
          }
        });
        on(root, "mouseleave", () => {
          if (wasPlaying && !interacted) self.play();
          wasPlaying = false;
        });
      }
      if (options.stopOnFocusIn) {
        on(root, "focusin", () => {
          if (playing || wasPlaying) {
            interacted = true;
            self.stop();
          }
        });
      }
      on(document, "visibilitychange", () => {
        if (document.hidden) clear();
        else set();
      });
      if (options.playOnInit) self.play();
    },
    destroy() {
      clear();
      cleanups.forEach((cleanup) => cleanup());
      cleanups = [];
      playing = false;
      interacted = false;
    },
    /** @param {boolean} [jump] */
    play(jump) {
      if (jump !== undefined) options.jump = jump;
      if (playing || !api) return;
      playing = true;
      interacted = false;
      api.emit("autoplay:play");
      set();
    },
    stop() {
      if (!playing) return;
      playing = false;
      clear();
      api.emit("autoplay:stop");
    },
    /** The time starts again (when it plays) */
    reset() {
      if (playing) set();
    },
    isPlaying: () => playing,
    /** ms to the next snap (null when it isn't counting) */
    timeUntilNext: () => (due ? Math.max(0, due - Date.now()) : null),
  };
  return self;
}

/** Options every Autoplay starts from @type {AutoplayOptions | undefined} */
Autoplay.globalOptions = undefined;
