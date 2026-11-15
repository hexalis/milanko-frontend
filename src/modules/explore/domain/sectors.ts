/*
 * The nine regions ("sectors") of the planet, ported from the POC's sectors.js. Rough boxes are
 * applied to land; the land outline gives the real edges, so a point at sea can still fall in a box.
 * The 3D world and the POC's scripts/sectors.py use the same rules, and the case files carry
 * these ids in their `region` field.
 */

export const SECTOR_IDS = [
  "arctic",
  "north-america",
  "central-america",
  "south-america",
  "europe",
  "africa",
  "asia",
  "oceania",
  "antarctica",
] as const;

export type SectorId = (typeof SECTOR_IDS)[number];

type SectorRule = readonly [SectorId, (lat: number, lon: number) => boolean];

/** Order matters: the first box that matches wins. */
const RULES: readonly SectorRule[] = [
  ["arctic", (lat) => lat >= 66],
  ["antarctica", (lat) => lat <= -60],
  ["central-america", (lat, lon) => lat >= 5 && lat < 24 && lon >= -118 && lon <= -58],
  ["north-america", (lat, lon) => lat >= 14 && lon >= -170 && lon <= -50],
  ["north-america", (lat, lon) => lat >= 55 && lon >= -75 && lon <= -10],
  ["south-america", (lat, lon) => lat < 13 && lon >= -93 && lon <= -30],
  [
    "africa",
    (lat, lon) => lat <= 37.5 && lat >= -36 && lon >= -20 && lon <= 52 && !(lon > 34 && lat > 12),
  ],
  ["europe", (lat, lon) => lat >= 35 && lon >= -25 && lon <= 45],
  ["oceania", (lat, lon) => lat <= -11 && lon >= 110],
  ["oceania", (lat, lon) => lon <= -120 && lat <= 0 && lat >= -50],
  ["asia", (_lat, lon) => lon >= 25 || lon <= -168],
];

/** Where the globe flies to show a whole sector: [lat, lon]. */
export const SECTOR_CENTER: Readonly<Record<SectorId, readonly [lat: number, lon: number]>> = {
  arctic: [80, 0],
  "north-america": [45, -100],
  "central-america": [15, -85],
  "south-america": [-15, -60],
  europe: [50, 15],
  africa: [5, 20],
  asia: [40, 95],
  oceania: [-25, 140],
  antarctica: [-80, 0],
};

export function isSectorId(value: unknown): value is SectorId {
  return typeof value === "string" && (SECTOR_IDS as readonly string[]).includes(value);
}

/**
 * The sector of a point, or null. The polar caps hold at sea too; elsewhere `onLand = false`
 * says the point is water and belongs to no sector.
 */
export function sectorOf(lat: number, lon: number, onLand = true): SectorId | null {
  if (lat >= 66) return "arctic";
  if (lat <= -60) return "antarctica";
  if (!onLand) return null;
  return RULES.find(([, test]) => test(lat, lon))?.[0] ?? null;
}

const EARTH_DIAMETER_KM = 12742;

/** Great-circle distance in km (haversine), as the POC's kmBetween. */
export function kmBetween(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const rad = Math.PI / 180;
  const a =
    Math.sin(((lat2 - lat1) * rad) / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lon2 - lon1) * rad) / 2) ** 2;
  return EARTH_DIAMETER_KM * Math.asin(Math.sqrt(a));
}
