import type {
  ExpressionSpecification,
  GeoJSONSource,
  Map as MLMap,
  MapGeoJSONFeature,
  MapMouseEvent,
} from "maplibre-gl";
import { Marker } from "maplibre-gl";
import { ADVANCES } from "@/data/geography/advances";
import { PLACE_BY_ID, PLACES } from "@/data/geography/places";
import { EVENTS } from "@/data/events/events";
import { MAP_LABELS, REGIMES } from "@/data/historical/regimes";
import { CATEGORY_META, TERRITORY_INFO } from "@/data/historical/territories";
import {
  JAPANESE_HELD,
  RAIL_SEGMENTS,
  STATUS_LABEL,
  advanceFrame,
  eventPhase,
  placeState,
  segmentState,
  territoryActive,
  type HistoryModel,
  type PlaceStatus,
} from "@/lib/history-model";
import { formatDate, isActive } from "@/lib/time";
import type { BaseLayerKey, LayerKey, Selection, TerritoryCategory } from "@/types/history";
import { registerImages } from "./images";
import { MAP_COLORS } from "./mapStyle";

const EMPTY: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };

interface Tween {
  source: string;
  id: string;
  key: string;
  cur: number;
  target: number;
}

export interface EngineState {
  time: number;
  layers: Record<LayerKey, boolean>;
  base: Record<BaseLayerKey, boolean>;
  selection: Selection;
  highlight: string[];
}

interface EngineOptions {
  onSelect: (s: Selection) => void;
  reducedMotion: boolean;
}

const fs = (key: string, fallback = 0): ExpressionSpecification => ["coalesce", ["feature-state", key], fallback];

const categoryMatch = (pick: (c: TerritoryCategory) => string | number): ExpressionSpecification => {
  const entries = (Object.keys(CATEGORY_META) as TerritoryCategory[]).flatMap((c) => [c, pick(c)]);
  return ["match", ["get", "category"], ...entries, pick("japan")] as unknown as ExpressionSpecification;
};

const PATTERN_IMAGE: Partial<Record<TerritoryCategory, string>> = {
  puppet: "pat-hatch-puppet",
  protectorate: "pat-hatch-amber",
  sphere: "pat-dots-amber",
  leased: "pat-cross-red",
  "ceded-returned": "pat-cross-red",
  "foreign-lease": "pat-cross-slate",
};

/** Rail-flow dash sequence (classic "ant trail" animation). */
const DASH_SEQ: number[][] = [
  [0, 4, 3],
  [0.5, 4, 2.5],
  [1, 4, 2],
  [1.5, 4, 1.5],
  [2, 4, 1],
  [2.5, 4, 0.5],
  [3, 4, 0],
  [0, 0.5, 3, 3.5],
  [0, 1, 3, 3],
  [0, 1.5, 3, 2.5],
  [0, 2, 3, 2],
  [0, 2.5, 3, 1.5],
  [0, 3, 3, 1],
  [0, 3.5, 3, 0.5],
];

export class AtlasEngine {
  private map: MLMap;
  private model: HistoryModel;
  private opts: EngineOptions;
  private tweens = new Map<string, Tween>();
  private raf = 0;
  private last = 0;
  private dashStep = -1;
  private state: EngineState | null = null;
  private placeMarkers = new Map<string, { marker: Marker; el: HTMLElement; status?: PlaceStatus; attached: boolean }>();
  private labelMarkers = new Map<string, { marker: Marker; el: HTMLElement; attached: boolean }>();
  private tooltip: HTMLDivElement;
  private hoverTerritory: string | null = null;
  private eventSignature = "";
  private portSignature = "";
  private regimeSignature = "";
  private advanceSignature = "";
  private destroyed = false;
  /** Last value written per feature-state key — avoids map.getFeatureState() on every update. */
  private values = new Map<string, number>();
  /** HTML pulse rings for currently-active events. */
  private pulses = new Map<string, Marker>();
  private zoomTier = 0;
  private paused = false;

