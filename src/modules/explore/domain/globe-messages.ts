import { isSectorId, type SectorId } from "./sectors";
import { isSkyId, type SkyId } from "./sky";

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

/** What the data layer shows in one region on one day, as the globe painted it. */
export type RegionReading = {
  /** NASA's code ("T2M"). */
  variable: string;
  /** The variable in words, in the reader's language ("Air temperature"). */
  label: string;
  source: string;
  /** Ready to show ("°C"); empty when the variable has none. */
  unit: string;
  date: string;
  /** A day's value, or a month's mean against that month's normal (the layer's anomaly view). */
  period: "day" | "month";
  value: number | null;
  /** Difference from the baseline (normal for that date). */
  anomaly: number | null;
  z: number | null;
  baseline: number | null;
};

/** Where a data region sits: one of the portal's sectors, the open ocean, or not known yet. */
export type RegionPlace = SectorId | "ocean" | null;

const SATELLITE_IDS = ["terra"] as const;
type SatelliteId = (typeof SATELLITE_IDS)[number];

export type GlobeSelection =
  | { type: "case"; id: string }
  | { type: "sector"; id: SectorId }
  | { type: "point"; lat: number; lon: number }
  | { type: "event"; ev: GlobeEvent }
  | { type: "satellite"; id: SatelliteId }
  /** The Moon or a constellation; `apollo` once the reader has found the Apollo 11 mark (three taps). */
  | { type: "sky"; id: SkyId; apollo: boolean }
  | {
      type: "region";
      /** The data region's code (0–161 on the current grid). */
      code: number;
      place: RegionPlace;
      /** Its centre, when the globe knows it. */
      lat: number | null;
      lon: number | null;
      reading: RegionReading;
    };

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

/** The globe's own controls, which the page's guided tour points at. */
export const GLOBE_CHROME = ["search", "zoom", "layers"] as const;
type GlobeChromePart = (typeof GLOBE_CHROME)[number];

/** Where a control sits in the frame, in CSS pixels. */
type ChromeRect = { left: number; top: number; width: number; height: number };

export type GlobeChrome = Partial<Record<GlobeChromePart, ChromeRect>>;

export type GlobeMessage =
  | { type: "ready" }
  /** The loader has made way and the world is showing: the page's own layers may come in. */
  | { type: "shown" }
  | { type: "chrome"; rects: GlobeChrome }
  | { type: "escape" }
  | { type: "select"; sel: GlobeSelection }
  /** The reader hid or showed the interface from inside the globe. */
  | { type: "immersive"; on: boolean }
  | ({ type: "tile" } & GlobeTile);

type FlyKind = "sector" | "point" | "event" | "case" | "region";

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
  | { type: "layer"; layer: "cases" | "events"; cat?: string; year?: number }
  /** The data layer on one variable (NASA's code). */
  | { type: "layer"; layer: "data"; variable: string }
  /** Hide (or show) the globe's own controls: only the planet and its sky. */
  | { type: "immersive"; on: boolean }
  /** Asks a globe that is already built to say "ready" again (the queue lost track of it). */
  | { type: "hello" };

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
const VARIABLE = /^[A-Za-z0-9_]{1,40}$/;
const MAX_REGION_CODE = 9999;
const MAX_UNIT = 24;

const finiteOrNull = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

function parsePlace(value: unknown): RegionPlace {
  if (value === "ocean") return "ocean";
  return isSectorId(value) ? value : null;
}

function parseReading(value: unknown): RegionReading | null {
  if (!isRecord(value)) return null;
  const { variable, date } = value;
  if (typeof variable !== "string" || !VARIABLE.test(variable)) return null;
  if (typeof date !== "string" || !ISO_DAY.test(date)) return null;
  return {
    variable,
    label: text(value.label) || variable,
    source: text(value.source),
    unit: text(value.unit).slice(0, MAX_UNIT),
    date: date.slice(0, 10),
    period: value.period === "month" ? "month" : "day",
    value: finiteOrNull(value.value),
    anomaly: finiteOrNull(value.anomaly),
    z: finiteOrNull(value.z),
    baseline: finiteOrNull(value.baseline),
  };
}

function parseRegion(value: Unknown): GlobeSelection | null {
  const { code, lat, lon } = value;
  if (typeof code !== "number" || !Number.isInteger(code) || code < 0 || code > MAX_REGION_CODE)
    return null;
  const reading = parseReading(value.reading);
  if (!reading) return null;
  const hasCentre = isLatitude(lat) && isLongitude(lon);
  return {
    type: "region",
    code,
    place: parsePlace(value.place),
    lat: hasCentre ? lat : null,
    lon: hasCentre ? lon : null,
    reading,
  };
}

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
    case "satellite":
      return (SATELLITE_IDS as readonly unknown[]).includes(value.id)
        ? { type: "satellite", id: value.id as SatelliteId }
        : null;
    case "sky":
      return isSkyId(value.id)
        ? { type: "sky", id: value.id, apollo: value.id === "moon" && value.apollo === true }
        : null;
    case "region":
      return parseRegion(value);
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

/** Frame pixels stay within a screen's reach; anything else is dropped. */
const MAX_PX = 20_000;
const isPx = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= MAX_PX;

function parseChrome(value: unknown): GlobeChrome {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    GLOBE_CHROME.flatMap((part) => {
      const box = value[part];
      if (!Array.isArray(box) || box.length !== 4 || !box.every(isPx)) return [];
      const [left, top, width, height] = box as [number, number, number, number];
      return width > 0 && height > 0 ? [[part, { left, top, width, height }]] : [];
    }),
  );
}

/** A message from the globe, validated; null for anything else (other frames, extensions…). */
export function parseGlobeMessage(data: unknown): GlobeMessage | null {
  if (!isRecord(data) || data.etd !== 1) return null;
  switch (data.type) {
    case "ready":
      return { type: "ready" };
    case "shown":
      return { type: "shown" };
    case "escape":
      return { type: "escape" };
    case "chrome":
      return { type: "chrome", rects: parseChrome(data.rects) };
    case "select": {
      const sel = parseSelection(data.sel);
      return sel ? { type: "select", sel } : null;
    }
    case "immersive":
      return typeof data.on === "boolean" ? { type: "immersive", on: data.on } : null;
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
    /**
     * The frame may be another one now (reloaded, or rebuilt while its page was hidden): hold the
     * commands again until it says it is ready, instead of posting them to a window that is gone.
     */
    reset() {
      post = null;
    },
  };
}
