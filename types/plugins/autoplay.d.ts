/** @param {AutoplayOptions} [userOptions] */
declare function Autoplay(userOptions?: AutoplayOptions): {
    name: string;
    options: AutoplayOptions;
    /** @param {any} carousel @param {any} handler */
    init(carousel: any, handler: any): void;
    destroy(): void;
    /** @param {boolean} [jump] */
    play(jump?: boolean): void;
    stop(): void;
    /** The time starts again (when it plays) */
    reset(): void;
    isPlaying: () => boolean;
    /** ms to the next snap (null when it isn't counting) */
    timeUntilNext: () => number | null;
};
declare namespace Autoplay {
    let globalOptions: AutoplayOptions | undefined;
}
export default Autoplay;
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
export const autoplayDefaults: Readonly<Required<AutoplayOptions>>;
export type AutoplayOptions = {
    active?: boolean | undefined;
    breakpoints?: Record<string, AutoplayOptions> | undefined;
    /**
     * ms — or one per snap
     */
    delay?: number | ((scrollSnaps: number[], api: any) => number[]) | undefined;
    /**
     * no animation between snaps
     */
    jump?: boolean | undefined;
    playOnInit?: boolean | undefined;
    stopOnFocusIn?: boolean | undefined;
    /**
     * a drag or a press stops it for good (else it starts again after)
     */
    stopOnInteraction?: boolean | undefined;
    /**
     * (starts again on mouse leave, unless an interaction stopped it)
     */
    stopOnMouseEnter?: boolean | undefined;
    stopOnLastSnap?: boolean | undefined;
    /**
     * where the mouse and the focus are watched
     */
    rootNode?: ((rootNode: HTMLElement) => HTMLElement | null) | null | undefined;
};
