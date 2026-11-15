export const RANKING_METRICS = ["anomaly", "value", "trend"] as const;
export type RankingMetric = (typeof RANKING_METRICS)[number];

export const RANKING_ORDERS = ["desc", "asc"] as const;
export type RankingOrder = (typeof RANKING_ORDERS)[number];

export const RANKING_LIMITS = ["10", "20", "50"] as const;
type RankingLimit = (typeof RANKING_LIMITS)[number];

export const RANKING_METRIC_LABELS: Record<RankingMetric, string> = {
  anomaly: "Anomalía mensual",
  value: "Valor actual",
  trend: "Tendencia",
};

export const RANKING_ORDER_LABELS: Record<RankingOrder, string> = {
  desc: "Mayor primero",
  asc: "Menor primero",
};

export type RankingQuery = {
  variable: string;
  metric: RankingMetric;
  order: RankingOrder;
  limit: RankingLimit;
  /** Ignored by the API for the trend metric. */
  date?: string;
};

/** One region of GET /regions/rankings. */
export type RankingRow = {
  code: number;
  name: string;
  value?: number | null;
  date?: string | null;
  anomaly?: number | null;
  slope_per_year?: number | null;
  r2?: number | null;
  n_months?: number | null;
};

export type Ranking = {
  variable: string;
  source: string;
  unit?: string | null;
  metric: string;
  order: string;
  date?: string | null;
  count: number;
  total: number;
  regions: RankingRow[];
};

export function metricValue(row: RankingRow, metric: RankingMetric): number | null | undefined {
  if (metric === "anomaly") return row.anomaly;
  if (metric === "trend") return row.slope_per_year;
  return row.value;
}

export function metricUnit(metric: RankingMetric, unit: string | null | undefined): string {
  if (metric === "trend") return `${unit ?? ""}/año`;
  return unit ?? "";
}

export type RankingBar = {
  row: RankingRow;
  value: number;
  widthPercent: number;
  isNegative: boolean;
};

const MIN_BAR_PERCENT = 1;

/** Bar widths relative to the largest absolute value in the ranking. */
export function rankingBars(rows: readonly RankingRow[], metric: RankingMetric): RankingBar[] {
  const values = rows.map((row) => Number(metricValue(row, metric)) || 0);
  const max = Math.max(...values.map(Math.abs), 0.0001);
  return rows.map((row, index) => {
    const value = values[index] ?? 0;
    return {
      row,
      value,
      widthPercent: Math.max(MIN_BAR_PERCENT, (Math.abs(value) / max) * 100),
      isNegative: value < 0,
    };
  });
}
