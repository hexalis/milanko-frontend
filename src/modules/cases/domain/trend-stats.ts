/*
 * Trend statistics: Mann-Kendall test and Theil-Sen slope with its 95 % interval.
 * Ported from the POC's stats.js (same math as its scripts/trend.py). x = years, y = values, no gaps.
 */

export type Strength = "strong" | "moderate" | "weak";

export type MannKendall = { s: number; z: number; p: number; tau: number };

export type SenSlope = { slope: number; intercept: number; slopeLow: number; slopeHigh: number };

export type TrendAnalysis = MannKendall &
  SenSlope & {
    n: number;
    mean: number;
    /** Change over the whole record along the Sen line. */
    total: number;
    /** Year-to-year noise: standard deviation around the trend line. */
    noise: number;
    perDecade: number;
    /** Total change measured in years of noise. */
    snr: number;
    significant: boolean;
    strength: Strength;
  };

const MIN_POINTS = 8;
export const SIGNIFICANCE = 0.05;
export const STRONG_EVIDENCE = 0.01;
/** z for a two-sided 95 % interval. */
const Z_95 = 1.96;

export function median(values: readonly number[]): number {
  const sorted = values.toSorted((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? (sorted[middle] ?? Number.NaN)
    : ((sorted[middle - 1] ?? Number.NaN) + (sorted[middle] ?? Number.NaN)) / 2;
}

/** Standard normal CDF (Abramowitz-Stegun erf approximation). */
function normCdf(z: number): number {
  const t = 1 / (1 + (0.3275911 * Math.abs(z)) / Math.SQRT2);
  const erf =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-(z * z) / 2);
  return z >= 0 ? (1 + erf) / 2 : (1 - erf) / 2;
}

export function mannKendall(y: readonly number[]): MannKendall {
  const n = y.length;
  let s = 0;
  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) s += Math.sign((y[j] ?? 0) - (y[i] ?? 0));
  }
  const counts = new Map<number, number>();
  for (const value of y) counts.set(value, (counts.get(value) ?? 0) + 1);
  let ties = 0;
  for (const count of counts.values()) {
    if (count > 1) ties += count * (count - 1) * (2 * count + 5);
  }
  const variance = (n * (n - 1) * (2 * n + 5) - ties) / 18;
  const z = s > 0 ? (s - 1) / Math.sqrt(variance) : s < 0 ? (s + 1) / Math.sqrt(variance) : 0;
  return { s, z, p: 2 * (1 - normCdf(Math.abs(z))), tau: s / ((n * (n - 1)) / 2) };
}

export function senSlope(x: readonly number[], y: readonly number[]): SenSlope {
  const slopes: number[] = [];
  for (let i = 0; i < x.length - 1; i++) {
    for (let j = i + 1; j < x.length; j++) {
      slopes.push(((y[j] ?? 0) - (y[i] ?? 0)) / ((x[j] ?? 0) - (x[i] ?? 0)));
    }
  }
  slopes.sort((a, b) => a - b);
  const slope = median(slopes);
  // 95 % interval (Gilbert 1987).
  const n = y.length;
  const c = Z_95 * Math.sqrt((n * (n - 1) * (2 * n + 5)) / 18);
  const lower = Math.round((slopes.length - c) / 2);
  const upper = Math.round((slopes.length + c) / 2);
  return {
    slope,
    intercept: median(y) - slope * median(x),
    slopeLow: slopes[Math.max(0, lower - 1)] ?? slope,
    slopeHigh: slopes[Math.min(slopes.length - 1, upper)] ?? slope,
  };
}

/** Full trend reading; null below 8 points, where the test says nothing useful. */
export function analyzeTrend(x: readonly number[], y: readonly number[]): TrendAnalysis | null {
  if (x.length < MIN_POINTS) return null;
  const mk = mannKendall(y);
  const sen = senSlope(x, y);
  const mean = y.reduce((sum, value) => sum + value, 0) / y.length;
  const total = sen.slope * ((x.at(-1) ?? 0) - (x[0] ?? 0));
  const residuals = y.map((value, index) => value - (sen.intercept + sen.slope * (x[index] ?? 0)));
  const noise = Math.sqrt(
    residuals.reduce((sum, residual) => sum + residual * residual, 0) /
      Math.max(1, residuals.length - 2),
  );
  return {
    ...mk,
    ...sen,
    n: x.length,
    mean,
    total,
    noise,
    perDecade: sen.slope * 10,
    snr: noise ? Math.abs(total) / noise : 0,
    significant: mk.p < SIGNIFICANCE,
    strength: mk.p < STRONG_EVIDENCE ? "strong" : mk.p < SIGNIFICANCE ? "moderate" : "weak",
  };
}
