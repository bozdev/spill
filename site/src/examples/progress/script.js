import Spill from "@bozdev/spill";

const root = document.querySelector(".carousel--progress");
const prev = root.querySelector(".carousel__button--prev");
const next = root.querySelector(".carousel__button--next");
const bar = root.querySelector(".carousel__progress-bar");

const api = Spill(root.querySelector(".carousel__viewport"), { align: "start" });

// The bar: where the scroll is, 0 (the start) to 1 (the end), as a CSS variable the CSS scales the bar by.
// "scroll" comes once a frame, whatever moves it: a finger, a trackpad, a mouse's drag or the buttons.
const showProgress = () => bar.style.setProperty("--progress", String(api.scrollProgress()));

// Previous and next: a snap each, off at the edges
prev.addEventListener("click", () => api.scrollPrev());
next.addEventListener("click", () => api.scrollNext());
const toggleButtons = () => {
  prev.disabled = !api.canScrollPrev();
  next.disabled = !api.canScrollNext();
};

// On init and reInit (a new size changes the scroll's length) both are brought up to date
const refresh = () => {
  showProgress();
  toggleButtons();
};
api.on("init", refresh).on("reInit", refresh).on("scroll", showProgress).on("select", toggleButtons);
