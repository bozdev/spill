import Spill from "@bozdev/spill";

const root = document.querySelector(".carousel--align");
const prev = root.querySelector(".carousel__button--prev");
const next = root.querySelector(".carousel__button--next");
const choices = [...root.querySelectorAll("[data-align]")];

// It starts on the second snap: the scroll can't go before its start, so at the first snap every align
// looks the same (unless containScroll: false) — the difference shows from the middle on
const api = Spill(root.querySelector(".carousel__viewport"), { align: "center", startIndex: 1 });

// The switch: the carousel rebuilt with the new align (reInit keeps the selected snap)
for (const choice of choices) {
  choice.addEventListener("click", () => {
    api.reInit({ align: choice.dataset.align });
    choices.forEach((each) => each.setAttribute("aria-pressed", String(each === choice)));
  });
}

// Previous and next: a snap each, off at the edges
prev.addEventListener("click", () => api.scrollPrev());
next.addEventListener("click", () => api.scrollNext());
const toggleButtons = () => {
  prev.disabled = !api.canScrollPrev();
  next.disabled = !api.canScrollNext();
};
api.on("init", toggleButtons).on("reInit", toggleButtons).on("select", toggleButtons);
