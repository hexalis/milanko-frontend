const LOCALE = "es-CL";
const EMPTY = "—";

type Numeric = number | string | null | undefined;

function toFiniteNumber(value: Numeric): number | null {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

/** Formats a number for the UI; returns an em dash when the value is missing. */
export function formatNumber(value: Numeric, maximumFractionDigits = 2): string {
  const number = toFiniteNumber(value);
  if (number === null) return EMPTY;
  return number.toLocaleString(LOCALE, { maximumFractionDigits });
}

/** Like formatNumber, with an explicit "+" for positive values. */
export function formatSigned(value: Numeric, maximumFractionDigits = 2): string {
  const number = toFiniteNumber(value);
  if (number === null) return EMPTY;
  return `${number > 0 ? "+" : ""}${formatNumber(number, maximumFractionDigits)}`;
}

/** Joins a formatted value with its unit, omitting the unit when there is no value. */
export function withUnit(formatted: string, unit: string | null | undefined): string {
  if (formatted === EMPTY || !unit) return formatted;
  return `${formatted} ${unit}`;
}
