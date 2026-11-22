/**
 * SpillAuto — Spill by attributes, Flip's way: write the markup and the carousel builds itself; its controls can be
 * anywhere on the page.
 *
 *   <section id="gallery" data-spill-carousel='{"align":"start"}' data-spill-plugins="autoplay"
 *            data-spill-autoplay='{"delay":5000}' aria-label="Gallery">
 *     <div data-spill-viewport>                      the box that scrolls (none marked: the carousel element itself)
 *       <div class="slides"> …slides… </div>
 *     </div>
 *     <button data-spill-prev></button> <button data-spill-next></button>
 *     <div data-spill-dots></div>                    one button a snap (data-spill-dots="number": numbered)
 *     <div data-spill-progress></div>                its --spill-progress: 0 → 1 as it scrolls
 *     <button data-spill-to="3"></button>            to the 3rd snap
 *     <button data-spill-play></button>              autoplay on / off (aria-pressed)
 *   </section>
 *   <button data-spill-next data-spill-for="gallery"></button>    a control elsewhere: its carousel's id
 *
 *   SpillAuto.plugins = { autoplay: Autoplay };      the plugins data-spill-plugins can name
 *   SpillAuto.words = { … };                         the labels it writes (a site's language)
 *   SpillAuto.start();                               scan the page, and watch it for new carousels
 *   SpillAuto.scan(roots) / forget(roots) / get(element) / all()
 */
import Spill from "./spill.js";

const CAROUSEL = "data-spill-carousel";
const VIEWPORT = "data-spill-viewport";
const PLUGINS = "data-spill-plugins";
const FOR = "data-spill-for";
const ARIA = "data-spill-aria";
const PREV = "data-spill-prev";
const NEXT = "data-spill-next";
const DOTS = "data-spill-dots";
const DOT = "data-spill-dot";
const PROGRESS = "data-spill-progress";
const TO = "data-spill-to";
const PLAY = "data-spill-play";
const DISABLED = "data-spill-disabled";
const CONTROLS = [PREV, NEXT, DOTS, PROGRESS, TO, PLAY].map((name) => `[${name}]`).join(", ");

/** @typedef {import("./spill.js").SpillApi} SpillApi */
/** @typedef {{ api: SpillApi, cleanups: (() => void)[] }} Built */
/** @typedef {{ carousel: string, carouselRole: string, slideRole: string, slide: string, prev: string, next: string, goTo: string, autoplay: string }} SpillWords */

/** The labels in English: what a word left out of SpillAuto.words falls back to @type {Readonly<SpillWords>} */
const WORDS = Object.freeze({
  carousel: "Carousel",
  carouselRole: "carousel",
  slideRole: "slide",
  slide: "{0} of {1}",
  prev: "Previous slide",
  next: "Next slide",
  goTo: "Go to slide {0}",
  autoplay: "Autoplay",
});
/** @type {Map<HTMLElement, Built>} */
const built = new Map();
/** @type {MutationObserver | null} */
let observer = null;

/** @param {string} text @param {...(string | number)} values */
const fill = (text, ...values) => text.replace(/\{(\d+)\}/g, (_, at) => String(values[Number(at)] ?? ""));

/** JSON from an attribute ({} when absent or broken — said in the console) @param {Element} element @param {string} name */
function json(element, name) {
  const value = element.getAttribute(name);
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    console.warn(`Spill: ${name} isn't JSON`, element, error);
    return {};
  }
}

/** The elements in the roots (the roots too) that match @param {ParentNode[]} roots @param {string} selector */
function inside(roots, selector) {
  /** @type {Set<HTMLElement>} */
  const found = new Set();
  for (const root of roots) {
    if (root instanceof HTMLElement && root.matches(selector)) found.add(root);
    for (const element of root.querySelectorAll(selector)) found.add(/** @type {HTMLElement} */ (element));
  }
  return [...found];
}

/** A carousel's controls: its own (not a nested carousel's) and the page's that name it @param {HTMLElement} element */
function controlsOf(element) {
  const own = [...element.querySelectorAll(CONTROLS)].filter((control) => control.closest(`[${CAROUSEL}]`) === element && !control.hasAttribute(FOR));
  const named = element.id ? [...document.querySelectorAll(`[${FOR}="${CSS.escape(element.id)}"]`)].filter((control) => control.matches(CONTROLS)) : [];
  return /** @type {HTMLElement[]} */ ([...own, ...named]);
}

