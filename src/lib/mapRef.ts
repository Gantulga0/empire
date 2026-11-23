import type { Map as MLMap } from "maplibre-gl";

/** Shared handle to the live MapLibre instance for imperative controls (zoom buttons). */
export const mapRef: { current: MLMap | null } = { current: null };
