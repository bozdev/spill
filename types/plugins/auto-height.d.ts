/** @param {AutoHeightOptions} [userOptions] */
declare function AutoHeight(userOptions?: AutoHeightOptions): {
    name: string;
    options: AutoHeightOptions;
    /** @param {any} carousel @param {any} handler */
    init(carousel: any, handler: any): void;
    destroy(): void;
};
declare namespace AutoHeight {
    let globalOptions: AutoHeightOptions | undefined;
}
export default AutoHeight;
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
export const autoHeightDefaults: Readonly<Required<AutoHeightOptions>>;
export type AutoHeightOptions = {
    active?: boolean | undefined;
    breakpoints?: Record<string, AutoHeightOptions> | undefined;
};
