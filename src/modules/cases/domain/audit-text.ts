import type { Translator } from "@/shared/lib/i18n";
import type { AuditCategory, CatalogBreak, EventAudit } from "./event-audit";
import { lastAuditYear } from "./event-audit";
import { formatFigure, formatOdds } from "./format";

/*
 * Wording of a catalog audit chart (POC app.js eonetSub, auditEvidence and the audit card's break
 * list). The figures come from data/events.json.
 */

type AuditContext = Pick<EventAudit, "firstYear" | "lastCompleteYear">;

/** What the bars count, the period (the running year marked) and the total. */
export function auditSubtitle(
  category: Pick<AuditCategory, "years" | "total">,
  audit: AuditContext,
  { t, locale }: Translator,
): string {
  const to = lastAuditYear(category);
  return t(to > audit.lastCompleteYear ? "chart.audit.sub.partial" : "chart.audit.sub", {
    from: audit.firstYear,
    to,
    n: category.total.toLocaleString(locale),
  });
}

/** The line under the chart: only the evidence (the tested span and what its test says). */
export function auditEvidence(
  category: Pick<AuditCategory, "verdict" | "span" | "trend">,
  translator: Translator,
): string {
  const { t } = translator;
  const { trend } = category;
  const span = category.span ? { from: category.span[0], to: category.span[1] } : {};
  if (category.verdict === "trend" && trend) {
    return t("chart.audit.read.trend", { ...span, odds: formatOdds(trend.p, translator) });
  }
  if (category.verdict === "no-trend" && trend) {
    return t("chart.audit.read.no-trend", {
      ...span,
      rate: formatFigure(trend.perDecade, 1, true),
    });
  }
  return trend ? t("chart.audit.read.artifact.span", span) : t("chart.audit.read.artifact.nospan");
}

/** "source mix changed · volume jump · GDACS enters" for one catalog break. */
export function breakText(
  catalogBreak: CatalogBreak,
  sources: Readonly<Record<string, string>>,
  { t }: Translator,
): string {
  const kinds = catalogBreak.kinds.map((kind) => t(`audit.break.${kind}`));
  const entering = catalogBreak.entering.map((source) =>
    t("audit.entering", { src: sources[source] ?? source }),
  );
  return [...kinds, ...entering].join(" · ");
}
