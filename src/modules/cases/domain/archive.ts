import { caseTextHaystack, getTranslator } from "@/modules/copy";
import type { SearchParams } from "@/shared/lib/search-params";
import { readOption, readString } from "@/shared/lib/search-params";
import {
  fileDirection,
  fileP,
  fileSnr,
  fileSource,
  fileStrength,
  fileTheme,
  isEvent,
  verdictOf,
  type CaseFile,
  type EventFile,
  type TrendCase,
} from "./case-file";
import type { CaseCatalog } from "./catalog";
import { eventTitle } from "./event-title";

/*
 * The Case Files archive (POC app.js renderArchive): kind tabs, facet filters with counts,
 * curated collections, a search over both languages and three sorts. Everything here is pure;
 * the state lives in the URL and the page parses it with `parseArchiveState`.
 */

export const ARCHIVE_PATH = "/cases";

export const ARCHIVE_KINDS = ["all", "trend", "event"] as const;
export type ArchiveKind = (typeof ARCHIVE_KINDS)[number];

export const ARCHIVE_SORTS = ["recent", "evidence", "magnitude"] as const;
export type ArchiveSort = (typeof ARCHIVE_SORTS)[number];

export const COLLECTION_IDS = ["records", "opposite", "false", "arctic", "space"] as const;
export type CollectionId = (typeof COLLECTION_IDS)[number];

/** Facet keys double as URL parameter names, as in the POC (`ev` is the evidence strength). */
export const FACET_KEYS = ["region", "theme", "ev", "dir", "src"] as const;
export type FacetKey = (typeof FACET_KEYS)[number];

type FacetSelection = Readonly<Record<FacetKey, readonly string[]>>;

export type ArchiveState = {
  kind: ArchiveKind;
  /** Free text as typed (trimmed); matching normalizes it. */
  q: string;
  sort: ArchiveSort;
  col: CollectionId | undefined;
  facets: FacetSelection;
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

/** Search words a trend theme also answers to, in both languages (POC SYNONYMS). */
const SYNONYMS: Readonly<Record<string, string>> = {
  temperature: "temperature heat warm warming hot air arctic temperatura calor calentamiento aire",
  water:
    "water soil drought dry wet rain rainfall moisture agua suelo sequía seco húmedo lluvia humedad",
  vegetation:
    "vegetation green greening browning forest plants deforestation tundra ndvi vegetación verde bosque plantas deforestación",
};

const EMPTY_FACETS: FacetSelection = { region: [], theme: [], ev: [], dir: [], src: [] };

export const DEFAULT_ARCHIVE_STATE: ArchiveState = {
  kind: "all",
  q: "",
  sort: "recent",
  col: undefined,
  facets: EMPTY_FACETS,
};

/* ---------- Readings ---------- */

const KIND_TESTS: Record<ArchiveKind, (file: CaseFile) => boolean> = {
  all: () => true,
  trend: (file) => !isEvent(file),
  event: isEvent,
};

function isOfKind(file: CaseFile, kind: ArchiveKind): boolean {
  return KIND_TESTS[kind](file);
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

/** Options each facet offers, in display order; only values some file actually carries. */
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

/** Longest search kept from the URL; anything longer is cut, not rejected. */
const MAX_QUERY_LENGTH = 120;

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
    q: (readString(params, "q") ?? "").slice(0, MAX_QUERY_LENGTH),
    sort: readOption(params, "sort", ARCHIVE_SORTS, "recent"),
    col: COLLECTION_IDS.find((id) => id === col),
    facets,
  };
}

/** The archive URL for a state; defaults are left out so the plain archive stays `/cases`. */
export function archiveHref(state: ArchiveState): string {
  const params = new URLSearchParams();
  if (state.kind !== "all") params.set("kind", state.kind);
  if (state.q) params.set("q", state.q);
  for (const key of FACET_KEYS) {
    for (const value of state.facets[key]) params.append(key, value);
  }
  if (state.col) params.set("col", state.col);
  if (state.sort !== "recent") params.set("sort", state.sort);
  const query = params.toString();
  return query ? `${ARCHIVE_PATH}?${query}` : ARCHIVE_PATH;
}

