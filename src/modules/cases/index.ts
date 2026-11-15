/*
 * Public API of the case files for other modules (the method page and its labs).
 * Export only what a consumer needs; the archive and the dossiers stay internal.
 *
 * Client components (the method labs) import this barrel too. The data loaders below must stay
 * side-effect free so tree-shaking keeps the case JSON (~220 KB) out of client bundles; check
 * .next/static for a case id such as "ETD-2026-001" after changing this file.
 */
export { period, trendDirection, type Point } from "./domain/case-file";
export { getCaseCatalog, type CaseCatalog } from "./domain/catalog";
export { getEventAudit } from "./domain/event-audit";
export { formatFigure, formatOdds, formatP } from "./domain/format";
export { analyzeTrend } from "./domain/trend-stats";
export { EvidenceMeter } from "./ui/evidence-meter";
export { SeriesChart } from "./ui/series-chart";
export { VerdictStamp } from "./ui/verdict-stamp";
