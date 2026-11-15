import { changeLabel, fileName, formatFigure, rateLabel, unitLabel } from "@/modules/cases";
import { Table, Td, Th, Tr } from "@/shared/ui/table";
import { askPath, HUNCHES, type Hunch } from "../domain/ask-state";
import { unitText } from "../domain/guided";
import { GuidedSources, LessonMore, RateFigure, StepLead, type StepProps } from "./guided-parts";
import { GuidedChart, GuidedQuiz } from "./guided-quiz";

/*
 * Screen "guess" · hypothesis and reconstruction together (POC ask.js renderAsk, sk === "guess"):
 * the points first, the line once the reader has said what they see.
 */

const HUNCH_ICON: Record<Hunch, string> = { up: "up", down: "down", unsure: "flat" };

/** Folded under the result: the figures behind the chart and where they come from. */
function NumbersFold({ view, translator }: Omit<StepProps, "catalog">) {
  const { t, locale } = translator;
  const { file } = view;
  const variable = t(`var.${file.variable}`);
  const unit = unitText(file.unit, locale);
  const digits = file.digits + 1;
  return (
    <LessonMore summary={t("ask.numbers")}>
      <Table
        caption={variable}
        head={
          <>
            <Th>{t("tbl.year")}</Th>
            <Th>
              {variable}
              {unitLabel(file.unit, locale) ? ` (${unit})` : ""}
            </Th>
            <Th>{t("case.chart.inline.trend")}</Th>
          </>
        }
      >
        {file.series.map(([year, value]) => (
          <Tr key={year}>
            <Td>
              <span className="font-mono">{year}</span>
            </Td>
            <Td>
              <span className="tabular-nums">{formatFigure(value, digits)}</span>
            </Td>
            <Td>
              <span className="tabular-nums">
                {formatFigure(file.t.intercept + file.t.slope * year, digits)}
              </span>
            </Td>
          </Tr>
        ))}
      </Table>
      <GuidedSources variable={file.variable} translator={translator} />
    </LessonMore>
  );
}

export function ScreenGuess(props: StepProps) {
  const { view, translator, catalog } = props;
  const { t } = translator;
  const { question, file, direction, depth, hunch, reading } = view;
  const context = { translator, catalog };
  return (
    <>
      <StepLead>{t("ask.hyp.lead")}</StepLead>
      <GuidedChart {...props} withTrend={hunch !== undefined} />
      <GuidedQuiz
        action={askPath(question.id)}
        name="h"
        legend={t("ask.hyp.legend")}
        picked={hunch}
        keep={{ s: "guess", depth, r: reading }}
        options={HUNCHES.map((value) => ({
          value,
          icon: HUNCH_ICON[value],
          label: t(`ask.hyp.${value}`),
        }))}
      />
      {hunch ? (
        <section aria-labelledby="ask-reveal" className="flex flex-col gap-3">
          <h2
            id="ask-reveal"
            className="font-display text-text-primary text-[clamp(22px,2.4vw,28px)] leading-tight font-semibold"
          >
            {t(file.t.significant ? "case.claim" : "case.claim.flat", {
              v: t(`var.${file.variable}`),
              place: fileName(file, context),
              total: changeLabel(file, context),
              from: file.series[0]?.[0],
            })}
          </h2>
          <RateFigure
            direction={direction}
            rate={rateLabel(file, context)}
            perDecade={t("perDecade")}
          />
          <NumbersFold view={view} translator={translator} />
        </section>
      ) : null}
    </>
  );
}