export function withKind(state: ArchiveState, kind: ArchiveKind): ArchiveState {
  return { ...state, kind };
}

export function toggleCollection(state: ArchiveState, col: CollectionId): ArchiveState {
  return { ...state, col: state.col === col ? undefined : col };
}

export function toggleFacet(state: ArchiveState, key: FacetKey, value: string): ArchiveState {
  const current = state.facets[key];
  const next = current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];
  return { ...state, facets: { ...state.facets, [key]: next } };
}

/** Clears search, facets and collection; the kind tab and the sort stay (POC clearAll). */
export function clearFilters(state: ArchiveState): ArchiveState {
  return { ...state, q: "", col: undefined, facets: EMPTY_FACETS };
}

/* ---------- Active filters ---------- */

export type ActiveFilter =
  | { type: "col"; value: CollectionId }
  | { type: "q"; value: string }
  | { type: "facet"; key: FacetKey; value: string };

/** Filters in force, in the order the POC lists its chips: collection, search, then facets. */
export function activeFilters(state: ArchiveState): ActiveFilter[] {
  const out: ActiveFilter[] = [];
  if (state.col) out.push({ type: "col", value: state.col });
  if (state.q) out.push({ type: "q", value: state.q });
  for (const key of FACET_KEYS) {
    for (const value of state.facets[key]) out.push({ type: "facet", key, value });
  }
  return out;
}

export function withoutFilter(state: ArchiveState, filter: ActiveFilter): ArchiveState {
  switch (filter.type) {
    case "col":
      return { ...state, col: undefined };
    case "q":
      return { ...state, q: "" };
    case "facet":
      return toggleFacet(state, filter.key, filter.value);
  }
}

/** How many facet values plus the collection are selected (the search is counted apart). */
export function selectedFilterCount(state: ArchiveState): number {
  return FACET_KEYS.reduce((n, key) => n + state.facets[key].length, state.col ? 1 : 0);
}

/* ---------- Search ---------- */

