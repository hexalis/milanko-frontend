export type SearchParams = Record<string, string | string[] | undefined>;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** First value of a query parameter, trimmed; empty strings become undefined. */
export function readString(params: SearchParams, key: string): string | undefined {
  const raw = params[key];
  const value = (Array.isArray(raw) ? raw[0] : raw)?.trim();
  return value ? value : undefined;
}

/** A YYYY-MM-DD date that is also a real calendar day, or undefined. */
export function readIsoDate(params: SearchParams, key: string): string | undefined {
  const value = readString(params, key);
  if (!value || !ISO_DATE.test(value)) return undefined;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && toIsoDate(date) === value ? value : undefined;
}

/** A non-negative integer, or undefined when missing or invalid. */
export function readNonNegativeInt(params: SearchParams, key: string): number | undefined {
  const value = readString(params, key);
  if (!value || !/^\d+$/.test(value)) return undefined;
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : undefined;
}

/** One of the allowed values, or the fallback. */
export function readOption<T extends string>(
  params: SearchParams,
  key: string,
  options: readonly T[],
  fallback: T,
): T {
  const value = readString(params, key);
  return options.find((option) => option === value) ?? fallback;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** The ISO date `days` days before `from` (UTC). */
export function isoDaysAgo(days: number, from: Date): string {
  const date = new Date(from);
  date.setUTCDate(date.getUTCDate() - days);
  return toIsoDate(date);
}

/** Returns the range with its ends swapped when the start comes after the end. */
export function orderedRange(start: string, end: string): { start: string; end: string } {
  return start <= end ? { start, end } : { start: end, end: start };
}

/** Today as an ISO date (UTC). */
export function todayIsoDate(): string {
  return toIsoDate(new Date());
}

/** The last `days` days up to today, as ISO dates (UTC). */
export function lastDaysRange(days: number, now = new Date()): { start: string; end: string } {
  return { start: isoDaysAgo(days, now), end: toIsoDate(now) };
}

/** Builds a query string from defined values only. */
export function toQueryString(values: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}
