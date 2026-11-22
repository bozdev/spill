import Spill from "@bozdev/spill";

const root = document.querySelector(".carousel--drag-free");
const prev = root.querySelector(".carousel__button--prev");
const next = root.querySelector(".carousel__button--next");

// dragFree: no snap points — a throw glides on and the row rests wherever it ends
const api = Spill(root.querySelector(".carousel__viewport"), { align: "start", dragFree: true });

// The snaps are still there for the API: the buttons step one at a time, and the selected snap follows the
// nearest one as the row moves
prev.addEventListener("click", () => api.scrollPrev());
next.addEventListener("click", () => api.scrollNext());
const toggleButtons = () => {
  prev.disabled = !api.canScrollPrev();
  next.disabled = !api.canScrollNext();
};
api.on("init", toggleButtons).on("reInit", toggleButtons).on("select", toggleButtons);
