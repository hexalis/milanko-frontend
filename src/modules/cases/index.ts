/*
 * Public API of the case files for other modules (the method page and its labs, the guided
 * investigation of "I have a question", the globe explorer, the app shell's rail). Export only
 * what a consumer needs; the archive and the dossiers stay internal.
 *
 * Client components (the method labs) import this barrel too. The data loaders below must stay
 * side-effect free so tree-shaking keeps the case JSON (~220 KB) out of client bundles; check
 * .next/static for a case id such as "ETD-2026-001" after changing this file.
 */
export {
  period,
  trendDirection,
  verdictOf,
  type Direction,
  type Point,
  type TrendCase,
} from "./domain/case-file";
export { ARCHIVE_FOCUS_HREF, ARCHIVE_SEARCH_ID } from "./domain/archive";
export { getCaseSummaries, type CaseSummary } from "./domain/case-summary";
export { getCaseCatalog, type CaseCatalog } from "./domain/catalog";
export { getEventAudit } from "./domain/event-audit";
export { eventTitle } from "./domain/event-title";
export {
  changeLabel,
  fileName,
  rateLabel,
  strengthWord,
  trendText,
  verdictLabel,
} from "./domain/file-text";
export {
  formatCoordinates,
  formatDate,
  formatFigure,
  formatOdds,
  formatP,
  unitLabel,
} from "./domain/format";
export { analyzeTrend } from "./domain/trend-stats";
export {
  ChartCaption,
  ChartHead,
  EvidenceBlock,
  SourcesList,
  THEME_TONE,
} from "./ui/dossier/doc-parts";
export { GlossaryTerm } from "./ui/dossier/glossary-term";
export { TrendReadout } from "./ui/dossier/trend-readout";
export { EvidenceMeter } from "./ui/evidence-meter";
export { SeriesChart } from "./ui/series-chart";
export { Sparkline } from "./ui/sparkline";
export { VerdictStamp } from "./ui/verdict-stamp";
