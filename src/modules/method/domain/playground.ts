import { analyzeTrend, trendDirection, type Point } from "@/modules/cases";
import { noiseDraws } from "./noise-lab";

/*
 * The data playground: one of the real yearly series of the case files, rebuilt from its parts so
 * the reader can change each one and see what the same Mann-Kendall / Theil-Sen test then says.
 * A series is read as its Sen line plus what is left around it (the year-to-year noise):
 *   measured   the line and the measured leftovers, so with no change it is the real record;
 *   invented   a flat line at the record's mean with made-up noise of the same size (seeded),
 *              to build a variable from nothing and see whether the test invents a trend.
 * Then: an added trend (per decade, turning about the record's middle), the noise scaled, an
 * extreme year added, and the record cut to its last years.
 */

export type PlaygroundStart = "measured" | "invented";

export type PlaygroundEdit = {
  start: PlaygroundStart;
  /** Added change per decade, in the variable's unit. */
  trend: number;
  /** The year-to-year noise times this: 1 as measured, 0 none. */
  noise: number;
  /** Only the last years of the record. */
  years: number;
  spikeYear: number;
  /** The extreme year, in years of noise (standard deviations): 0 for none. */
  spikeSize: number;
  seed: number;
};

type Limits = { min: number; max: number; step: number };

export type PlaygroundLimits = {
  trend: Limits;
  noise: Limits;
  years: Limits;
  spikeYear: Limits;
  spikeSize: Limits;
};

/** The test needs at least eight years; ten keeps it honest. */
const MIN_YEARS = 10;
const MAX_NOISE = 3;
const MAX_SPIKE = 6;
/** The added trend reaches this many times the larger of the record's trend and its noise. */
const TREND_REACH = 2;
const TREND_STEPS = 40;

/** Physical bounds: a share stays in 0–1, greenness in −1–1 and rain is never negative. */
const BOUNDS: Readonly<Record<string, readonly [number, number]>> = {
  "0–1": [0, 1],
  NDVI: [-1, 1],
  "mm/day": [0, Number.POSITIVE_INFINITY],
};

/** 1, 2 or 5 times a power of ten, the nearest at or below `value`. */
export function niceStep(value: number): number {
  if (!(value > 0)) return 1;
  const power = 10 ** Math.floor(Math.log10(value));
  const scaled = value / power;
  return (scaled >= 5 ? 5 : scaled >= 2 ? 2 : 1) * power;
}

function analyze(data: readonly Point[]) {
  return analyzeTrend(
    data.map(([year]) => year),
    data.map(([, value]) => value),
  );
}

export function playgroundLimits(series: readonly Point[]): PlaygroundLimits {
  const fit = analyze(series);
  const reach = TREND_REACH * Math.max(Math.abs(fit?.perDecade ?? 0), fit?.noise ?? 0, 1e-6);
  const step = niceStep(reach / TREND_STEPS);
  const max = Math.ceil(reach / step) * step;
  const first = series[0]?.[0] ?? 0;
  const last = series.at(-1)?.[0] ?? first;
  return {
    trend: { min: -max, max, step },
    noise: { min: 0, max: MAX_NOISE, step: 0.1 },
    years: { min: Math.min(MIN_YEARS, series.length), max: series.length, step: 1 },
    spikeYear: { min: first, max: last, step: 1 },
    spikeSize: { min: -MAX_SPIKE, max: MAX_SPIKE, step: 0.5 },
  };
}

/** The series as measured, with nothing changed. */
export function initialEdit(series: readonly Point[], seed: number): PlaygroundEdit {
  const last = series.at(-1)?.[0] ?? 0;
  return {
    start: "measured",
    trend: 0,
    noise: 1,
    years: series.length,
    spikeYear: last,
    spikeSize: 0,
    seed,
  };
}

export function isUnchanged(edit: PlaygroundEdit, series: readonly Point[]): boolean {
  return (
    edit.start === "measured" &&
    edit.trend === 0 &&
    edit.noise === 1 &&
    edit.years >= series.length &&
    edit.spikeSize === 0
  );
}

const clampTo = (unit: string) => {
  const [low, high] = BOUNDS[unit] ?? [Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY];
  return (value: number) => Math.min(high, Math.max(low, value));
};

/** The reader's version of the series. */
export function editSeries(series: readonly Point[], edit: PlaygroundEdit, unit = ""): Point[] {
  const fit = analyze(series);
  if (!fit) return [...series];
  const years = series.map(([year]) => year);
  const middle = ((years[0] ?? 0) + (years.at(-1) ?? 0)) / 2;
  // The generator's first draw from a small seed is extreme (its first uniform is near 0): skip it.
  const draws = noiseDraws(edit.seed, series.length + 1).slice(1);
  const clamp = clampTo(unit);
  const edited = series.map(([year, value], index): Point => {
    const line = fit.intercept + fit.slope * year;
    const base =
      edit.start === "measured"
        ? line + edit.noise * (value - line)
        : fit.mean + edit.noise * fit.noise * (draws[index] ?? 0);
    const added = (edit.trend / 10) * (year - middle);
    const spike = year === edit.spikeYear ? edit.spikeSize * fit.noise : 0;
    return [year, clamp(base + added + spike)];
  });
  return edited.slice(Math.max(0, edited.length - edit.years));
}

export function readSeries(data: readonly Point[]) {
  const trend = analyze(data);
  return {
    data,
    trend,
    direction: trendDirection(trend),
    verdict: trend?.significant ? ("confirmed" as const) : ("inconclusive" as const),
  };
}

export type SeriesReading = ReturnType<typeof readSeries>;
