import type { Translator } from "@/shared/lib/i18n";
import type { Direction, Point, TrendCase, Verdict } from "./case-file";
import type { CaseCatalog } from "./catalog";
import type { AuditCategory, EventAudit } from "./event-audit";
import type { AnomalyStrip } from "./readout";
import type { Strength, TrendAnalysis } from "./trend-stats";

/*
 * One reading for every case file (POC app.js "Case file: one reading for everyone", d2de23a).
 * Whatever its kind, a file is the same seven sections in the same order: the answer, what the
 * data show, how sure we are, what this does not say, why, where the data come from, and use it.
 * Each section says the same thing twice: a plain sentence, then the exact figures. One adapter
 * per kind of data (trend files, anomaly files, catalog-audit categories) fills a CaseReading;
 * one view draws it. Everything here is plain data, so the adapters are tested without React.
 */

type ReadingKind = "trend" | "event" | "audit";

/** Colour of the answer: confirmed, not proven, out of the ordinary, catalog artifact. */
export type ReadingTone = "yes" | "no" | "anom" | "art";

export type ExactRow = { label: string; value: string };

type ReadingLink = { href: string; icon: string; label: string };

export type ReadingChart =
  | { kind: "series"; file: TrendCase; direction: Direction; label: string }
  | {
      kind: "strips";
      year: number;
      strips: (AnomalyStrip & { name: string; said: string })[];
    }
  | {
      kind: "bars";
      category: AuditCategory;
      partialFrom: number;
      label: string;
    };

/** A satellite picture of the place (NASA GIBS true colour) on one day. */
type OrbitImage = { src: string; alt: string; date: string };

/** A bar the test clears or not (p < 0.05, p < 0.01): it decides how many sheets the file carries. */
type SheetCheck = { label: string; isPassed: boolean };

/**
 * One sheet of the folder: 01 the series, 02 the test, 03 the source (as in the archive), each
 * with its figure and one plain sentence saying what that figure means.
 */
export type ReadingSheet = { label: string; value: string; note: string; checks?: SheetCheck[] };

/** The small chart on the first sheet, the same sparkline the archive folder shows. */
type SheetSpark = {
  series: readonly Point[];
  trend: TrendAnalysis | null;
  direction: Direction;
  isLastMarked: boolean;
};

/**
 * The file at a glance, the screen a file opens on: where on Earth, the folder's sheets (one per
 * level of evidence), the verdict stamp, and why it matters to the people who live there.
 */
export type ReadingGlance = {
  /** The point the data describe, or null for a planet-wide catalog audit. */
  place: { lat: number; lon: number; label: string } | null;
  globe: ReadingLink;
  sheets: ReadingSheet[];
  /** Why the sheets a weaker file lacks are missing, or null when it carries all three. */
  missing: string | null;
  spark: SheetSpark | null;
  verdict: Verdict;
  verdictLabel: string;
  impact: string;
};

export type CaseReading = {
  kind: ReadingKind;
  /** The address of the file: `/cases/<id>`. */
  path: string;
  crumb: { href: string; label: string; code: string };
  question: string;
  chips: { icon: string; text: string }[];
  glance: ReadingGlance;
  answer: {
    tone: ReadingTone;
    icon: string;
    word: string;
    plain: string;
    fig: string;
    /** Arrow or variable icon before the figure. */
    figIcon?: string;
    figDirection?: Direction;
    /** The figure of a file that proves nothing is drawn smaller. */
    isSoft: boolean;
    figNote: string;
    exact: ExactRow[];
  };
  chart: {
    plain: string;
    visual: ReadingChart;
    exact: ExactRow[];
    table: { head: string[]; rows: string[][] };
    csvHref: string;
  };
  sure: { level: Strength; tone: ReadingTone; word: string; plain: string; exact: ExactRow[] };
  notSay: string[];
  why: {
    title: string;
    tag: string;
    plain: string;
    more?: string;
    breaks?: { year: number; text: string }[];
    /** The trend theme, for the slab tone. */
    theme?: string;
    link?: { href: string; label: string };
  } | null;
  data: {
    plain: string;
    rows: { label: string; value: string; href?: string }[];
    orbit: OrbitImage[];
  };
  use: {
    quote: string;
    /** Citation lines; the last one is completed in the browser (date read, full address). */
    cite: string[];
    think: { q: string; a: string }[];
    related: ReadingLink[];
    isShareable: boolean;
  };
  next: { href: string; title: string; meta: string };
};

