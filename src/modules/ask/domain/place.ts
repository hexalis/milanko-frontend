import { analyzeTrend, type Point, type TrendCase } from "@/modules/cases";
import { readString, toQueryString, type SearchParams } from "@/shared/lib/search-params";

/*
 * "My own place" (POC renderPlace and powerSeries, app.js L1985–2174 and L353–368): any point of
 * the Earth, read live from NASA POWER through the Milanko API and tested like a case file. Nobody
 * on the team has reviewed such a result, so the page says so. This file holds the pure parts: the
 * point in the address, the variables a point can be asked about, and the yearly series.
 */

/** NASA POWER monthly series the API serves at any coordinate (POC EXPLORE_VARS). */
const LIVE_VARIABLES = {
  T2M: { unit: "°C", digits: 2, relative: false },
  PRECTOTCORR: { unit: "mm/day", digits: 2, relative: true },
  GWETROOT: { unit: "0–1", digits: 3, relative: true },
  RH2M: { unit: "%", digits: 1, relative: false },
  ALLSKY_SFC_SW_DWN: { unit: "kWh/m²/day", digits: 2, relative: true },
} as const;

export type LiveVariable = keyof typeof LIVE_VARIABLES;

export const LIVE_TREND_VARIABLES = Object.keys(LIVE_VARIABLES) as LiveVariable[];

export const isLiveVariable = (value: string | undefined): value is LiveVariable =>
  LIVE_TREND_VARIABLES.some((variable) => variable === value);

/** The cover speaks of air temperature unless the question asked for another variable. */
const DEFAULT_LIVE_VARIABLE: LiveVariable = "T2M";

export type PlacePoint = { lat: number; lon: number; name: string | undefined };

/** A place the search found: its name, where it is (region, country) and its point. */
export type FoundPlace = { name: string; admin: string; lat: number; lon: number };

/** Shortest search worth sending (POC askBindBuilder: three letters). */
export const MIN_QUERY = 3;
export const MAX_QUERY = 80;

/** How a found place reads in a question and on its page: "Matagalpa, Nicaragua". */
export function foundName(place: Pick<FoundPlace, "name" | "admin">): string {
  const country = place.admin.split(", ").at(-1);
  return country && country !== place.name ? `${place.name}, ${country}` : place.name;
}

/** Two decimals (about 1 km) is far finer than a NASA POWER cell (about 50 km). */
const roundTo2 = (value: number) => Math.round(value * 100) / 100;

function readCoordinate(params: SearchParams, key: "lat" | "lon"): number | undefined {
  // A link without a latitude or a longitude is a broken link, not the point 0° N, 0° E.
  const raw = readString(params, key);
  if (!raw || !/^-?\d+(\.\d+)?$/.test(raw)) return undefined;
  const value = Number(raw);
  const limit = key === "lat" ? 90 : 180;
  return Number.isFinite(value) && Math.abs(value) <= limit ? roundTo2(value) : undefined;
}

const MAX_NAME = 120;

/** The point the address names, or undefined when it is missing or off the map. */
export function parsePoint(params: SearchParams): PlacePoint | undefined {
  const lat = readCoordinate(params, "lat");
  const lon = readCoordinate(params, "lon");
  if (lat === undefined || lon === undefined) return undefined;
  return { lat, lon, name: readString(params, "name")?.slice(0, MAX_NAME) };
}

/** The variable the address asks for, or the cover's air temperature. */
export function parseLiveVariable(params: SearchParams): LiveVariable {
  const value = readString(params, "var");
  return isLiveVariable(value) ? value : DEFAULT_LIVE_VARIABLE;
}

/** The page of a point, opened on one variable. */
export function placeHref(point: PlacePoint, variable?: LiveVariable): string {
  return `/place${toQueryString({
    lat: point.lat.toFixed(2),
    lon: point.lon.toFixed(2),
    name: point.name,
    var: variable === DEFAULT_LIVE_VARIABLE ? undefined : variable,
  })}`;
}

/** One month of a series as the API returns it ("YYYY-MM-DD", value or null). */
export type MonthlyValue = { time: string; value: number | null };

const MONTHS_IN_YEAR = 12;

/**
 * The yearly means of the complete years only (POC powerSeries): a year with a missing month would
 * lean towards the months it has, so it is left out rather than guessed.
 */
export function annualMeans(values: readonly MonthlyValue[]): Point[] {
  const byYear = new Map<number, Map<number, number>>();
  for (const { time, value } of values) {
    const match = /^(\d{4})-(\d{2})/.exec(time);
    if (!match || value === null || !Number.isFinite(value)) continue;
    const year = Number(match[1]);
    const month = Number(match[2]);
    if (month < 1 || month > MONTHS_IN_YEAR) continue;
    const months = byYear.get(year) ?? new Map<number, number>();
    months.set(month, value);
    byYear.set(year, months);
  }
  return [...byYear.entries()]
    .filter(([, months]) => months.size === MONTHS_IN_YEAR)
    .map(([year, months]): Point => {
      const sum = [...months.values()].reduce((total, value) => total + value, 0);
      return [year, sum / MONTHS_IN_YEAR];
    })
    .toSorted((first, second) => first[0] - second[0]);
}

/**
 * A point read as a trend file, so it goes through the same test and the same readout as the
 * reviewed files. Undefined when too few complete years remain for the test.
 */
export function pointFile(
  point: PlacePoint,
  variable: LiveVariable,
  values: readonly MonthlyValue[],
): TrendCase | undefined {
  const series = annualMeans(values);
  const analysis = analyzeTrend(
    series.map(([year]) => year),
    series.map(([, value]) => value),
  );
  if (!analysis) return undefined;
  const { unit, digits, relative } = LIVE_VARIABLES[variable];
  return {
    kind: "trend",
    id: `point:${point.lat.toFixed(2)},${point.lon.toFixed(2)}`,
    region: "",
    catalog: "",
    publishedAt: "",
    theme: "",
    source: "power",
    variable,
    unit,
    lat: point.lat,
    lon: point.lon,
    digits,
    relative,
    series,
    t: analysis,
  };
}

/**
 * A confirmed temperature trend against the planet's sign deserves a word of caution, not silence
 * (POC drawCover): reanalysis cells can differ from local stations.
 */
export function isAgainstPlanet(file: TrendCase, planetPerDecade: number): boolean {
  return (
    file.variable === "T2M" &&
    file.t.significant &&
    Math.sign(file.t.slope) !== Math.sign(planetPerDecade)
  );
}
