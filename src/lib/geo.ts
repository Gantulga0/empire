import type { LngLat } from "@/types/history";

type Ring = number[][];
type PolygonCoords = Ring[];

function pointInRing(x: number, y: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function pointInPolygonCoords(x: number, y: number, poly: PolygonCoords): boolean {
  if (!poly?.[0]?.length || !pointInRing(x, y, poly[0])) return false;
  for (let h = 1; h < poly.length; h++) if (pointInRing(x, y, poly[h])) return false;
  return true;
}

export function pointInGeometry(pt: LngLat, geom: GeoJSON.Geometry): boolean {
  const [x, y] = pt;
  if (geom.type === "Polygon") return pointInPolygonCoords(x, y, geom.coordinates as PolygonCoords);
  if (geom.type === "MultiPolygon")
    return (geom.coordinates as PolygonCoords[]).some((p) => pointInPolygonCoords(x, y, p));
  return false;
}

/** Initial bearing in degrees (clockwise from north) between two points. */
export function bearing(a: LngLat, b: LngLat): number {
  const toR = Math.PI / 180;
  const φ1 = a[1] * toR;
  const φ2 = b[1] * toR;
  const Δλ = (b[0] - a[0]) * toR;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** Approximate planar distance, scaled for latitude — adequate for schematic lines. */
function segLen(a: LngLat, b: LngLat): number {
  const k = Math.cos((((a[1] + b[1]) / 2) * Math.PI) / 180);
  const dx = (b[0] - a[0]) * k;
  const dy = b[1] - a[1];
  return Math.hypot(dx, dy);
}

/** Smooth a polyline with Chaikin corner-cutting (keeps endpoints). */
export function smoothLine(pts: LngLat[], iterations = 2): LngLat[] {
  let out = pts;
  for (let it = 0; it < iterations; it++) {
    if (out.length < 3) return out;
    const next: LngLat[] = [out[0]];
    for (let i = 0; i < out.length - 1; i++) {
      const [x0, y0] = out[i];
      const [x1, y1] = out[i + 1];
      next.push([x0 * 0.75 + x1 * 0.25, y0 * 0.75 + y1 * 0.25]);
      next.push([x0 * 0.25 + x1 * 0.75, y0 * 0.25 + y1 * 0.75]);
    }
    next.push(out[out.length - 1]);
    out = next;
  }
  return out;
}

/** Return the first `fraction` (0–1) of a polyline by length. */
export function sliceLine(pts: LngLat[], fraction: number): LngLat[] {
  if (fraction >= 1) return pts;
  if (fraction <= 0 || pts.length < 2) return [pts[0], pts[0]];
  const lens = pts.slice(1).map((p, i) => segLen(pts[i], p));
  const total = lens.reduce((s, l) => s + l, 0);
  let remaining = total * fraction;
  const out: LngLat[] = [pts[0]];
  for (let i = 0; i < lens.length; i++) {
    if (remaining >= lens[i]) {
      out.push(pts[i + 1]);
      remaining -= lens[i];
    } else {
      const f = remaining / lens[i];
      const a = pts[i];
      const b = pts[i + 1];
      out.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]);
      break;
    }
  }
  return out;
}
