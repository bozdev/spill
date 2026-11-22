import Spill from "@bozdev/spill";

const root = document.querySelector(".carousel--thumbnails");

// Two carousels: the main one (the first viewport), and the thumbnails, gliding freely with a snap for each
const main = Spill(root.querySelector(".carousel__viewport"));
const thumbs = Spill(root.querySelector(".carousel__thumbs"), { containScroll: "keepSnaps", dragFree: true });

// A thumbnail's click: the main carousel goes to its slide (a snap a slide here, so the indexes match)
thumbs.slideNodes().forEach((thumb, index) => thumb.addEventListener("click", () => main.scrollTo(index)));

// The main carousel's select: its thumbnail marked, and the row scrolled to bring it into view
const sync = () => {
  const selected = main.selectedScrollSnap();
  thumbs.slideNodes().forEach((thumb, index) => thumb.setAttribute("aria-current", String(index === selected)));
  thumbs.scrollTo(selected);
};
main.on("init", sync).on("select", sync);
