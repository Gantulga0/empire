import { create } from "zustand";
import type { BaseLayerKey, CameraView, LayerKey, Selection } from "@/types/history";
import { clampTime, toYear } from "@/lib/time";
import type { HistoryModel } from "@/lib/history-model";

export type Phase = "intro" | "atlas";
export type Mode = "explore" | "story";

export interface CameraRequest extends CameraView {
  /** Monotonic id so identical requests still trigger. */
  nonce: number;
  duration?: number;
}

export const INITIAL_VIEW: CameraView = { center: [120.5, 36.5], zoom: 3.75, pitch: 0, bearing: 0 };

export const PLAYBACK_SPEEDS = [0.5, 1, 2, 4] as const;
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];

interface AtlasState {
  phase: Phase;
  /** The intro overlay stays mounted while it fades out over the already-live atlas. */
  introOpen: boolean;
  closeIntro: () => void;
  /** True once the map has drawn every layer type once (shaders compiled). */
  mapWarm: boolean;
  setMapWarm: (v: boolean) => void;
  mode: Mode;
  /** Decimal year. */
  time: number;
  playing: boolean;
  speed: PlaybackSpeed;
  layers: Record<LayerKey, boolean>;
  baseLayers: Record<BaseLayerKey, boolean>;
  selection: Selection;
  storyIndex: number;
  storyAutoplay: boolean;
  camera: CameraRequest | null;
  mapReady: boolean;
  mapError: string | null;
  sourcesOpen: boolean;
  layersOpen: boolean;
  /** Loaded historical geometry + derived lookups (null until fetched). */
  model: HistoryModel | null;

  setModel: (m: HistoryModel) => void;
  setPhase: (p: Phase) => void;
  setMode: (m: Mode) => void;
  setTime: (t: number) => void;
  setPlaying: (p: boolean) => void;
  setSpeed: (s: PlaybackSpeed) => void;
  toggleLayer: (k: LayerKey) => void;
  toggleBaseLayer: (k: BaseLayerKey) => void;
  select: (s: Selection) => void;
  setStoryIndex: (i: number) => void;
  setStoryAutoplay: (v: boolean) => void;
  flyTo: (view: CameraView, duration?: number) => void;
  resetView: () => void;
  setMapReady: (v: boolean) => void;
  setMapError: (e: string | null) => void;
  setSourcesOpen: (v: boolean) => void;
  setLayersOpen: (v: boolean) => void;
}

let nonce = 0;

export const useAtlasStore = create<AtlasState>((set) => ({
  phase: "intro",
  introOpen: true,
  closeIntro: () => set({ introOpen: false }),
  mapWarm: false,
  setMapWarm: (mapWarm) => set({ mapWarm }),
  mode: "explore",
  time: toYear("1894-07-01"),
  playing: false,
  speed: 1,
  layers: {
    colony: true,
    occupied: true,
    puppet: true,
    sphere: true,
    ports: true,
    railways: true,
    events: true,
    advances: true,
  },
  baseLayers: { relief: true, modernBorders: true, rivers: true, labels: true },
  selection: null,
  storyIndex: 0,
  storyAutoplay: false,
  camera: null,
  mapReady: false,
  mapError: null,
  sourcesOpen: false,
  layersOpen: false,
  model: null,

  setModel: (model) => set({ model }),
  setPhase: (phase) => set(phase === "intro" ? { phase, introOpen: true } : { phase }),
  setMode: (mode) => set({ mode, playing: false, selection: null }),
  setTime: (t) => set({ time: clampTime(t) }),
  setPlaying: (playing) => set({ playing }),
  setSpeed: (speed) => set({ speed }),
  toggleLayer: (k) => set((s) => ({ layers: { ...s.layers, [k]: !s.layers[k] } })),
  toggleBaseLayer: (k) => set((s) => ({ baseLayers: { ...s.baseLayers, [k]: !s.baseLayers[k] } })),
  select: (selection) => set({ selection }),
  setStoryIndex: (storyIndex) => set({ storyIndex }),
  setStoryAutoplay: (storyAutoplay) => set({ storyAutoplay }),
  flyTo: (view, duration) => set({ camera: { ...view, duration, nonce: ++nonce } }),
  resetView: () => set({ camera: { ...INITIAL_VIEW, nonce: ++nonce } }),
  setMapReady: (mapReady) => set({ mapReady }),
  setMapError: (mapError) => set({ mapError }),
  setSourcesOpen: (sourcesOpen) => set({ sourcesOpen }),
  setLayersOpen: (layersOpen) => set({ layersOpen }),
}));
