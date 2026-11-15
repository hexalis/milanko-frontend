import { period, type CaseCatalog } from "@/modules/cases";

/* The key figures that open the method page (POC renderMethod `facts`), all read from the data. */

export type MethodFacts = {
  firstYear: number;
  lastYear: number;
  files: number;
  anomalyFiles: number;
  points: number;
  windowDays: number;
  /** EONET events in the catalog audit (data/events.json). */
  auditedEvents: number;
};

export function methodFacts(catalog: CaseCatalog, auditedEvents: number): MethodFacts {
  const spans = catalog.trends.map((file) => period(file.series));
  return {
    firstYear: Math.min(catalog.global.from, ...spans.map(({ from }) => from)),
    lastYear: Math.max(catalog.global.to, ...spans.map(({ to }) => to)),
    files: catalog.all.length,
    anomalyFiles: catalog.events.length,
    auditedEvents,
    points: catalog.global.points,
    windowDays: catalog.eventWindowDays,
  };
}
