/*
 * The reader's own trail through the archive (POC app.js markRead): the files opened most
 * recently and every file opened at least once. Both live in localStorage under the POC's keys;
 * these functions are the pure part, so the storage layer only reads and writes strings.
 */

export const RECENT_STORAGE_KEY = "etd-recent";
export const READ_STORAGE_KEY = "etd-read";

/** How many recent ids are kept; the rail shows the first three. */
const RECENT_LIMIT = 5;
const RAIL_RECENT_COUNT = 3;

/** A stored JSON list of ids; anything else (missing, corrupt, edited by hand) reads as empty. */
export function parseIdList(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return [...new Set(value.filter((id): id is string => typeof id === "string" && id !== ""))];
  } catch {
    return [];
  }
}

/** The opened file goes first; it is not repeated and the list keeps its limit. */
export function withRecent(recent: readonly string[], id: string): string[] {
  return [id, ...recent.filter((other) => other !== id)].slice(0, RECENT_LIMIT);
}

export function withRead(read: readonly string[], id: string): string[] {
  return read.includes(id) ? [...read] : [...read, id];
}

/** Opened files that still exist in the catalog (an old id must not inflate the count). */
export function countOpened(read: readonly string[], titles: Readonly<Record<string, string>>) {
  return read.filter((id) => Object.hasOwn(titles, id)).length;
}

export type RecentFile = { id: string; title: string };

/** The recent files the catalog still knows, with their titles, newest first. */
export function recentFiles(
  recent: readonly string[],
  titles: Readonly<Record<string, string>>,
  count = RAIL_RECENT_COUNT,
): RecentFile[] {
  return recent
    .flatMap((id) => {
      // Own keys only: an edited store must not reach Object.prototype ("constructor"…).
      const title = Object.hasOwn(titles, id) ? titles[id] : undefined;
      return typeof title === "string" ? [{ id, title }] : [];
    })
    .slice(0, count);
}
