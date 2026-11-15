import type { Translator } from "@/shared/lib/i18n";
import { Icon } from "@/shared/ui/icon";
import { EVENT_UNITS, type EventFile, type EventVariable } from "../../domain/case-file";
import { eventHeadline } from "../../domain/file-text";
import { formatFigure } from "../../domain/format";
import { anomalyStrips, eventYear, type PercentileBand } from "../../domain/readout";
import { GlossaryTerm } from "./glossary-term";

/*
 * Appendix readout of an anomaly file (POC anomalyReadout): every year of the run-up window as a
 * dot, the average as a short line and the event year as the large dot.
 */

export const EVENT_VARIABLE_ICON: Record<EventVariable, string> = {
  tmax: "heat",
  rain: "rain",
  soil: "soil",
};

const THIS_YEAR_FILL: Record<PercentileBand, string> = {
  "very-high": "bg-trend-up",
  high: "bg-trend-up",
  usual: "bg-text-primary",
  low: "bg-trend-down",
  "very-low": "bg-trend-down",
};

export function LeadTag({ label }: { label: string }) {
  return (
    <span className="bg-status-ok-bg text-text-link text-label-xs rounded-sm px-1.5 py-0.5 uppercase">
      {label}
    </span>
  );
}

export function AnomalyReadout({ file, translator }: { file: EventFile; translator: Translator }) {
  const { t } = translator;
  const year = eventYear(file);
  const strips = anomalyStrips(file);

  return (
    <div className="grid gap-3">
      {strips.map((strip, index) => {
        const { unit, digits } = EVENT_UNITS[strip.variable];
        const withUnit = (value: number) =>
          `${formatFigure(value, digits)}${unit ? ` ${unit}` : ""}`;
        const name = t(`pt.recent.${strip.variable}`);
        return (
          <figure
            key={strip.variable}
            className="rounded-card bg-bg-surface shadow-card m-0 flex flex-col gap-3 p-4"
          >
            <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-body-m-strong text-text-primary inline-flex items-center gap-2">
                <Icon name={EVENT_VARIABLE_ICON[strip.variable]} />
                {name}
                {strip.isLead ? <LeadTag label={t("ev.lead")} /> : null}
              </span>
              <span className="text-body-s text-text-secondary">
                {t("ev.rank", { r: strip.reading.rank, n: strip.reading.years })} ·{" "}
                {index === 0 ? (
                  <>
                    <GlossaryTerm term="pct" translator={translator} /> {strip.reading.percentile}
                  </>
                ) : (
                  t("ev.pct", { p: strip.reading.percentile })
                )}
              </span>
            </figcaption>
            <p className="sr-only">{`${name}: ${eventHeadline(strip.variable, strip.reading, { translator })}`}</p>
            <div
              aria-hidden="true"
              className="before:bg-border-subtle relative h-7 before:absolute before:inset-x-0 before:top-1/2 before:h-px"
            >
              {strip.years.map((dot) => (
                <i
                  key={dot.year}
                  title={`${dot.year} · ${withUnit(dot.value)}`}
                  className="bg-text-tertiary absolute top-1/2 -mt-1 -ml-1 size-2 rounded-full"
                  style={{ left: `${dot.position}%` }}
                />
              ))}
              <span
                className="bg-text-secondary absolute inset-y-[3px] -ml-px w-0.5 rounded-sm"
                style={{ left: `${strip.meanPosition}%` }}
              />
              <b
                title={`${year} · ${withUnit(strip.reading.value)}`}
                className={`ring-bg-surface absolute top-1/2 -mt-2 -ml-2 size-4 rounded-full ring-[3px] ${THIS_YEAR_FILL[strip.band]}`}
                style={{ left: `${strip.valuePosition}%` }}
              />
            </div>
            <div
              className="text-body-s text-text-tertiary flex justify-between font-mono"
              aria-hidden="true"
            >
              <span>{withUnit(strip.min)}</span>
              <span>{withUnit(strip.max)}</span>
            </div>
          </figure>
        );
      })}
      <p className="text-body-s text-text-secondary flex flex-wrap items-center gap-1.5">
        <span className="bg-text-primary size-3 rounded-full" aria-hidden="true" />
        {year}
        <span className="bg-text-tertiary ml-2 size-2 rounded-full" aria-hidden="true" />
        {t("ro.strip.years", { from: file.lv.from, to: year - 1 })}
        <span className="bg-text-secondary ml-2 h-3 w-0.5 rounded-sm" aria-hidden="true" />
        {t("ro.strip.mean")}
      </p>
    </div>
  );
}
