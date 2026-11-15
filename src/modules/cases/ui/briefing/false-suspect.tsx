import type { Translator } from "@/shared/lib/i18n";
import { Icon } from "@/shared/ui/icon";
import { auditEvidence, auditSubtitle, breakText } from "../../domain/audit-text";
import { lastAuditYear, type AuditCategory, type EventAudit } from "../../domain/event-audit";
import { formatFigure } from "../../domain/format";
import { ChartHead } from "../dossier/doc-parts";
import { AuditBars } from "./audit-bars";

type FalseSuspectProps = {
  suspect: AuditCategory & { naiveFactor: number };
  audit: EventAudit;
  /** EONET categories with a real trend once the catalog breaks are set apart. */
  realTrends: number;
  translator: Translator;
};

/*
 * The false suspect (POC renderBriefing L691-701, explained chart from auditHTML L1795-1820): the
 * category whose raw count grew the most only because the catalog changed. Deferred: the POC's
 * "See the catalog audit" button, until the audit tab of Case Files is ported.
 */
export function FalseSuspect({ suspect, audit, realTrends, translator }: FalseSuspectProps) {
  const { t, locale } = translator;
  const category = t(`cat.${suspect.id}`);
  const firstBreak = suspect.breaks[0]?.year;
  const lastBreak = suspect.breaks.at(-1)?.year;
  return (
    <section
      aria-labelledby="suspect-title"
      className="rounded-shell bg-surface-tone-5 text-text-primary expanded:grid-cols-2 medium:p-10 shadow-card grid items-center gap-8 p-6"
    >
      <div className="flex flex-col gap-3">
        <p className="text-label-l text-feedback-danger-fg flex items-center gap-2">
          <Icon name="warning" />
          {t("brief.suspect.kind")}
        </p>
        <h2 id="suspect-title" className="text-heading-h2 font-display text-balance">
          {t("brief.suspect.title", {
            cat: category,
            catl: category.toLocaleLowerCase(locale),
            x: formatFigure(suspect.naiveFactor, 0),
          })}
        </h2>
        {firstBreak !== undefined && lastBreak !== undefined ? (
          <p className="text-body-l font-reading text-text-secondary max-w-[60ch]">
            {t(realTrends ? "brief.suspect.lead" : "brief.suspect.lead0", {
              from: firstBreak,
              to: lastBreak,
              n: suspect.breaks.length,
              real: realTrends,
              cats: audit.categories.length,
            })}
          </p>
        ) : null}
      </div>
      <figure className="rounded-card bg-bg-surface shadow-card medium:p-5 flex min-w-0 flex-col gap-3 p-4">
        <ChartHead
          subtitle={auditSubtitle(suspect, audit, translator)}
          purpose={t("chart.audit.purpose")}
        />
        <AuditBars
          years={suspect.years}
          span={suspect.span}
          breaks={suspect.breaks.map((catalogBreak) => catalogBreak.year)}
          partialFrom={audit.lastCompleteYear + 1}
          label={t("audit.chart.aria", {
            cat: category,
            from: audit.firstYear,
            to: lastAuditYear(suspect),
          })}
          spanLabel={t("audit.span")}
          locale={locale}
        />
        <ul className="text-body-s text-text-secondary flex flex-wrap gap-x-5 gap-y-1">
          {suspect.span ? (
            <li className="flex items-center gap-2">
              <span aria-hidden="true" className="bg-chart-band inline-block h-3 w-5 rounded-xs" />
              {t("audit.span")}
            </li>
          ) : null}
          <li className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="border-chart-annotation inline-block h-4 w-0 border-l-2 border-dashed"
            />
            {t("audit.break")}
          </li>
        </ul>
        <figcaption className="flex flex-col gap-2">
          <p className="text-body-m text-text-primary">{auditEvidence(suspect, translator)}</p>
          {suspect.breaks.length ? (
            <ul className="text-body-s text-text-secondary flex flex-col gap-1">
              {suspect.breaks.map((catalogBreak) => (
                <li key={catalogBreak.year} className="flex gap-3">
                  <span className="text-text-primary font-mono font-semibold tabular-nums">
                    {catalogBreak.year}
                  </span>
                  <span>{breakText(catalogBreak, audit.sources, translator)}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </figcaption>
      </figure>
    </section>
  );
}
