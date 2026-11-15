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
  enteringKey = "audit.entering",
): string {
  const kinds = catalogBreak.kinds.map((kind) => t(`audit.break.${kind}`));
  const entering = catalogBreak.entering.map((source) =>
    t(enteringKey, { src: sources[source] ?? source }),
  );
  return [...kinds, ...entering].join(" · ");
}

const categoryName = (id: string, { t }: Translator) => t(`cat.${id}`);

/** The answer of an audit file in one plain sentence (POC auditSentence). */
export function auditSentence(
  category: Pick<AuditCategory, "id" | "verdict" | "naiveFactor" | "span" | "total">,
  audit: Pick<EventAudit, "firstYear">,
  translator: Translator,
): string {
  const { t, locale } = translator;
  const cat = categoryName(category.id, translator).toLowerCase();
  if (category.verdict === "artifact") {
    return category.naiveFactor
      ? t("cf.audit.s.artifact.x", { cat, x: formatFigure(category.naiveFactor, 1) })
      : t("cf.audit.s.artifact", { cat });
  }
  if (category.verdict === "no-trend" && category.span) {
    return t("cf.audit.s.none", { cat, from: category.span[0], to: category.span[1] });
  }
  if (category.verdict === "trend") return t("cf.audit.s.trend", { cat });
  return t("cf.audit.s.few", {
    cat,
    n: category.total.toLocaleString(locale),
    from: audit.firstYear,
  });
}

/** The question an audit file answers: "Are there more and more wildfires, or are more recorded?" */
export function auditQuestion(category: Pick<AuditCategory, "id">, translator: Translator): string {
  return translator.t("cf.audit.q", { cat: categoryName(category.id, translator).toLowerCase() });
}

/** The audit card's title: the verdict with its figure (POC auditTitle). */
export function auditTitle(
  category: Pick<AuditCategory, "id" | "verdict" | "trend" | "naiveFactor" | "naiveChangePct">,
  translator: Translator,
): string {
  const { t } = translator;
  const cat = categoryName(category.id, translator);
  const { trend } = category;
  if (category.verdict === "trend" && trend) {
    const rate = formatFigure(Math.abs(trend.perDecade), 1);
    const isUp = trend.perDecade ? trend.perDecade > 0 : trend.tau > 0;
    const rare = rate === formatFigure(0, 1) ? ".rare" : "";
    return t(`chart.audit.title.trend.${isUp ? "up" : "down"}${rare}`, { cat, rate });
  }
  if (category.verdict === "no-trend") return t("chart.audit.title.no-trend", { cat });
  if ((category.naiveFactor ?? 0) >= 3) {
    return t("chart.audit.title.artifact.x", { cat, x: formatFigure(category.naiveFactor, 0) });
  }
  if (category.naiveChangePct !== null) {
    return t("chart.audit.title.artifact.pct", {
      cat,
      pct: `${formatFigure(category.naiveChangePct, 0, true)} %`,
    });
  }
  return t("chart.audit.title.artifact.jumps", { cat });
}
