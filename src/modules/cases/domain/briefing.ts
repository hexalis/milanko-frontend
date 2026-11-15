import type { EventFile, TrendCase } from "./case-file";
import type { CaseCatalog } from "./catalog";
import type { AuditCategory, EventAudit } from "./event-audit";

/*
 * What the Briefing picks from the data (POC app.js renderBriefing): one count per kind of
 * evidence, the opposite-trend pairs, the latest folders, the false suspect and the featured case.
 * Every figure comes from the data files, never from the text.
 */

const SHELF_SIZE = 3;

export type LedgerCount = { hits: number; total: number };

export type BriefingLedger = {
  /** Trend files whose Mann-Kendall test is significant. */
  trends: LedgerCount;
  /** Anomaly files whose run-up was very unusual. */
  events: LedgerCount;
  /** EONET categories whose yearly count shows a real trend once catalog breaks are set apart. */
  audit: LedgerCount;
};

export function briefingLedger(
  catalog: Pick<CaseCatalog, "trends" | "events">,
  audit: Pick<EventAudit, "categories">,
): BriefingLedger {
  return {
    trends: {
      hits: catalog.trends.filter((file) => file.t.significant).length,
      total: catalog.trends.length,
    },
    events: {
      hits: catalog.events.filter((file) => file.strength === "strong").length,
      total: catalog.events.length,
    },
    audit: {
      hits: audit.categories.filter((category) => category.verdict === "trend").length,
      total: audit.categories.length,
    },
  };
}

/** Longest record among the trend files, in years ("up to 45 years of NASA data"). */
export function longestRecord(trends: readonly TrendCase[]): number {
  return Math.max(0, ...trends.map((file) => file.series.length));
}

/** Each pair once, in catalog order: the file that comes first leads. */
export function oppositePairs(trends: readonly TrendCase[]): [TrendCase, TrendCase][] {
  return trends.flatMap((file, index) => {
    if (!file.pair) return [];
    const partnerIndex = trends.findIndex((candidate) => candidate.id === file.pair);
    const partner = trends[partnerIndex];
    return partner && partnerIndex > index ? [[file, partner] as [TrendCase, TrendCase]] : [];
  });
}

const byRecent = (a: TrendCase, b: TrendCase) =>
  b.publishedAt.localeCompare(a.publishedAt) || b.catalog.localeCompare(a.catalog);

export function latestTrends(trends: readonly TrendCase[], size = SHELF_SIZE): TrendCase[] {
  return trends.toSorted(byRecent).slice(0, size);
}

/** The latest strong anomaly of each category, so the shelf shows different kinds of event. */
export function latestStrongAnomalies(
  events: readonly EventFile[],
  size = SHELF_SIZE,
): EventFile[] {
  const newest = events
    .filter((file) => file.strength === "strong")
    .toSorted((a, b) => b.date.localeCompare(a.date));
  const seen = new Set<string>();
  return newest
    .filter((file) => {
      if (seen.has(file.category)) return false;
      seen.add(file.category);
      return true;
    })
    .slice(0, size);
}

/** The theme block's case: the confirmed trend with the most signal against its noise. */
export function featuredCase(trends: readonly TrendCase[]): TrendCase | undefined {
  return trends.filter((file) => file.t.significant).toSorted((a, b) => b.t.snr - a.t.snr)[0];
}

/** The false suspect: the catalog artifact whose raw yearly count grew the most. */
export function falseSuspect(
  categories: readonly AuditCategory[],
): (AuditCategory & { naiveFactor: number }) | undefined {
  return categories
    .filter(
      (category): category is AuditCategory & { naiveFactor: number } =>
        category.verdict === "artifact" && Boolean(category.naiveFactor),
    )
    .toSorted((a, b) => b.naiveFactor - a.naiveFactor)[0];
}
