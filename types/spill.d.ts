/**
 * A carousel on a scrolling viewport
 * @param {HTMLElement} root the viewport: the box that scrolls (its first child the container, unless `container`)
 * @param {SpillOptions} [userOptions]
 * @param {SpillPlugin[]} [userPlugins]
 */
declare function Spill(root: HTMLElement, userOptions?: SpillOptions, userPlugins?: SpillPlugin[]): SpillApi;
declare namespace Spill {
    let globalOptions: SpillOptions | undefined;
}
export default Spill;
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
export const defaultOptions: Readonly<Required<SpillOptions>>;
/** Handed to plugins (Embla's options handler) */
export const optionsHandler: Readonly<{
    mergeOptions: typeof mergeOptions;
    optionsAtMedia: typeof optionsAtMedia;
    optionsMediaQueries: (list: any[]) => MediaQueryList[];
}>;
export type Align = "start" | "center" | "end" | ((viewSize: number, snapSize: number, index: number) => number);
export type SpillOptions = {
    /**
     * where a snap sits in the viewport
     */
    align?: Align | undefined;
    axis?: "x" | "y" | undefined;
    /**
     * the slides' parent (default: the viewport's first child)
     */
    container?: string | HTMLElement | null | undefined;
    /**
     * (default: the container's children)
     */
    slides?: string | NodeListOf<HTMLElement> | HTMLElement[] | null | undefined;
    containScroll?: false | "trimSnaps" | "keepSnaps" | undefined;
    direction?: "ltr" | "rtl" | undefined;
    slidesToScroll?: number | "auto" | undefined;
    inViewThreshold?: number | number[] | undefined;
    /**
     * media query → options
     */
    breakpoints?: Record<string, SpillOptions> | undefined;
    dragFree?: boolean | undefined;
    /**
     * px a mouse moves before it drags
     */
    dragThreshold?: number | undefined;
    skipSnaps?: boolean | undefined;
    /**
     * 20–60: higher is slower (× 16 ms)
     */
    duration?: number | undefined;
    startIndex?: number | undefined;
    active?: boolean | undefined;
    watchDrag?: boolean | ((api: SpillApi, event: PointerEvent) => boolean | void) | undefined;
    watchResize?: boolean | ((api: SpillApi, entries: ResizeObserverEntry[]) => boolean | void) | undefined;
    watchSlides?: boolean | ((api: SpillApi, mutations: MutationRecord[]) => boolean | void) | undefined;
    watchFocus?: boolean | ((api: SpillApi, event: FocusEvent) => boolean | void) | undefined;
};
export type SpillPlugin = {
    name: string;
    options?: object;
    init: (api: SpillApi, handler: typeof optionsHandler) => void;
    destroy: () => void;
} & Record<string, any>;
/**
 * The core's events (Embla's names)
 */
export type SpillEventName = "init" | "reInit" | "destroy" | "select" | "scroll" | "settle" | "resize" | "slidesInView" | "slidesChanged" | "slideFocusStart" | "slideFocus" | "pointerDown" | "pointerUp";
/**
 * An event: the core's, or a plugin's ("autoplay:play")
 */
export type SpillEventType = SpillEventName | (string & {});
export type SpillEventCallback = (api: SpillApi, event: SpillEventType) => void;
/**
 * A carousel's API — Embla's
 */
export type SpillApi = {
    /**
     * to the next snap (`jump`: at once, no animation)
     */
    scrollNext: (jump?: boolean) => void;
    /**
     * to the previous snap
     */
    scrollPrev: (jump?: boolean) => void;
    /**
     * to a snap
     */
    scrollTo: (index: number, jump?: boolean) => void;
    canScrollNext: () => boolean;
    canScrollPrev: () => boolean;
    selectedScrollSnap: () => number;
    previousScrollSnap: () => number;
    /**
     * every snap's place, 0 (the start) to 1 (the end)
     */
    scrollSnapList: () => number[];
    /**
     * where the scroll is, 0 to 1
     */
    scrollProgress: () => number;
    slidesInView: () => number[];
    slidesNotInView: () => number[];
    slideNodes: () => HTMLElement[];
    containerNode: () => HTMLElement | null;
    /**
     * the viewport
     */
    rootNode: () => HTMLElement;
    /**
     * not Embla's physics engine: what plugins need of it
     */
    internalEngine: () => SpillEngine;
    /**
     * the plugins in force, by name
     */
    plugins: () => Record<string, SpillPlugin>;
    /**
     * rebuilt (the selected snap kept)
     */
    reInit: (options?: SpillOptions, plugins?: SpillPlugin[]) => void;
    destroy: () => void;
    on: (event: SpillEventType, callback: SpillEventCallback) => SpillApi;
    off: (event: SpillEventType, callback: SpillEventCallback) => SpillApi;
    emit: (event: SpillEventType) => SpillApi;
};
/**
 * What plugins need of the carousel: the options in force, each snap's slides, the snaps' places (px), the scroll's limit
 */
export type SpillEngine = {
    options: Required<SpillOptions>;
    slideRegistry: number[][];
    scrollSnaps: number[];
    limit: {
        min: number;
        max: number;
    };
};
/** Options merged, plain objects deeply (breakpoints included) @param {object} a @param {object} [b] @returns {any} */
declare function mergeOptions(a: object, b?: object): any;
/** The options with their matching breakpoints merged in (in order) @param {any} options */
declare function optionsAtMedia(options: any): any;