/** @param {HTMLElement} element */
function build(element) {
  if (built.has(element)) return;
  const viewport = /** @type {HTMLElement | undefined} */ ([...element.querySelectorAll(`[${VIEWPORT}]`)].find((each) => each.closest(`[${CAROUSEL}]`) === element)) ?? element;
  const plugins = (element.getAttribute(PLUGINS) ?? "")
    .split(/[\s,]+/)
    .filter(Boolean)
    .flatMap((name) => {
      const factory = SpillAuto.plugins[name];
      if (!factory) {
        console.warn(`Spill: no plugin "${name}" — add it to SpillAuto.plugins`, element);
        return [];
      }
      return [factory(json(element, `data-spill-${name}`))];
    });
  /** @type {any} */
  let api;
  try {
    api = Spill(viewport, json(element, CAROUSEL), plugins);
  } catch (error) {
    console.warn("Spill: the carousel couldn't be built", element, error);
    return;
  }
  /** @type {(() => void)[]} */
  const cleanups = [];
  /** @param {string} name @param {() => void} callback */
  const listen = (name, callback) => {
    api.on(name, callback);
    cleanups.push(() => api.off(name, callback));
  };
  /** @type {SpillWords} */
  const words = { ...WORDS, ...SpillAuto.words };
  const controls = controlsOf(element);
  /** @param {string} name */
  const all = (name) => controls.filter((control) => control.hasAttribute(name));
  /** Labels it wrote (the author's own stay) @type {[Element, string][]} */
  const written = [];
  /** @param {Element} node @param {string} name @param {string} value */
  const write = (node, name, value) => {
    if (node.hasAttribute(name) && !written.some(([each, attribute]) => each === node && attribute === name)) return;
    node.setAttribute(name, value);
    if (!written.some(([each, attribute]) => each === node && attribute === name)) written.push([node, name]);
  };

  // ---- the buttons: prev, next, to, play
  /** @param {Event} event */
  const onClick = (event) => {
    const control = /** @type {HTMLElement} */ (event.currentTarget);
    if (control.getAttribute("aria-disabled") === "true") return;
    if (control.hasAttribute(PREV)) api.scrollPrev();
    else if (control.hasAttribute(NEXT)) api.scrollNext();
    else if (control.hasAttribute(TO)) {
      const index = Number(control.getAttribute(TO));
      if (Number.isInteger(index) && index >= 1) api.scrollTo(index - 1);
    } else if (control.hasAttribute(PLAY)) {
      const autoplay = api.plugins().autoplay;
      if (autoplay?.isPlaying()) autoplay.stop();
      else autoplay?.play();
    }
  };
  for (const control of [...all(PREV), ...all(NEXT), ...all(TO), ...all(PLAY)]) {
    control.addEventListener("click", onClick);
    cleanups.push(() => control.removeEventListener("click", onClick));
  }
  for (const control of all(PREV)) write(control, "aria-label", words.prev);
  for (const control of all(NEXT)) write(control, "aria-label", words.next);
  for (const control of all(PLAY)) write(control, "aria-label", words.autoplay);
  const edges = () => {
    for (const [list, can] of /** @type {[HTMLElement[], boolean][]} */ ([
      [all(PREV), api.canScrollPrev()],
      [all(NEXT), api.canScrollNext()],
    ])) {
      for (const control of list) {
        control.setAttribute("aria-disabled", String(!can));
        control.toggleAttribute(DISABLED, !can);
      }
    }
  };
  const playing = () => {
    const on = !!api.plugins().autoplay?.isPlaying();
    for (const control of all(PLAY)) control.setAttribute("aria-pressed", String(on));
  };

  // ---- the dots: one a snap, the selected one current
  /** @type {HTMLButtonElement[]} */
  let dots = [];
  const dotsBuild = () => {
    dots.forEach((dot) => dot.remove());
    dots = [];
    for (const holder of all(DOTS)) {
      const numbered = holder.getAttribute(DOTS) === "number";
      api.scrollSnapList().forEach((/** @type {number} */ _, /** @type {number} */ index) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.setAttribute(DOT, String(index));
        dot.setAttribute("aria-label", fill(words.goTo, index + 1));
        if (numbered) dot.textContent = String(index + 1);
        dot.addEventListener("click", () => api.scrollTo(index));
        holder.append(dot);
        dots.push(dot);
      });
    }
    dotsSelect();
  };
  const dotsSelect = () => {
    const chosen = api.selectedScrollSnap();
    for (const dot of dots) {
      if (Number(dot.getAttribute(DOT)) === chosen) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    }
  };

  // ---- the progress: a CSS variable, 0 → 1
  const progress = () => {
    const value = api.scrollProgress().toFixed(4);
    for (const bar of all(PROGRESS)) bar.style.setProperty("--spill-progress", value);
  };

  // ---- the words a screen reader hears: a carousel, its slides "1 of 5"
  const aria = element.getAttribute(ARIA) !== "false";
  const label = () => {
    if (!aria) return;
    write(element, "role", "region");
    write(element, "aria-roledescription", words.carouselRole);
    if (!element.hasAttribute("aria-labelledby")) write(element, "aria-label", words.carousel);
    api.slideNodes().forEach((/** @type {HTMLElement} */ slide, /** @type {number} */ index, /** @type {HTMLElement[]} */ slides) => {
      write(slide, "role", "group");
      write(slide, "aria-roledescription", words.slideRole);
      write(slide, "aria-label", fill(words.slide, index + 1, slides.length));
    });
  };

  const refresh = () => {
    label();
    dotsBuild();
    edges();
    progress();
    playing();
  };
  refresh();
  listen("select", () => {
    dotsSelect();
    edges();
  });
  listen("scroll", progress);
  listen("reInit", refresh);
  listen("resize", progress);
  listen("autoplay:play", playing);
  listen("autoplay:stop", playing);

  cleanups.push(() => {
    dots.forEach((dot) => dot.remove());
    for (const [node, name] of written) node.removeAttribute(name);
    for (const control of controls) {
      control.removeAttribute("aria-disabled");
      control.removeAttribute(DISABLED);
      control.removeAttribute("aria-pressed");
      control.style.removeProperty("--spill-progress");
    }
  });
  built.set(element, { api, cleanups });
  element.dispatchEvent(new CustomEvent("spill:ready", { bubbles: true, detail: { api } }));
}

