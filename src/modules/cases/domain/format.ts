import type { Locale, Translator } from "@/shared/lib/i18n";

/*
 * Number wording of the case files, ported from the POC's app.js helpers so figures read the same:
 * a true minus sign, "+" only when asked, and the decimals each variable carries.
 */

const MINUS = "−";

export function formatFigure(
  value: number | null | undefined,
  digits: number,
  isSigned = false,
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const text = Math.abs(value) < 10 ** -(digits + 1) ? (0).toFixed(digits) : value.toFixed(digits);
  return isSigned && value > 0 ? `+${text}` : text.replace("-", MINUS);
}

export function formatP(p: number): string {
  return p < 0.001 ? "< 0.001" : `= ${p.toFixed(3)}`;
}

const RARE_P = 0.001;
const SIGNIFICANCE = 0.05;

/** p as plain odds: "about 1 time in 300". */
export function formatOdds(p: number, { t, locale }: Translator): string {
  if (p < RARE_P) return t("odds.lt1000");
  if (p < SIGNIFICANCE) return t("odds.n", { n: Math.round(1 / p).toLocaleString(locale) });
  return t("odds.high", { pct: Math.round(p * 100) });
}

/** Data files write units in English ("mm/day"); Spanish reads "mm/día". The 0–1 soil index has no unit. */
export function unitLabel(unit: string, locale: Locale): string {
  if (unit === "0–1") return "";
  return locale === "es" ? unit.replace("/day", "/día") : unit;
}

/** Beside a variable name: no unit when the name already carries it ("Vegetation greenness (NDVI)"). */
export function variableUnit(unit: string, locale: Locale): string {
  return unit === "NDVI" ? "" : unitLabel(unit, locale);
}

export function formatCoordinates(lat: number, lon: number): string {
  return `${Math.abs(lat).toFixed(1)}° ${lat >= 0 ? "N" : "S"}, ${Math.abs(lon).toFixed(1)}° ${lon >= 0 ? "E" : "W"}`;
}

export function formatDate(iso: string, locale: Locale): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
