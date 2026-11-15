import { withBasePath } from "@/shared/lib/base-path";
import { parseGlobeEvent, type GlobeEvent } from "./globe-messages";

/*
 * The EONET snapshot the globe draws, one file per year (public/globe/data/events/<year>.json, built
 * by the POC's scripts/build_events.py): { fields, points: [[lon, lat, category, date, title,
 * source, id, magnitude, unit], …] }. The explorer reads it only to reopen an event from a link.
 */

export const eventPointsUrl = (year: number): string =>
  withBasePath(`/globe/data/events/${year}.json`);

/** The event with that id in a year file, validated; null when it is not there. */
export function findEventPoint(file: unknown, id: string): GlobeEvent | null {
  if (typeof file !== "object" || file === null || !("points" in file)) return null;
  const { points } = file;
  if (!Array.isArray(points)) return null;
  const row: unknown = points.find((point) => Array.isArray(point) && point[6] === id);
  if (!Array.isArray(row)) return null;
  const [lon, lat, cat, date, title, src, eventId, mag, unit] = row as unknown[];
  return parseGlobeEvent({ lon, lat, cat, date, title, src, id: eventId, mag, unit });
}
