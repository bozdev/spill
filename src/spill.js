/**
 * Spill — a carousel on the browser's own scrolling.
 *
 * Embla Carousel's API, options, events and plugin shape — https://www.embla-carousel.com — with native scroll under
 * it: a finger's momentum, a trackpad, the keyboard's focus and find-in-page work as on any scrolling box, and nothing
 * is moved with transforms. The browser's CSS snap points do the snapping; Spill measures, animates and reports.
 * No dependencies, no stylesheet: what it needs it writes inline (the look — slide sizes, gaps — is the page's CSS,
 * as with Embla).
 *
 *   const api = Spill(viewport, { align: "start" }, [Autoplay()]);
 *   api.on("select", () => console.log(api.selectedScrollSnap()));
 */

/** @typedef {"start" | "center" | "end" | ((viewSize: number, snapSize: number, index: number) => number)} Align */
/**
 * @typedef {object} SpillOptions
 * @property {Align} [align] where a snap sits in the viewport
 * @property {"x" | "y"} [axis]
 * @property {string | HTMLElement | null} [container] the slides' parent (default: the viewport's first child)
 * @property {string | HTMLElement[] | NodeListOf<HTMLElement> | null} [slides] (default: the container's children)
 * @property {"trimSnaps" | "keepSnaps" | false} [containScroll]
 * @property {"ltr" | "rtl"} [direction]
 * @property {number | "auto"} [slidesToScroll]
 * @property {number | number[]} [inViewThreshold]
 * @property {Record<string, SpillOptions>} [breakpoints] media query → options
 * @property {boolean} [dragFree]
 * @property {number} [dragThreshold] px a mouse moves before it drags
 * @property {boolean} [skipSnaps]
 * @property {number} [duration] 20–60: higher is slower (× 16 ms)
 * @property {number} [startIndex]
 * @property {boolean} [active]
 * @property {boolean | ((api: SpillApi, event: PointerEvent) => boolean | void)} [watchDrag]
 * @property {boolean | ((api: SpillApi, entries: ResizeObserverEntry[]) => boolean | void)} [watchResize]
 * @property {boolean | ((api: SpillApi, mutations: MutationRecord[]) => boolean | void)} [watchSlides]
 * @property {boolean | ((api: SpillApi, event: FocusEvent) => boolean | void)} [watchFocus]
 */
/** @typedef {{ name: string, options?: object, init: (api: SpillApi, handler: typeof optionsHandler) => void, destroy: () => void } & Record<string, any>} SpillPlugin */
/**
 * The core's events (Embla's names)
 * @typedef {"init" | "reInit" | "destroy" | "select" | "scroll" | "settle" | "resize" | "slidesInView" | "slidesChanged" | "slideFocusStart" | "slideFocus" | "pointerDown" | "pointerUp"} SpillEventName
 */
/** An event: the core's, or a plugin's ("autoplay:play") @typedef {SpillEventName | (string & {})} SpillEventType */
/** @typedef {(api: SpillApi, event: SpillEventType) => void} SpillEventCallback */
/**
 * A carousel's API — Embla's
 * @typedef {object} SpillApi
 * @property {(jump?: boolean) => void} scrollNext to the next snap (`jump`: at once, no animation)
 * @property {(jump?: boolean) => void} scrollPrev to the previous snap
 * @property {(index: number, jump?: boolean) => void} scrollTo to a snap
 * @property {() => boolean} canScrollNext
 * @property {() => boolean} canScrollPrev
 * @property {() => number} selectedScrollSnap
 * @property {() => number} previousScrollSnap
 * @property {() => number[]} scrollSnapList every snap's place, 0 (the start) to 1 (the end)
 * @property {() => number} scrollProgress where the scroll is, 0 to 1
 * @property {() => number[]} slidesInView
 * @property {() => number[]} slidesNotInView
 * @property {() => HTMLElement[]} slideNodes
 * @property {() => HTMLElement | null} containerNode
 * @property {() => HTMLElement} rootNode the viewport
 * @property {() => SpillEngine} internalEngine not Embla's physics engine: what plugins need of it
 * @property {() => Record<string, SpillPlugin>} plugins the plugins in force, by name
 * @property {(options?: SpillOptions, plugins?: SpillPlugin[]) => void} reInit rebuilt (the selected snap kept)
 * @property {() => void} destroy
 * @property {(event: SpillEventType, callback: SpillEventCallback) => SpillApi} on
 * @property {(event: SpillEventType, callback: SpillEventCallback) => SpillApi} off
 * @property {(event: SpillEventType) => SpillApi} emit
 */
