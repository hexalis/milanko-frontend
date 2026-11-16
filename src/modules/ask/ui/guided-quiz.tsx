import Form from "next/form";
import { ChartCaption, ChartHead, fileName, SeriesChart, trendText } from "@/modules/cases";
import { Icon } from "@/shared/ui/icon";
import { GUIDED_SOURCE, unitText } from "../domain/guided";
import type { StepProps } from "./guided-parts";

/*
 * The two quizzes of the lesson (POC ask.js tilesHTML and lessonQuiz): big tiles, one choice, and
 * the dock's "Check" submits it. The form is a GET to the same screen, so the answer lands in the
 * URL (h or r) and the server renders what the test says. Once answered, the other tiles go quiet.
 */

export const QUIZ_FORM_ID = "ask-quiz";

type QuizOption = { value: string; icon: string; label: string };

type GuidedQuizProps = {
  /** Where the GET form goes: the question's own page. */
  action: string;
  /** The URL key that holds the answer ("h" or "r"). */
  name: string;
  legend: string;
  options: QuizOption[];
  picked?: string;
  /** Everything else the URL already carries (s, depth, the other answer). */
  keep: Record<string, string | undefined>;
};

const TILE = [
  "group/tile relative flex cursor-pointer gap-2.5 rounded-[18px] border-2 border-transparent bg-bg-surface p-4",
  "flex-row items-center min-h-16 medium:min-h-24 medium:flex-col medium:items-start",
  "text-body-m font-semibold text-text-primary",
  "shadow-[0_1px_2px_rgb(0_0_0/0.06),0_4px_0_var(--color-border-subtle)]",
  "transition-[translate,border-color,box-shadow] duration-fast ease-standard",
  "active:scale-[0.97] motion-reduce:active:scale-100",
  "has-checked:border-action-primary has-checked:shadow-[0_1px_2px_rgb(0_0_0/0.06),0_4px_0_var(--color-action-primary)]",
  "has-disabled:cursor-default has-disabled:opacity-45 has-disabled:active:scale-100",
  "has-focus-visible:outline-3 has-focus-visible:outline-offset-3 has-focus-visible:outline-focus-ring",
].join(" ");

/*
 * Once answered, the tiles fold into one row of chips: the choice stays readable, and the result
 * it unlocks moves up into view instead of below a wall of tiles.
 */
const TILE_DONE = [
  "group/tile relative flex items-center gap-2 rounded-full border-2 border-transparent bg-bg-surface py-1.5 ps-1.5 pe-4",
  "text-label-m font-semibold text-text-primary shadow-card",
  "has-checked:border-action-primary has-checked:bg-action-selected",
  "has-disabled:opacity-45",
  "motion-safe:transition-[opacity] motion-safe:duration-300",
].join(" ");

const GRID: Record<2 | 3, string> = {
  2: "grid grid-cols-1 gap-3 medium:grid-cols-2",
  3: "grid grid-cols-1 gap-3 medium:grid-cols-3",
};

export function GuidedQuiz({ action, name, legend, options, picked, keep }: GuidedQuizProps) {
  const isAnswered = picked !== undefined;
  return (
    <Form id={QUIZ_FORM_ID} action={action} scroll={false} replace>
      {Object.entries(keep).map(([key, value]) =>
        value ? <input key={key} type="hidden" name={key} value={value} /> : null,
      )}
      <fieldset data-tour="lesson-quiz" className="m-0 min-w-0 border-0 p-0">
        <legend className="sr-only">{legend}</legend>
        <div className={isAnswered ? "flex flex-wrap gap-2" : GRID[options.length === 2 ? 2 : 3]}>
          {options.map((option, index) => (
            // Keyed by the answer too: a back or forward that changes it remounts the radio.
            <label
              key={`${option.value}:${picked ?? ""}`}
              className={isAnswered ? TILE_DONE : TILE}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                required={index === 0}
                defaultChecked={option.value === picked}
                disabled={isAnswered && option.value !== picked}
                className="sr-only"
              />
              <span
                className={
                  isAnswered
                    ? "bg-bg-surface-sunken grid size-8 flex-none place-items-center rounded-full text-[18px]"
                    : "bg-bg-surface-sunken grid size-9 flex-none place-items-center rounded-xl text-[22px]"
                }
              >
                <Icon name={option.icon} />
              </span>
              <span>{option.label}</span>
              {isAnswered ? null : (
                <span className="text-action-primary invisible absolute end-3 top-3 text-[20px] group-has-checked/tile:visible">
                  <Icon name="check" />
                </span>
              )}
            </label>
          ))}
        </div>
      </fieldset>
    </Form>
  );
}

