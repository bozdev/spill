import Spill from "@bozdev/spill";
import Autoplay from "@bozdev/spill/plugins/autoplay";

const root = document.querySelector(".carousel--autoplay");
const play = root.querySelector(".carousel__button--play");
const fill = root.querySelector(".carousel__timer-fill");
const dots = root.querySelector(".carousel__dots");

const api = Spill(root.querySelector(".carousel__viewport"), { align: "start" }, [Autoplay({ delay: 4000 })]);
const autoplay = api.plugins().autoplay;

// Play / pause. The button shows the state, whatever changed it: a click here, a drag or a focus in the carousel
play.addEventListener("click", () => (autoplay.isPlaying() ? autoplay.stop() : autoplay.play()));
const showState = () => play.setAttribute("aria-pressed", String(autoplay.isPlaying()));

// The line fills while the timer counts down to the next slide, and empties when the timer stops
let filling = null;
const startFill = () => {
  filling?.cancel();
  const ms = autoplay.timeUntilNext();
  if (ms !== null) filling = fill.animate({ transform: ["scaleX(0)", "scaleX(1)"] }, { duration: ms, easing: "linear" });
};
const stopFill = () => filling?.cancel();

// A dot for each snap
const buildDots = () => {
  dots.replaceChildren(
    ...api.scrollSnapList().map((_, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("aria-label", `Go to slide ${index + 1}`);
      dot.addEventListener("click", () => api.scrollTo(index));
      return dot;
    }),
  );
};
const selectDot = () => {
  [...dots.children].forEach((dot, index) => dot.setAttribute("aria-current", String(index === api.selectedScrollSnap())));
};

const refresh = () => {
  buildDots();
  selectDot();
  showState();
};
api
  .on("init", () => {
    refresh();
    startFill(); // autoplay started while the carousel was built, before these listeners
  })
  .on("reInit", refresh)
  .on("select", selectDot)
  .on("autoplay:play", showState)
  .on("autoplay:stop", showState)
  .on("autoplay:timerset", startFill)
  .on("autoplay:timerstopped", stopFill);
