/** Monthly Mann–Kendall + Sen trend for one variable (GET /regions/{code}/trends). */
export type RegionTrend = {
  n_months: number;
  sen_slope_per_year?: number | null;
  mann_kendall?: { trend?: string | null; p_value?: number | null } | null;
};

/** One day of the anomaly series (GET /regions/{code}/anomalies). */
export type AnomalyPoint = {
  time: string;
  anomaly?: number | null;
  z?: number | null;
  percentile?: number | null;
};

const MIN_TREND_MONTHS = 12;

export type TrendReading =
  | { kind: "missing" }
  | { kind: "too-short"; months: number }
  | { kind: "ready"; slopePerYear: number; label: string; pValue?: number | null; months: number };

export function readTrend(trend: RegionTrend | null | undefined): TrendReading {
  if (!trend?.n_months) return { kind: "missing" };
  const slope = trend.sen_slope_per_year;
  if (trend.n_months < MIN_TREND_MONTHS || typeof slope !== "number") {
    return { kind: "too-short", months: trend.n_months };
  }
  return {
    kind: "ready",
    slopePerYear: slope,
    label: trend.mann_kendall?.trend ?? "sin tendencia",
    pValue: trend.mann_kendall?.p_value,
    months: trend.n_months,
  };
}

export type AnomalyBar = { time: string; value: number };

/** Anomalies on or after `since`, keeping only numeric values. */
export function recentAnomalies(points: readonly AnomalyPoint[], since: string): AnomalyBar[] {
  return points.flatMap((point) =>
    point.time >= since && typeof point.anomaly === "number" && Number.isFinite(point.anomaly)
      ? [{ time: point.time, value: point.anomaly }]
      : [],
  );
}

export function latestAnomaly(points: readonly AnomalyPoint[]): AnomalyPoint | undefined {
  return points.findLast((point) => typeof point.anomaly === "number");
}

/* ---------- Anomaly calendar ---------- */

/** z is clamped to ±3 and rounded to half steps, so the calendar draws 13 colors. */
const Z_LIMIT = 3;
const Z_STEP = 0.5;

const NEUTRAL: readonly [number, number, number] = [247, 247, 247];
const COLD: readonly [number, number, number] = [33, 102, 172];
const WARM: readonly [number, number, number] = [178, 24, 43];

function mix(from: readonly number[], to: readonly number[], amount: number): string {
  const channels = from.map((value, index) =>
    Math.round(value + ((to[index] ?? value) - value) * amount),
  );
  return `rgb(${channels.join(",")})`;
}

export function zBucket(z: number): number {
  const clamped = Math.max(-Z_LIMIT, Math.min(Z_LIMIT, z));
  return Math.round(clamped / Z_STEP) * Z_STEP;
}

export function zColor(z: number): string {
  return z < 0 ? mix(NEUTRAL, COLD, -z / Z_LIMIT) : mix(NEUTRAL, WARM, z / Z_LIMIT);
}

type CalendarCell = { year: number; dayOfYear: number };

export type CalendarLayout = {
  firstYear: number;
  lastYear: number;
  dayCount: number;
  /** Cells grouped by z bucket so the chart draws one shape per color. */
  buckets: { z: number; color: string; cells: CalendarCell[] }[];
};

function dayOfYear(time: string): number {
  const [year = 0, month = 1, day = 1] = time.split("-").map(Number);
  return Math.floor((Date.UTC(year, month - 1, day) - Date.UTC(year, 0, 1)) / 86_400_000);
}

export function layoutCalendar(points: readonly AnomalyPoint[]): CalendarLayout | undefined {
  const days = points.flatMap((point) =>
    typeof point.z === "number" && Number.isFinite(point.z)
      ? [{ year: Number(point.time.slice(0, 4)), dayOfYear: dayOfYear(point.time), z: point.z }]
      : [],
  );
  if (!days.length) return undefined;

  const buckets = new Map<number, CalendarCell[]>();
  for (const { z, ...cell } of days) {
    const key = zBucket(z);
    buckets.set(key, [...(buckets.get(key) ?? []), cell]);
  }
  const years = days.map((day) => day.year);
  return {
    firstYear: Math.min(...years),
    lastYear: Math.max(...years),
    dayCount: days.length,
    buckets: [...buckets.entries()]
      .toSorted(([a], [b]) => a - b)
      .map(([z, cells]) => ({ z, color: zColor(z), cells })),
  };
}
