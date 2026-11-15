/** One persisted observation (GET /regions/{code}/observations). */
export type Observation = {
  variable: string;
  date: string;
  value?: number | null;
  unit?: string | null;
  quality: string;
  valid_fraction?: number | null;
};

export type SeriesPoint = { date: string; value: number };

export type Series = {
  points: SeriesPoint[];
  isMonthlyMean: boolean;
};

/** Above this many points the chart shows monthly means instead of daily values. */
const MAX_DAILY_POINTS = 1200;

function hasValue(observation: Observation): observation is Observation & { value: number } {
  return typeof observation.value === "number" && Number.isFinite(observation.value);
}

export function toSeries(observations: readonly Observation[]): Series {
  const points = observations
    .filter(hasValue)
    .map((observation) => ({ date: observation.date, value: observation.value }));
  if (points.length <= MAX_DAILY_POINTS) return { points, isMonthlyMean: false };

  const months = new Map<string, { total: number; count: number }>();
  for (const point of points) {
    const key = point.date.slice(0, 7);
    const bucket = months.get(key) ?? { total: 0, count: 0 };
    months.set(key, { total: bucket.total + point.value, count: bucket.count + 1 });
  }
  return {
    points: [...months.entries()]
      .toSorted(([a], [b]) => a.localeCompare(b))
      .map(([month, bucket]) => ({ date: `${month}-01`, value: bucket.total / bucket.count })),
    isMonthlyMean: true,
  };
}

export type SeriesSummary = {
  count: number;
  firstDate?: string;
  lastDate?: string;
  latest?: Observation & { value: number };
  mean?: number;
  min?: number;
  max?: number;
  numericCount: number;
};

export function summarizeObservations(observations: readonly Observation[]): SeriesSummary {
  const numeric = observations.filter(hasValue);
  const values = numeric.map((observation) => observation.value);
  return {
    count: observations.length,
    firstDate: observations[0]?.date,
    lastDate: observations.at(-1)?.date,
    latest: numeric.at(-1),
    mean: values.length
      ? values.reduce((total, value) => total + value, 0) / values.length
      : undefined,
    min: values.length ? Math.min(...values) : undefined,
    max: values.length ? Math.max(...values) : undefined,
    numericCount: values.length,
  };
}

const CSV_COLUMNS = ["date", "variable", "value", "unit", "quality", "valid_fraction"] as const;

function csvCell(value: unknown): string {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function toObservationsCsv(observations: readonly Observation[]): string {
  const rows = observations.map((observation) =>
    CSV_COLUMNS.map((column) => csvCell(observation[column])).join(","),
  );
  return [CSV_COLUMNS.join(","), ...rows].join("\n") + "\n";
}