/** @param {HTMLElement} element */
function remove(element) {
  const carousel = built.get(element);
  if (!carousel) return;
  built.delete(element);
  carousel.cleanups.forEach((cleanup) => cleanup());
  carousel.api.destroy();
}

export const SpillAuto = {
  /** The plugins data-spill-plugins can name: name → factory (options) @type {Record<string, (options: any) => any>} */
  plugins: {},
  /** The labels it writes — a site's own language ({0}, {1}: numbers); a word left out stays English @type {Partial<SpillWords>} */
  words: { ...WORDS },
  /** Every carousel in the roots built (once) @param {ParentNode[]} [roots] */
  scan(roots = [document]) {
    for (const element of inside(roots, `[${CAROUSEL}]`)) build(element);
  },
  /** The carousels in the roots taken down (a page leaving) @param {ParentNode[]} roots */
  forget(roots) {
    for (const element of [...built.keys()]) if (roots.some((root) => root === element || root.contains(element))) remove(element);
  },
  /** A carousel's API, by its element or anything in it @param {Element} element @returns {SpillApi | null} */
  get(element) {
    const carousel = element.closest(`[${CAROUSEL}]`);
    return carousel ? (built.get(/** @type {HTMLElement} */ (carousel))?.api ?? null) : null;
  },
  /** Every carousel built: element → API @returns {Map<HTMLElement, SpillApi>} */
  all: () => new Map([...built].map(([element, { api }]) => [element, api])),
  /**
   * Scan the page now, and (observe) the carousels added later and the ones removed — a page that changes by itself.
   * A site that swaps its content (a router) calls scan / forget itself instead: start({ observe: false })
   * @param {{ observe?: boolean }} [how]
   */
  start({ observe = true } = {}) {
    const go = () => {
      SpillAuto.scan();
      if (!observe || observer || typeof MutationObserver !== "function") return;
      observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) if (node instanceof HTMLElement) SpillAuto.scan([node]);
          for (const node of mutation.removedNodes) if (node instanceof HTMLElement) SpillAuto.forget([node]);
        }
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", go, { once: true });
    else go();
  },
  /** Every carousel taken down, nothing watched */
  stop() {
    observer?.disconnect();
    observer = null;
    for (const element of [...built.keys()]) remove(element);
  },
};
