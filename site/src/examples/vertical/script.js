import Spill from "@bozdev/spill";

const root = document.querySelector(".carousel--vertical");
const prev = root.querySelector(".carousel__button--prev");
const next = root.querySelector(".carousel__button--next");
const dots = root.querySelector(".carousel__dots");

// axis "y": the viewport scrolls up and down. The column itself is the CSS's (style.css).
const api = Spill(root.querySelector(".carousel__viewport"), { axis: "y", align: "start" });

// Previous and next: a snap each, off at the edges
prev.addEventListener("click", () => api.scrollPrev());
next.addEventListener("click", () => api.scrollNext());
const toggleButtons = () => {
  prev.disabled = !api.canScrollPrev();
  next.disabled = !api.canScrollNext();
};

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
  toggleButtons();
};
api.on("init", refresh).on("reInit", refresh).on("select", () => {
  selectDot();
  toggleButtons();
});
