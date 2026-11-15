/** A POC geodesic region, as returned by the API. */
export type Region = {
  code: number;
  name: string;
  lat?: number | null;
  lon?: number | null;
  area_km2?: number | null;
};

export function formatRegionCode(code: number): string {
  return String(code).padStart(3, "0");
}

export function regionLabel(region: Pick<Region, "code" | "name">): string {
  return `${formatRegionCode(region.code)} · ${region.name}`;
}

/** Parses a region code from the URL, accepting only codes that exist. */
export function pickRegion(
  regions: readonly Region[],
  requested: string | undefined,
): Region | undefined {
  const code = requested && /^\d+$/.test(requested) ? Number(requested) : undefined;
  return regions.find((region) => region.code === code) ?? regions[0];
}

/** An EONET event linked to a region (GET /regions/{code}/events). */
export type RegionEvent = {
  id: string;
  title: string;
  category?: string | null;
  first_date?: string | null;
  last_date?: string | null;
  n_geometries: number;
};

/** Last valid value of one variable in a region (GET /regions/{code}/latest). */
export type LatestVariable = {
  variable: string;
  source: string;
  name: string;
  unit?: string | null;
  date: string;
  value?: number | null;
  quality: string;
};