  constructor(map: MLMap, model: HistoryModel, opts: EngineOptions) {
    this.map = map;
    this.model = model;
    this.opts = opts;
    this.tooltip = document.createElement("div");
    this.tooltip.className = "map-tooltip";
    this.tooltip.setAttribute("role", "status");
    map.getContainer().appendChild(this.tooltip);
    this.addLayers();
    this.addMarkers();
    this.bindInteractions();
    this.updateZoomTier();
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);
  }

  // ───────────────────────── setup ─────────────────────────

  private addLayers() {
    const map = this.map;
    registerImages(map);

    map.addSource("territories", {
      type: "geojson",
      data: { type: "FeatureCollection", features: this.model.territories },
      promoteId: "id",
      maxzoom: 7,
    });
    map.addSource("rails", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: RAIL_SEGMENTS.map((s) => ({
          type: "Feature",
          properties: { id: s.id, railwayId: s.railwayId },
          geometry: { type: "LineString", coordinates: s.coords },
        })),
      },
      promoteId: "id",
      maxzoom: 7,
      lineMetrics: false,
    });
    map.addSource("glow", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: PLACES.filter((p) => p.occupations?.length).map((p) => ({
          type: "Feature",
          properties: { id: p.id },
          geometry: { type: "Point", coordinates: [p.lng, p.lat] },
        })),
      },
      promoteId: "id",
      maxzoom: 7,
    });
    // Low maxzoom on frequently-updated sources keeps each setData() cheap (fewer tiles to cut).
    map.addSource("advances", { type: "geojson", data: EMPTY, maxzoom: 7 });
    map.addSource("advance-heads", { type: "geojson", data: EMPTY, maxzoom: 7 });
    map.addSource("events", { type: "geojson", data: EMPTY, promoteId: "id", maxzoom: 7 });
    map.addSource("ports", { type: "geojson", data: EMPTY, promoteId: "id", maxzoom: 7 });
    map.addSource("regimes", { type: "geojson", data: EMPTY, promoteId: "id", maxzoom: 7 });

    const vis = fs("v");
    const hl = fs("hl");
    const hover: ExpressionSpecification = ["case", ["boolean", ["feature-state", "hover"], false], 1, 0];

    // Territories — solid tint
    map.addLayer({
      id: "territory-fill",
      type: "fill",
      source: "territories",
      paint: {
        "fill-color": categoryMatch((c) => CATEGORY_META[c].color),
        "fill-opacity": [
          "*",
          vis,
          ["+", categoryMatch((c) => (CATEGORY_META[c].pattern ? 0.12 : CATEGORY_META[c].opacity)), ["*", 0.14, hover], ["*", 0.12, hl]],
        ],
      },
    });
    // Territories — patterns (hatch / dots / cross)
    map.addLayer({
      id: "territory-pattern",
      type: "fill",
      source: "territories",
      filter: ["in", ["get", "category"], ["literal", Object.keys(PATTERN_IMAGE)]],
      paint: {
        "fill-pattern": categoryMatch((c) => PATTERN_IMAGE[c] ?? "pat-cross-slate"),
        "fill-opacity": ["*", vis, ["+", categoryMatch((c) => CATEGORY_META[c].opacity), ["*", 0.25, hover]]],
      },
    });
    // Keep reference borders readable over territory fills and beneath historical outlines.
    map.moveLayer("modern-borders");

    const territoryLineWidth: ExpressionSpecification = ["+", 1.85, ["*", 1.35, hl], ["*", 0.45, hover]];
    map.addLayer({
      id: "territory-glow",
      type: "line",
      source: "territories",
      paint: {
        "line-color": categoryMatch((c) => CATEGORY_META[c].color),
        "line-width": ["+", 2, ["*", 8, hl]],
        "line-blur": 6,
        "line-opacity": ["*", vis, ["+", 0.15, ["*", 0.55, hl], ["*", 0.25, hover]]],
      },
    });
    map.addLayer({
      id: "territory-line",
      type: "line",
      source: "territories",
      filter: ["!=", ["get", "approximate"], true],
      layout: { "line-join": "round" },
      paint: {
        "line-color": categoryMatch((c) => CATEGORY_META[c].color),
        "line-width": territoryLineWidth,
        "line-opacity": vis,
      },
    });
    map.addLayer({
      id: "territory-line-approx",
      type: "line",
      source: "territories",
      filter: ["==", ["get", "approximate"], true],
      layout: { "line-join": "round" },
      paint: {
        "line-color": categoryMatch((c) => CATEGORY_META[c].color),
        "line-width": territoryLineWidth,
        "line-dasharray": [2, 1.6],
        "line-opacity": vis,
      },
    });

    // Occupied-city glow
    map.addLayer({
      id: "occupied-glow",
      type: "circle",
      source: "glow",
      paint: {
        "circle-color": MAP_COLORS.red,
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 9, 6, 26, 9, 60],
        "circle-blur": 1,
        "circle-opacity": ["*", vis, 0.55],
      },
    });

    // Railways
    const railWidth = (k: number): ExpressionSpecification => ["interpolate", ["linear"], ["zoom"], 3, 0.9 * k, 6, 2 * k, 9, 3.4 * k];
    map.addLayer({
      id: "rail-casing",
      type: "line",
      source: "rails",
      layout: { "line-cap": "round" },
      paint: { "line-color": "#05080D", "line-width": railWidth(2.6), "line-opacity": ["*", vis, 0.9] },
    });
    map.addLayer({
      id: "rail-base",
      type: "line",
      source: "rails",
      layout: { "line-cap": "round" },
      paint: {
        "line-color": ["interpolate", ["linear"], fs("j"), 0, "#5F7489", 1, MAP_COLORS.cyan],
        // Zoom must be the top-level interpolation input; feature-state scales each stop.
        "line-width": [
          "interpolate",
          ["linear"],
          ["zoom"],
          3, ["*", 0.9, ["+", 0.8, ["*", 0.5, fs("j")]]],
          6, ["*", 2, ["+", 0.8, ["*", 0.5, fs("j")]]],
          9, ["*", 3.4, ["+", 0.8, ["*", 0.5, fs("j")]]],
        ],
        "line-opacity": ["*", vis, ["+", 0.55, ["*", 0.45, fs("j")]]],
      },
    });
    map.addLayer({
      id: "rail-ties",
      type: "line",
      source: "rails",
      paint: {
        "line-color": ["interpolate", ["linear"], fs("j"), 0, "#5F7489", 1, MAP_COLORS.cyan],
        "line-width": railWidth(3),
        "line-dasharray": [0.18, 2.2],
        "line-opacity": ["*", vis, 0.7],
      },
      minzoom: 4.4,
    });
    map.addLayer({
      id: "rail-flow",
      type: "line",
      source: "rails",
      paint: {
        "line-color": "#D7F3FA",
        "line-width": railWidth(0.9),
        "line-dasharray": DASH_SEQ[0],
        "line-opacity": ["*", vis, fs("j"), 0.55],
      },
    });

    // Military advances
    map.addLayer({
      id: "advance-glow",
      type: "line",
      source: "advances",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": MAP_COLORS.red, "line-width": 12, "line-blur": 8, "line-opacity": ["*", ["get", "o"], 0.35] },
    });
    map.addLayer({
      id: "advance-line",
      type: "line",
      source: "advances",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#E85A5A",
        "line-width": ["interpolate", ["linear"], ["zoom"], 3, 2, 7, 4.2],
        "line-opacity": ["get", "o"],
      },
    });
    map.addLayer({
      id: "advance-head",
      type: "symbol",
      source: "advance-heads",
      layout: {
        "icon-image": "arrowhead",
        "icon-rotate": ["get", "b"],
        "icon-rotation-alignment": "map",
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
        "icon-size": ["interpolate", ["linear"], ["zoom"], 3, 0.55, 7, 0.95],
      },
      paint: { "icon-opacity": ["get", "o"] },
    });

    // Ports & regime seats
    map.addLayer({
      id: "ports-ring",
      type: "circle",
      source: "ports",
      paint: {
        "circle-color": "rgba(0,0,0,0)",
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 6, 8, 12],
        "circle-stroke-color": MAP_COLORS.cyan,
        "circle-stroke-width": ["case", ["boolean", ["feature-state", "hover"], false], 2.6, 1.6],
        "circle-stroke-opacity": 0.95,
      },
    });
    map.addLayer({
      id: "regimes-ring",
      type: "circle",
      source: "regimes",
      paint: {
        "circle-color": "rgba(224,112,63,0.18)",
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 9, 8, 18],
        "circle-stroke-color": "#E0703F",
        "circle-stroke-width": 1.6,
        "circle-stroke-opacity": 0.95,
      },
    });

    // Events. The pulse ring for "current" events is an HTML/CSS element (see
    // syncEventPulses) so it animates on the compositor without repainting the map.
    map.addLayer({
      id: "event-dot",
      type: "circle",
      source: "events",
      paint: {
        // Lift event markers above the city dot so both stay clickable.
        "circle-translate": [0, -17],
        "circle-color": ["match", ["get", "phase"], "current", MAP_COLORS.amber, "rgba(217,163,95,0.12)"],
        "circle-radius": [
          "*",
          ["match", ["get", "phase"], "current", 1, 0.7],
          ["case", ["get", "major"], 7, 5.2],
          ["case", ["boolean", ["feature-state", "hover"], false], 1.3, 1],
        ],
        "circle-stroke-color": MAP_COLORS.amber,
        "circle-stroke-width": ["match", ["get", "phase"], "current", 2, 1.2],
        "circle-stroke-opacity": ["match", ["get", "phase"], "current", 1, 0.55],
      },
    });
  }

  private addMarkers() {
    for (const p of PLACES) {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "place";
      el.dataset.tier = String(p.tier);
      el.dataset.kind = p.kind;
      el.dataset.status = "free";
      el.setAttribute("aria-label", `${p.name}${p.alt ? ` (${p.alt})` : ""}`);
      el.innerHTML = `<span class="place__dot" aria-hidden="true"></span><span class="place__label">${p.name}</span>`;
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        this.opts.onSelect({ kind: "place", id: p.id });
      });
      el.addEventListener("mouseenter", () => this.showPlaceTooltip(p.id, el));
      el.addEventListener("mouseleave", () => this.hideTooltip());
      el.addEventListener("focus", () => this.showPlaceTooltip(p.id, el));
      el.addEventListener("blur", () => this.hideTooltip());
      const marker = new Marker({ element: el, anchor: "center" }).setLngLat([p.lng, p.lat]);
      this.placeMarkers.set(p.id, { marker, el, attached: false });
    }
    for (const l of MAP_LABELS) {
      const el = document.createElement("div");
      el.className = `map-label map-label--${l.kind}`;
      el.setAttribute("aria-hidden", "true");
      el.innerHTML = `<span>${l.text}</span>${l.sub ? `<small>${l.sub}</small>` : ""}`;
      const marker = new Marker({ element: el, anchor: "center" }).setLngLat([l.lng, l.lat]);
      this.labelMarkers.set(l.id, { marker, el, attached: false });
    }
  }

  private bindInteractions() {
    const map = this.map;
    const interactive = ["event-dot", "regimes-ring", "ports-ring", "territory-fill"];

    map.on("mousemove", (e: MapMouseEvent) => {
      const feats = map.queryRenderedFeatures(e.point, { layers: interactive }).filter(this.isVisibleFeature);
      const f = feats[0];
      map.getCanvas().style.cursor = f ? "pointer" : "";
      const terr = feats.find((x) => x.layer.id === "territory-fill");
      this.setTerritoryHover(terr ? String(terr.properties.id) : null);
      if (!f) return this.hideTooltip();
      this.showFeatureTooltip(f, e.point.x, e.point.y);
    });
    map.on("mouseout", () => {
      this.setTerritoryHover(null);
      this.hideTooltip();
    });
    map.on("click", (e: MapMouseEvent) => {
      const f = map.queryRenderedFeatures(e.point, { layers: interactive }).filter(this.isVisibleFeature)[0];
      if (!f) return this.opts.onSelect(null);
      const id = String(f.properties.id);
      if (f.layer.id === "event-dot") this.opts.onSelect({ kind: "event", id });
      else if (f.layer.id === "regimes-ring") this.opts.onSelect({ kind: "regime", id });
      else if (f.layer.id === "ports-ring") this.opts.onSelect({ kind: "place", id });
      else this.opts.onSelect({ kind: "territory", id });
    });
    map.on("zoom", () => this.updateZoomTier());
  }

  /** Territory features with v≈0 are still rendered (opacity 0); ignore them for interaction. */
  private isVisibleFeature = (f: MapGeoJSONFeature) => {
    if (f.layer.id !== "territory-fill") return true;
    const st = this.map.getFeatureState({ source: "territories", id: String(f.properties.id) });
    return (st?.v ?? 0) > 0.5;
  };

  private setTerritoryHover(id: string | null) {
    if (id === this.hoverTerritory) return;
    if (this.hoverTerritory) this.map.setFeatureState({ source: "territories", id: this.hoverTerritory }, { hover: false });
    if (id) this.map.setFeatureState({ source: "territories", id }, { hover: true });
    this.hoverTerritory = id;
  }

  private showFeatureTooltip(f: MapGeoJSONFeature, x: number, y: number) {
    const id = String(f.properties.id);
    let title = "";
    let sub = "";
    if (f.layer.id === "territory-fill") {
      const info = TERRITORY_INFO[id];
      title = info?.name ?? id;
      sub = info?.status ?? "";
      if (f.properties.approximate) sub += " · хил ойролцоо";
    } else if (f.layer.id === "event-dot") {
      const ev = EVENTS.find((e) => e.id === id);
      title = ev?.title ?? "";
      sub = ev ? formatDate(ev.date, ev.precision) : "";
    } else if (f.layer.id === "regimes-ring") {
      const r = REGIMES.find((x) => x.id === id);
      title = r?.name ?? "";
      sub = "Хүүхэлдэй засгийн суудал";
    } else if (f.layer.id === "ports-ring") {
      const p = PLACE_BY_ID[id];
      title = p?.name ?? "";
      sub = p?.port?.label ?? "";
    }
    this.tooltip.innerHTML = `<strong>${title}</strong>${sub ? `<span>${sub}</span>` : ""}`;
    this.tooltip.style.transform = `translate(${x + 14}px, ${y + 14}px)`;
    this.tooltip.dataset.show = "true";
  }

  private showPlaceTooltip(id: string, el: HTMLElement) {
    const p = PLACE_BY_ID[id];
    if (!p || !this.state) return;
    const st = placeState(p, this.state.time, this.model);
    const rect = el.getBoundingClientRect();
    const host = this.map.getContainer().getBoundingClientRect();
    this.tooltip.innerHTML = `<strong>${p.name}${p.alt ? ` <em>${p.alt}</em>` : ""}</strong><span>${STATUS_LABEL[st.status]}</span>`;
    this.tooltip.style.transform = `translate(${rect.left - host.left + 16}px, ${rect.top - host.top + 16}px)`;
    this.tooltip.dataset.show = "true";
  }

  private hideTooltip() {
    this.tooltip.dataset.show = "false";
  }

  private updateZoomTier() {
    const z = this.map.getZoom();
    const tier = z < 4.6 ? 1 : z < 5.9 ? 2 : 3;
    if (tier !== this.zoomTier) {
      this.zoomTier = tier;
      this.map.getContainer().dataset.ztier = String(tier);
      if (this.state) this.updatePlaceClasses(this.state);
    }
    if (this.state) this.updateLabels(this.state);
  }

  /** Pause decorative work (e.g. while the intro covers the map). */
  setPaused(paused: boolean) {
    this.paused = paused;
  }

  // ───────────────────────── state sync ─────────────────────────

  update(next: EngineState) {
    this.state = next;
    const { time: t, layers, base, highlight, selection } = next;
    const hlSet = new Set(highlight);
    if (selection?.kind === "territory") hlSet.add(selection.id);

    // Territories
    for (const f of this.model.territories) {
      const p = f.properties;
      const layerKey = CATEGORY_META[p.category].layer;
      const on = layerKey === null ? true : layers[layerKey];
      this.target("territories", p.id, "v", on && territoryActive(t, p) ? 1 : 0);
      this.target("territories", p.id, "hl", hlSet.has(p.id) ? 1 : 0);
    }

    // Places — computed once per update and shared with the railway logic.
    const states = new Map<string, PlaceStatus>();
    for (const p of PLACES) {
      const st = placeState(p, t, this.model);
      states.set(p.id, st.status);
      const m = this.placeMarkers.get(p.id)!;
      if (m.status !== st.status) {
        m.status = st.status;
        m.el.dataset.status = st.status;
        const held = JAPANESE_HELD.has(st.status) ? "true" : "false";
        if (m.el.dataset.held !== held) m.el.dataset.held = held;
      }
      if (p.occupations?.length) this.target("glow", p.id, "v", layers.occupied && st.status === "occupied" ? 1 : 0);
    }
    this.updatePlaceClasses(next);

    // Railways
    const statusOf = (id: string) => states.get(id) ?? "free";
    for (const seg of RAIL_SEGMENTS) {
      const s = segmentState(seg, t, this.model, statusOf);
      this.target("rails", seg.id, "v", layers.railways && s.open ? 1 : 0);
      this.target("rails", seg.id, "j", s.japanese ? 1 : 0);
    }

    // Advances — geometry grows with time. Quantised so the GeoJSON is only re-sent
    // to the worker when the drawing visibly changes.
    const frames = layers.advances ? ADVANCES.map((a) => advanceFrame(a, t)).filter((f) => f !== null) : [];
    const advSig = frames.map((f) => `${f.advance.id}:${Math.round(f.progress * 160)}:${Math.round(f.opacity * 20)}`).join("|");
    if (advSig !== this.advanceSignature) {
      this.advanceSignature = advSig;
      (this.map.getSource("advances") as GeoJSONSource).setData({
        type: "FeatureCollection",
        features: frames.map((f) => ({
          type: "Feature",
          properties: { id: f.advance.id, o: f.opacity },
          geometry: { type: "LineString", coordinates: f.coords },
        })),
      });
      (this.map.getSource("advance-heads") as GeoJSONSource).setData({
        type: "FeatureCollection",
        features: frames.map((f) => ({
          type: "Feature",
          properties: { id: f.advance.id, o: f.opacity, b: f.headBearing },
          geometry: { type: "Point", coordinates: f.head },
        })),
      });
    }

    // Events
    const evFeatures: GeoJSON.Feature[] = [];
    const current: string[] = [];
    for (const ev of EVENTS) {
      const phase = eventPhase(ev, t);
      if (phase === "future") continue;
      const place = PLACE_BY_ID[ev.placeIds[0]];
      if (!place) continue;
      if (phase === "current") current.push(ev.id);
      evFeatures.push({
        type: "Feature",
        properties: { id: ev.id, phase, major: ev.major },
        geometry: { type: "Point", coordinates: [place.lng, place.lat] },
      });
    }
    const evSig = evFeatures.map((f) => `${f.properties!.id}:${f.properties!.phase}`).join("|");
    if (evSig !== this.eventSignature) {
      this.eventSignature = evSig;
      (this.map.getSource("events") as GeoJSONSource).setData({ type: "FeatureCollection", features: evFeatures });
    }
    this.syncEventPulses(layers.events ? current : []);

    // Ports (active port functions at t)
    const ports = PLACES.filter((p) => p.port && isActive(t, p.port.from, p.port.to) && (p.port.kind !== "concession" || t >= 1898.5));
    const portSig = ports.map((p) => p.id).join("|");
    if (portSig !== this.portSignature) {
      this.portSignature = portSig;
      (this.map.getSource("ports") as GeoJSONSource).setData({
        type: "FeatureCollection",
        features: ports.map((p) => ({
          type: "Feature",
          properties: { id: p.id },
          geometry: { type: "Point", coordinates: [p.lng, p.lat] },
        })),
      });
    }

    // Regime seats
    const regimes = REGIMES.filter((r) => isActive(t, r.from, r.to));
    const regSig = regimes.map((r) => r.id).join("|");
    if (regSig !== this.regimeSignature) {
      this.regimeSignature = regSig;
      (this.map.getSource("regimes") as GeoJSONSource).setData({
        type: "FeatureCollection",
        features: regimes.map((r) => {
          const p = PLACE_BY_ID[r.seatPlaceId];
          // Offset co-located regimes slightly so both remain clickable.
          const dup = regimes.filter((x) => x.seatPlaceId === r.seatPlaceId).indexOf(r);
          return {
            type: "Feature",
            properties: { id: r.id },
            geometry: { type: "Point", coordinates: [p.lng + dup * 0.18, p.lat - dup * 0.12] },
          };
        }),
      });
    }

    // Layer visibility toggles
    this.setVisible(["advance-glow", "advance-line", "advance-head"], layers.advances);
    this.setVisible(["event-dot"], layers.events);
    this.setVisible(["ports-ring"], layers.ports);
    this.setVisible(["regimes-ring"], layers.puppet);
    this.setVisible(["rail-flow"], layers.railways);
    this.setVisible(["relief"], base.relief);
    this.setVisible(["modern-borders"], base.modernBorders);
    this.setVisible(["rivers"], base.rivers);
    const labelsAttr = base.labels ? "on" : "off";
    const container = this.map.getContainer();
    if (container.dataset.labels !== labelsAttr) container.dataset.labels = labelsAttr;

    this.updateLabels(next);
  }

  /**
   * Only markers that can be seen are attached to the map: MapLibre repositions every
   * attached marker on each camera frame, so detaching hidden tiers keeps flights smooth.
   */
  private updatePlaceClasses(s: EngineState) {
    const sel = s.selection;
    const related = new Set<string>();
    if (sel?.kind === "event") EVENTS.find((e) => e.id === sel.id)?.placeIds.forEach((id) => related.add(id));
    const tier = this.zoomTier || 1;
    for (const [id, m] of this.placeMarkers) {
      const isSel = sel?.kind === "place" && sel.id === id;
      const isRel = related.has(id);
      if (m.el.classList.contains("is-selected") !== isSel) m.el.classList.toggle("is-selected", isSel);
      if (m.el.classList.contains("is-related") !== isRel) m.el.classList.toggle("is-related", isRel);
      const visible = PLACE_BY_ID[id].tier <= tier || isSel || isRel;
      if (visible && !m.attached) {
        m.marker.addTo(this.map);
        m.attached = true;
      } else if (!visible && m.attached) {
        m.marker.remove();
        m.attached = false;
      }
    }
  }

  private updateLabels(s: EngineState) {
    const z = this.map.getZoom();
    for (const l of MAP_LABELS) {
      const m = this.labelMarkers.get(l.id)!;
      const show = isActive(s.time, l.from, l.to) && z >= (l.minZoom ?? 0) && !(l.kind === "sea" && z > 7.2);
      const v = show ? "true" : "false";
      if (m.el.dataset.show === v) continue;
      m.el.dataset.show = v;
      if (show && !m.attached) {
        m.marker.addTo(this.map);
        m.attached = true;
      }
    }
  }

  private syncEventPulses(ids: string[]) {
    const want = new Set(ids);
    for (const [id, marker] of this.pulses) {
      if (!want.has(id)) {
        marker.remove();
        this.pulses.delete(id);
      }
    }
    for (const id of want) {
      if (this.pulses.has(id)) continue;
      const ev = EVENTS.find((e) => e.id === id);
      const place = ev && PLACE_BY_ID[ev.placeIds[0]];
      if (!ev || !place) continue;
      const el = document.createElement("div");
      el.className = `event-pulse${ev.major ? " event-pulse--major" : ""}`;
      el.setAttribute("aria-hidden", "true");
      const marker = new Marker({ element: el, anchor: "center", offset: [0, -17] })
        .setLngLat([place.lng, place.lat])
        .addTo(this.map);
      this.pulses.set(id, marker);
    }
  }

  private setVisible(ids: string[], on: boolean) {
    for (const id of ids) {
      if (!this.map.getLayer(id)) continue;
      const v = on ? "visible" : "none";
      if (this.map.getLayoutProperty(id, "visibility") !== v) this.map.setLayoutProperty(id, "visibility", v);
    }
  }

  private target(source: string, id: string, key: string, value: number) {
    const k = `${source}|${id}|${key}`;
    const tw = this.tweens.get(k);
    if (tw) {
      tw.target = value;
      return;
    }
    const cur = this.values.get(k) ?? 0;
    if (Math.abs(cur - value) < 0.001) return;
    if (this.opts.reducedMotion) {
      this.values.set(k, value);
      this.map.setFeatureState({ source, id }, { [key]: value });
      return;
    }
    this.tweens.set(k, { source, id, key, cur, target: value });
  }

  // ───────────────────────── animation loop ─────────────────────────

  /**
   * One rAF loop: eases feature-state values, and runs the railway "flow" only while the
   * map is already redrawing (playback, tweens, camera moves). An idle map is never
   * repainted, which is what keeps the GPU cool on classroom laptops.
   */
  private loop(now: number) {
    if (this.destroyed) return;
    const dt = this.last ? Math.min(0.1, (now - this.last) / 1000) : 0.016;
    this.last = now;
    if (this.tweens.size) {
      const k = 1 - Math.exp(-dt / 0.2);
      for (const [key, tw] of this.tweens) {
        tw.cur += (tw.target - tw.cur) * k;
        if (Math.abs(tw.target - tw.cur) < 0.01) {
          tw.cur = tw.target;
          this.tweens.delete(key);
        }
        this.values.set(key, tw.cur);
        this.map.setFeatureState({ source: tw.source, id: tw.id }, { [tw.key]: tw.cur });
      }
    }

    const busy = this.tweens.size > 0 || this.map.isMoving();
    if (!this.paused && !this.opts.reducedMotion && busy && this.state?.layers.railways) {
      const step = Math.floor(now / 90) % DASH_SEQ.length;
      if (step !== this.dashStep) {
        this.dashStep = step;
        this.map.setPaintProperty("rail-flow", "line-dasharray", DASH_SEQ[step]);
      }
    }
    this.raf = requestAnimationFrame(this.loop);
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    for (const { marker } of this.placeMarkers.values()) marker.remove();
    for (const { marker } of this.labelMarkers.values()) marker.remove();
    for (const marker of this.pulses.values()) marker.remove();
    this.tooltip.remove();
  }
}