/** The reader's answer set against what the line does, on the chart itself. */
export type ChartCall = {
  yoursLabel: string;
  yours: string;
  yoursIcon: string;
  lineLabel: string;
  line: string;
  /** Whether the answer agrees with the test. */
  isMatch: boolean;
};

const CALL_CHIP = {
  match: "bg-surface-tone-3 text-text-primary",
  other: "bg-surface-tone-4 text-text-primary",
} as const;

function CallStrip({ call, direction }: { call: ChartCall; direction: string }) {
  return (
    <p className="chart-call text-label-m flex flex-wrap items-center gap-2">
      <span
        className={`${call.isMatch ? CALL_CHIP.match : CALL_CHIP.other} inline-flex items-center gap-1.5 rounded-full py-1 ps-1.5 pe-3`}
      >
        <span className="bg-bg-surface grid size-6 place-items-center rounded-full text-[15px]">
          <Icon name={call.yoursIcon} />
        </span>
        <span className="text-text-secondary font-normal">{call.yoursLabel}:</span>
        <strong>{call.yours}</strong>
      </span>
      <span className="text-text-tertiary flex" aria-hidden="true">
        <Icon name="arrow-right" />
      </span>
      <span className="bg-bg-surface-sunken inline-flex items-center gap-1.5 rounded-full py-1 ps-1.5 pe-3">
        <span className="bg-bg-surface text-chart-trend grid size-6 place-items-center rounded-full text-[15px]">
          <Icon name={direction} />
        </span>
        <span className="text-text-secondary font-normal">{call.lineLabel}:</span>
        <strong className="tabular-nums">{call.line}</strong>
      </span>
    </p>
  );
}

/**
 * The record as a sheet of paper: the points alone, or with the trend and its band. With a call,
 * the trend draws itself in beside the reader's answer, so the answer and the line read together.
 */
export function GuidedChart({
  view,
  translator,
  catalog,
  withTrend,
  call,
}: StepProps & { withTrend: boolean; call?: ChartCall }) {
  const { t, locale } = translator;
  const { file, direction } = view;
  const context = { translator, catalog };
  const from = file.series[0]?.[0];
  const to = file.series.at(-1)?.[0];
  const variable = t(`var.${file.variable}`);
  const unit = unitText(file.unit, locale);
  const subtitle = t("chart.case.sub", {
    v: variable,
    agg: t("chart.case.agg.year"),
    unit,
    from,
    to,
    n: file.series.length,
  });
  return (
    <div
      data-tour="lesson-chart"
      className={`${call ? "chart-reveal " : ""}rounded-card bg-bg-surface shadow-raised medium:px-5 medium:pt-5 flex flex-col gap-3 px-3 pt-3 pb-4`}
    >
      {call ? <CallStrip call={call} direction={direction} /> : null}
      <ChartHead subtitle={subtitle} />
      {withTrend ? (
        <SeriesChart
          data={file.series}
          trend={file.t}
          digits={file.digits}
          unit={unit}
          direction={direction}
          label={trendText(file, "summary", context)}
          recordLabel={t(direction === "down" ? "chart.min" : "chart.max")}
          inline={{
            series: t("case.chart.inline.series"),
            trend: t("case.chart.inline.trend"),
            band: t("case.chart.inline.band"),
          }}
        />
      ) : (
        <SeriesChart
          data={file.series}
          trend={null}
          digits={file.digits}
          unit={unit}
          direction="flat"
          label={t("ask.hyp.chart.aria", { v: variable, place: fileName(file, context), from, to })}
        />
      )}
      <ChartCaption>{t("case.evidence.caption", { source: GUIDED_SOURCE })}</ChartCaption>
    </div>
  );
}
