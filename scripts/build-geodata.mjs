/**
 * Build-time geodata generator.
 *
 * Reads Natural Earth (public domain) datasets from scripts/raw/ and writes
 * compact GeoJSON files to public/data/. Historical territories are derived
 * by intersecting modern *coastline-accurate* land polygons with clip shapes
 * whose vertices come from treaty descriptions or well-known landmarks.
 * Every derived polygon carries an `approximate` flag and a `method` note so
 * the UI can disclose how it was produced.
 *
 * Usage:  node scripts/build-geodata.mjs
 * (download the raw files first — see README "Rebuilding geodata")
 */
import fs from "node:fs";
import path from "node:path";
import * as turf from "@turf/turf";

const RAW = path.resolve("scripts/raw");
const OUT = path.resolve("public/data");
fs.mkdirSync(OUT, { recursive: true });

const read = (f) => JSON.parse(fs.readFileSync(path.join(RAW, f), "utf8"));
const write = (f, data) => {
  const s = JSON.stringify(data);
  fs.writeFileSync(path.join(OUT, f), s);
  console.log(`  wrote ${f}  ${(s.length / 1024).toFixed(0)} KB`);
};
const round = (fc, p = 3) => turf.truncate(fc, { precision: p, coordinates: 2, mutate: true });

// Map extent for the base layers (generous so the user can pan a bit).
const BBOX = [72, 5, 158, 58];

const countries = read("ne_50m_admin_0_countries.geojson");
const admin1 = read("ne_10m_admin_1_states_provinces.geojson");
const country = (a3) => countries.features.find((f) => f.properties.ADM0_A3 === a3);
const province = (name) =>
  admin1.features.find((f) => f.properties.adm0_a3 === "CHN" && f.properties.name === name);

const poly = (coords) => turf.polygon([[...coords, coords[0]]]);
const inter = (a, b) => turf.intersect(turf.featureCollection([a, b]));
const diff = (a, b) => turf.difference(turf.featureCollection([a, b]));
const uni = (...fs) => turf.union(turf.featureCollection(fs));
const simp = (f, t) => turf.simplify(f, { tolerance: t, highQuality: true });

// ───────────────────────── Base map layers ─────────────────────────
console.log("Base layers");
{
  const land = read("ne_50m_land.geojson");
  const clipped = land.features
    .map((f) => turf.bboxClip(f, BBOX))
    .filter((f) => f.geometry.coordinates.length);
  write("base-land.json", round(turf.featureCollection(clipped.map((f) => simp(f, 0.01)))));

  // Ocean polygon is drawn above the hillshade so bathymetry relief is masked.
  const ocean = read("ne_50m_ocean.geojson");
  const oc = ocean.features
    .map((f) => turf.bboxClip(f, [BBOX[0] - 4, BBOX[1] - 4, BBOX[2] + 4, BBOX[3] + 4]))
    .filter((f) => f.geometry.coordinates.length);
  write("base-ocean.json", round(turf.featureCollection(oc.map((f) => simp(f, 0.01)))));

  const rivers = read("ne_50m_rivers_lake_centerlines.geojson");
  const rv = rivers.features
    .filter((f) => f.geometry)
    .map((f) => {
      const c = turf.bboxClip(f, BBOX);
      c.properties = { name: f.properties.name_en || f.properties.name, rank: f.properties.scalerank };
      return c;
    })
    .filter((f) => f.geometry.coordinates.length);
  write("base-rivers.json", round(turf.featureCollection(rv)));

  const lakes = read("ne_50m_lakes.geojson");
  const lk = lakes.features
    .filter((f) => {
      const [x0, y0, x1, y1] = turf.bbox(f);
      return x1 > BBOX[0] && x0 < BBOX[2] && y1 > BBOX[1] && y0 < BBOX[3];
    })
    .map((f) => ({ ...f, properties: { name: f.properties.name } }));
  write("base-lakes.json", round(turf.featureCollection(lk)));

  const bl = read("ne_50m_admin_0_boundary_lines_land.geojson");
  const borders = bl.features
    .map((f) => {
      const c = turf.bboxClip(f, BBOX);
      c.properties = {};
      return c;
    })
    .filter((f) => f.geometry.coordinates.length);
  write("modern-borders.json", round(turf.featureCollection(borders)));
}

// ───────────────────────── Historical territories ─────────────────────────
console.log("Historical territories");

const CHN = country("CHN");
const features = [];
const add = (id, geom, props) => {
  const f = turf.feature(geom.geometry ?? geom, { id, ...props });
  features.push(f);
};

// Japan proper (context only — always shown).
add("japan-home", simp(country("JPN"), 0.01), {
  category: "japan",
  start: "1868-01-01",
  end: "1946-01-01",
  approximate: false,
  method: "Natural Earth 1:50m coastline (modern Japan; Ryukyu annexed 1879).",
});

