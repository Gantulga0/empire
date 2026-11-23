# The Empire's Shadow

**Японы Хятад дахь нөлөө ба түрэмгийлэл (1894–1945)** — an interactive historical atlas built as a university history presentation. The topic is told through the map: territories, treaties, railways, occupation and military advances change as you move along the timeline.

![stack](https://img.shields.io/badge/Next.js-16-black) ![maplibre](https://img.shields.io/badge/MapLibre-6-blue) ![three](https://img.shields.io/badge/Three.js-R3F-green)

## Quick start

```bash
npm install        # also copies the MapLibre worker to public/vendor (postinstall)
npm run dev        # http://localhost:3000
```

Production:

```bash
npm run build
npm start
```

Quality checks:

```bash
npm run typecheck
npm run lint
```

Node 20+ is required. No API keys, accounts or backend are needed. Everything is served locally from `public/data`, so the atlas also works offline (useful for classroom projectors).

## What's inside

| Feature | Notes |
| --- | --- |
| **Cinematic intro** | Real Three.js globe (React Three Fiber): dot-matrix land sampled from Natural Earth, coastlines, atmosphere shader, and expansion arcs from Tokyo drawn in chronological order. A GSAP camera move flies toward East Asia. «Түүхийг судлах» dives in and starts Story mode; «Алгасах» goes straight to Explore mode. |
| **Historical map** | MapLibre GL JS with a custom dark style, all local GeoJSON. Labels are HTML markers, so Mongolian Cyrillic renders in the app fonts and no glyph server is needed. |
| **Timeline engine** | One decimal-year value drives everything: territory fills (feature-state tweened for smooth transitions), place status, railway control, event pulses, port and regime markers, and the length of advance arrows. |
| **Story mode** | 14 chapters. Each one flies the camera and animates the timeline across its period, so changes appear in their real order. Has autoplay and keyboard navigation. Built for classroom projectors. |
| **Explore mode** | Free scrubbing, playback at 0.5×–4×, previous/next event, clickable places, territories, events, ports and regime seats, a contextual information panel, and layer toggles. |
| **Layers** | Colonies · Occupied · Puppet state · Spheres of influence · Ports & leased areas · Railways · Events · Military advances. Base layers: relief, rivers, modern borders (reference only), labels. |
| **Accessibility** | Keyboard: `Space` play/pause, `←/→` previous/next event or chapter, `Esc` closes panels. Native range slider with `aria-valuetext`, focusable markers, and `prefers-reduced-motion` support (camera jumps, no pulses or flow animation). |
| **Fallbacks** | Without WebGL you get a text chronology. A failed globe falls back to the typographic intro. Data load errors show an alert. |

## Architecture

```
scripts/
  build-geodata.mjs        Natural Earth → public/data/*.json (territory derivation, globe dots)
  copy-maplibre-worker.mjs postinstall: serve MapLibre v6 worker from /public/vendor
public/data/               generated GeoJSON (base layers, territories, globe)
src/
  app/                     layout (fonts with cyrillic-ext for Ө/Ү), page, global styles
  components/
    globe/                 Intro overlay + GlobeScene (R3F, custom shaders)
    map/                   AtlasMap (lifecycle, camera), engine.ts (layers, tweening, interaction), style, images
    timeline/              Timeline (scrubber, eras, event ticks, playback controls)
    storytelling/          StoryPanel
    controls/              LayerPanel (+legend), MapControls
    layout/                AppShell, TopBar, InfoPanel, SourcesDialog, fallbacks
  data/
    events/                events.ts (typed events), story.ts (chapters)
    geography/             places.ts, railways.ts, advances.ts
    historical/            territories.ts (legal categories + descriptions), regimes.ts, sources.ts
  hooks/                   playback, story controller, navigation, keyboard, media queries
  lib/                     history-model.ts (pure time → state functions), time.ts, geo.ts, animation.ts
  store/                   Zustand store (time, mode, layers, selection, camera requests)
  types/                   history.ts — strongly typed events, places, territories, sources
```

**Data flow:** `store.time` → `history-model` (pure functions) → `AtlasEngine.update()`. The engine sets feature-state targets, and a single rAF loop eases them, so territories fade in and out instead of popping. Animations only ever move the timeline value. The map always shows real data for that date.

### Rebuilding geodata

The raw Natural Earth files are not committed. To regenerate `public/data`:

```bash
mkdir -p scripts/raw && cd scripts/raw
base=https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson
for f in ne_50m_admin_0_countries ne_50m_land ne_50m_ocean ne_50m_rivers_lake_centerlines \
         ne_50m_lakes ne_50m_admin_0_boundary_lines_land ne_110m_land ne_10m_admin_1_states_provinces; do
  curl -sSfLO $base/$f.geojson; done
cd ../.. && npm run build:geodata
npm run build:relief   # downloads ~60 Terrain Tiles once, writes public/data/relief.png
```

## Performance notes

The atlas is tuned to stay smooth on integrated GPUs and classroom laptops:

- **No idle repaint.** Event pulses are CSS (compositor-only) HTML rings. The railway "flow" animates only while the map is already redrawing (playback, tweens, camera moves). A still map costs nothing.
- **Pre-rendered relief.** The shaded relief is one static Web-Mercator PNG built by `scripts/build-relief.mjs`. Live hillshading had to re-decode and re-shade DEM tiles during every camera flight.
- **Warm-up behind the intro.** While the intro covers the map, a few representative years are drawn once, so MapLibre compiles shaders and cuts tiles before the first story transition. The map itself mounts only after the globe animation has settled.
- **Cheap updates.** Feature-state values are cached instead of read back from the map. Place statuses are computed once per frame. Advance arrows are re-sent to the worker only when they visibly change, and hidden-tier markers are detached from the map.
- **No backdrop blur.** Panels are near-opaque instead of using `backdrop-filter`, which re-blurs the live WebGL canvas every frame. The render pixel ratio is capped at 1.5.
- **Present from a production build** (`npm run build && npm start`). `npm run dev` is much slower (unminified React, dev checks, HMR).

## Distinguishing territory types

Legal and political categories are kept distinct on purpose. Each has its own colour or pattern and its own definition in the info panel:

| Category | Example | Style |
| --- | --- | --- |
| Colony (formally annexed) | Taiwan 1895, Korea 1910, Karafuto 1905 | solid red |
| Ceded, then returned | Liaodong, Apr–Nov 1895 | red cross-hatch |
| Leased territory | Kwantung 1905–45 | red cross-hatch, dashed |
| Other powers' leases | Russian Kwantung 1898–1905, German Jiaozhou 1898–1914 | slate cross-hatch |
| Puppet state | Manchukuo 1932, Rehe 1933 | orange diagonal hatch |
| Military occupation | Jiaozhou 1914–22; occupied cities 1931–45 | red / red glow |
| Protectorate | Korea 1905–10 | amber hatch |
| Sphere of influence | South Manchuria, Shandong, Fujian | amber dots |

## Historical sources

Primary sources: the Treaty of Shimonoseki (1895), the Retrocession Convention (1895), the Treaty of Portsmouth (1905), the Sino-Japanese Treaty of Peking (1905), the 1915 treaties (Twenty-One Demands), the Lytton Report (1932) and the IMTFE Judgment (1948).

Scholarship: Paine (2003, 2012), Myers & Peattie (1984), Duus, Myers & Peattie (1989), Matsusaka (2001), Young (1998), Dickinson (1999), Mitter (2013), Peattie, Drea & van de Ven (2011), Muscolino (2015), Glantz (2003) and Encyclopaedia Britannica.

Datasets: Natural Earth (public domain), GeoNames coordinates (CC BY 4.0) and Terrain Tiles (Mapzen / AWS Open Data).

The full bibliography is in `src/data/historical/sources.ts` and in the in-app «Эх сурвалж» dialog.

## Data limitations (read before presenting)

- **Derived boundaries.** Colonial and leased boundaries come from coastlines intersected with clip shapes built from treaty text or landmarks. The Liaodong 1895 cession line follows the towns named in Shimonoseki Art. 2. The Kwantung northern limit is about 39.45°N (Port Adams–Pitsewo). Jiaozhou is a schematic radius of about 21 km. All of these are flagged `approximate` and drawn with dashed outlines. Computed areas match the historical figures closely (Kwantung ≈ 3,470 km² vs. ≈ 3,460 km² historical).
- **Manchukuo's edges.** The northern and eastern edges follow rivers that have marked the border since 1860. The western edge toward Mongolia and Chahar, and the Rehe outline, are hand-placed approximations.
- **Spheres of influence.** These never had surveyed borders, so modern provincial outlines are used as clearly labelled proxies.
- **Occupation 1937–45.** No occupation polygon is drawn. The occupation was largely "points and lines" (cities and railways), with guerrilla-held countryside, so it is shown as dated city captures. A railway segment turns Japanese-controlled when both of its end stations are held.
- **Railways.** These are schematic straight segments between documented stations, not surveyed alignments. Some opening dates are approximate (noted in the data).
- **Advance arrows.** These show direction and sequence through documented battle and capture sites. They are not unit routes.
- **Date precision.** Dates marked as month precision vary between sources.
- **Modern borders.** These are a faint reference layer only and are labelled as modern.

## Reference assets

`public/references/` is reserved for the course's blank contour map and assignment screenshot. They were not present when this project was built. The atlas does not depend on them. If you add an AI-generated annotated map, treat it as concept art only.

## Licences

Code: MIT-style, for coursework. Map data: Natural Earth (public domain), GeoNames (CC BY 4.0) and Terrain Tiles (see the AWS registry for component licences). Libraries: MapLibre GL JS (BSD-3), Three.js (MIT) and GSAP (standard no-charge licence).
