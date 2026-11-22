// Spill — every part, to import what you use (each file stands on its own; a bundler leaves out the rest)
export { default, default as Spill, defaultOptions, optionsHandler } from "./spill.js";
export { default as Autoplay, autoplayDefaults } from "./plugins/autoplay.js";
export { default as ClassNames, classNamesDefaults } from "./plugins/class-names.js";
export { default as AutoHeight, autoHeightDefaults } from "./plugins/auto-height.js";
export { SpillAuto } from "./attributes.js";

// Its types (for TypeScript and editors: types/index.d.ts, made from these notes)
/** @typedef {import("./spill.js").SpillOptions} SpillOptions */
/** @typedef {import("./spill.js").SpillApi} SpillApi */
/** @typedef {import("./spill.js").SpillPlugin} SpillPlugin */
/** @typedef {import("./spill.js").SpillEngine} SpillEngine */
/** @typedef {import("./spill.js").SpillEventName} SpillEventName */
/** @typedef {import("./spill.js").SpillEventType} SpillEventType */
/** @typedef {import("./spill.js").SpillEventCallback} SpillEventCallback */
/** @typedef {import("./spill.js").Align} SpillAlign */
/** @typedef {import("./attributes.js").SpillWords} SpillWords */
/** @typedef {import("./plugins/autoplay.js").AutoplayOptions} AutoplayOptions */
/** @typedef {ReturnType<typeof import("./plugins/autoplay.js").default>} AutoplayType */
/** @typedef {import("./plugins/class-names.js").ClassNamesOptions} ClassNamesOptions */
/** @typedef {ReturnType<typeof import("./plugins/class-names.js").default>} ClassNamesType */
/** @typedef {import("./plugins/auto-height.js").AutoHeightOptions} AutoHeightOptions */
/** @typedef {ReturnType<typeof import("./plugins/auto-height.js").default>} AutoHeightType */
