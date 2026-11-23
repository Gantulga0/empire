// MapLibre GL JS v6 loads its web worker as a separate ES module resolved relative to
// the library file. Bundlers rename chunks, so we serve the worker from /public/vendor
// and point MapLibre at it with setWorkerUrl().
import fs from "node:fs";
import path from "node:path";

const src = path.resolve("node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs");
const dest = path.resolve("public/vendor/maplibre-gl-worker.mjs");
if (fs.existsSync(src)) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log("[copy-maplibre-worker] copied worker to public/vendor/");
}
