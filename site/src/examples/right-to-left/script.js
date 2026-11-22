import Spill from "@bozdev/spill";

const root = document.querySelector(".carousel--right-to-left");
const prev = root.querySelector(".carousel__button--prev");
const next = root.querySelector(".carousel__button--next");
const dots = root.querySelector(".carousel__dots");

// direction "rtl" goes with dir="rtl" in the markup (on the viewport or, as here, an ancestor):
// the one lays the row out from the right, the other tells Spill to read the scroll that way.
const api = Spill(root.querySelector(".carousel__viewport"), { align: "start", direction: "rtl" });

// Previous and next: a snap each, off at the edges (the row mirrors them: previous on the right)
prev.addEventListener("click", () => api.scrollPrev());
next.addEventListener("click", () => api.scrollNext());
const toggleButtons = () => {
  prev.disabled = !api.canScrollPrev();
  next.disabled = !api.canScrollNext();
};

// A dot for each snap, the first one on the right
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