/**
 * What plugins need of the carousel: the options in force, each snap's slides, the snaps' places (px), the scroll's limit
 * @typedef {{ options: Required<SpillOptions>, slideRegistry: number[][], scrollSnaps: number[], limit: { min: number, max: number } }} SpillEngine
 */

/** @type {Readonly<Required<SpillOptions>>} */
export const defaultOptions = Object.freeze({
  align: "center",
  axis: "x",
  container: null,
  slides: null,
  containScroll: "trimSnaps",
  direction: "ltr",
  slidesToScroll: 1,
  inViewThreshold: 0,
  breakpoints: {},
  dragFree: false,
  dragThreshold: 10,
  skipSnaps: false,
  duration: 25,
  startIndex: 0,
  active: true,
  watchDrag: true,
  watchResize: true,
  watchSlides: true,
  watchFocus: true,
});

// The attributes Spill writes (hooks for the page's CSS)
const VIEWPORT = "data-spill-viewport";
const AXIS = "data-spill-axis";
const DRAGGABLE = "data-spill-draggable";
const DRAGGING = "data-spill-dragging";
const FREE = "data-spill-free";
/** Form fields a mouse press never drags from (Embla's "focus nodes") */
const FIELDS = "input, select, textarea, [contenteditable]:not([contenteditable='false'])";

const isObject = (/** @type {unknown} */ value) => Object.prototype.toString.call(value) === "[object Object]";
const clamp = (/** @type {number} */ value, /** @type {number} */ low, /** @type {number} */ high) => Math.min(high, Math.max(low, value));
const now = () => performance.now();
const stillMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** The one rule an inline style can't be — an older WebKit's scrollbar (no `scrollbar-width`) — added once, from JS
 * (a constructed stylesheet: no file, no <style>, nothing a CSP blocks) */
let scrollbarsHidden = false;
function hideScrollbars() {
  if (scrollbarsHidden || typeof document === "undefined") return;
  scrollbarsHidden = true;
  if (typeof CSS !== "undefined" && CSS.supports("scrollbar-width", "none")) return;
  try {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(`[${"data-spill-viewport"}]::-webkit-scrollbar { display: none; }`);
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
  } catch {
    // no constructed stylesheets: the scrollbar shows
  }
}

// containScroll: false needs room before the first snap and after the last. Not the container's padding: a slide sized
// in % shrinks with it, and its end padding isn't scrollable (the slides overflow the container, its padding stays
// behind); not a slide's margin either (an end margin isn't scrollable). Two empty flex items are: the container's
// ::before and ::after — one constructed stylesheet (no file, no <style>, nothing a Content Security Policy blocks),
// shaped by the container's attribute and custom properties. Without constructed stylesheets: the padding, as before.
const ROOM = "data-spill-room";
const ROOM_RULES =
  `[${ROOM}]::before,[${ROOM}]::after{content:"";display:block;flex:none;pointer-events:none}` +
  `[${ROOM}~=start]::before{order:-99999;inline-size:var(--spill-room-start);margin-inline-end:var(--spill-room-gap)}` +
  `[${ROOM}~=end]::after{order:99999;inline-size:var(--spill-room-end);margin-inline-start:var(--spill-room-gap)}` +
  `[${ROOM}~=y]::before,[${ROOM}~=y]::after{inline-size:auto;margin:0}` +
  `[${ROOM}~=y][${ROOM}~=start]::before{block-size:var(--spill-room-start);margin-block-end:var(--spill-room-gap)}` +
  `[${ROOM}~=y][${ROOM}~=end]::after{block-size:var(--spill-room-end);margin-block-start:var(--spill-room-gap)}`;
/** @type {boolean | null} the room's stylesheet: in place, impossible, or not tried yet */
let roomRules = null;

function roomStyles() {
  if (roomRules !== null) return roomRules;
  try {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(ROOM_RULES);
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    roomRules = true;
  } catch {
    roomRules = false;
  }
  return roomRules;
}

/** Options merged, plain objects deeply (breakpoints included) @param {object} a @param {object} [b] @returns {any} */
function mergeOptions(a, b) {
  /** @type {Record<string, any>} */
  const out = { ...a };
  for (const [key, value] of Object.entries(b ?? {})) out[key] = isObject(out[key]) && isObject(value) ? mergeOptions(out[key], value) : value;
  return out;
}

