import type { StyleSpecification } from "maplibre-gl";

export const MAP_COLORS = {
  ocean: "#070C14",
  land: "#141E2B",
  landEdge: "#5D768D",
  coastGlow: "#3E5A78",
  river: "#24435C",
  graticule: "#1A2636",
  modernBorder: "#B9C8D9",
  red: "#DB4545",
  amber: "#D9A35F",
  cyan: "#58B6CE",
  cream: "#F1EBDD",
  slate: "#9AA8B9",
};

function graticule(): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];
  for (let lng = 70; lng <= 160; lng += 5)
    features.push({ type: "Feature", properties: { major: lng % 10 === 0 }, geometry: { type: "LineString", coordinates: [[lng, 0], [lng, 60]] } });
  for (let lat = 0; lat <= 60; lat += 5)
    features.push({ type: "Feature", properties: { major: lat % 10 === 0 }, geometry: { type: "LineString", coordinates: [[70, lat], [160, lat]] } });
  return { type: "FeatureCollection", features };
}

const ATTR_NE = '<a href="https://www.naturalearthdata.com" target="_blank" rel="noopener">Natural Earth</a>';
/** Must match public/data/relief.json (regenerate both with `npm run build:relief`). */
const RELIEF_CORNERS: [[number, number], [number, number], [number, number], [number, number]] = [
  [67.5, 61.606396],
  [168.75, 61.606396],
  [168.75, 0],
  [67.5, 0],
];

const ATTR_TERRAIN =
  '<a href="https://registry.opendata.aws/terrain-tiles/" target="_blank" rel="noopener">Terrain Tiles (Mapzen/AWS)</a>';

/** Self-contained dark cartographic style. No API keys, no glyph server — labels are HTML. */
export function buildBaseStyle(): StyleSpecification {
  return {
    version: 8,
    name: "Empire's Shadow — dark historical",
    sources: {
      // maxzoom 6: tiles are cut once and over-zoomed beyond that (precision ~100 m),
      // instead of being re-tiled at every zoom level during camera flights.
      land: { type: "geojson", data: "/data/base-land.json", attribution: `${ATTR_NE} · ${ATTR_TERRAIN}`, maxzoom: 6 },
      ocean: { type: "geojson", data: "/data/base-ocean.json", maxzoom: 6 },
      lakes: { type: "geojson", data: "/data/base-lakes.json", maxzoom: 6 },
      rivers: { type: "geojson", data: "/data/base-rivers.json", maxzoom: 6 },
      borders: { type: "geojson", data: "/data/modern-borders.json", maxzoom: 6 },
      graticule: { type: "geojson", data: graticule(), maxzoom: 5 },
      relief: {
        type: "image",
        url: "/data/relief.png",
        // Corners of the Web-Mercator mosaic written by scripts/build-relief.mjs (public/data/relief.json).
        coordinates: RELIEF_CORNERS,
      },
    },
    layers: [
      { id: "background", type: "background", paint: { "background-color": MAP_COLORS.ocean } },
      { id: "land", type: "fill", source: "land", paint: { "fill-color": MAP_COLORS.land } },
      {
        // Pre-rendered shaded relief (scripts/build-relief.mjs): a single texture instead of
        // live DEM decoding + hillshading, so camera flights stay smooth and it works offline.
        id: "relief",
        type: "raster",
        source: "relief",
        paint: { "raster-opacity": 0.62, "raster-resampling": "linear", "raster-fade-duration": 0 },
      },
      { id: "ocean-mask", type: "fill", source: "ocean", paint: { "fill-color": MAP_COLORS.ocean } },
      {
        id: "graticule",
        type: "line",
        source: "graticule",
        paint: {
          "line-color": MAP_COLORS.graticule,
          "line-width": ["case", ["get", "major"], 0.8, 0.4],
          "line-opacity": 0.8,
        },
      },
      { id: "lakes", type: "fill", source: "lakes", paint: { "fill-color": MAP_COLORS.ocean } },
      {
        id: "rivers",
        type: "line",
        source: "rivers",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": MAP_COLORS.river,
          "line-width": ["interpolate", ["linear"], ["zoom"], 3, 0.5, 7, 1.6],
          "line-opacity": 0.9,
        },
      },
      {
        id: "coast-glow",
        type: "line",
        source: "land",
        paint: { "line-color": MAP_COLORS.coastGlow, "line-width": 5, "line-blur": 5, "line-opacity": 0.22 },
      },
      {
        id: "coast",
        type: "line",
        source: "land",
        paint: {
          "line-color": MAP_COLORS.landEdge,
          "line-width": ["interpolate", ["linear"], ["zoom"], 3, 0.9, 8, 1.7],
        },
      },
      {
        id: "modern-borders",
        type: "line",
        source: "borders",
        layout: { "line-join": "round" },
        paint: {
          "line-color": MAP_COLORS.modernBorder,
          "line-width": ["interpolate", ["linear"], ["zoom"], 3, 1.3, 8, 2.3],
          "line-dasharray": [2.5, 1.8],
          "line-opacity": 0.9,
        },
      },
    ],
  };
}
