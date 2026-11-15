import type { Reviewed } from "./rules";
import { PLANET } from "./rules";

/** POWER variable behind each anomaly-file reading. */
export const EVENT_VARS = { tmax: "T2M_MAX", rain: "PRECTOTCORR", soil: "GWETROOT" } as const;

type ReviewedSources = {
  trends: readonly { id: string; variable: string }[];
  /** The planet-wide sample counts as a reviewed trend at "planet" when it has a trend. */
  global: { variable: string; hasTrend: boolean } | null;
  events: readonly { id: string; vars: Partial<Record<string, unknown>> }[];
  auditCategories: readonly { id: string }[];
};

/**
 * Facts of class 2, "which analyses are reviewed", are never written by hand: they are read from
 * the data files the build scripts produce (POC rules.js reviewedFrom).
 */
export function reviewedFrom({
  trends,
  global,
  events,
  auditCategories,
}: ReviewedSources): Reviewed[] {
  const reviewed: Reviewed[] = trends.map((trend) => ({
    variable: trend.variable,
    type: "trend",
    place: trend.id,
  }));
  if (global?.variable && global.hasTrend) {
    reviewed.push({ variable: global.variable, type: "trend", place: PLANET });
  }
  for (const file of events) {
    for (const key of Object.keys(file.vars)) {
      const variable = EVENT_VARS[key as keyof typeof EVENT_VARS];
      if (variable && file.vars[key]) reviewed.push({ variable, type: "anomaly", place: file.id });
    }
  }
  for (const category of auditCategories) {
    reviewed.push({ variable: "EONET_COUNT", type: "catalog", place: category.id });
  }
  return reviewed;
}
