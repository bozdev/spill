// A small static server for the demo and the tests (no dependency): http://localhost:4400/demo/
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const PORT = Number(process.env.PORT) || 4400;
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".json": "application/json" };

createServer(async (request, response) => {
  try {
    const path = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
    let file = normalize(join(ROOT, path));
    if (!file.startsWith(ROOT)) throw new Error("outside");
    if ((await stat(file)).isDirectory()) file = join(file, "index.html");
    response.writeHead(200, { "content-type": TYPES[/** @type {keyof typeof TYPES} */ (extname(file))] ?? "application/octet-stream", "cache-control": "no-store" });
    response.end(await readFile(file));
  } catch {
    response.writeHead(404, { "content-type": "text/plain" });
    response.end("Not found");
  }
}).listen(PORT, () => console.log(`Spill: http://localhost:${PORT}/demo/`));
