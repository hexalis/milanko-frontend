import type { Locale } from "@/shared/lib/i18n";
import type { SeriesPoint } from "./series";

/*
 * The region record in words: how unusual a day was, where the series is heading, what "normal"
 * is for each month, and units as people read them. Pure functions, so the screen only lays out.
 */

/** Where a data region sits, as the globe names it (its sector, or open ocean). */
const REGION_PLACES = [
  "arctic",
  "north-america",
  "central-america",
  "south-america",
  "europe",
  "africa",
  "asia",
  "oceania",
  "antarctica",
  "ocean",
] as const;

export type RegionPlace = (typeof REGION_PLACES)[number];

export function readPlace(value: string | undefined): RegionPlace | undefined {
  return REGION_PLACES.find((place) => place === value);
}

/** Standard normal cumulative distribution (Abramowitz and Stegun 7.1.26, error under 1.5e-7). */
function normalCdf(z: number): number {
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const poly =
    t *
    (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  const erf = 1 - poly * Math.exp(-x * x);
  return z >= 0 ? (1 + erf) / 2 : (1 - erf) / 2;
}

/** Below one standard deviation a day is within normal and gets no odds. */
const NORMAL_Z = 1;
/** Rarer than this reads "fewer than 1 in 1,000". */
export const RAREST = 1000;

/**
 * How often a day lands this far from normal on the same side, as "1 in n days", from its z
 * (standard deviations from the baseline for that date). null while it is within normal.
 */
export function oneIn(z: number | null | undefined): number | null {
  if (typeof z !== "number" || !Number.isFinite(z) || Math.abs(z) < NORMAL_Z) return null;
  const tail = 1 - normalCdf(Math.abs(z));
  return Math.min(RAREST, Math.round(1 / tail));
}

const SIGNIFICANCE = 0.05;
const YEARS_PER_DECADE = 10;

/** Sen's slope per year, said per decade, the span people compare climate over. */
export function perDecade(slopePerYear: number): number {
  return slopePerYear * YEARS_PER_DECADE;
}

/** A Mann–Kendall p-value under 0.05: the series does lean one way. */
export function isConfirmed(pValue: number | null | undefined): boolean {
  return typeof pValue === "number" && pValue < SIGNIFICANCE;
}

export type Band = { low: number; high: number };

/** The share of years on each side left out of "normal": 8 years in 10 fall inside the band. */
const BAND_TAIL = 0.1;
/** A month needs this many years before its band means anything. */
const MIN_YEARS = 3;

function quantile(sorted: readonly number[], q: number): number {
  const at = (sorted.length - 1) * q;
  const below = Math.floor(at);
  const above = Math.ceil(at);
  const low = sorted[below] ?? 0;
  const high = sorted[above] ?? low;
  return low + (high - low) * (at - below);
}

/**
 * For monthly means: what each calendar month usually is, as the range 8 years in 10 fall into.
 * One band per point (null when its month has too few years).
 */
export function normalBand(points: readonly SeriesPoint[]): (Band | null)[] {
  const byMonth = new Map<string, number[]>();
  for (const point of points) {
    const month = point.date.slice(5, 7);
    byMonth.set(month, [...(byMonth.get(month) ?? []), point.value]);
  }
  const bands = new Map<string, Band | null>();
  for (const [month, values] of byMonth) {
    const sorted = values.toSorted((a, b) => a - b);
    bands.set(
      month,
      sorted.length < MIN_YEARS
        ? null
        : { low: quantile(sorted, BAND_TAIL), high: quantile(sorted, 1 - BAND_TAIL) },
    );
  }
  return points.map((point) => bands.get(point.date.slice(5, 7)) ?? null);
}

/** API units ("C", "mm/day", "kg m-2") as people read them; indices carry none. */
export function readableUnit(unit: string | null | undefined, locale: Locale): string {
  if (!unit || ["index", "dimensionless", "1", "0–1"].includes(unit)) return "";
  const day = locale === "es" ? "día" : "day";
  const map: Record<string, string> = {
    C: "°C",
    "mm/day": `mm/${day}`,
    "mm/hr": "mm/h",
    "kg m-2": "kg/m²",
    "kg/m2": "kg/m²",
    "W m-2": "W/m²",
    "W/m2": "W/m²",
    "W/m^2": "W/m²",
    "m3/m3": "m³/m³",
    "m3 m-3": "m³/m³",
    "MJ/m^2/day": `MJ/m²/${day}`,
  };
  // Square and cubic metres anywhere else ("mol/m2", "mg/m3").
  return map[unit] ?? unit.replace(/m\^?2(?!\d)/g, "m²").replace(/m\^?3(?!\d)/g, "m³");
}

const SUPERSCRIPT = "⁰¹²³⁴⁵⁶⁷⁸⁹";
/** From a million up, figures read as "3,73 × 10¹⁷" rather than a row of digits. */
const SCIENTIFIC_FROM = 1e6;

/** Numbers in the reader's language ("31,4" or "31.4"), with a true minus sign. */
export function formatFor(
  value: number | null | undefined,
  locale: Locale,
  { digits = 2, signed = false }: { digits?: number; signed?: boolean } = {},
): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  const lang = locale === "es" ? "es-CL" : "en-US";
  const size = Math.abs(value);
  let text: string;
  if (size >= SCIENTIFIC_FROM) {
    const exponent = Math.floor(Math.log10(size));
    const mantissa = (size / 10 ** exponent).toLocaleString(lang, { maximumFractionDigits: 2 });
    const power = [...String(exponent)].map((digit) => SUPERSCRIPT[Number(digit)]).join("");
    text = `${mantissa} × 10${power}`;
  } else {
    text = size.toLocaleString(lang, { maximumFractionDigits: digits });
  }
  if (value < 0 && text !== "0") return `−${text}`;
  return signed && value > 0 ? `+${text}` : text;
}
