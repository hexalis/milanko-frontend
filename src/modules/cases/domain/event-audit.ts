import eventsData from "../data/events.json";
import type { Strength } from "./trend-stats";

/*
 * NASA EONET catalog audit, a snapshot built by the POC's scripts/build_events.py (data/events.json):
 * for each event category, the yearly count, the years the catalog itself changed (breaks) and
 * whether the clean stretch between those breaks shows a real trend. The per-sector counts in the
 * file feed the globe, which is not ported, so they are left out of this type.
 */

type AuditVerdict = "trend" | "no-trend" | "artifact" | "insufficient";

type BreakKind = "onset" | "composition" | "volume" | "gap" | "step";

export type CatalogBreak = {
  year: number;
  kinds: BreakKind[];
  /** Sources that join the catalog that year. */
  entering: string[];
};

export type AuditTrend = {
  p: number;
  tau: number;
  slope: number;
  slopeLow: number;
  slopeHigh: number;
  perDecade: number;
  mean: number;
  n: number;
};

export type AuditCategory = {
  id: string;
  title: string;
  total: number;
  /** [year, events logged that year], from the first year to the running one. */
  years: [year: number, count: number][];
  /** [source id, events], largest first. */
  sources: [source: string, count: number][];
  /** Events per source for each year. */
  mix: Record<string, Record<string, number>>;
  breaks: CatalogBreak[];
  step: { year: number; p: number; atBreak: boolean } | null;
  /** Raw change of the yearly count across the catalog, before setting the breaks apart. */
  naiveChangePct: number | null;
  naiveFactor: number | null;
  /** The longest stretch with no catalog change, the one tested for a trend. */
  span: [from: number, to: number] | null;
  trend: AuditTrend | null;
  verdict: AuditVerdict;
  strength: Strength | null;
};

export type EventAudit = {
  generated: string;
  firstYear: number;
  /** The year after it is still running, so its bar is partial. */
  lastCompleteYear: number;
  events: number;
  catalogBreaks: number[];
  swapped: number;
  sources: Record<string, string>;
  categories: AuditCategory[];
};

function buildAudit(): EventAudit {
  // JSON imports widen [year, count] tuples to number[] and verdicts to string; the build script guarantees the shape.
  const categories = eventsData.categories as unknown as AuditCategory[];
  return {
    generated: eventsData.generated,
    firstYear: eventsData.firstYear,
    lastCompleteYear: eventsData.lastCompleteYear,
    events: eventsData.events,
    catalogBreaks: eventsData.catalogBreaks,
    swapped: eventsData.swapped,
    sources: eventsData.sources as Record<string, string>,
    categories,
  };
}

let audit: EventAudit | undefined;

/** Built once per server process; the data is static. */
export function getEventAudit(): EventAudit {
  audit ??= buildAudit();
  return audit;
}

/** Last year in a category's count (the running year when the snapshot was taken mid-year). */
export function lastAuditYear(category: Pick<AuditCategory, "years">): number {
  return category.years.at(-1)?.[0] ?? 0;
}

/* ---------- Audit case files ---------- */

/** Each category of the audit opens as a case file at `/cases/audit-<category>` (POC #/case/audit-…). */
const AUDIT_FILE_PREFIX = "audit-";

export const auditFileId = (category: Pick<AuditCategory, "id">): string =>
  `${AUDIT_FILE_PREFIX}${category.id}`;

/** The audit category a case-file id names, if any. */
export function findAuditCategory(id: string, source: EventAudit = getEventAudit()) {
  if (!id.startsWith(AUDIT_FILE_PREFIX)) return undefined;
  const category = id.slice(AUDIT_FILE_PREFIX.length);
  return source.categories.find((candidate) => candidate.id === category);
}
