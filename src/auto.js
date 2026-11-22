// Spill, ready by attributes: one script, and every [data-spill-carousel] on the page builds itself — its plugins
// nameable (data-spill-plugins="autoplay class-names auto-height"), new carousels picked up as they come.
//   <script type="module" src="spill/src/auto.js"></script>
import { SpillAuto } from "./attributes.js";
import Autoplay from "./plugins/autoplay.js";
import ClassNames from "./plugins/class-names.js";
import AutoHeight from "./plugins/auto-height.js";

export * from "./index.js";
export { default } from "./index.js";

SpillAuto.plugins = { autoplay: Autoplay, "class-names": ClassNames, "auto-height": AutoHeight, ...SpillAuto.plugins };
SpillAuto.start();
