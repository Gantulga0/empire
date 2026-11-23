/**
 * Pre-renders the shaded-relief backdrop into a single transparent PNG.
 *
 * Live MapLibre hillshade decodes and re-shades DEM tiles on every camera flight,
 * which caused visible stutter during story transitions. The relief here is a soft,
 * low-contrast backdrop, so one static Web-Mercator image is visually equivalent,
 * costs a single texture on the GPU, and works offline.
 *
 * Source: Terrain Tiles (Mapzen/Tilezen, AWS Open Data), terrarium encoding, zoom 5.
 * Usage:  node scripts/build-relief.mjs   (downloads ~60 tiles once into scripts/raw/dem)
 */
import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";

const Z = 5;
const TILE = 256;
const BBOX = [72, 5, 158, 58]; // must match the map's base layers
const RAW = path.resolve("scripts/raw/dem");
const OUT = path.resolve("public/data/relief.png");
const META = path.resolve("public/data/relief.json");
fs.mkdirSync(RAW, { recursive: true });

const lon2x = (lon) => ((lon + 180) / 360) * 2 ** Z;
const lat2y = (lat) => {
  const r = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** Z;
};
const x2lon = (x) => (x / 2 ** Z) * 360 - 180;
const y2lat = (y) => {
  const n = Math.PI - (2 * Math.PI * y) / 2 ** Z;
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
};

const x0 = Math.floor(lon2x(BBOX[0]));
const x1 = Math.floor(lon2x(BBOX[2]));
const y0 = Math.floor(lat2y(BBOX[3]));
const y1 = Math.floor(lat2y(BBOX[1]));
const W = (x1 - x0 + 1) * TILE;
const H = (y1 - y0 + 1) * TILE;
console.log(`tiles x ${x0}-${x1}, y ${y0}-${y1} → ${W}×${H}px`);

async function tile(x, y) {
  const file = path.join(RAW, `${Z}-${x}-${y}.png`);
  if (!fs.existsSync(file)) {
    const url = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${Z}/${x}/${y}.png`;
    for (let attempt = 1; ; attempt++) {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`${url} → ${res.status}`);
        fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
        break;
      } catch (err) {
        if (attempt >= 4) throw err;
        console.warn(`  retry ${attempt} for ${Z}/${x}/${y}: ${err.message}`);
        await new Promise((r) => setTimeout(r, 800 * attempt));
      }
    }
  }
  return PNG.sync.read(fs.readFileSync(file));
}

// Mosaic elevations (metres).
const elev = new Float32Array(W * H);
for (let ty = y0; ty <= y1; ty++) {
  for (let tx = x0; tx <= x1; tx++) {
    const png = await tile(tx, ty);
    for (let py = 0; py < TILE; py++) {
      for (let px = 0; px < TILE; px++) {
        const i = (py * TILE + px) * 4;
        const e = png.data[i] * 256 + png.data[i + 1] + png.data[i + 2] / 256 - 32768;
        elev[((ty - y0) * TILE + py) * W + (tx - x0) * TILE + px] = e;
      }
    }
  }
}

// Hillshade (Horn's method), light from the north-west at 45°.
const out = new PNG({ width: W, height: H });
const az = (315 * Math.PI) / 180;
const alt = (45 * Math.PI) / 180;
const zFactor = 2.2; // gentle exaggeration so ranges read at atlas scale
const flat = Math.sin(alt);
const at = (x, y) => elev[Math.min(H - 1, Math.max(0, y)) * W + Math.min(W - 1, Math.max(0, x))];
for (let y = 0; y < H; y++) {
  const lat = y2lat(y0 + (y + 0.5) / TILE);
  const cell = (40075016.686 * Math.cos((lat * Math.PI) / 180)) / (TILE * 2 ** Z); // metres per pixel
  for (let x = 0; x < W; x++) {
    const a = at(x - 1, y - 1), b = at(x, y - 1), c = at(x + 1, y - 1);
    const d = at(x - 1, y), f = at(x + 1, y);
    const g = at(x - 1, y + 1), h = at(x, y + 1), k = at(x + 1, y + 1);
    const dzdx = (((c + 2 * f + k) - (a + 2 * d + g)) / (8 * cell)) * zFactor;
    const dzdy = (((g + 2 * h + k) - (a + 2 * b + c)) / (8 * cell)) * zFactor;
    const slope = Math.atan(Math.hypot(dzdx, dzdy));
    const aspect = Math.atan2(dzdy, -dzdx);
    const shade = Math.sin(alt) * Math.cos(slope) + Math.cos(alt) * Math.sin(slope) * Math.cos(az - Math.PI / 2 - aspect);
    const delta = shade - flat;
    const i = (y * W + x) * 4;
    // Sea floor is hidden by the ocean mask anyway — leave it fully transparent so the
    // PNG compresses well. Alpha is quantised to steps of 8 for the same reason.
    if (elev[y * W + x] <= 0) {
      out.data[i + 3] = 0;
      continue;
    }
    if (delta < 0) {
      // shadow
      out.data[i] = 3; out.data[i + 1] = 6; out.data[i + 2] = 11;
      out.data[i + 3] = Math.min(232, Math.round((-delta * 520) / 8) * 8);
    } else {
      // highlight
      out.data[i] = 70; out.data[i + 1] = 96; out.data[i + 2] = 124;
      out.data[i + 3] = Math.min(144, Math.round((delta * 420) / 8) * 8);
    }
  }
}

fs.writeFileSync(OUT, PNG.sync.write(out, { colorType: 6, deflateLevel: 9 }));
// Image-source corners: top-left, top-right, bottom-right, bottom-left (lng, lat).
const west = x2lon(x0), east = x2lon(x1 + 1), north = y2lat(y0), south = y2lat(y1 + 1);
const coordinates = [[west, north], [east, north], [east, south], [west, south]].map(([a, b]) => [+a.toFixed(6), +b.toFixed(6)]);
fs.writeFileSync(META, JSON.stringify({ zoom: Z, width: W, height: H, coordinates }));
console.log(`wrote ${path.relative(process.cwd(), OUT)} (${(fs.statSync(OUT).size / 1024).toFixed(0)} KB)`, coordinates);
