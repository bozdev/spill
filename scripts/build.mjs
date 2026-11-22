// npm run build — dist/, minified (esbuild), then each file's size (minified, gzip, Brotli); then the types (tsc):
//   dist/spill.esm.js       every part, one ES module (named exports, as src/index.js)
//   dist/spill.global.js    for a <script> tag: window.Spill (the carousel; .Autoplay, .ClassNames, .AutoHeight, .SpillAuto)
//   dist/spill.auto.js      for a <script> tag, by attributes: window.Spill, the plugins registered, SpillAuto started
//   dist/esm/…              each module on its own, minified (the core alone: dist/esm/spill.js)
import { build } from "esbuild";
import { readFile, rm } from "node:fs/promises";
import { brotliCompressSync, constants, gzipSync } from "node:zlib";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const out = (path) => resolve(root, "dist", path);
const { version, license } = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
// Each file says what it is, its version and its licence (minifiers keep a /*! comment)
const banner = { js: `/*! Spill ${version} | ${license} | https://github.com/bozdev/spill */` };
const common = { absWorkingDir: root, minify: true, target: "es2022", legalComments: "none", logLevel: "warning", banner };

await rm(resolve(root, "dist"), { recursive: true, force: true });
await build({ ...common, entryPoints: ["src/index.js"], bundle: true, format: "esm", outfile: out("spill.esm.js") });
await build({ ...common, entryPoints: ["src/global.js"], bundle: true, format: "iife", globalName: "Spill", footer: { js: "Spill=Spill.default;" }, outfile: out("spill.global.js") });
await build({
  ...common,
  entryPoints: ["src/global.js"],
  bundle: true,
  format: "iife",
  globalName: "Spill",
  footer: { js: 'Spill=Spill.default;Spill.SpillAuto.plugins={autoplay:Spill.Autoplay,"class-names":Spill.ClassNames,"auto-height":Spill.AutoHeight};Spill.SpillAuto.start();' },
  outfile: out("spill.auto.js"),
});
await build({
  ...common,
  entryPoints: ["src/spill.js", "src/attributes.js", "src/plugins/autoplay.js", "src/plugins/class-names.js", "src/plugins/auto-height.js"],
  bundle: false,
  format: "esm",
  outbase: "src",
  outdir: out("esm"),
});

const files = ["spill.esm.js", "spill.global.js", "spill.auto.js", "esm/spill.js", "esm/attributes.js", "esm/plugins/autoplay.js", "esm/plugins/class-names.js", "esm/plugins/auto-height.js"];
const brotli = (/** @type {Buffer} */ bytes) => brotliCompressSync(bytes, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length;
console.log("dist/                         minified     gzip   brotli");
for (const file of files) {
  const bytes = await readFile(out(file));
  console.log(`  ${file.padEnd(28)}${String(bytes.length).padStart(7)} B${String(gzipSync(bytes, { level: 9 }).length).padStart(8)} B${String(brotli(bytes)).padStart(8)} B`);
}
