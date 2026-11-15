import Link from "next/link";
import { ChartCaption, ChartHead, fileName, SeriesChart } from "@/modules/cases";
import { buttonLink } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { askHref, HUNCHES, type Hunch } from "../domain/ask-state";
import { GUIDED_SOURCE, unitText } from "../domain/guided";
import { StepLead, type StepProps } from "./guided-parts";

/*
 * Step 4 · The reader's hypothesis (POC ask.js L192–225). The points come alone, with no trend line.
 * The three hunches are links that put `h` in the URL, so the feedback is rendered on the server
 * and every later step carries the hunch.
 */

const HUNCH_ICON: Record<Hunch, string> = { up: "up", down: "down", unsure: "flat" };

/* A DS secondary button that reads as chosen once it is the reader's hunch. */
const HUNCH_LINK = `${buttonLink({ intent: "secondary" })} min-h-[52px] aria-[current=true]:bg-bg-inverse aria-[current=true]:text-text-inverse`;

export function StepHypothesis({ view, translator, catalog }: StepProps) {
  const { t, locale } = translator;
  const { question, file, depth, hunch } = view;
  const from = file.series[0]?.[0];
  const to = file.series.at(-1)?.[0];
  const variable = t(`var.${file.variable}`);
  const unit = unitText(file.unit, locale);
  return (
    <>
      <StepLead>{t("ask.hyp.lead")}</StepLead>
      <div className="rounded-card bg-bg-surface shadow-card medium:p-5 flex flex-col gap-3 p-3">
        <ChartHead
          subtitle={t("chart.case.sub", {
            v: variable,
            agg: t("chart.case.agg.year"),
            unit,
            from,
            to,
            n: file.series.length,
          })}
        />
        <SeriesChart
          data={file.series}
          trend={null}
          digits={file.digits}
          unit={unit}
          direction="flat"
          label={t("ask.hyp.chart.aria", {
            v: variable,
            place: fileName(file, { translator, catalog }),
            from,
            to,
          })}
        />
        <ChartCaption>{t("case.evidence.caption", { source: GUIDED_SOURCE })}</ChartCaption>
      </div>
      <section aria-labelledby="hunch-legend" className="flex flex-col gap-3">
        <h2 id="hunch-legend" className="text-heading-h3 font-display text-text-primary">
          {t("ask.hyp.legend")}
        </h2>
        <ul className="flex flex-wrap gap-3">
          {HUNCHES.map((option) => (
            <li key={option}>
              <Link
                href={askHref(question.id, { step: 4, depth, hunch: option })}
                scroll={false}
                replace
                aria-current={option === hunch ? "true" : undefined}
                className={HUNCH_LINK}
              >
                <Icon name={HUNCH_ICON[option]} />
                {t(`ask.hyp.${option}`)}
              </Link>
            </li>
          ))}
        </ul>
        <p className="text-body-l text-text-primary min-h-[3em] max-w-[68ch]" aria-live="polite">
          {hunch ? (
            t(`ask.hyp.fb.${hunch}`)
          ) : (
            <span className="text-text-secondary">{t("ask.hyp.skip")}</span>
          )}
        </p>
      </section>
    </>
  );
}