// Taiwan + Penghu, ceded 1895. Built from 1:10m admin-1 units, excluding Kinmen and Matsu
// (Lienchiang), which were never ceded. The 1:50m country polygon lacks Penghu.
{
  const units = admin1.features.filter(
    (f) => f.properties.adm0_a3 === "TWN" && !["Kinmen", "Lienchiang"].includes(f.properties.name),
  );
  const parts = units
    .flatMap((f) => (f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates))
    .filter((p) => turf.centroid(turf.polygon(p)).geometry.coordinates[0] > 119.3);
  const merged = uni(...parts.map((p) => turf.polygon(p)));
  add("taiwan", simp(merged, 0.004), {
    category: "colony",
    start: "1895-04-17",
    end: "1945-10-25",
    approximate: false,
    method: "Island coastlines of Taiwan and the Penghu (Pescadores) islands, Natural Earth 1:10m. Island boundaries are unchanged since 1895.",
  });
}

// Korea — protectorate 1905, annexed 1910. The Yalu/Tumen boundary has been stable since the 18th c.
{
  const korea = simp(uni(country("KOR"), country("PRK")), 0.01);
  add("korea-protectorate", korea, {
    category: "protectorate",
    start: "1905-11-17",
    end: "1910-08-29",
    approximate: false,
    method: "Union of modern ROK+DPRK; northern Yalu–Tumen boundary matches the historical Korea–Qing border.",
  });
  add("korea-colony", korea, {
    category: "colony",
    start: "1910-08-29",
    end: "1945-08-15",
    approximate: false,
    method: "Same geometry as above.",
  });
}

// Karafuto — southern Sakhalin below 50°N (Treaty of Portsmouth, Art. IX).
{
  const rus = country("RUS");
  const k = turf.bboxClip(rus, [141, 45.8, 145.5, 50.0]);
  add("karafuto", simp(k, 0.01), {
    category: "colony",
    start: "1905-09-05",
    end: "1945-08-25",
    approximate: false,
    method: "Sakhalin coastline clipped at the 50th parallel per Treaty of Portsmouth Art. IX.",
  });
}

// Liaodong cession of 1895 (Shimonoseki Art. 2) — returned after the Triple Intervention.
// Treaty line: mouth of the Yalu → mouth of the An-ping → Feng-huang → Hai-cheng → Ying-kow.
{
  const clip = poly([
    [124.42, 40.15], // Yalu at the An-ping (Ai) river confluence (approx.)
    [124.07, 40.47], // Fenghuang
    [122.75, 40.88], // Haicheng
    [122.23, 40.69], // Yingkou
    [121.6, 40.3],
    [121.0, 39.2],
    [121.0, 38.3],
    [125.3, 38.3],
    [125.3, 39.8],
  ]);
  add("liaodong-1895", simp(inter(CHN, clip), 0.005), {
    category: "ceded-returned",
    start: "1895-04-17",
    end: "1895-11-08",
    approximate: true,
    method: "Coastline ∩ polygon through the towns named in the Treaty of Shimonoseki Art. 2 (Yalu–Fenghuang–Haicheng–Yingkou).",
  });
}

// Kwantung Leased Territory — Russian lease 1898, transferred to Japan 1905.
// Northern limit ran roughly from Port Adams (Pulandian Bay) to Pitsewo (Pikou), ~39.4–39.5°N.
const kwantungClip = poly([
  [120.8, 38.3],
  [120.8, 39.45],
  [122.8, 39.45],
  [122.8, 38.3],
]);
const kwantung = inter(CHN, kwantungClip);
add("kwantung-russian", simp(kwantung, 0.004), {
  category: "foreign-lease",
  start: "1898-03-27",
  end: "1905-09-05",
  approximate: true,
  method: "Coastline south of the Port Adams–Pitsewo line (~39.45°N); line simplified.",
});
add("kwantung", simp(kwantung, 0.004), {
  category: "leased",
  start: "1905-09-05",
  end: "1945-08-22",
  approximate: true,
  method: "Coastline south of the Port Adams–Pitsewo line (~39.45°N); line simplified.",
});

// Jiaozhou Bay leased territory (German 1898; Japanese occupation 1914–1922).
{
  const circle = turf.circle([120.27, 36.1], 21, { steps: 48, units: "kilometers" });
  const j = inter(CHN, circle);
  add("jiaozhou-german", simp(j, 0.003), {
    category: "foreign-lease",
    start: "1898-03-06",
    end: "1914-11-07",
    approximate: true,
    method: "Schematic ~21 km radius around Jiaozhou Bay entrance clipped to the coastline; true lease ≈ 550 km² of land.",
  });
  add("jiaozhou-japanese", simp(j, 0.003), {
    category: "occupied",
    start: "1914-11-07",
    end: "1922-12-10",
    approximate: true,
    method: "Same schematic geometry as the German lease.",
  });
}

