import { analyzeTrend, type Strength, type TrendAnalysis } from "./trend-stats";

/*
 * Two kinds of file share the archive (as in the POC's app.js):
 * - trend files: a long yearly series tested with Mann-Kendall (data/cases.json);
 * - anomaly files: an EONET event and how unusual its 90-day run-up was in NASA POWER (data/event-files.json).
 * The helpers below hide the difference so the archive and the dossier can treat them alike.
 */

export type Point = readonly [year: number, value: number];
export type Direction = "up" | "down" | "flat";
export type Verdict = "confirmed" | "inconclusive";
export type EventVariable = "tmax" | "rain" | "soil";

export type TrendCaseRecord = {
  id: string;
  region: string;
  catalog: string;
  publishedAt: string;
  theme: string;
  source: string;
  variable: string;
  unit: string;
  lat: number;
  lon: number;
  digits: number;
  relative: boolean;
  series: Point[];
  pair?: string;
  months?: number[];
  context?: Record<string, number | string>;
};

export type TrendCase = TrendCaseRecord & {
  kind: "trend";
  /** Recomputed from the series, as the POC did in the browser. */
  t: TrendAnalysis;
};

export type EventVariableReading = {
  value: number;
  mean: number;
  z: number;
  percentile: number;
  /** 1 = highest of all the years compared. */
  rank: number;
  /** Years compared, including the event year. */
  years: number;
  from: number;
  series: Point[];
  trend?: {
    p: number;
    perDecade: number;
    slope: number;
    intercept: number;
    slopeLow: number;
    slopeHigh: number;
  };
};

export type EventFileRecord = {
  id: string;
  eonet: string;
  region: string;
  category: string;
  title: string;
  date: string;
  closed?: string | null;
  lat: number;
  lon: number;
  magnitude?: number | null;
  unit?: string;
  source?: { id: string; url: string };
  link?: string;
  sectorCount?: number;
  vars: Partial<Record<EventVariable, EventVariableReading>>;
  lead: EventVariable;
  strength: Strength;
  anomalous: boolean;
  publishedAt: string;
  catalog: string;
};

export type EventFile = Omit<EventFileRecord, "kind"> & {
  kind: "event";
  /** The lead variable's reading (the one that tells the story). */
  lv: EventVariableReading;
  /** Event family, for icons and colors. */
  family: EventFamily;
};

export type CaseFile = TrendCase | EventFile;

export type EventFamily = "fire" | "storm" | "water" | "ice" | "earth";

const EVENT_FAMILY: Record<string, EventFamily> = {
  wildfires: "fire",
  severeStorms: "storm",
  dustHaze: "storm",
  floods: "water",
  drought: "water",
  waterColor: "water",
  seaLakeIce: "ice",
  snow: "ice",
  tempExtremes: "ice",
  volcanoes: "earth",
  earthquakes: "earth",
  landslides: "earth",
  manmade: "earth",
};

function eventFamily(category: string): EventFamily {
  return EVENT_FAMILY[category] ?? "earth";
}

/* ---------- Loading ---------- */

export function toTrendCase(record: TrendCaseRecord): TrendCase | null {
  const t = analyzeTrend(
    record.series.map(([year]) => year),
    record.series.map(([, value]) => value),
  );
  return t ? { ...record, kind: "trend", t } : null;
}

/** GDACS titles end in their own record number ("Flood in Nigeria 1104186"); it stays in the appendix. */
const RECORD_NUMBER = /\s\d{6,}$/;

export function toEventFile(record: EventFileRecord): EventFile | null {
  const lv = record.vars[record.lead];
  if (!lv) return null;
  return {
    ...record,
    kind: "event",
    title: record.title.replace(RECORD_NUMBER, ""),
    lv,
    family: eventFamily(record.category),
  };
}

/* ---------- Readings shared by both kinds ---------- */

export const isEvent = (file: CaseFile): file is EventFile => file.kind === "event";

/** A significant trend whose Sen slope is exactly 0 (ties) takes the sign of the Mann-Kendall S. */
export function trendDirection(t: TrendAnalysis | null | undefined): Direction {
  if (!t?.significant) return "flat";
  if (t.slope !== 0) return t.slope > 0 ? "up" : "down";
  return t.s > 0 ? "up" : t.s < 0 ? "down" : "flat";
}

export function fileDirection(file: CaseFile): Direction {
  if (!isEvent(file)) return trendDirection(file.t);
  if (file.strength === "weak") return "flat";
  return file.lv.percentile >= 50 ? "up" : "down";
}

export const fileStrength = (file: CaseFile): Strength =>
  isEvent(file) ? file.strength : file.t.strength;

export const fileSeries = (file: CaseFile): readonly Point[] =>
  isEvent(file) ? file.lv.series : file.series;

export const fileTheme = (file: CaseFile): string => (isEvent(file) ? file.category : file.theme);

export const fileSource = (file: CaseFile): string => (isEvent(file) ? "eonet" : file.source);

/** Chance-like figure for sorting: p for trends; for anomalies, how far into the tails the run-up was. */
export function fileP(file: CaseFile): number {
  if (!isEvent(file)) return file.t.p;
  const tail = Math.min(file.lv.percentile, 100 - file.lv.percentile);
  return Math.max(0.001, (2 * tail) / 100);
}

/** Signal against noise: years of noise for trends, |z| for anomalies. */
export const fileSnr = (file: CaseFile): number =>
  isEvent(file) ? Math.abs(file.lv.z) : file.t.snr;

export function verdictOf(file: CaseFile): Verdict {
  if (isEvent(file)) return file.strength === "strong" ? "confirmed" : "inconclusive";
  return file.t.significant ? "confirmed" : "inconclusive";
}

/** Change relative to the mean, for variables where a percentage reads better than a unit. */
export function relativeChange(file: TrendCase): number | null {
  return file.relative && file.t.mean ? (file.t.total / Math.abs(file.t.mean)) * 100 : null;
}

export function period(series: readonly Point[]): { from: number; to: number } {
  return { from: series[0]?.[0] ?? 0, to: series.at(-1)?.[0] ?? 0 };
}

/* ---------- Anomaly wording counts ---------- */

export type RankCount = {
  /** Years compared before the event year. */
  n: number;
  isHigh: boolean;
  /** How many of those years the event year beat. */
  k: number;
  isTop: boolean;
  isBottom: boolean;
};

/** "Hotter than 38 of 45 years" vs "hottest since 1981". */
export function rankCount(reading: Pick<EventVariableReading, "rank" | "years">): RankCount {
  const isHigh = reading.rank <= reading.years / 2;
  return {
    n: reading.years - 1,
    isHigh,
    k: isHigh ? reading.years - reading.rank : reading.rank - 1,
    isTop: reading.rank === 1,
    isBottom: reading.rank === reading.years,
  };
}

export const EVENT_UNITS: Record<EventVariable, { unit: string; digits: number }> = {
  tmax: { unit: "°C", digits: 1 },
  rain: { unit: "mm", digits: 0 },
  soil: { unit: "", digits: 2 },
};
