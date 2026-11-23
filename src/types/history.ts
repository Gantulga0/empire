/** ISO calendar date, e.g. "1937-12-13". */
export type ISODate = string;

/** How precisely a date is known. Drives how it is displayed. */
export type DatePrecision = "day" | "month" | "year";

export type LngLat = [number, number];

export interface Source {
  id: string;
  /** Full bibliographic reference. */
  citation: string;
  kind: "primary" | "scholarly" | "reference" | "dataset";
  url?: string;
  note?: string;
}

/**
 * Legal / political type of an area. These are deliberately distinct:
 * a formal colony (Taiwan) is not the same thing as a puppet state (Manchukuo),
 * a leased territory (Kwantung) or a sphere of influence (Fujian).
 */
export type TerritoryCategory =
  | "japan" // Japanese home islands (context)
  | "colony" // formally annexed / ceded territory
  | "ceded-returned" // ceded by treaty but retroceded (Liaodong 1895)
  | "protectorate" // Korea 1905–1910
  | "leased" // Japanese-leased territory (Kwantung)
  | "foreign-lease" // territory leased to another power (context)
  | "puppet" // nominally independent state controlled by Japan
  | "occupied" // military occupation
  | "sphere"; // claimed sphere of influence / special interests

export type LayerKey =
  | "colony"
  | "occupied"
  | "puppet"
  | "sphere"
  | "ports"
  | "railways"
  | "events"
  | "advances";

export type BaseLayerKey = "relief" | "modernBorders" | "rivers" | "labels";

/** Geometry lives in public/data/territories.json; this is the descriptive half. */
export interface TerritoryInfo {
  id: string;
  name: string;
  /** Short legal / political status line. */
  status: string;
  summary: string;
  sourceIds: string[];
}

export interface TerritoryProps {
  id: string;
  category: TerritoryCategory;
  start: ISODate;
  end: ISODate;
  approximate: boolean;
  method: string;
}

export interface OccupationPeriod {
  from: ISODate;
  to?: ISODate;
  precision: DatePrecision;
  note?: string;
}

export type PortKind = "treaty-port" | "leased-port" | "colonial-port" | "concession";

export interface Place {
  id: string;
  name: string;
  /** Historical / alternative names, e.g. "Мукден". */
  alt?: string;
  lng: number;
  lat: number;
  /** 1 = always visible, 2 = regional zoom, 3 = close zoom (railway nodes, minor sites). */
  tier: 1 | 2 | 3;
  kind: "city" | "capital" | "site";
  /** Explicit Japanese military occupation periods. */
  occupations?: OccupationPeriod[];
  port?: { kind: PortKind; label: string; from?: ISODate; to?: ISODate };
  /** Short description (1–2 sentences). */
  note?: string;
  /** Coordinates are approximate (e.g. naval battle area). */
  approximate?: boolean;
}

export interface CameraView {
  center: LngLat;
  zoom: number;
  bearing?: number;
  pitch?: number;
}

export interface HistoricalEvent {
  id: string;
  date: ISODate;
  endDate?: ISODate;
  precision: DatePrecision;
  title: string;
  /** One-line label for the timeline. */
  short: string;
  placeIds: string[];
  summary: string;
  significance: string;
  /** Related treaty / context line. */
  context?: string;
  camera: CameraView;
  /** Territory ids to emphasise when the event is focused. */
  highlight?: string[];
  sourceIds: string[];
  /** Major events get a prominent tick on the timeline. */
  major: boolean;
}

export type RailController = "japan" | "russia" | "germany" | "china";

export interface Railway {
  id: string;
  name: string;
  /** Ordered station place ids. Segments are drawn as straight lines between them (schematic). */
  nodes: string[];
  opened: ISODate;
  /** Optional per-segment opening dates (length = nodes.length - 1). */
  segmentOpened?: ISODate[];
  control: { from: ISODate; to?: ISODate; by: RailController }[];
  /** Chinese lines that changed hands when both ends were captured. */
  capturable?: boolean;
  note: string;
  sourceIds: string[];
}

export interface Advance {
  id: string;
  name: string;
  start: ISODate;
  end: ISODate;
  /** Ordered place ids (or literal coordinates for landing points at sea). */
  path: (string | LngLat)[];
  note: string;
  sourceIds: string[];
}

export interface Regime {
  id: string;
  name: string;
  seatPlaceId: string;
  from: ISODate;
  to: ISODate;
  summary: string;
  sourceIds: string[];
}

export interface MapLabel {
  id: string;
  text: string;
  sub?: string;
  lng: number;
  lat: number;
  kind: "state" | "sea" | "territory";
  from?: ISODate;
  to?: ISODate;
  minZoom?: number;
}

export interface StoryChapter {
  eventId: string;
  /** Timeline value the chapter animates from (defaults to the previous position). */
  timeFrom?: ISODate;
  /** Timeline value the chapter lands on. */
  time: ISODate;
  camera: CameraView;
}

export type Selection =
  | { kind: "place"; id: string }
  | { kind: "territory"; id: string }
  | { kind: "event"; id: string }
  | { kind: "regime"; id: string }
  | null;
