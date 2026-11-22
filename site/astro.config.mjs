// spill.bozdev.com — Spill's site. Its examples import "@bozdev/spill" as anyone would: here it is the repo's own
// src/ (an alias), so the site always shows the code next to it.
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import { fileURLToPath } from "node:url";

const source = (path) => fileURLToPath(new URL(`../src/${path}`, import.meta.url));

export default defineConfig({
  site: "https://spill.bozdev.com",
  integrations: [mdx()],
  devToolbar: { enabled: false },
  markdown: {
    shikiConfig: { themes: { light: "github-light", dark: "github-dark" }, defaultColor: false },
  },
  vite: {
    resolve: {
      alias: [
        { find: /^@bozdev\/spill$/, replacement: source("index.js") },
        { find: /^@bozdev\/spill\/core$/, replacement: source("spill.js") },
        { find: /^@bozdev\/spill\/(auto|attributes)$/, replacement: source("$1.js") },
        { find: /^@bozdev\/spill\/plugins\/(autoplay|class-names|auto-height)$/, replacement: source("plugins/$1.js") },
      ],
    },
    server: { fs: { allow: [".."] } },
  },
});
