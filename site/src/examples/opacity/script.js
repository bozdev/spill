import Spill from "@bozdev/spill";

const root = document.querySelector(".carousel--opacity");

// Every slide can sit in the middle (the default align, "center"), the first and the last too: containScroll false
// leaves room before and after them. It starts on the second slide, with a faded one on each side.
const api = Spill(root.querySelector(".carousel__viewport"), { containScroll: false, startIndex: 1 });

// The faintest a slide gets: never invisible, so the next ones still show they're there. Opacity moves nothing,
// so it stays with prefers-reduced-motion: reduce (Spill's own moves jump there by themselves).
const MIN_OPACITY = 0.35;

// Embla's tween: each slide's opacity from how far its snap is from the scroll. scrollSnapList() and
// scrollProgress() both run 0 to 1 across the carousel; the distance is counted in the way to the next snap on
// the scroll's side: 0 with the slide in place, 1 once the scroll reaches that next snap.
const tween = () => {
  const snaps = api.scrollSnapList();
  const progress = api.scrollProgress();
  const slides = api.slideNodes(); // one slide a snap here (several a snap: api.internalEngine().slideRegistry)
  snaps.forEach((snap, index) => {
    const next = snaps[progress < snap ? index - 1 : index + 1] ?? snap;
    const distance = Math.min(1, Math.abs(snap - progress) / (Math.abs(next - snap) || 1));
    slides[index].style.opacity = (1 - distance * (1 - MIN_OPACITY)).toFixed(3);
  });
};

// Every frame it scrolls, and when it's built or measured again
api.on("init", tween).on("reInit", tween).on("scroll", tween);
