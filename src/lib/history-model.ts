/**
 * Pure functions that turn the historical dataset + a timeline value into
 * map state. No rendering here — the map and UI both consume these.
 */
import { ADVANCES } from "@/data/geography/advances";
import { PLACE_BY_ID, PLACES } from "@/data/geography/places";
import { RAILWAYS } from "@/data/geography/railways";
import { EVENTS } from "@/data/events/events";
import { REGIMES } from "@/data/historical/regimes";
import type {
  Advance,
  HistoricalEvent,
  LngLat,
  OccupationPeriod,
  Place,
  RailController,
  TerritoryCategory,
  TerritoryProps,
} from "@/types/history";
import { bearing, pointInGeometry, sliceLine, smoothLine } from "./geo";
import { isActive, toYear } from "./time";

export type TerritoryFeature = GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon, TerritoryProps>;

export type PlaceStatus =
  | "japan"
  | "colony"
  | "leased"
  | "puppet"
  | "occupied"
  | "protectorate"
  | "sphere"
  | "foreign"
  | "free";

export const STATUS_LABEL: Record<PlaceStatus, string> = {
  japan: "Японы үндсэн нутаг",
  colony: "Японы колони",
  leased: "Японы түрээсийн нутаг",
  puppet: "Хүүхэлдэй улсын нутаг",
  occupied: "Японы цэргийн эзлэлтэд",
  protectorate: "Японы протекторат",
  sphere: "Японы нөлөөллийн бүсэд",
  foreign: "Бусад гүрний түрээсэд",
  free: "Японы шууд хяналтаас гадуур",
};

const CATEGORY_TO_STATUS: Record<TerritoryCategory, PlaceStatus> = {
  japan: "japan",
  colony: "colony",
  "ceded-returned": "colony",
  protectorate: "protectorate",
  leased: "leased",
  "foreign-lease": "foreign",
  puppet: "puppet",
  occupied: "occupied",
  sphere: "sphere",
};

const STATUS_PRIORITY: PlaceStatus[] = ["japan", "colony", "leased", "puppet", "occupied", "protectorate", "foreign", "sphere"];

export const JAPANESE_HELD: ReadonlySet<PlaceStatus> = new Set(["japan", "colony", "leased", "puppet", "occupied"]);

export interface HistoryModel {
  territories: TerritoryFeature[];
  territoryById: Record<string, TerritoryFeature>;
  /** placeId → ids of territory polygons containing it. */
  containment: Record<string, string[]>;
}

export function buildModel(territories: TerritoryFeature[]): HistoryModel {
  const territoryById = Object.fromEntries(territories.map((t) => [t.properties.id, t]));
  const containment: Record<string, string[]> = {};
  for (const p of PLACES) {
    containment[p.id] = territories
      .filter((t) => pointInGeometry([p.lng, p.lat], t.geometry))
      .map((t) => t.properties.id);
  }
  return { territories, territoryById, containment };
}

export function territoryActive(t: number, props: TerritoryProps): boolean {
  return isActive(t, props.start, props.end);
}

export function activeOccupation(place: Place, t: number): OccupationPeriod | undefined {
  return place.occupations?.find((o) => isActive(t, o.from, o.to));
}

export interface PlaceState {
  status: PlaceStatus;
  /** The territory or occupation that produced the status. */
  territoryId?: string;
  occupation?: OccupationPeriod;
}

export function placeState(place: Place, t: number, model: HistoryModel): PlaceState {
  const occ = activeOccupation(place, t);
  let best: PlaceState = { status: "free" };
  let bestRank = STATUS_PRIORITY.length;
  for (const id of model.containment[place.id] ?? []) {
    const terr = model.territoryById[id];
    if (!terr || !territoryActive(t, terr.properties)) continue;
    const s = CATEGORY_TO_STATUS[terr.properties.category];
    const rank = STATUS_PRIORITY.indexOf(s);
    if (rank < bestRank) {
      best = { status: s, territoryId: id };
      bestRank = rank;
    }
  }
  if (occ) {
    const occRank = STATUS_PRIORITY.indexOf("occupied");
    if (occRank <= bestRank || best.status === "sphere" || best.status === "foreign" || best.status === "protectorate") {
      return { status: "occupied", occupation: occ };
    }
  }
  return best;
}

// ───────────────────────── Railways ─────────────────────────

export interface RailSegment {
  id: string;
  railwayId: string;
  from: string;
  to: string;
  opened: string;
  coords: [LngLat, LngLat];
}

