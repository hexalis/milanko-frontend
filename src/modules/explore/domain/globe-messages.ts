import { isSectorId, type SectorId } from "./sectors";

/*
 * The protocol between the explorer page and the embedded 3D globe (public/globe/world3d, the POC's
 * page, in a sandboxed frame with an opaque origin): window.postMessage({ etd: 1, type, ... }, "*")
 * both ways. Neither side can name the other's origin, so each checks the message's source window
 * (the page: the frame's contentWindow; the globe: window.parent). Ported from the POC's app.js
 * renderExplore (onFrame, tell3d) and world3d/index.html (tell, the message listener). Everything
 * that comes in is validated here.
 */

/** An EONET event as the globe sends it (one point per event, from data/events/<year>.json). */
export type GlobeEvent = {
  id: string;
  cat: string;
  date: string;
  title: string;
  /** EONET source id ("GDACS", "InciWeb"…); may be empty. */
  src: string;
  lat: number;
  lon: number;
  mag: number | null;
  unit: string;
};

export type GlobeSelection =
  | { type: "case"; id: string }
  | { type: "sector"; id: SectorId }
  | { type: "point"; lat: number; lon: number }
  | { type: "event"; ev: GlobeEvent };

export type TilePeriod =
  | { kind: "live" }
  | { kind: "year"; y: number }
  | { kind: "all"; from: number; to: number };

/** The tile the globe lifted for a point, and the EONET events counted inside it. */
export type GlobeTile = {
  lat: number;
  lon: number;
  km: number;
  n: number;
  /** [category, events], most first. */
  cats: [category: string, count: number][];
  latest: { title: string; date: string } | null;
  period: TilePeriod;
};

export type GlobeMessage =
  | { type: "ready" }
  | { type: "escape" }
  | { type: "select"; sel: GlobeSelection }
  | ({ type: "tile" } & GlobeTile);

type FlyKind = "sector" | "point" | "event" | "case";

/** What the page tells the globe. `etd: 1` is added when it is posted. */
export type FrameCommand =
  | {
      type: "fly";
      kind: FlyKind;
      lat: number;
      lon: number;
      id?: string;
      ev?: Pick<GlobeEvent, "cat" | "id" | "date" | "title" | "lat" | "lon">;
    }
  | { type: "inset"; side: "right" | "bottom"; px: number }
  /** The portal's side rail floats over the frame's left edge, px wide (0 without it). */
  | { type: "rail"; px: number }
  | { type: "closed" }
  | { type: "focus" }
  | { type: "layer"; layer: "cases" | "events"; cat?: string; year?: number };

type Unknown = Record<string, unknown>;

const isRecord = (value: unknown): value is Unknown =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isLatitude = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= -90 && value <= 90;

const isLongitude = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= -180 && value <= 180;

const MAX_TEXT = 300;
const text = (value: unknown): string =>
  typeof value === "string" ? value.slice(0, MAX_TEXT) : "";

const ISO_DAY = /^\d{4}-\d{2}-\d{2}/;
const ID = /^[\w.:-]{1,120}$/;

export function parseGlobeEvent(value: unknown): GlobeEvent | null {
  if (!isRecord(value)) return null;
  const { id, cat, date, lat, lon, mag } = value;
  if (typeof id !== "string" || !ID.test(id)) return null;
  if (typeof cat !== "string" || !ID.test(cat)) return null;
  if (typeof date !== "string" || !ISO_DAY.test(date)) return null;
  if (!isLatitude(lat) || !isLongitude(lon)) return null;
  return {
    id,
    cat,
    date: date.slice(0, 10),
    title: text(value.title),
    src: text(value.src),
    lat,
    lon,
    mag: typeof mag === "number" && Number.isFinite(mag) ? mag : null,
    unit: text(value.unit),
  };
}

function parseSelection(value: unknown): GlobeSelection | null {
  if (!isRecord(value)) return null;
  switch (value.type) {
    case "case":
      return typeof value.id === "string" && ID.test(value.id)
        ? { type: "case", id: value.id }
        : null;
    case "sector":
      return isSectorId(value.id) ? { type: "sector", id: value.id } : null;
    case "point":
      return isLatitude(value.lat) && isLongitude(value.lon)
        ? { type: "point", lat: value.lat, lon: value.lon }
        : null;
    case "event": {
      const ev = parseGlobeEvent(value.ev);
      return ev ? { type: "event", ev } : null;
    }
    default:
      return null;
  }
}

const isCount = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0;

function parsePeriod(value: unknown): TilePeriod | null {
  if (!isRecord(value)) return null;
  if (value.kind === "live") return { kind: "live" };
  if (value.kind === "year" && isCount(value.y)) return { kind: "year", y: value.y };
  if (value.kind === "all" && isCount(value.from) && isCount(value.to))
    return { kind: "all", from: value.from, to: value.to };
  return null;
}

function parseTile(value: Unknown): GlobeTile | null {
  const { lat, lon, km, n, cats, latest } = value;
  if (!isLatitude(lat) || !isLongitude(lon) || !isCount(km) || !isCount(n)) return null;
  if (!Array.isArray(cats)) return null;
  const period = parsePeriod(value.period);
  if (!period) return null;
  const counts = cats.flatMap((entry): [string, number][] =>
    Array.isArray(entry) && typeof entry[0] === "string" && isCount(entry[1])
      ? [[entry[0], entry[1]]]
      : [],
  );
  const last =
    isRecord(latest) && typeof latest.date === "string"
      ? { title: text(latest.title), date: latest.date.slice(0, 10) }
      : null;
  return { lat, lon, km, n, cats: counts, latest: last, period };
}

/** A message from the globe, validated; null for anything else (other frames, extensions…). */
export function parseGlobeMessage(data: unknown): GlobeMessage | null {
  if (!isRecord(data) || data.etd !== 1) return null;
  switch (data.type) {
    case "ready":
      return { type: "ready" };
    case "escape":
      return { type: "escape" };
    case "select": {
      const sel = parseSelection(data.sel);
      return sel ? { type: "select", sel } : null;
    }
    case "tile": {
      const tile = parseTile(data);
      return tile ? { type: "tile", ...tile } : null;
    }
    default:
      return null;
  }
}

/**
 * The globe runs in a sandboxed frame (scripts, no same-origin), so its documents have an opaque
 * origin: its messages arrive with origin "null", and a message to it cannot name its origin.
 */
const FRAME_ORIGIN = "null";

/** Only this page's globe frame is listened to: its window, from its sandboxed (opaque) origin. */
export function isFromFrame(event: { source: unknown; origin: string }, frame: unknown): boolean {
  return (
    frame !== null && frame !== undefined && event.source === frame && event.origin === FRAME_ORIGIN
  );
}

/**
 * Commands wait in order until the globe says it is ready, then go out (the POC's tell3d queue).
 * Kept free of the DOM: `ready` receives the function that posts to the frame that said so.
 */
export function createCommandQueue() {
  let post: ((command: FrameCommand) => void) | null = null;
  let pending: FrameCommand[] = [];
  return {
    send(command: FrameCommand) {
      if (post) post(command);
      else pending = [...pending, command];
    },
    ready(target: (command: FrameCommand) => void) {
      post = target;
      const queued = pending;
      pending = [];
      queued.forEach(target);
    },
  };
}
