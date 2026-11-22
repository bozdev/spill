// The site's own behaviour: the theme, the menu on a phone, the examples' code tabs, copy buttons, "On this page".

const root = document.documentElement;

// ---- light / dark: the one chosen is kept
document.querySelector("[data-theme-toggle]")?.addEventListener("click", () => {
  const theme = root.dataset.theme === "light" ? "dark" : "light";
  root.dataset.theme = theme;
  try {
    localStorage.setItem("spill-theme", theme);
  } catch {}
});

// ---- the sidebar as a drawer on a phone
const menu = document.querySelector("[data-menu-toggle]");
const setMenu = (open) => {
  root.toggleAttribute("data-nav-open", open);
  menu?.setAttribute("aria-expanded", String(open));
};
menu?.addEventListener("click", () => setMenu(!root.hasAttribute("data-nav-open")));
document.querySelector(".sidebar")?.addEventListener("click", (event) => {
  if (event.target instanceof Element && event.target.closest("a")) setMenu(false);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && root.hasAttribute("data-nav-open")) {
    setMenu(false);
    menu?.focus();
  }
});
matchMedia("(width >= 56rem)").addEventListener("change", (query) => query.matches && setMenu(false));

// ---- an example's code: tabs (the arrow keys move between them)
for (const group of document.querySelectorAll("[data-tabs]")) {
  const tabs = [...group.querySelectorAll('[role="tab"]')];
  const select = (tab) => {
    for (const each of tabs) {
      const on = each === tab;
      each.setAttribute("aria-selected", String(on));
      each.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(each.getAttribute("aria-controls") ?? "");
      if (panel) panel.hidden = !on;
    }
  };
  for (const tab of tabs) {
    tab.addEventListener("click", () => select(tab));
    tab.addEventListener("keydown", (event) => {
      const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
      if (!step) return;
      event.preventDefault();
      const to = tabs[(tabs.indexOf(tab) + step + tabs.length) % tabs.length];
      select(to);
      to.focus();
    });
  }
}

// ---- copy: an example's open panel, or a [data-copy] value
const copied = (button) => {
  button.dataset.copied = "";
  const label = button.getAttribute("aria-label");
  button.setAttribute("aria-label", "Copied");
  setTimeout(() => {
    delete button.dataset.copied;
    if (label) button.setAttribute("aria-label", label);
  }, 1500);
};
document.addEventListener("click", async (event) => {
  const button = event.target instanceof Element ? event.target.closest("[data-copy-panel], [data-copy]") : null;
  if (!button) return;
  let text = button.getAttribute("data-copy");
  if (text === null) {
    const panel = button.closest("[data-tabs]")?.querySelector(".example-panel:not([hidden]) code");
    text = panel?.textContent ?? "";
  }
  try {
    await navigator.clipboard.writeText(text);
    copied(button);
  } catch {
    // No clipboard (an insecure page): the text stays selectable
  }
});

// ---- "On this page": the heading being read
const links = [...document.querySelectorAll(".toc a")];
if (links.length && "IntersectionObserver" in window) {
  const byId = new Map(links.map((link) => [decodeURIComponent(link.hash.slice(1)), link]));
  const headings = [...byId.keys()].map((id) => document.getElementById(id)).filter(Boolean);
  const visible = new Set();
  const mark = () => {
    const first = headings.find((heading) => visible.has(heading)) ?? null;
    if (!first) return;
    for (const link of links) link.classList.toggle("is-current", link === byId.get(first.id));
  };
  const watch = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target);
      mark();
    },
    { rootMargin: "-64px 0px -55% 0px" },
  );
  headings.forEach((heading) => watch.observe(heading));
}
