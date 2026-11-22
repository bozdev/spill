import Spill from "@bozdev/spill";

const root = document.querySelector(".carousel--scale");

// The scale is all CSS (style.css): the script only builds the carousel. Every slide can sit in the middle (the
// default align, "center"), the first and the last too: containScroll false leaves room before and after them.
// It starts on the second slide, with a smaller one on each side.
Spill(root.querySelector(".carousel__viewport"), { containScroll: false, startIndex: 1 });
