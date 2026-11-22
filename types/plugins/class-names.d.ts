/** @param {ClassNamesOptions} [userOptions] */
declare function ClassNames(userOptions?: ClassNamesOptions): {
    name: string;
    options: ClassNamesOptions;
    /** @param {any} carousel @param {any} handler */
    init(carousel: any, handler: any): void;
    destroy(): void;
};
declare namespace ClassNames {
    let globalOptions: ClassNamesOptions | undefined;
}
export default ClassNames;
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
export const classNamesDefaults: Readonly<Required<ClassNamesOptions>>;
export type ClassNamesOptions = {
    active?: boolean | undefined;
    breakpoints?: Record<string, ClassNamesOptions> | undefined;
    /**
     * on the selected snap's slides
     */
    snapped?: string | string[] | undefined;
    /**
     * on the slides in view
     */
    inView?: string | string[] | undefined;
    /**
     * on the viewport, when a mouse can drag it
     */
    draggable?: string | string[] | undefined;
    /**
     * on the viewport, while a pointer is down on it
     */
    dragging?: string | string[] | undefined;
};
