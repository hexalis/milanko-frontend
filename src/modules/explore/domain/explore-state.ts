import { readString, toQueryString, type SearchParams } from "@/shared/lib/search-params";
import type { FrameCommand, GlobeEvent, GlobeSelection } from "./globe-messages";
import { isSectorId, SECTOR_CENTER, sectorOf, type SectorId } from "./sectors";

/*
 * What the explorer has open, and how it reads from and writes to the URL (the POC's renderExplore
 * sync() and its deep links: ?case=, ?region=, ?ev=, ?near=lat,lon, ?lat=&lon=, ?events=, ?year=).
 */

export type ExploreSelection =
  | { type: "sector"; id: SectorId }
  | { type: "case"; id: string }
  | { type: "point"; lat: number; lon: number; sector: SectorId | null }
  | { type: "event"; ev: GlobeEvent; sector: SectorId | null }
  /** Tapped in the sky; the globe already highlights it, so nothing flies. */
  | Extract<GlobeSelection, { type: "satellite" }>
  /** The Moon or a constellation, tapped in the sky; nothing flies either. */
  | Extract<GlobeSelection, { type: "sky" }>
  /** A region of the data layer, with what the layer shows there. Not kept in the URL. */
  | Extract<GlobeSelection, { type: "region" }>;

/** What a link asks the explorer to open when it loads. */
export type ExploreRequest =
  | { type: "none" }
  | { type: "sector"; id: SectorId }
  | { type: "case"; id: string }
  | { type: "point"; lat: number; lon: number }
  /** Fly there without opening a drawer (the POC's ?near=). */
  | { type: "near"; lat: number; lon: number }
  /** An EONET event id, looked up in the year's snapshot. */
  | { type: "event"; id: string };

export type ExploreQuery = {
  open: ExploreRequest;
  /** Year of the EONET snapshot to look an event up in, or to show on the events layer. */
  year: number;
  /** The events layer, when the link asks for it: a category id, or "all". */
  events: string | null;
};

type CaseLookup = {
  /** The region of a case file, or undefined when the id is not a case file. */
  caseRegion: (id: string) => SectorId | undefined;
};

type YearRange = { firstYear: number; lastYear: number; defaultYear: number };

const EVENT_ID = /^[\w.:-]{1,120}$/;
const CATEGORY = /^[A-Za-z]{1,40}$/;
const COORD_DIGITS = 3;

function readNumber(params: SearchParams, key: string): number | undefined {
  const value = readString(params, key);
  if (value === undefined) return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

const isLatLon = (lat: number | undefined, lon: number | undefined) =>
  lat !== undefined && lon !== undefined && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;

function readNear(params: SearchParams): [number, number] | undefined {
  const [lat, lon] = (readString(params, "near") ?? "").split(",").map(Number);
  return isLatLon(lat, lon) ? [lat as number, lon as number] : undefined;
}

function readOpen(params: SearchParams, { caseRegion }: CaseLookup): ExploreRequest {
  const caseId = readString(params, "case");
  if (caseId && caseRegion(caseId)) return { type: "case", id: caseId };
  const region = readString(params, "region");
  if (isSectorId(region)) return { type: "sector", id: region };
  const ev = readString(params, "ev");
  if (ev && EVENT_ID.test(ev)) return { type: "event", id: ev };
  const near = readNear(params);
  if (near) return { type: "near", lat: near[0], lon: near[1] };
  const lat = readNumber(params, "lat");
  const lon = readNumber(params, "lon");
  if (isLatLon(lat, lon)) return { type: "point", lat: lat as number, lon: lon as number };
  return { type: "none" };
}

/** Same precedence as the POC: case, then region, then event, then near, then lat/lon. */
export function parseExploreQuery(
  params: SearchParams,
  lookup: CaseLookup,
  years: YearRange,
): ExploreQuery {
  const asked = readNumber(params, "year");
  const year =
    asked !== undefined &&
    Number.isInteger(asked) &&
    asked >= years.firstYear &&
    asked <= years.lastYear
      ? asked
      : years.defaultYear;
  const events = readString(params, "events");
  return {
    open: readOpen(params, lookup),
    year,
    events: events && (events === "all" || CATEGORY.test(events)) ? events : null,
  };
}

/** A tap on the globe, as the drawer holds it (points and events learn their sector here). */
export function toSelection(sel: GlobeSelection): ExploreSelection {
  switch (sel.type) {
    case "point":
      return { ...sel, sector: sectorOf(sel.lat, sel.lon, true) };
    case "event":
      return { ...sel, sector: sectorOf(sel.ev.lat, sel.ev.lon, true) };
    default:
      return sel;
  }
}

/**
 * The drawer a link opens straight away, so the server renders it open. An event waits for its
 * year's snapshot, and `near` only flies, so neither opens anything here.
 */
export function initialSelection(open: ExploreRequest): ExploreSelection | null {
  switch (open.type) {
    case "case":
    case "sector":
      return open;
    case "point":
      return { ...open, sector: sectorOf(open.lat, open.lon, true) };
    default:
      return null;
  }
}

const eventYear = (ev: Pick<GlobeEvent, "date">): number => Number(ev.date.slice(0, 4));

type QueryContext = CaseLookup & {
  /** The events layer the page was opened with, kept in the URL while it stays on. */
  events: string | null;
  year: number;
  defaultYear: number;
};

/** The query string for a selection (empty when nothing is open), starting with "?". */
export function selectionQuery(
  sel: ExploreSelection | null,
  { caseRegion, events, year, defaultYear }: QueryContext,
): string {
  const region =
    sel?.type === "sector" ? sel.id : sel?.type === "case" ? caseRegion(sel.id) : undefined;
  const layerYear = events && year !== defaultYear ? year : undefined;
  return toQueryString({
    region,
    case: sel?.type === "case" ? sel.id : undefined,
    ev: sel?.type === "event" ? sel.ev.id : undefined,
    // An event is looked up in its own year's snapshot, so a shared link opens it again.
    year: sel?.type === "event" ? eventYear(sel.ev) : layerYear,
    lat: sel?.type === "point" ? sel.lat.toFixed(COORD_DIGITS) : undefined,
    lon: sel?.type === "point" ? sel.lon.toFixed(COORD_DIGITS) : undefined,
    events: events ?? undefined,
  });
}

/** Where the globe should fly for a selection; null when a case file has no known place. */
export function flyCommand(
  sel: ExploreSelection,
  caseAt: (id: string) => readonly [number, number] | undefined,
): FrameCommand | null {
  switch (sel.type) {
    case "sector": {
      const [lat, lon] = SECTOR_CENTER[sel.id];
      return { type: "fly", kind: "sector", id: sel.id, lat, lon };
    }
    case "case": {
      const at = caseAt(sel.id);
      return at ? { type: "fly", kind: "case", id: sel.id, lat: at[0], lon: at[1] } : null;
    }
    case "point":
      return { type: "fly", kind: "point", lat: sel.lat, lon: sel.lon };
    case "event": {
      const { cat, id, date, title, lat, lon } = sel.ev;
      return { type: "fly", kind: "event", lat, lon, ev: { cat, id, date, title, lat, lon } };
    }
    case "region":
      return sel.lat !== null && sel.lon !== null
        ? { type: "fly", kind: "region", lat: sel.lat, lon: sel.lon }
        : null;
    case "satellite":
    case "sky":
      return null;
  }
}