export type ReadingContext = {
  translator: Translator;
  catalog: CaseCatalog;
  audit: EventAudit;
};

export const capFirst = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

/** Drops the empty rows an adapter writes as `false` (a figure the file does not have). */
export const exactRows = (rows: (ExactRow | false | null | undefined)[]): ExactRow[] =>
  rows.filter((row): row is ExactRow => Boolean(row));

export const caseFilePath = (id: string): string => `/cases/${id}`;

/* ---------- Satellite pictures ---------- */

const GIBS_WMS = "https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi";
const GIBS_KM = 220;
const GIBS_PX = 480;
const KM_PER_DEGREE = 111;
const MIN_COS_LAT = 0.2;

/** A MODIS/Terra true-colour picture about 220 km wide around the point (POC Sources.gibsImage). */
export function gibsImageUrl(lat: number, lon: number, date: string): string {
  const dLat = GIBS_KM / KM_PER_DEGREE / 2;
  const dLon = dLat / Math.max(MIN_COS_LAT, Math.cos((lat * Math.PI) / 180));
  const box = [
    Math.max(-90, lat - dLat),
    Math.max(-180, lon - dLon),
    Math.min(90, lat + dLat),
    Math.min(180, lon + dLon),
  ].map((value) => value.toFixed(3));
  const query = new URLSearchParams({
    SERVICE: "WMS",
    REQUEST: "GetMap",
    VERSION: "1.3.0",
    LAYERS: "MODIS_Terra_CorrectedReflectance_TrueColor",
    STYLES: "",
    FORMAT: "image/jpeg",
    CRS: "EPSG:4326",
    BBOX: box.join(","),
    WIDTH: String(GIBS_PX),
    HEIGHT: String(GIBS_PX),
    TIME: date,
  });
  return `${GIBS_WMS}?${query.toString()}`;
}

/*
 * The whole planet on one NASA picture (GIBS Blue Marble, shaded relief and sea floor). It is
 * equirectangular, so a point sits at a plain fraction of its width and height.
 */
export const WORLD_MAP_URL = `${GIBS_WMS}?${new URLSearchParams({
  SERVICE: "WMS",
  REQUEST: "GetMap",
  VERSION: "1.3.0",
  LAYERS: "BlueMarble_ShadedRelief_Bathymetry",
  STYLES: "",
  FORMAT: "image/jpeg",
  CRS: "EPSG:4326",
  BBOX: "-90,-180,90,180",
  WIDTH: "960",
  HEIGHT: "480",
}).toString()}`;

/** Where a point falls on the world map, in percent from its left and top edges. */
export function mapPosition(lat: number, lon: number): { x: number; y: number } {
  return { x: ((lon + 180) / 360) * 100, y: ((90 - lat) / 180) * 100 };
}

/** One sheet per level of evidence (POC sheetsFor): weaker evidence carries fewer pages. */
export const SHEET_COUNT: Record<Strength, number> = { strong: 3, moderate: 2, weak: 1 };

/** Mid-season day of a year for a trend case's picture (POC orbitDate). */
export function orbitDate(file: Pick<TrendCase, "months" | "lat">, year: number): string {
  const month = file.months?.length
    ? (file.months[Math.floor(file.months.length / 2)] ?? 1)
    : file.lat >= 0
      ? 7
      : 1;
  return `${year}-${String(month).padStart(2, "0")}-15`;
}
