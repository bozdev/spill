// Spill for a <script> tag (dist/spill.global.js): one global, `Spill` — the carousel function, its plugins and
// SpillAuto on it: Spill(viewport, options, [Spill.Autoplay()]), Spill.SpillAuto.start()
import Spill, { defaultOptions, optionsHandler } from "./spill.js";
import Autoplay from "./plugins/autoplay.js";
import ClassNames from "./plugins/class-names.js";
import AutoHeight from "./plugins/auto-height.js";
import { SpillAuto } from "./attributes.js";

Object.assign(Spill, { Autoplay, ClassNames, AutoHeight, SpillAuto, defaultOptions, optionsHandler });

export default Spill;