export const RAIL_SEGMENTS: RailSegment[] = RAILWAYS.flatMap((r) =>
  r.nodes.slice(1).map((to, i) => {
    const from = r.nodes[i];
    const a = PLACE_BY_ID[from];
    const b = PLACE_BY_ID[to];
    if (!a || !b) throw new Error(`Railway ${r.id}: unknown node ${!a ? from : to}`);
    return {
      id: `${r.id}:${i}`,
      railwayId: r.id,
      from,
      to,
      opened: r.segmentOpened?.[i] ?? r.opened,
      coords: [
        [a.lng, a.lat],
        [b.lng, b.lat],
      ] as [LngLat, LngLat],
    };
  }),
);

const RAILWAY_BY_ID = Object.fromEntries(RAILWAYS.map((r) => [r.id, r]));

export interface SegmentState {
  open: boolean;
  controller: RailController | null;
  japanese: boolean;
}

/** `statusOf` lets callers pass place statuses they already computed for this `t`. */
export function segmentState(
  seg: RailSegment,
  t: number,
  model: HistoryModel,
  statusOf: (placeId: string) => PlaceStatus = (id) => placeState(PLACE_BY_ID[id], t, model).status,
): SegmentState {
  const r = RAILWAY_BY_ID[seg.railwayId];
  const open = t >= toYear(seg.opened);
  if (!open) return { open: false, controller: null, japanese: false };
  const ctl = r.control.find((c) => isActive(t, c.from, c.to))?.by ?? null;
  let japanese = ctl === "japan";
  if (!japanese && r.capturable) {
    const a = statusOf(seg.from);
    const b = statusOf(seg.to);
    japanese = JAPANESE_HELD.has(a) && JAPANESE_HELD.has(b);
  }
  return { open, controller: japanese ? "japan" : ctl, japanese };
}

// ───────────────────────── Advances ─────────────────────────

const resolvePath = (a: Advance): LngLat[] =>
  smoothLine(
    a.path.map((p) => {
      if (typeof p !== "string") return p;
      const pl = PLACE_BY_ID[p];
      if (!pl) throw new Error(`Advance ${a.id}: unknown place ${p}`);
      return [pl.lng, pl.lat] as LngLat;
    }),
    2,
  );

export const ADVANCE_PATHS: Record<string, LngLat[]> = Object.fromEntries(ADVANCES.map((a) => [a.id, resolvePath(a)]));

/** How long (years) a completed arrow lingers before fading out. */
const ADVANCE_LINGER = 0.9;
const ADVANCE_LEAD = 0.04;

export interface AdvanceFrame {
  advance: Advance;
  coords: LngLat[];
  head: LngLat;
  headBearing: number;
  opacity: number;
  progress: number;
}

export function advanceFrame(a: Advance, t: number): AdvanceFrame | null {
  const s = toYear(a.start);
  const e = toYear(a.end);
  if (t < s - ADVANCE_LEAD || t > e + ADVANCE_LINGER) return null;
  const progress = Math.min(1, Math.max(0.02, (t - s) / Math.max(e - s, 0.01)));
  const opacity = t <= e ? 1 : Math.max(0.1, 1 - (t - e) / ADVANCE_LINGER);
  const full = ADVANCE_PATHS[a.id];
  const coords = sliceLine(full, progress);
  const head = coords[coords.length - 1];
  const prev = coords.length > 1 ? coords[coords.length - 2] : full[0];
  return { advance: a, coords, head, headBearing: bearing(prev, head), opacity, progress };
}

// ───────────────────────── Events ─────────────────────────

export type EventPhase = "future" | "current" | "past";

export function eventPhase(ev: HistoricalEvent, t: number): EventPhase {
  const s = toYear(ev.date);
  const e = toYear(ev.endDate ?? ev.date);
  if (t < s - 0.02) return "future";
  if (t <= e + 0.6) return "current";
  return "past";
}

export function eventsAt(placeId: string): HistoricalEvent[] {
  return EVENTS.filter((e) => e.placeIds.includes(placeId));
}

/** Latest event that started on/before t (used for the timeline caption). */
export function latestEvent(t: number, majorOnly = false): HistoricalEvent | undefined {
  let found: HistoricalEvent | undefined;
  for (const e of EVENTS) {
    if (majorOnly && !e.major) continue;
    if (toYear(e.date) <= t + 1e-6) found = e;
  }
  return found;
}

export function activeRegimes(t: number) {
  return REGIMES.filter((r) => isActive(t, r.from, r.to));
}
