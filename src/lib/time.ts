import type { DatePrecision, ISODate } from "@/types/history";

export const TIME_MIN = 1894;
export const TIME_MAX = 1945.999;

const cache = new Map<string, number>();

/** Convert an ISO date to a decimal year (1937-07-07 → 1937.514…). */
export function toYear(iso: ISODate): number {
  const hit = cache.get(iso);
  if (hit !== undefined) return hit;
  const [y, m = 1, d = 1] = iso.split("-").map(Number);
  const start = Date.UTC(y, 0, 1);
  const next = Date.UTC(y + 1, 0, 1);
  const v = y + (Date.UTC(y, m - 1, d) - start) / (next - start);
  cache.set(iso, v);
  return v;
}

export function clampTime(t: number): number {
  return Math.min(TIME_MAX, Math.max(TIME_MIN, t));
}

export function isActive(t: number, from?: ISODate, to?: ISODate): boolean {
  if (from && t < toYear(from)) return false;
  if (to && t >= toYear(to)) return false;
  return true;
}

/** Decimal year → { year, month (1-12), day }. */
export function fromYear(t: number): { year: number; month: number; day: number } {
  const year = Math.floor(t);
  const start = Date.UTC(year, 0, 1);
  const next = Date.UTC(year + 1, 0, 1);
  const d = new Date(start + (t - year) * (next - start));
  return { year, month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

export const MONTHS_MN = [
  "1-р сар",
  "2-р сар",
  "3-р сар",
  "4-р сар",
  "5-р сар",
  "6-р сар",
  "7-р сар",
  "8-р сар",
  "9-р сар",
  "10-р сар",
  "11-р сар",
  "12-р сар",
];

/** Mongolian date formatting respecting precision, e.g. "1937.12.13" or "1938 оны 2-р сар". */
export function formatDate(iso: ISODate, precision: DatePrecision = "day"): string {
  const [y, m, d] = iso.split("-");
  if (precision === "year") return `${y} он`;
  if (precision === "month") return `${y} оны ${Number(m)}-р сар`;
  return `${y}.${m}.${d}`;
}

export function formatRange(from: ISODate, to: ISODate | undefined, precision: DatePrecision = "day"): string {
  if (!to) return formatDate(from, precision);
  return `${formatDate(from, precision)} – ${formatDate(to, "day")}`;
}

export function formatTimeLabel(t: number): { year: string; month: string } {
  const { year, month } = fromYear(t);
  return { year: String(year), month: MONTHS_MN[month - 1] };
}
