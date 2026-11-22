export namespace SpillAuto {
    let plugins: Record<string, (options: any) => any>;
    let words: Partial<SpillWords>;
    /** Every carousel in the roots built (once) @param {ParentNode[]} [roots] */
    function scan(roots?: ParentNode[]): void;
    /** The carousels in the roots taken down (a page leaving) @param {ParentNode[]} roots */
    function forget(roots: ParentNode[]): void;
    /** A carousel's API, by its element or anything in it @param {Element} element @returns {SpillApi | null} */
    function get(element: Element): SpillApi | null;
    function all(): Map<HTMLElement, SpillApi>;
    /**
     * Scan the page now, and (observe) the carousels added later and the ones removed — a page that changes by itself.
     * A site that swaps its content (a router) calls scan / forget itself instead: start({ observe: false })
     * @param {{ observe?: boolean }} [how]
     */
    function start({ observe }?: {
        observe?: boolean;
    }): void;
    /** Every carousel taken down, nothing watched */
    function stop(): void;
}
export type SpillApi = import("./spill.js").SpillApi;
export type Built = {
    api: SpillApi;
    cleanups: (() => void)[];
};
export type SpillWords = {
    carousel: string;
    carouselRole: string;
    slideRole: string;
    slide: string;
    prev: string;
    next: string;
    goTo: string;
    autoplay: string;
};