/** The options with their matching breakpoints merged in (in order) @param {any} options */
function optionsAtMedia(options) {
  const breakpoints = options?.breakpoints ?? {};
  return Object.keys(breakpoints)
    .filter((query) => matchMedia(query).matches)
    .reduce((merged, query) => mergeOptions(merged, breakpoints[query]), options);
}

/** Every breakpoint's media query, to watch @param {any[]} list @returns {MediaQueryList[]} */
const optionsMediaQueries = (list) => list.flatMap((options) => Object.keys(options?.breakpoints ?? {})).map((query) => matchMedia(query));

/** Handed to plugins (Embla's options handler) */
export const optionsHandler = Object.freeze({ mergeOptions, optionsAtMedia, optionsMediaQueries });

/**
 * A carousel on a scrolling viewport
 * @param {HTMLElement} root the viewport: the box that scrolls (its first child the container, unless `container`)
 * @param {SpillOptions} [userOptions]
 * @param {SpillPlugin[]} [userPlugins]
 */
export default function Spill(root, userOptions = {}, userPlugins = []) {
  /** @type {Map<string, Set<SpillEventCallback>>} */
  const listeners = new Map();
  /** @type {any} the options given (Spill.globalOptions under them), kept for reInit */
  let given = mergeOptions({}, userOptions);
  let pluginList = [...userPlugins];
  /** @type {Record<string, SpillPlugin>} */
  let pluginApis = {};
  /** @type {any} the options in force (breakpoints applied) */
  let options = mergeOptions(defaultOptions, given);
  /** @type {(() => void)[]} the media queries watched */
  let mediaCleanups = [];
  let destroyed = false;

  // ---- an active carousel's state
  let active = false;
  /** @type {HTMLElement | null} */
  let container = null;
  /** @type {HTMLElement[]} */
  let slides = [];
  /** @type {number[]} each snap's scroll position (px, forward) */
  let positions = [];
  /** @type {number[][]} each snap's slides */
  let registry = [];
  let selected = 0;
  let previous = 0;
  let max = 0;
  /** @type {Set<number>} */
  let inView = new Set();
  let animation = 0;
  let settleTimer = 0;
  let frame = 0;
  let moving = false;
  /** where it last came to rest (px): a scroll event that finds it still there is the echo of its own last frame */
  let restAt = Number.NaN;
  /** the viewport carried data-spill-viewport before Spill (SpillAuto's marker, the author's own): it stays */
  let markedBefore = false;
  /** @type {WeakMap<Element, number>} the viewport's and each slide's size along the axis when last measured: a
   * resize that changes none of them is no resize (Embla's way — a slide only taller in a row is nothing to it) */
  let measuredSizes = new WeakMap();
  /** @type {{ x: number, y: number, from: number, index: number, moved: boolean, id: number, samples: [number, number][] } | null} */
  let drag = null;
  /** @type {(() => void)[]} */
  let cleanups = [];
  /** @type {Set<HTMLElement>} elements that had no style attribute before Spill wrote one */
  const unstyled = new Set();

  const x = () => options.axis !== "y";
  const rtl = () => x() && options.direction === "rtl";
  /** The scroll position, forward (0 at the start, rtl too) */
  const position = () => (x() ? (rtl() ? -root.scrollLeft : root.scrollLeft) : root.scrollTop);
  /** @param {number} to */
  const place = (to) => {
    if (x()) root.scrollLeft = rtl() ? -to : to;
    else root.scrollTop = to;
  };
  const extent = () => Math.max(0, x() ? root.scrollWidth - root.clientWidth : root.scrollHeight - root.clientHeight);
  const viewSize = () => (x() ? root.clientWidth : root.clientHeight);
  const snapType = () => (options.dragFree ? "none" : `${x() ? "x" : "y"} mandatory`);
  const snapOff = () => root.style.setProperty("scroll-snap-type", "none");
  const snapOn = () => root.style.setProperty("scroll-snap-type", snapType());
  const call = (/** @type {any} */ watch, /** @type {unknown} */ detail) => (typeof watch === "function" ? watch(api, detail) : watch);

  /** @param {SpillEventType} name @returns {SpillApi} */
  function emit(name) {
    for (const callback of [...(listeners.get(name) ?? [])]) callback(api, name);
    return api;
  }

  // ---------------------------------------------------------------------------
  // Measuring: where every snap is; its first slide carries it for the browser
  // ---------------------------------------------------------------------------

  const MARGIN = () => (x() ? "scroll-margin-inline-start" : "scroll-margin-block-start");
  const PAD = () => (x() ? ["padding-inline-start", "padding-inline-end"] : ["padding-block-start", "padding-block-end"]);
  const ROOM_PROPERTIES = ["--spill-room-start", "--spill-room-end", "--spill-room-gap", "padding-inline-start", "padding-inline-end", "padding-block-start", "padding-block-end"];

  /** The room containScroll: false made, taken away */
  function clearRoom() {
    if (!container) return;
    container.removeAttribute(ROOM);
    for (const property of ROOM_PROPERTIES) container.style.removeProperty(property);
  }

  /** Room before the first snap (lead) and after the last (tail), in px @param {number} lead @param {number} tail */
  function makeRoom(lead, tail) {
    if (!container || (!lead && !tail)) return;
    if (!roomStyles()) {
      const [first, last] = PAD();
      if (lead) container.style.setProperty(first, `${lead}px`);
      if (tail) container.style.setProperty(last, `${tail}px`);
      return;
    }
    // Each room is a flex item: the gap after (before) it is taken back by a negative margin
    const gap = parseFloat(getComputedStyle(container).getPropertyValue(x() ? "column-gap" : "row-gap")) || 0;
    container.style.setProperty("--spill-room-start", `${lead}px`);
    container.style.setProperty("--spill-room-end", `${tail}px`);
    container.style.setProperty("--spill-room-gap", `${-gap}px`);
    container.setAttribute(ROOM, [x() ? "x" : "y", lead ? "start" : "", tail ? "end" : ""].filter(Boolean).join(" "));
  }

  function clearSnaps() {
    for (const slide of slides) {
      slide.style.removeProperty("scroll-snap-align");
      slide.style.removeProperty("scroll-snap-stop");
      slide.style.removeProperty("scroll-margin-inline-start");
      slide.style.removeProperty("scroll-margin-block-start");
    }
  }

  function measure() {
    if (!container) return;
    clearSnaps();
    clearRoom();
    const box = root.getBoundingClientRect();
    const at = position();
    const items = slides.map((slide) => {
      const rect = slide.getBoundingClientRect();
      const start = !x() ? rect.top - box.top - root.clientTop + at : rtl() ? box.right - root.clientLeft - rect.right + at : rect.left - box.left - root.clientLeft + at;
      return { start, size: x() ? rect.width : rect.height };
    });
    measuredSizes = new WeakMap([[root, x() ? box.width : box.height], ...slides.map((slide, index) => /** @type {[Element, number]} */ ([slide, items[index].size]))]);
    const view = viewSize();
    // The snaps: slidesToScroll slides each — or, "auto", as many as fit in view
    /** @type {number[][]} */
    const groups = [];
    if (options.slidesToScroll === "auto") {
      /** @type {number[]} */
      let group = [];
      items.forEach((item, index) => {
        if (group.length && item.start + item.size - items[group[0]].start > view + 1) {
          groups.push(group);
          group = [];
        }
        group.push(index);
      });
      if (group.length) groups.push(group);
    } else {
      const step = Math.max(1, Math.floor(Number(options.slidesToScroll)) || 1);
      for (let index = 0; index < items.length; index += step) groups.push(items.slice(index, index + step).map((_, offset) => index + offset));
    }
    const raw = groups.map((group, index) => {
      const start = Math.min(...group.map((at) => items[at].start));
      const size = Math.max(...group.map((at) => items[at].start + items[at].size)) - start;
      const align = options.align;
      const offset = typeof align === "function" ? align(view, size, index) : align === "start" ? 0 : align === "end" ? view - size : (view - size) / 2;
      return { group, at: start - offset };
    });
    // containScroll false: room before the first snap and after the last, so every snap can take its place
    let lead = 0;
    if (options.containScroll === false && raw.length) {
      lead = Math.max(0, -Math.min(...raw.map((snap) => snap.at)));
      const tail = Math.max(0, Math.max(...raw.map((snap) => snap.at)) - extent());
      makeRoom(lead, tail);
    }
    max = extent();
    /** @type {{ group: number[], at: number }[]} */
    const snaps = [];
    for (const snap of raw) {
      const at = clamp(snap.at + lead, 0, max);
      const last = snaps[snaps.length - 1];
      // trimSnaps: snaps the edges hold at the same place are one
      if (options.containScroll === "trimSnaps" && last && Math.abs(last.at - at) < 1) last.group.push(...snap.group);
      else snaps.push({ group: [...snap.group], at });
    }
    positions = snaps.map((snap) => snap.at);
    registry = snaps.map((snap) => snap.group);
    // For the browser: each snap's first slide, its alignment as its scroll margin — the snap point is exactly ours
    for (const snap of snaps) {
      const leader = slides[snap.group[0]];
      if (!leader) continue;
      leader.style.setProperty("scroll-snap-align", "start");
      leader.style.setProperty(MARGIN(), `${items[snap.group[0]].start + lead - snap.at}px`);
      if (!options.skipSnaps) leader.style.setProperty("scroll-snap-stop", "always");
    }
    selected = clamp(selected, 0, Math.max(0, positions.length - 1));
    previous = clamp(previous, 0, Math.max(0, positions.length - 1));
  }

  /** The snap nearest a scroll position @param {number} at */
  function nearest(at) {
    let best = 0;
    positions.forEach((snap, index) => {
      if (Math.abs(snap - at) < Math.abs(positions[best] - at)) best = index;
    });
    return best;
  }

  /** @param {number} index */
  function choose(index) {
    if (index === selected) return;
    previous = selected;
    selected = index;
    emit("select");
  }

  // ---------------------------------------------------------------------------
  // Moving: an animation of the native scroll position (snapping paused meanwhile)
  // ---------------------------------------------------------------------------

  function stop() {
    if (!animation) return;
    cancelAnimationFrame(animation);
    animation = 0;
    snapOn();
  }

  /** @param {number} to @param {boolean} [jump] @param {boolean} [free] a free throw: the nearest snap chosen when it stops */
  function animate(to, jump = false, free = false) {
    stop();
    const from = position();
    const target = clamp(to, 0, max);
    const ms = Math.max(0, Number(options.duration) || 0) * 16;
    if (Math.abs(target - from) < 0.5) return;
    moving = true;
    if (jump || ms === 0 || stillMotion()) {
      snapOff();
      place(target);
      snapOn();
      if (free) choose(nearest(position()));
      return;
    }
    snapOff();
    const started = now();
    const step = () => {
      const progress = Math.min(1, (now() - started) / ms);
      place(from + (target - from) * (1 - (1 - progress) ** 4));
      if (progress < 1) {
        animation = requestAnimationFrame(step);
        return;
      }
      animation = 0;
      snapOn();
      if (free) choose(nearest(position()));
      settle();
    };
    animation = requestAnimationFrame(step);
  }

  function settle() {
    clearTimeout(settleTimer);
    if (animation || drag?.moved || !moving) return;
    moving = false;
    restAt = position();
    emit("settle");
  }

  /** @param {number} index @param {boolean} [jump] */
  function scrollTo(index, jump = false) {
    if (!active || !positions.length) return;
    const to = clamp(Math.round(index), 0, positions.length - 1);
    choose(to);
    animate(positions[to], jump);
  }

  // ---------------------------------------------------------------------------
  // Listening: the scroll, a mouse's drag, a focus, sizes, slides, what's in view
  // ---------------------------------------------------------------------------

  function onScroll() {
    if (!moving && !animation && !drag && Math.abs(position() - restAt) < 0.5) return;
    moving = true;
    if (!frame) {
      frame = requestAnimationFrame(() => {
        frame = 0;
        emit("scroll");
        if (!animation && !drag?.moved) choose(nearest(position()));
      });
    }
    clearTimeout(settleTimer);
    settleTimer = window.setTimeout(settle, 150);
  }

  /** @type {number | null} the press that said pointerDown: its end says pointerUp, whatever pointer it was */
  let pressed = null;

  /** @param {PointerEvent} event */
  function onPressEnd(event) {
    if (event.pointerId !== pressed) return;
    pressed = null;
    window.removeEventListener("pointerup", onPressEnd);
    window.removeEventListener("pointercancel", onPressEnd);
    emit("pointerUp");
  }

  /** @param {PointerEvent} event */
  function onPointerDown(event) {
    emit("pointerDown");
    pressed = event.pointerId;
    // Heard before a drag's own end (added first): pointerUp, then the throw's select
    window.addEventListener("pointerup", onPressEnd);
    window.addEventListener("pointercancel", onPressEnd);
    stop();
    if (event.pointerType !== "mouse" || event.button !== 0 || !call(options.watchDrag, event)) return;
    if (event.target instanceof Element && event.target.closest(FIELDS)) return;
    drag = { x: event.clientX, y: event.clientY, from: position(), index: selected, moved: false, id: event.pointerId, samples: [[now(), position()]] };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
  }

  /** @param {PointerEvent} event */
  function onPointerMove(event) {
    if (!drag || event.pointerId !== drag.id) return;
    const moved = x() ? (rtl() ? drag.x - event.clientX : event.clientX - drag.x) : event.clientY - drag.y;
    if (!drag.moved) {
      if (Math.abs(moved) < options.dragThreshold) return;
      drag.moved = true;
      snapOff();
      root.setAttribute(DRAGGING, "");
      root.style.setProperty("user-select", "none");
      getSelection()?.removeAllRanges();
      try {
        root.setPointerCapture(event.pointerId);
      } catch {
        // the pointer is gone already
      }
    }
    event.preventDefault();
    place(clamp(drag.from - moved, 0, max));
    drag.samples.push([now(), position()]);
    if (drag.samples.length > 8) drag.samples.shift();
  }

  /** @param {PointerEvent} event */
  function onPointerUp(event) {
    if (!drag || event.pointerId !== drag.id) return;
    unlisten();
    const ended = drag;
    drag = null;
    if (!ended.moved) return;
    root.removeAttribute(DRAGGING);
    root.style.removeProperty("user-select");
    // The click a drag ends with isn't a click
    const swallow = (/** @type {Event} */ click) => {
      click.preventDefault();
      click.stopPropagation();
    };
    root.addEventListener("click", swallow, { capture: true, once: true });
    setTimeout(() => root.removeEventListener("click", swallow, { capture: true }), 0);
    // The throw: the last moves' speed, carried on
    const recent = ended.samples.filter(([time]) => now() - time < 100);
    const [first, last] = [recent[0] ?? ended.samples[0], recent[recent.length - 1] ?? ended.samples[ended.samples.length - 1]];
    const speed = last[0] > first[0] ? (last[1] - first[1]) / (last[0] - first[0]) : 0;
    const projected = position() + speed * (options.dragFree ? 400 : 150);
    if (options.dragFree) {
      animate(projected, false, true);
      if (!animation) choose(nearest(position()));
      return;
    }
    let index = nearest(projected);
    if (!options.skipSnaps) index = clamp(index, ended.index - 1, ended.index + 1);
    if (index === ended.index && Math.abs(speed) > 0.35) index = clamp(ended.index + Math.sign(speed), 0, positions.length - 1);
    choose(index);
    animate(positions[index]);
    if (!animation) snapOn();
  }

  function unlisten() {
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerUp);
  }

  /** A press still down when the carousel stops: its end is no longer heard */
  function unlistenPress() {
    pressed = null;
    window.removeEventListener("pointerup", onPressEnd);
    window.removeEventListener("pointercancel", onPressEnd);
  }

  /** A link's or an image's own drag would steal a mouse's @param {DragEvent} event */
  const onDragStart = (event) => {
    if (drag) event.preventDefault();
  };

  /** @param {FocusEvent} event */
  function onFocusIn(event) {
    const slide = slides.findIndex((each) => each.contains(/** @type {Node} */ (event.target)));
    if (slide < 0 || !call(options.watchFocus, event)) return;
    emit("slideFocusStart");
    scrollTo(registry.findIndex((group) => group.includes(slide)));
    emit("slideFocus");
  }

  // ---------------------------------------------------------------------------
  // Turning on and off
  // ---------------------------------------------------------------------------

  /** @param {any} withOptions @param {SpillPlugin[]} withPlugins */
  function activate(withOptions, withPlugins) {
    const base = mergeOptions(mergeOptions(defaultOptions, Spill.globalOptions ?? {}), withOptions);
    options = optionsAtMedia(base);
    pluginList = withPlugins;
    // Breakpoints: a change in any (its own, a plugin's) turns the carousel off and on again
    for (const query of optionsMediaQueries([Spill.globalOptions, withOptions, ...withPlugins.map((plugin) => plugin.options)])) {
      const onChange = () => reActivate();
      query.addEventListener("change", onChange);
      mediaCleanups.push(() => query.removeEventListener("change", onChange));
    }
    if (!options.active) return;
    const own = typeof options.container === "string" ? root.querySelector(options.container) : options.container;
    container = /** @type {HTMLElement | null} */ (own ?? root.firstElementChild);
    if (!container) return;
    slides =
      typeof options.slides === "string"
        ? /** @type {HTMLElement[]} */ ([...container.querySelectorAll(options.slides)])
        : options.slides
          ? /** @type {HTMLElement[]} */ ([...options.slides])
          : /** @type {HTMLElement[]} */ ([...container.children]);
    active = true;
    for (const node of [root, container, ...slides]) if (!node.hasAttribute("style")) unstyled.add(node);
    markedBefore = root.hasAttribute(VIEWPORT);
    root.setAttribute(VIEWPORT, "");
    root.setAttribute(AXIS, x() ? "x" : "y");
    root.toggleAttribute(FREE, !!options.dragFree);
    root.toggleAttribute(DRAGGABLE, options.watchDrag !== false);
    root.style.setProperty(x() ? "overflow-x" : "overflow-y", options.watchDrag === false ? "hidden" : "auto");
    root.style.setProperty(x() ? "overflow-y" : "overflow-x", "hidden");
    root.style.setProperty(x() ? "overscroll-behavior-x" : "overscroll-behavior-y", "contain");
    root.style.setProperty("scrollbar-width", "none");
    hideScrollbars();
    snapOn();
    measure();
    selected = clamp(Math.round(options.startIndex), 0, Math.max(0, positions.length - 1));
    previous = selected;
    if (positions.length) {
      snapOff();
      place(positions[selected]);
      snapOn();
    }

    /** @param {EventTarget} target @param {string} type @param {any} handler @param {AddEventListenerOptions} [how] */
    const on = (target, type, handler, how) => {
      target.addEventListener(type, handler, how);
      cleanups.push(() => target.removeEventListener(type, handler, how));
    };
    on(root, "scroll", onScroll, { passive: true });
    if ("onscrollend" in root) on(root, "scrollend", settle);
    on(root, "pointerdown", onPointerDown);
    on(root, "dragstart", onDragStart);
    on(root, "wheel", stop, { passive: true });
    on(root, "touchstart", stop, { passive: true });
    on(root, "focusin", onFocusIn);

    if (options.watchResize !== false && typeof ResizeObserver === "function") {
      const sizes = new ResizeObserver((entries) => {
        if (!call(options.watchResize, entries)) return;
        // A size along the axis changed — the viewport's or a slide's (Embla's way: half a pixel at least). Its first
        // report (each observer's, a rebuild's too) is no exception: the sizes it measured are the same, unless one
        // changed in between — or it was built hidden (measured 0), and shows now

        const along = (/** @type {Element} */ node) => {
          const rect = node.getBoundingClientRect();
          return x() ? rect.width : rect.height;
        };
        if (!entries.some((entry) => Math.abs(along(entry.target) - (measuredSizes.get(entry.target) ?? -1)) >= 0.5)) return;
        measure();
        if (!moving && !drag && positions.length) {
          snapOff();
          place(positions[selected]);
          snapOn();
        }
        // Embla rebuilds here (reInit(), then resize): measured again, the snaps are as new — said as Embla says it,
        // so what listens to reInit (the arrows, the dots, a plugin) follows a new size too
        emit("reInit");
        emit("resize");
      });
      sizes.observe(root);
      for (const slide of slides) sizes.observe(slide);
      cleanups.push(() => sizes.disconnect());
    }
    if (options.watchSlides !== false && typeof MutationObserver === "function") {
      const changes = new MutationObserver((mutations) => {
        if (!call(options.watchSlides, mutations)) return;
        reActivate();
        emit("slidesChanged");
      });
      changes.observe(container, { childList: true });
      cleanups.push(() => changes.disconnect());
    }
    if (typeof IntersectionObserver === "function") {
      const threshold = options.inViewThreshold;
      const least = Array.isArray(threshold) ? Math.min(...threshold) : Number(threshold) || 0;
      const seen = new IntersectionObserver(
        (entries) => {
          let changed = false;
          for (const entry of entries) {
            const index = slides.indexOf(/** @type {HTMLElement} */ (entry.target));
            if (index < 0) continue;
            const inside = least > 0 ? entry.intersectionRatio >= least : entry.intersectionRatio > 0;
            if (inside !== inView.has(index)) {
              changed = true;
              if (inside) inView.add(index);
              else inView.delete(index);
            }
          }
          if (changed) emit("slidesInView");
        },
        { root, threshold },
      );
      for (const slide of slides) seen.observe(slide);
      cleanups.push(() => seen.disconnect());
    }

    pluginApis = {};
    for (const plugin of pluginList) {
      plugin.init(api, optionsHandler);
      pluginApis[plugin.name] = plugin;
    }
  }

  function deactivate() {
    for (const plugin of Object.values(pluginApis)) plugin.destroy();
    pluginApis = {};
    mediaCleanups.forEach((cleanup) => cleanup());
    mediaCleanups = [];
    stop();
    unlisten();
    unlistenPress();
    cancelAnimationFrame(frame);
    clearTimeout(settleTimer);
    cleanups.forEach((cleanup) => cleanup());
    cleanups = [];
    drag = null;
    frame = 0;
    moving = false;
    if (active) {
      clearSnaps();
      clearRoom();
      for (const property of ["overflow-x", "overflow-y", "overscroll-behavior-x", "overscroll-behavior-y", "scrollbar-width", "scroll-snap-type", "user-select"]) root.style.removeProperty(property);
      for (const name of [AXIS, FREE, DRAGGABLE, DRAGGING]) root.removeAttribute(name);
      if (!markedBefore) root.removeAttribute(VIEWPORT);
    }
    for (const node of unstyled) if (node.getAttribute("style") === "") node.removeAttribute("style");
    unstyled.clear();
    active = false;
    container = null;
    slides = [];
    positions = [];
    registry = [];
    inView = new Set();
  }

  /** @param {any} [withOptions] @param {SpillPlugin[]} [withPlugins] */
  function reActivate(withOptions = {}, withPlugins = pluginList) {
    if (destroyed) return;
    const startIndex = withOptions.startIndex ?? selected;
    deactivate();
    given = mergeOptions(given, withOptions);
    // The snap it was on stays (Embla's way), unless the new options say where to start
    activate(mergeOptions(given, { startIndex }), withPlugins);
    emit("reInit");
  }

  // ---------------------------------------------------------------------------
  // The API (Embla's)
  // ---------------------------------------------------------------------------

  /** @type {SpillApi} */
  const api = {
    /** @param {boolean} [jump] */
    scrollNext: (jump) => scrollTo(selected + 1, jump),
    /** @param {boolean} [jump] */
    scrollPrev: (jump) => scrollTo(selected - 1, jump),
    scrollTo,
    canScrollNext: () => active && selected < positions.length - 1,
    canScrollPrev: () => active && selected > 0,
    selectedScrollSnap: () => selected,
    previousScrollSnap: () => previous,
    /** Every snap's place, 0 (the start) to 1 (the end) */
    scrollSnapList: () => positions.map((at) => (max ? at / max : 0)),
    /** Where the scroll is, 0 to 1 */
    scrollProgress: () => (max ? clamp(position() / max, 0, 1) : 0),
    slidesInView: () => [...inView].sort((a, b) => a - b),
    slidesNotInView: () => slides.map((_, index) => index).filter((index) => !inView.has(index)),
    slideNodes: () => [...slides],
    containerNode: () => container,
    rootNode: () => root,
    /** Not Embla's physics engine: what plugins need of it — the options in force, each snap's slides, the places */
    internalEngine: () => ({ options, slideRegistry: registry.map((group) => [...group]), scrollSnaps: [...positions], limit: { min: 0, max } }),
    plugins: () => ({ ...pluginApis }),
    reInit: (withOptions, withPlugins) => reActivate(withOptions, withPlugins),
    destroy() {
      if (destroyed) return;
      deactivate();
      emit("destroy");
      listeners.clear();
      destroyed = true;
    },
    on(name, callback) {
      if (!listeners.has(name)) listeners.set(name, new Set());
      listeners.get(name)?.add(callback);
      return api;
    },
    off(name, callback) {
      listeners.get(name)?.delete(callback);
      return api;
    },
    emit,
  };

  activate(given, pluginList);
  // After the caller's own api.on("init", …)
  setTimeout(() => {
    if (!destroyed) emit("init");
  }, 0);
  return api;
}

/** Options every carousel starts from (under its own) @type {SpillOptions | undefined} */
Spill.globalOptions = undefined;
