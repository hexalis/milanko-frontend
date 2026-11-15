import { caseText } from "@/modules/copy";
import { LOCALES } from "@/shared/lib/i18n";
import { isEvent, type CaseFile } from "./case-file";
import { eventTitle } from "./event-title";

/*
 * "Search near" (POC app.js kmBetween, roundKm, near=lat,lon,name). The archive orders the files by
 * their distance to a place. The POC finds a typed place through Open-Meteo geocoding, a live
 * service; here the place is resolved offline from what the app ships: typed coordinates, or a
 * place named by a case file (its place name or the place in an event's title, in both languages).
 */

export type NearPlace = { lat: number; lon: number; name: string };

const EARTH_RADIUS_KM = 6371;
const COORD_DIGITS = 2;

/** Beyond this, the nearest file is said to be far (docs/18 §6, "500 km, to confirm"). */
export const FAR_KM = 500;

/** Great-circle distance in km. */
export function kmBetween(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const r = Math.PI / 180;
  const a =
    Math.sin(((lat2 - lat1) * r) / 2) ** 2 +
    Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(((lon2 - lon1) * r) / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

/** "About 110 km": 5 km steps under 100, then 10 km, then 100 km. */
export function roundKm(km: number): number {
  if (km < 100) return Math.max(5, Math.round(km / 5) * 5);
  if (km < 1000) return Math.round(km / 10) * 10;
  return Math.round(km / 100) * 100;
}

export const kmToFile = (place: NearPlace, file: Pick<CaseFile, "lat" | "lon">): number =>
  kmBetween(place.lat, place.lon, file.lat, file.lon);

const isLatitude = (value: number) => Number.isFinite(value) && Math.abs(value) <= 90;
const isLongitude = (value: number) => Number.isFinite(value) && Math.abs(value) <= 180;

/** `near=12.93,-85.92,Matagalpa` from the address bar; anything out of range is dropped. */
export function parseNear(raw: string | undefined): NearPlace | undefined {
  if (!raw) return undefined;
  const [latText = "", lonText = "", ...rest] = raw.split(",");
  if (!latText.trim() || !lonText.trim()) return undefined;
  const lat = Number(latText);
  const lon = Number(lonText);
  if (!isLatitude(lat) || !isLongitude(lon)) return undefined;
  // A bare pair of coordinates still needs a name to quote in the chip and the message.
  const name = rest.join(",").trim();
  // No comma in it: chips quote a name up to its first comma.
  return { lat, lon, name: name || `${lat}° ${lon}°` };
}

export function nearParam(place: NearPlace): string {
  const coords = `${place.lat.toFixed(COORD_DIGITS)},${place.lon.toFixed(COORD_DIGITS)}`;
  return place.name ? `${coords},${place.name}` : coords;
}

/** The short name a chip or a message quotes: the part before the first comma. */
export const shortPlaceName = (place: NearPlace): string => place.name.split(",")[0]?.trim() ?? "";

/* ---------- Offline place lookup ---------- */

const normalize = (text: string) => text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

/** "Flood in Japan" → "Japan"; "Telica Volcano, Nicaragua" → "Nicaragua" and "Telica Volcano". */
function eventPlaceNames(title: string): string[] {
  const inPlace = /\b(?:in|en)\s+(.+)$/i.exec(title)?.[1];
  const parts = title.split(",").map((part) => part.trim());
  return [title, ...(inPlace ? [inPlace] : []), ...parts.slice(1)];
}

function placeNames(file: CaseFile): string[] {
  if (isEvent(file)) {
    return [...eventPlaceNames(file.title), ...eventPlaceNames(eventTitle(file.title, "es"))];
  }
  return LOCALES.flatMap((locale) => {
    const name = caseText(locale, file.id, "name");
    return [name, ...name.split(",").map((part) => part.trim())];
  });
}

/** Typed coordinates ("12.9, -85.9") or a place one of the files names. */
export function resolvePlace(text: string, files: readonly CaseFile[]): NearPlace | undefined {
  const typed = parseNear(text);
  if (typed) return { ...typed, name: typed.name || text.trim() };
  const wanted = normalize(text);
  if (!wanted) return undefined;
  for (const file of files) {
    const name = placeNames(file).find((candidate) => normalize(candidate) === wanted);
    if (name) return { lat: file.lat, lon: file.lon, name };
  }
  return undefined;
}
