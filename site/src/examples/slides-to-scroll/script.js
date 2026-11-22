import Spill from "@bozdev/spill";

const root = document.querySelector(".carousel--slides-to-scroll");
const prev = root.querySelector(".carousel__button--prev");
const next = root.querySelector(".carousel__button--next");
const dots = root.querySelector(".carousel__dots");

// A snap a page: as many slides as fit in view ("auto"). A number groups that many: slidesToScroll: 2
const api = Spill(root.querySelector(".carousel__viewport"), { align: "start", slidesToScroll: "auto" });

// Previous and next: a page each, off at the edges
prev.addEventListener("click", () => api.scrollPrev());
next.addEventListener("click", () => api.scrollNext());
const toggleButtons = () => {
  prev.disabled = !api.canScrollPrev();
  next.disabled = !api.canScrollNext();
};

// A dot for each snap — fewer than the slides. When the carousel changes width and a page holds two slides
// instead of three, Spill measures again and fires reInit: the dots are built again there.
const buildDots = () => {
  dots.replaceChildren(
    ...api.scrollSnapList().map((_, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("aria-label", `Go to page ${index + 1}`);
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
  toggleButtons();
};
api.on("init", refresh).on("reInit", refresh).on("select", () => {
  selectDot();
  toggleButtons();
});
