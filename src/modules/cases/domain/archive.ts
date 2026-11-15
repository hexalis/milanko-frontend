import type { SearchParams } from "@/shared/lib/search-params";
import { readOption, readString } from "@/shared/lib/search-params";
import {
  fileDirection,
  fileSource,
  fileStrength,
  fileTheme,
  isEvent,
  verdictOf,
  type CaseFile,
} from "./case-file";
import type { CaseCatalog } from "./catalog";
import { nearParam, parseNear, type NearPlace } from "./near";

/*
 * The Case Files archive (POC app.js renderArchive, d2de23a): five topic buttons, one search box
 * that also finds a place ("near"), the results and the catalog-audit card. The facets and shelves
 * of earlier versions have no controls any more, but their links still work and show as removable
 * chips. Everything here is pure; the state lives in the URL and `parseArchiveState` reads it.
 */

export const ARCHIVE_PATH = "/cases";

/** The archive search box; the shell's "/" key focuses it, or opens `?focus=1` from elsewhere. */
export const ARCHIVE_SEARCH_ID = "archive-search";
export const ARCHIVE_FOCUS_HREF = `${ARCHIVE_PATH}?focus=1`;

/** `trend` only survives as a chip from old links; `audit` shows the catalog audit instead of files. */
const ARCHIVE_KINDS = ["all", "trend", "audit"] as const;
export type ArchiveKind = (typeof ARCHIVE_KINDS)[number];

export const ARCHIVE_TOPICS = ["all", "heat", "water", "plants", "disasters"] as const;
export type ArchiveTopic = (typeof ARCHIVE_TOPICS)[number];

export const ARCHIVE_SORTS = ["recent", "evidence", "magnitude"] as const;
export type ArchiveSort = (typeof ARCHIVE_SORTS)[number];

const COLLECTION_IDS = ["records", "opposite", "false", "arctic", "space"] as const;
export type CollectionId = (typeof COLLECTION_IDS)[number];

/** Facet keys double as URL parameter names, as in the POC (`ev` is the evidence strength). */
export const FACET_KEYS = ["region", "theme", "ev", "dir", "src"] as const;
export type FacetKey = (typeof FACET_KEYS)[number];

type FacetSelection = Readonly<Record<FacetKey, readonly string[]>>;

export type ArchiveState = {
  kind: ArchiveKind;
  topic: ArchiveTopic;
  /** Free text as typed (trimmed); matching normalizes it. */
  q: string;
  sort: ArchiveSort;
  col: CollectionId | undefined;
  facets: FacetSelection;
  /** A place the files are ordered around, nearest first. */
  near: NearPlace | undefined;
};

