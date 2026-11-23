"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import { Map as MLMap, setWorkerUrl, type LngLatBoundsLike } from "maplibre-gl";
import { EVENT_BY_ID } from "@/data/events/events";
import { PLACE_BY_ID } from "@/data/geography/places";
import { STORY } from "@/data/events/story";
import { buildModel, type TerritoryFeature } from "@/lib/history-model";
import { prefersReducedMotion } from "@/lib/animation";
import { mapRef } from "@/lib/mapRef";
import { INITIAL_VIEW, useAtlasStore } from "@/store/useAtlasStore";
import type { CameraView } from "@/types/history";
import { AtlasEngine, type EngineState } from "./engine";
import { buildBaseStyle } from "./mapStyle";

const MAX_BOUNDS: LngLatBoundsLike = [
  [68, -2],
  [165, 61],
];

/** Panel-aware padding so focused content isn't hidden behind overlays. */
function cameraPadding() {
  const w = window.innerWidth;
  const { mode, selection } = useAtlasStore.getState();
  if (w < 768) return { top: 70, bottom: mode === "story" ? 330 : 190, left: 16, right: 16 };
  const left = mode === "story" ? Math.min(500, w * 0.36) : 24;
  const right = mode === "explore" && selection ? Math.min(420, w * 0.3) : 24;
  return { top: 80, bottom: 170, left, right };
}

function highlightFor(): string[] {
  const s = useAtlasStore.getState();
  if (s.mode === "story") {
    const ch = STORY[s.storyIndex];
    return (ch && EVENT_BY_ID[ch.eventId]?.highlight) || [];
  }
  if (s.selection?.kind === "event") return EVENT_BY_ID[s.selection.id]?.highlight ?? [];
  return [];
}

function bboxOf(geom: GeoJSON.Polygon | GeoJSON.MultiPolygon): [number, number, number, number] {
  let x0 = 180, y0 = 90, x1 = -180, y1 = -90;
  const polys = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
  for (const p of polys)
    for (const [x, y] of p[0]) {
      x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
    }
  return [x0, y0, x1, y1];
}

