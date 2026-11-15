import type { ReactNode } from "react";
import { formatDate, trendText, unitLabel } from "@/modules/cases";
import { Icon } from "@/shared/ui/icon";
import { ExternalLink } from "@/shared/ui/text-link";
import { GRID_CELL, questionTitle } from "../domain/guided";
import { StepLead, type StepProps } from "./guided-parts";

/* Step 3 · The clues we will follow (POC ask.js L177–189) */

const POWER_URL = "https://power.larc.nasa.gov/";

type ClueProps = { icon: string; title: string; children: ReactNode; science?: ReactNode };

function Clue({ icon, title, children, science }: ClueProps) {
  return (
    <li className="rounded-card bg-bg-surface shadow-card grid grid-cols-[1.75rem_minmax(0,1fr)] gap-3.5 px-5 py-[18px]">
      <span className="text-text-brand mt-0.5 text-[26px]">
        <Icon name={icon} />
      </span>
      <div className="flex flex-col gap-1">
        <h2 className="text-heading-h4 font-display text-text-primary">{title}</h2>
        <p className="text-body-m text-text-secondary">{children}</p>
        {science}
      </div>
    </li>
  );
}

function ScienceLine({ label, children }: { label: string; children: ReactNode }) {
  return (
    <p className="text-body-s text-text-tertiary mt-2">
      <span>{label}</span> <span className="font-mono">{children}</span>
    </p>
  );
}

export function StepClues({ view, translator, catalog }: StepProps) {
  const { t, locale } = translator;
  const { question, file, depth } = view;
  const isScience = depth === "science";
  const unit = unitLabel(file.unit, locale);
  const from = file.series[0]?.[0];
  const to = file.series.at(-1)?.[0];
  const built = catalog.generated ? formatDate(catalog.generated, locale) : "—";
  return (
    <>
      <StepLead>
        {t("ask.clues.lead", { q: questionTitle(question, { translator, catalog }) })}
      </StepLead>
      <ul className="medium:grid-cols-2 grid gap-4">
        <Clue
          icon={question.theme}
          title={t("ask.clue.var")}
          science={
            isScience ? <ScienceLine label={t("ask.sci.code")}>{file.variable}</ScienceLine> : null
          }
        >
          <strong className="text-text-primary">
            {t(`var.${file.variable}`)}
            {unit ? ` (${unit})` : ""}.
          </strong>{" "}
          {t(`ask.var.${file.variable}.d`)}
        </Clue>
        <Clue
          icon="chart"
          title={t("ask.clue.agg")}
          science={
            isScience ? (
              <ScienceLine label={t("case.detail.metric")}>
                {trendText(file, "metric", { translator, catalog })}
              </ScienceLine>
            ) : null
          }
        >
          {t("ask.clue.agg.d")}
        </Clue>
        <Clue
          icon="calendar"
          title={t("ask.clue.period")}
          science={isScience ? <ScienceLine label={t("ask.sci.built")}>{built}</ScienceLine> : null}
        >
          {t("ask.clue.period.d", { from, to, n: file.series.length })}
        </Clue>
        <Clue
          icon="satellite"
          title={t("ask.clue.source")}
          science={
            isScience ? (
              <>
                <ScienceLine label={t("ask.sci.cell")}>{GRID_CELL}</ScienceLine>
                <p className="text-body-s mt-2">
                  <ExternalLink href={POWER_URL} newTabHint={t("link.newTab")}>
                    power.larc.nasa.gov
                  </ExternalLink>
                </p>
              </>
            ) : null
          }
        >
          {t("ask.clue.source.d")}
        </Clue>
      </ul>
    </>
  );
}
