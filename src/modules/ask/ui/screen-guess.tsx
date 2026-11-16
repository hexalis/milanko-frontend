import { changeLabel, fileName, formatFigure, rateLabel, unitLabel } from "@/modules/cases";
import { Icon } from "@/shared/ui/icon";
import { Table, Td, Th, Tr } from "@/shared/ui/table";
import { askPath, HUNCHES, type Hunch } from "../domain/ask-state";
import { hunchSheet, unitText } from "../domain/guided";
import { GuidedSources, LessonMore, StepLead, type StepProps } from "./guided-parts";
import { GuidedChart, GuidedQuiz } from "./guided-quiz";
import { RevealScroll } from "./reveal-scroll";

/*
 * Screen "guess" · hypothesis and reconstruction together (POC ask.js renderAsk, sk === "guess"):
 * the points first; once the reader has said what they see, their answer folds into a chip, the
 * chart comes into view with their call beside the line as it draws in, and three figures say
 * what the numbers mean, with every year one fold away.
 */

const HUNCH_ICON: Record<Hunch, string> = { up: "up", down: "down", unsure: "flat" };

type Figure = { key: string; label: string; value: string; note: string; isLead?: boolean };

/** What the numbers say: where the line starts, where it ends, and the change between. */
function NumbersRead({ view, translator, catalog }: StepProps) {
  const { t, locale } = translator;
  const { file } = view;
  const context = { translator, catalog };
  const unit = unitText(file.unit, locale);
  const withUnit = (value: number) =>
    `${formatFigure(value, file.digits)}${unitLabel(file.unit, locale) ? ` ${unit}` : ""}`;
  const from = file.series[0]?.[0] ?? 0;
  const to = file.series.at(-1)?.[0] ?? 0;
  const lineAt = (year: number) => file.t.intercept + file.t.slope * year;
  const figures: Figure[] = [
    {
      key: "start",
      label: t("ask.num.start"),
      value: withUnit(lineAt(from)),
      note: t("ask.num.start.d", { year: from }),
    },
    {
      key: "end",
      label: t("ask.num.end"),
      value: withUnit(lineAt(to)),
      note: t("ask.num.end.d", { year: to }),
    },
    {
      key: "change",
      label: t("ask.num.change"),
      value: changeLabel(file, context),
      note: `${rateLabel(file, context)} ${t("perDecade")}`,
      isLead: true,
    },
  ];
  return (
    <section aria-labelledby="ask-numbers" className="flex flex-col gap-3">
      <h3 id="ask-numbers" className="text-heading-h4 text-text-primary">
        {t("ask.num.title")}
      </h3>
      <ol className="medium:grid-cols-[1fr_auto_1fr_auto_1fr] grid grid-cols-1 items-stretch gap-2">
        {figures.map((figure, index) => (
          <li key={figure.key} className="contents">
            {index > 0 ? (
              <span
                aria-hidden="true"
                className="text-text-tertiary medium:flex hidden items-center justify-center"
              >
                <Icon name="arrow-right" />
              </span>
            ) : null}
            <div
              className={
                figure.isLead
                  ? "rounded-card bg-surface-tone-3 flex flex-col gap-0.5 p-4"
                  : "rounded-card bg-bg-surface shadow-card flex flex-col gap-0.5 p-4"
              }
            >
              <span className="text-label-s text-text-secondary font-semibold">{figure.label}</span>
              <span className="font-display text-text-primary text-[22px] leading-tight font-semibold tabular-nums">
                {figure.value}
              </span>
              <span className="text-body-s text-text-secondary">{figure.note}</span>
            </div>
          </li>
        ))}
      </ol>
      <p className="text-body-s text-text-secondary flex items-start gap-2">
        <span className="text-text-brand mt-0.5 flex">
          <Icon name="info-on" />
        </span>
        {t("ask.num.why")}
      </p>
      <NumbersFold view={view} translator={translator} />
    </section>
  );
}

/** Folded under the figures: every year, and where the numbers come from. */
function NumbersFold({ view, translator }: Omit<StepProps, "catalog">) {
  const { t, locale } = translator;
  const { file } = view;
  const variable = t(`var.${file.variable}`);
  const unit = unitText(file.unit, locale);
  const digits = file.digits + 1;
  return (
    <LessonMore summary={t("ask.num.all")}>
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
  const quiz = (
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
  );
  if (!hunch) {
    return (
      <>
        <StepLead>{t("ask.hyp.lead")}</StepLead>
        <GuidedChart {...props} withTrend={false} />
        {quiz}
      </>
    );
  }
  const call = {
    yoursLabel: t("ask.call.yours"),
    yours: t(`ask.hyp.${hunch}`),
    yoursIcon: HUNCH_ICON[hunch],
    lineLabel: t("ask.call.line"),
    line: `${rateLabel(file, context)} ${t("perDecade")}`,
    isMatch: hunchSheet(hunch, file, direction, context).kind === "match",
  };
  return (
    <>
      {quiz}
      <RevealScroll tour="guess-reveal" className="flex flex-col gap-4">
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
        <GuidedChart {...props} withTrend call={call} />
      </RevealScroll>
      <NumbersRead {...props} />
    </>
  );
}