/** The nine regions of the planet in the POC's order (sectors.js). */
const SECTOR_ORDER = [
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

const STRENGTHS = ["strong", "moderate", "weak"] as const;
const DIRECTIONS = ["up", "down", "flat"] as const;
const SOURCES = ["power", "modis", "eonet"] as const;

const EMPTY_FACETS: FacetSelection = { region: [], theme: [], ev: [], dir: [], src: [] };

export const DEFAULT_ARCHIVE_STATE: ArchiveState = {
  kind: "all",
  topic: "all",
  q: "",
  sort: "recent",
  col: undefined,
  facets: EMPTY_FACETS,
  near: undefined,
};

/* ---------- Readings ---------- */

export const isOfKind = (file: CaseFile, kind: ArchiveKind): boolean =>
  kind === "trend" ? !isEvent(file) : true;

const TOPIC_TESTS: Record<ArchiveTopic, (file: CaseFile) => boolean> = {
  all: () => true,
  heat: (file) => !isEvent(file) && file.theme === "temperature",
  water: (file) => !isEvent(file) && file.theme === "water",
  plants: (file) => !isEvent(file) && file.theme === "vegetation",
  disasters: isEvent,
};

export function isInTopic(file: CaseFile, topic: ArchiveTopic): boolean {
  return TOPIC_TESTS[topic](file);
}

export function facetValue(file: CaseFile, key: FacetKey): string {
  switch (key) {
    case "region":
      return file.region;
    case "theme":
      return fileTheme(file);
    case "ev":
      return fileStrength(file);
    case "dir":
      return fileDirection(file);
    case "src":
      return fileSource(file);
  }
}

/** The run-up was the highest or lowest of every year compared. */
const isRecord = (file: CaseFile): boolean =>
  isEvent(file) && (file.lv.rank === 1 || file.lv.rank === file.lv.years);

const COLLECTION_TESTS: Record<CollectionId, (file: CaseFile) => boolean> = {
  records: isRecord,
  opposite: (file) => !isEvent(file) && Boolean(file.pair),
  false: (file) => verdictOf(file) === "inconclusive",
  arctic: (file) => file.region === "arctic",
  space: (file) => fileSource(file) === "modis",
};

export function isInCollection(file: CaseFile, collection: CollectionId): boolean {
  return COLLECTION_TESTS[collection](file);
}

/** Options each facet accepts, in display order; only values some file actually carries. */
export function facetOptions(catalog: Pick<CaseCatalog, "all">): Record<FacetKey, string[]> {
  const present = (key: FacetKey) => new Set(catalog.all.map((file) => facetValue(file, key)));
  const regions = present("region");
  return {
    region: SECTOR_ORDER.filter((region) => regions.has(region)),
    theme: [...present("theme")],
    ev: [...STRENGTHS],
    dir: [...DIRECTIONS],
    src: [...SOURCES],
  };
}

/* ---------- URL state ---------- */

/** Every value of a list parameter: repeated keys (`?region=a&region=b`) or commas (`?region=a,b`). */
function readList(params: SearchParams, key: string): string[] {
  const raw = params[key];
  const values = (Array.isArray(raw) ? raw : raw === undefined ? [] : [raw])
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
  return [...new Set(values)];
}

/** Longest search or place name kept from the URL; anything longer is cut, not rejected. */
const MAX_QUERY_LENGTH = 120;

/** Old links: `kind=event` lands on the disasters topic (POC renderArchive). */
function readTopic(params: SearchParams): ArchiveTopic {
  const topic = readOption(params, "topic", ARCHIVE_TOPICS, "all");
  return topic === "all" && readString(params, "kind") === "event" ? "disasters" : topic;
}

/**
 * Reads the archive state from the address bar. Like the POC, a value survives only when it names
 * a real option: anything else would show a raw copy key or break a lookup.
 */
export function parseArchiveState(
  params: SearchParams,
  catalog: Pick<CaseCatalog, "all">,
): ArchiveState {
  const options = facetOptions(catalog);
  const facets = Object.fromEntries(
    FACET_KEYS.map((key) => [
      key,
      readList(params, key).filter((value) => options[key].includes(value)),
    ]),
  ) as Record<FacetKey, string[]>;
  const col = readString(params, "col");
  return {
    kind: readOption(params, "kind", ARCHIVE_KINDS, "all"),
    topic: readTopic(params),
    q: (readString(params, "q") ?? "").slice(0, MAX_QUERY_LENGTH),
    sort: readOption(params, "sort", ARCHIVE_SORTS, "recent"),
    col: COLLECTION_IDS.find((id) => id === col),
    facets,
    near: parseNear(readString(params, "near")?.slice(0, MAX_QUERY_LENGTH)),
  };
}

/** The archive URL for a state; defaults are left out so the plain archive stays `/cases`. */
export function archiveHref(state: ArchiveState): string {
  const params = new URLSearchParams();
  if (state.kind !== "all") params.set("kind", state.kind);
  if (state.topic !== "all") params.set("topic", state.topic);
  if (state.q) params.set("q", state.q);
  if (state.near) params.set("near", nearParam(state.near));
  for (const key of FACET_KEYS) {
    for (const value of state.facets[key]) params.append(key, value);
  }
  if (state.col) params.set("col", state.col);
  if (state.sort !== "recent") params.set("sort", state.sort);
  const query = params.toString();
  return query ? `${ARCHIVE_PATH}?${query}` : ARCHIVE_PATH;
}

export function withTopic(state: ArchiveState, topic: ArchiveTopic): ArchiveState {
  return { ...state, topic };
}

function toggleFacet(state: ArchiveState, key: FacetKey, value: string): ArchiveState {
  const current = state.facets[key];
  const next = current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];
  return { ...state, facets: { ...state.facets, [key]: next } };
}

/** Back to every file: no topic, search, place, facet or shelf; the sort stays (POC clearAll). */
export function clearFilters(state: ArchiveState): ArchiveState {
  return { ...DEFAULT_ARCHIVE_STATE, sort: state.sort };
}

/* ---------- Active filters ---------- */

export type ActiveFilter =
  | { type: "kind"; value: "trend" }
  | { type: "col"; value: CollectionId }
  | { type: "near"; value: string }
  | { type: "q"; value: string }
  | { type: "facet"; key: FacetKey; value: string };

/** Filters in force, in the POC's chip order: kind, shelf, place, search, then facets. */
export function activeFilters(state: ArchiveState): ActiveFilter[] {
  const out: ActiveFilter[] = [];
  if (state.kind === "trend") out.push({ type: "kind", value: "trend" });
  if (state.col) out.push({ type: "col", value: state.col });
  if (state.near) out.push({ type: "near", value: state.near.name });
  if (state.q) out.push({ type: "q", value: state.q });
  for (const key of FACET_KEYS) {
    for (const value of state.facets[key]) out.push({ type: "facet", key, value });
  }
  return out;
}

export function withoutFilter(state: ArchiveState, filter: ActiveFilter): ArchiveState {
  switch (filter.type) {
    case "kind":
      return { ...state, kind: "all" };
    case "col":
      return { ...state, col: undefined };
    case "near":
      return { ...state, near: undefined };
    case "q":
      return { ...state, q: "" };
    case "facet":
      return toggleFacet(state, filter.key, filter.value);
  }
}
