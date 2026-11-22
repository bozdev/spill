import Spill from "@bozdev/spill";

const root = document.querySelector(".carousel--breakpoints");
const prev = root.querySelector(".carousel__button--prev");
const next = root.querySelector(".carousel__button--next");
const dots = root.querySelector(".carousel__dots");

const api = Spill(root.querySelector(".carousel__viewport"), {
  align: "start",
  // Each query's options are merged in, in this order, while it matches. When one starts or stops
  // matching, the carousel is rebuilt (reInit), its selected snap kept.
  breakpoints: {
    "(min-width: 640px)": { slidesToScroll: 2 }, // two slides in view: two a move
    "(min-width: 1024px)": { slidesToScroll: 3 }, // three in view: three a move
    "(min-width: 1440px)": { active: false }, // off: all it wrote taken back, only the queries watched
  },
});

// Previous and next: a snap each, off at the edges
prev.addEventListener("click", () => api.scrollPrev());
next.addEventListener("click", () => api.scrollNext());
const toggleButtons = () => {
  prev.disabled = !api.canScrollPrev();
  next.disabled = !api.canScrollNext();
};

// A dot for each snap: six, three or two of them — none while the carousel is off
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

// reInit follows every breakpoint change (and a new size): the dots are built again for the new snaps
const refresh = () => {
  buildDots();
  selectDot();
  toggleButtons();
};
api.on("init", refresh).on("reInit", refresh).on("select", () => {
  selectDot();
  toggleButtons();
});