// Manchukuo (1932) and Rehe (annexed 1933). North/east edges follow the Amur–Ussuri–Tumen–Yalu
// borders (stable since 1860); the south-west edge (Great Wall) and the west edge are approximate.
{
  const greatWall = [
    [119.72, 40.02], // Shanhaiguan
    [119.0, 40.15],
    [118.4, 40.33],
    [117.6, 40.55],
    [117.2, 40.68], // Gubeikou area
    [116.6, 40.95],
    [116.3, 41.25],
  ];
  const westEdge = [
    [116.9, 42.3],
    [117.4, 43.3],
    [118.4, 44.0],
    [119.6, 45.3],
    [119.95, 46.6],
  ];
  const bigClip = poly([
    [120.0, 39.5],
    ...greatWall,
    ...westEdge,
    [118.0, 47.3],
    [115.0, 47.6],
    [114.0, 53.6],
    [135.5, 53.6],
    [135.5, 41.0],
    [125.5, 38.0],
    [121.0, 38.3],
  ]);
  const reheClip = poly([
    ...greatWall,
    [116.9, 42.3],
    [117.4, 43.3],
    [118.6, 44.3],
    [120.2, 44.6],
    [121.3, 43.0],
    [121.9, 42.3],
    [121.4, 41.6],
    [120.7, 41.0],
    [120.2, 40.4],
  ]);
  const whole = inter(CHN, bigClip);
  const rehe = inter(CHN, reheClip);
  const core = diff(diff(whole, rehe), kwantung);
  add("manchukuo", simp(core, 0.02), {
    category: "puppet",
    start: "1932-03-01",
    end: "1945-08-18",
    approximate: true,
    method:
      "Northern/eastern edges = modern China border along Amur, Ussuri, Tumen, Yalu (stable since 1860). Western edge toward Mongolia/Chahar and the Rehe line are hand-placed approximations.",
  });
  add("rehe", simp(rehe, 0.02), {
    category: "puppet",
    start: "1933-03-04",
    end: "1945-08-18",
    approximate: true,
    method: "Approximate outline of Rehe province (south edge ≈ Great Wall line). Province boundaries were later reorganised by Manchukuo.",
  });
}

// Spheres of influence — expressed with modern provincial outlines and flagged as approximate.
{
  const southManchuria = simp(uni(province("Liaoning"), province("Jilin")), 0.02);
  add("sphere-south-manchuria", southManchuria, {
    category: "sphere",
    start: "1905-09-05",
    end: "1931-09-18",
    approximate: true,
    method: "Modern Liaoning + Jilin outlines used as a proxy for 'South Manchuria'; spheres had no surveyed borders.",
  });
  add("sphere-shandong", simp(province("Shandong"), 0.02), {
    category: "sphere",
    start: "1914-11-07",
    end: "1922-12-10",
    approximate: true,
    method: "Modern Shandong province outline as proxy for the claimed sphere.",
  });
  add("sphere-fujian", simp(province("Fujian"), 0.02), {
    category: "sphere",
    start: "1898-04-26",
    end: "1922-02-06",
    approximate: true,
    method: "Modern Fujian province outline as proxy (1898 non-alienation declaration).",
  });
}

// bboxClip/simplify can leave empty parts in MultiPolygons — drop them.
for (const f of features) {
  if (f.geometry?.type === "MultiPolygon") {
    f.geometry.coordinates = f.geometry.coordinates.filter((p) => p.length && p[0].length >= 4);
  }
}
const territories = turf.featureCollection(features.filter((f) => f.geometry && f.geometry.coordinates.length));
round(territories, 3);
write("territories.json", territories);

// ───────────────────────── Globe (intro) ─────────────────────────
console.log("Globe");
{
  const land = read("ne_110m_land.geojson");
  const regions = [
    { code: 1, f: country("JPN") },
    { code: 2, f: CHN },
    { code: 3, f: uni(country("KOR"), country("PRK")) },
    { code: 4, f: country("TWN") },
  ];
  const N = 52000;
  const golden = Math.PI * (3 - Math.sqrt(5));
  const dots = [];
  const landBoxes = land.features.map((f) => ({ f, b: turf.bbox(f) }));
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = golden * i;
    const lat = (Math.asin(y) * 180) / Math.PI;
    const lon = (((Math.atan2(Math.sin(th) * r, Math.cos(th) * r) * 180) / Math.PI + 540) % 360) - 180;
    const pt = turf.point([lon, lat]);
    const onLand = landBoxes.some(
      ({ f, b }) => lon >= b[0] && lon <= b[2] && lat >= b[1] && lat <= b[3] && turf.booleanPointInPolygon(pt, f),
    );
    if (!onLand) continue;
    let code = 0;
    if (lon > 100 && lon < 150 && lat > 15 && lat < 55) {
      for (const rg of regions) if (turf.booleanPointInPolygon(pt, rg.f)) { code = rg.code; break; }
    }
    dots.push(+lon.toFixed(2), +lat.toFixed(2), code);
  }
  const coast = [];
  for (const f of land.features) {
    const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const p of polys) coast.push(p[0].map(([x, y]) => [+x.toFixed(2), +y.toFixed(2)]));
  }
  write("globe.json", { dots, coast });
}

console.log("Done.");
