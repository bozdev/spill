// The docs' sidebar, in reading order (the pager's order too). A page not here has no sidebar entry and no pager.
export type NavItem = { title: string; href: string };
export type NavGroup = { title: string; items: NavItem[] };

export const nav: NavGroup[] = [
  {
    title: "Get started",
    items: [
      { title: "Introduction", href: "/docs/" },
      { title: "Installation", href: "/docs/installation/" },
      { title: "Quick start", href: "/docs/quick-start/" },
      { title: "By attributes", href: "/docs/attributes/" },
      { title: "Frameworks", href: "/docs/frameworks/" },
    ],
  },
  {
    title: "Guides",
    items: [
      { title: "Markup and CSS", href: "/docs/guides/markup-and-css/" },
      { title: "Buttons and dots", href: "/docs/guides/buttons-and-dots/" },
      { title: "Breakpoints", href: "/docs/guides/breakpoints/" },
      { title: "Accessibility and motion", href: "/docs/guides/accessibility/" },
      { title: "Modules and bundles", href: "/docs/guides/modules/" },
      { title: "Debugging", href: "/docs/guides/debugging/" },
      { title: "Coming from Embla", href: "/docs/guides/coming-from-embla/" },
    ],
  },
  {
    title: "API",
    items: [
      { title: "Options", href: "/docs/api/options/" },
      { title: "Methods", href: "/docs/api/methods/" },
      { title: "Events", href: "/docs/api/events/" },
      { title: "Plugins", href: "/docs/api/plugins/" },
    ],
  },
  {
    title: "Plugins",
    items: [
      { title: "Autoplay", href: "/docs/plugins/autoplay/" },
      { title: "Class names", href: "/docs/plugins/class-names/" },
      { title: "Auto height", href: "/docs/plugins/auto-height/" },
    ],
  },
  {
    title: "More",
    items: [
      { title: "Examples", href: "/examples/" },
      { title: "Browser support", href: "/docs/browser-support/" },
      { title: "Changelog", href: "/docs/changelog/" },
    ],
  },
];

export const flat: NavItem[] = nav.flatMap((group) => group.items);

export const site = {
  name: "Spill",
  description: "A carousel on the browser's own scroll: Embla Carousel's API, options, events and plugins — native scroll underneath, no dependencies, no stylesheet.",
  github: "https://github.com/bozdev/spill",
  npm: "https://www.npmjs.com/package/@bozdev/spill",
  bozdev: "https://bozdev.com",
};
