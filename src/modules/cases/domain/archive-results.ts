import {
  activeFilters,
  ARCHIVE_TOPICS,
  FACET_KEYS,
  facetValue,
  isInCollection,
  isInTopic,
  isOfKind,
  withoutFilter,
  type ActiveFilter,
  type ArchiveSort,
  type ArchiveState,
  type ArchiveTopic,
  type FacetKey,
} from "./archive";
import { matchesSearch } from "./archive-search";
import { fileP, fileSnr, isEvent, type CaseFile } from "./case-file";
import type { CaseCatalog } from "./catalog";
import { FAR_KM, kmToFile, resolvePlace, type NearPlace } from "./near";

/* What the archive shows for a state: the hits, their order, the counts and the near message. */

type Files = Pick<CaseCatalog, "all">;
type Skip = FacetKey | "col" | "q" | "topic" | null;

/** Whether a file passes the state; `skip` leaves one filter out, for the counts beside it. */
function matchesArchive(file: CaseFile, state: ArchiveState, skip: Skip = null): boolean {
  if (!isOfKind(file, state.kind)) return false;
  if (skip !== "topic" && !isInTopic(file, state.topic)) return false;
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

/** Nearest first when a place is set; otherwise the chosen sort. */
export function filterArchive(catalog: Files, state: ArchiveState): CaseFile[] {
  const hits = catalog.all.filter((file) => matchesArchive(file, state));
  const { near } = state;
  return near
    ? [...hits].sort((a, b) => kmToFile(near, a) - kmToFile(near, b))
    : sortFiles(hits, state.sort);
}

/** Files under the current topic (and old kind link), before search, place and chips. */
export function topicPool(catalog: Files, state: Pick<ArchiveState, "kind" | "topic">): number {
  return catalog.all.filter((file) => isOfKind(file, state.kind) && isInTopic(file, state.topic))
    .length;
}

/** How many files each topic would show with the search and the place kept (POC data-topicn). */
export function topicCounts(catalog: Files, state: ArchiveState): Record<ArchiveTopic, number> {
  const pool = catalog.all.filter((file) => matchesArchive(file, state, "topic"));
  return Object.fromEntries(
    ARCHIVE_TOPICS.map((topic) => [topic, pool.filter((file) => isInTopic(file, topic)).length]),
  ) as Record<ArchiveTopic, number>;
}

/** For an empty result: the one filter whose removal brings back the most files. */
export function suggestRelaxation(
  catalog: Files,
  state: ArchiveState,
): { filter: ActiveFilter; n: number } | null {
  let best: { filter: ActiveFilter; n: number } | null = null;
  for (const filter of activeFilters(state)) {
    const n = filterArchive(catalog, withoutFilter(state, filter)).length;
    if (n > 0 && (!best || n > best.n)) best = { filter, n };
  }
  return best;
}

export type ShelfGroup = { kind: "trend" | "event"; files: CaseFile[] };

/** Trend files first, then anomaly files, each keeping the chosen order. */
export function shelfGroups(files: readonly CaseFile[]): ShelfGroup[] {
  const groups: ShelfGroup[] = [
    { kind: "trend", files: files.filter((file) => !isEvent(file)) },
    { kind: "event", files: files.filter(isEvent) },
  ];
  return groups.filter((group) => group.files.length > 0);
}

/* ---------- Search near ---------- */

export type NearSearch =
  | { state: ArchiveState; place: "none" }
  | { state: ArchiveState; place: "found" }
  | { state: ArchiveState; place: "not-found"; text: string };

/**
 * The search box also finds a place (POC searchNear): when the words match no file, they are
 * read as a place and the files are ordered around it; the words then leave the search.
 */
export function resolveNearSearch(catalog: Files, state: ArchiveState): NearSearch {
  if (!state.q || filterArchive(catalog, state).length) return { state, place: "none" };
  const near = resolvePlace(state.q, catalog.all);
  if (!near) return { state, place: "not-found", text: state.q };
  return { state: { ...state, q: "", near }, place: "found" };
}

/** What the near message says: the place, how far the nearest file is, and whether that is far. */
export function nearSummary(place: NearPlace, hits: readonly CaseFile[]) {
  const nearest = hits[0];
  const km = nearest ? kmToFile(place, nearest) : Number.POSITIVE_INFINITY;
  return { km, isFar: km > FAR_KM };
}
