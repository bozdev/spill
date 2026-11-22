import Spill from "@bozdev/spill";

const root = document.querySelector(".carousel--events");
const prev = root.querySelector(".carousel__button--prev");
const next = root.querySelector(".carousel__button--next");
const log = root.querySelector(".carousel__log");

const api = Spill(root.querySelector(".carousel__viewport"), { align: "start" });

prev.addEventListener("click", () => api.scrollPrev());
next.addEventListener("click", () => api.scrollNext());

// What a line says about an event, read from the API as it fires
const details = {
  select: (carousel) => `snap ${carousel.selectedScrollSnap()}`,
  settle: (carousel) => `snap ${carousel.selectedScrollSnap()}`,
  scroll: (carousel) => `${Math.round(carousel.scrollProgress() * 100)}%`,
  slidesInView: (carousel) => `[${carousel.slidesInView().join(", ")}]`,
};

const span = (part, text = "") => {
  const element = document.createElement("span");
  element.className = `carousel__log-${part}`;
  element.textContent = text;
  return element;
};

// The log: newest first, six lines at most. The same event again (a scroll, frame after frame) counts up on its line.
let newest = null;
const write = (carousel, name) => {
  const detail = details[name]?.(carousel) ?? "";
  if (newest?.name === name) {
    newest.count += 1;
    newest.detail.textContent = detail;
    newest.counter.textContent = `×${newest.count}`;
    return;
  }
  const line = document.createElement("li");
  newest = { name, count: 1, detail: span("detail", detail), counter: span("count") };
  line.append(span("name", name), newest.detail, newest.counter);
  log.prepend(line);
  log.children[6]?.remove();
};

// Every event of the core. Each callback gets the API and the event's name.
const events = ["init", "reInit", "destroy", "select", "scroll", "settle", "resize", "slidesInView", "slidesChanged", "slideFocusStart", "slideFocus", "pointerDown", "pointerUp"];
for (const name of events) api.on(name, write);