/** Lower case without accents, so "Japon" finds "Japón" (POC norm). */
export function normalizeSearch(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function searchTerms(q: string): string[] {
  return normalizeSearch(q).split(/\s+/).filter(Boolean);
}

const en = getTranslator("en");
const es = getTranslator("es");
const bothLanguages = (key: string): string[] => [en.t(key), es.t(key)];

function trendHaystack(file: TrendCase): string[] {
  return [
    file.catalog,
    file.variable,
    SYNONYMS[file.theme] ?? "",
    caseTextHaystack(file.id),
    ...bothLanguages(`theme.${file.theme}`),
    ...bothLanguages(`reg.${file.region}`),
    ...bothLanguages(`var.${file.variable}`),
  ];
}

function eventHaystack(file: EventFile): string[] {
  // The Spanish title too: the folder says "Inundación en Japón", so "Japón" must find it.
  return [
    file.catalog,
    file.title,
    eventTitle(file.title, "es"),
    file.source?.id ?? "",
    ...bothLanguages(`cat.${file.category}`),
    ...bothLanguages(`reg.${file.region}`),
    ...bothLanguages(`pt.recent.${file.lead}`),
  ];
}

const haystacks = new WeakMap<CaseFile, string>();

/** Everything a file can be found by, in both languages, normalized. Cached: the data is static. */
function searchHaystack(file: CaseFile): string {
  let haystack = haystacks.get(file);
  if (haystack === undefined) {
    haystack = normalizeSearch(
      (isEvent(file) ? eventHaystack(file) : trendHaystack(file)).join(" "),
    );
    haystacks.set(file, haystack);
  }
  return haystack;
}

/** Every term must appear somewhere in the file's texts. */
export function matchesSearch(file: CaseFile, q: string): boolean {
  const terms = searchTerms(q);
  if (!terms.length) return true;
  const haystack = searchHaystack(file);
  return terms.every((term) => haystack.includes(term));
}

/* ---------- Filtering, counting, sorting ---------- */

type Skip = FacetKey | "col" | "q" | null;

/** Whether a file passes the state; `skip` leaves one filter out, for the counts beside it. */
function matchesArchive(file: CaseFile, state: ArchiveState, skip: Skip = null): boolean {
  if (!isOfKind(file, state.kind)) return false;
  if (state.col && skip !== "col" && !isInCollection(file, state.col)) return false;
  for (const key of FACET_KEYS) {
    if (key === skip) continue;
    const selected = state.facets[key];
    if (selected.length && !selected.includes(facetValue(file, key))) return false;
  }
  return skip === "q" || matchesSearch(file, state.q);
}

const fileDate = (file: CaseFile): string => (isEvent(file) ? file.date : file.publishedAt);

const SORT_COMPARE: Record<ArchiveSort, (a: CaseFile, b: CaseFile) => number> = {
  recent: (a, b) => fileDate(b).localeCompare(fileDate(a)) || b.catalog.localeCompare(a.catalog),
  evidence: (a, b) => fileP(a) - fileP(b),
  magnitude: (a, b) => fileSnr(b) - fileSnr(a),
};

export function sortFiles(files: readonly CaseFile[], sort: ArchiveSort): CaseFile[] {
  return [...files].sort(SORT_COMPARE[sort]);
}

export function filterArchive(catalog: Pick<CaseCatalog, "all">, state: ArchiveState): CaseFile[] {
  return sortFiles(
    catalog.all.filter((file) => matchesArchive(file, state)),
    state.sort,
  );
}

export function kindCounts(catalog: Pick<CaseCatalog, "all">): Record<ArchiveKind, number> {
  return {
    all: catalog.all.length,
    trend: catalog.all.filter(KIND_TESTS.trend).length,
    event: catalog.all.filter(KIND_TESTS.event).length,
  };
}

export type FacetCounts = Record<FacetKey, Record<string, number>>;

/** Results each option would give with every other filter kept (POC draw counts). */
export function facetCounts(catalog: Pick<CaseCatalog, "all">, state: ArchiveState): FacetCounts {
  const options = facetOptions(catalog);
  return Object.fromEntries(
    FACET_KEYS.map((key) => {
      const pool = catalog.all.filter((file) => matchesArchive(file, state, key));
      const counts = Object.fromEntries(
        options[key].map((value) => [
          value,
          pool.filter((file) => facetValue(file, key) === value).length,
        ]),
      );
      return [key, counts];
    }),
  ) as FacetCounts;
}

export function collectionCounts(
  catalog: Pick<CaseCatalog, "all">,
  state: ArchiveState,
): Record<CollectionId, number> {
  const pool = catalog.all.filter((file) => matchesArchive(file, state, "col"));
  return Object.fromEntries(
    COLLECTION_IDS.map((id) => [id, pool.filter((file) => isInCollection(file, id)).length]),
  ) as Record<CollectionId, number>;
}

/** For an empty result: the one filter whose removal brings back the most files. */
export function suggestRelaxation(
  catalog: Pick<CaseCatalog, "all">,
  state: ArchiveState,
): { filter: ActiveFilter; n: number } | null {
  let best: { filter: ActiveFilter; n: number } | null = null;
  for (const filter of activeFilters(state)) {
    const n = filterArchive(catalog, withoutFilter(state, filter)).length;
    if (n > 0 && (!best || n > best.n)) best = { filter, n };
  }
  return best;
}

export type ShelfGroup = { kind: Exclude<ArchiveKind, "all">; files: CaseFile[] };

/** Trend files first, then anomaly files, each keeping the chosen order. */
export function shelfGroups(files: readonly CaseFile[]): ShelfGroup[] {
  const groups: ShelfGroup[] = [
    { kind: "trend", files: files.filter(KIND_TESTS.trend) },
    { kind: "event", files: files.filter(KIND_TESTS.event) },
  ];
  return groups.filter((group) => group.files.length > 0);
}