export default function AtlasMap() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let disposed = false;
    let engine: AtlasEngine | null = null;
    const unsubs: (() => void)[] = [];
    const store = useAtlasStore.getState();
    const reduced = prefersReducedMotion();

    setWorkerUrl("/vendor/maplibre-gl-worker.mjs");

    let map: MLMap;
    try {
      map = new MLMap({
        container,
        style: buildBaseStyle(),
        center: INITIAL_VIEW.center,
        zoom: 2.9,
        minZoom: 2.6,
        maxZoom: 9.5,
        maxPitch: 60,
        maxBounds: MAX_BOUNDS,
        attributionControl: { compact: true, customAttribution: "Түүхэн өгөгдөл: «Эх сурвалж» хэсгийг үзнэ үү" },
        cooperativeGestures: false,
        fadeDuration: 0,
        // 4K / retina projectors: rendering hillshade + blurred lines at 2-3x DPR is the main GPU cost.
        pixelRatio: Math.min(window.devicePixelRatio || 1, 1.5),
      });
    } catch (err) {
      store.setMapError(err instanceof Error ? err.message : "WebGL алдаа");
      return;
    }

    mapRef.current = map;

    // The relief image is decorative — never surface its load errors.
    map.on("error", (e) => {
      const src = (e as { sourceId?: string }).sourceId;
      if (src === "relief") return;
      console.warn("[map]", e.error?.message ?? e);
    });

    const fly = (view: CameraView, duration?: number) => {
      const opts = {
        center: view.center,
        zoom: view.zoom,
        bearing: view.bearing ?? 0,
        pitch: view.pitch ?? 0,
        padding: cameraPadding(),
      };
      if (reduced || duration === 0) map.jumpTo(opts);
      else map.flyTo({ ...opts, duration: duration ?? 2600, curve: 1.5, essential: true });
    };

    const snapshot = (): EngineState => {
      const s = useAtlasStore.getState();
      return { time: s.time, layers: s.layers, base: s.baseLayers, selection: s.selection, highlight: highlightFor() };
    };

    /**
     * While the intro still covers the map, step through a few representative years so
     * every layer type (pattern fills, arrow icons, event circles, port rings…) is drawn
     * once. MapLibre compiles shaders and cuts tiles lazily on first draw; doing it here
     * moves those 100–300 ms hitches out of the visible story transitions.
     */
    const warmUp = async (eng: AtlasEngine) => {
      // Each year introduces new layer types: cross-hatch + arrows (1895), dots + leases (1906),
      // puppet hatch + occupied glow (1933), regime rings + ports + concessions (1938).
      const WARM_YEARS = [1895.6, 1906.2, 1933.5, 1938.5];
      for (const time of WARM_YEARS) {
        if (disposed || useAtlasStore.getState().phase !== "intro") break;
        eng.update({ ...snapshot(), time, highlight: [] });
        await new Promise((r) => setTimeout(r, 220));
      }
      if (disposed) return;
      eng.update(snapshot());
      // Lets the intro start its camera move only now, on a quiet main thread.
      useAtlasStore.getState().setMapWarm(true);
    };

    map.on("load", async () => {
      try {
        const res = await fetch("/data/territories.json");
        if (!res.ok) throw new Error(`territories.json: ${res.status}`);
        const fc = (await res.json()) as GeoJSON.FeatureCollection;
        if (disposed) return;
        const model = buildModel(fc.features as TerritoryFeature[]);
        useAtlasStore.getState().setModel(model);
        engine = new AtlasEngine(map, model, {
          reducedMotion: reduced,
          onSelect: (sel) => useAtlasStore.getState().select(sel),
        });
        engine.update(snapshot());
        engine.setPaused(useAtlasStore.getState().phase === "intro");
        void warmUp(engine);
        useAtlasStore.getState().setMapReady(true);

        let pending = false;
        unsubs.push(
          useAtlasStore.subscribe((s, prev) => {
            if (
              s.time === prev.time &&
              s.layers === prev.layers &&
              s.baseLayers === prev.baseLayers &&
              s.selection === prev.selection &&
              s.storyIndex === prev.storyIndex &&
              s.mode === prev.mode
            )
              return;
            if (pending) return;
            pending = true;
            requestAnimationFrame(() => {
              pending = false;
              engine?.update(snapshot());
            });
          }),
        );

        // Ease into the atlas once the intro has finished.
        if (useAtlasStore.getState().phase === "atlas") fly(INITIAL_VIEW, 2200);
      } catch (err) {
        console.error("[atlas] failed to initialise historical layers", err);
        useAtlasStore.getState().setMapError(err instanceof Error ? err.message : String(err));
      }
    });

    // Camera requests from anywhere in the UI.
    unsubs.push(
      useAtlasStore.subscribe((s, prev) => {
        if (s.camera && s.camera !== prev.camera) fly(s.camera, s.camera.duration);
        if (s.phase !== prev.phase) engine?.setPaused(s.phase === "intro");
        if (s.phase === "atlas" && prev.phase === "intro" && map.loaded()) fly(INITIAL_VIEW, 2400);
      }),
    );

    // Explore mode: focus the camera on whatever the user selects.
    unsubs.push(
      useAtlasStore.subscribe((s, prev) => {
        if (s.selection === prev.selection || !s.selection || s.mode !== "explore") return;
        const sel = s.selection;
        if (sel.kind === "place") {
          const p = PLACE_BY_ID[sel.id];
          if (p) fly({ center: [p.lng, p.lat], zoom: Math.max(map.getZoom(), 6.2), pitch: map.getPitch(), bearing: map.getBearing() }, 1600);
        } else if (sel.kind === "event") {
          const ev = EVENT_BY_ID[sel.id];
          if (ev) fly(ev.camera, 2000);
        } else if (sel.kind === "territory") {
          const terr = s.model?.territoryById[sel.id];
          if (terr) {
            const b = bboxOf(terr.geometry);
            map.fitBounds(
              [
                [b[0], b[1]],
                [b[2], b[3]],
              ],
              { padding: cameraPadding(), maxZoom: 7, duration: reduced ? 0 : 1800 },
            );
          }
        }
      }),
    );

    const onResize = () => map.resize();
    window.addEventListener("resize", onResize);

    return () => {
      disposed = true;
      unsubs.forEach((u) => u());
      window.removeEventListener("resize", onResize);
      engine?.destroy();
      mapRef.current = null;
      map.remove();
      useAtlasStore.getState().setMapReady(false);
    };
  }, []);

  // MapLibre sets `position: relative` on its container, so the sizing lives on a wrapper.
  return (
    <div className="absolute inset-0">
      <div
        ref={containerRef}
        className="atlas-map h-full w-full"
        role="region"
        aria-label="Түүхэн газрын зураг. Хотын тэмдэгт дээр дарж дэлгэрэнгүйг харна уу."
      />
    </div>
  );
}
