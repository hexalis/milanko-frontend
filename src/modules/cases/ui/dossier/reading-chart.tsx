import type { Translator } from "@/shared/lib/i18n";
import { Icon } from "@/shared/ui/icon";
import { EVENT_UNITS, type EventVariable } from "../../domain/case-file";
import type { ReadingChart as ReadingChartData } from "../../domain/case-reading";
import { formatFigure, unitLabel } from "../../domain/format";
import type { PercentileBand } from "../../domain/readout";
import { AuditBars } from "../briefing/audit-bars";
import { SeriesChart } from "../series-chart";

/* The chart of "What the data show": a yearly series, the run-up strips, or the catalog bars. */

const VARIABLE_ICON: Record<EventVariable, string> = { tmax: "heat", rain: "rain", soil: "soil" };

const THIS_YEAR_FILL: Record<PercentileBand, string> = {
  "very-high": "bg-trend-up",
  high: "bg-trend-up",
  usual: "bg-text-primary",
  low: "bg-trend-down",
  "very-low": "bg-trend-down",
};

type StripsChart = Extract<ReadingChartData, { kind: "strips" }>;
type Strip = StripsChart["strips"][number];

/** The dots of one strip: every earlier year, the usual value and the event year. */
function StripTrack({
  strip,
  year,
  usualLabel,
}: {
  strip: Strip;
  year: number;
  usualLabel: string;
}) {
  const { unit, digits } = EVENT_UNITS[strip.variable];
  const withUnit = (value: number) => `${formatFigure(value, digits)}${unit ? ` ${unit}` : ""}`;
  return (
    <>
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
          title={usualLabel}
          className="bg-text-secondary absolute inset-y-[3px] -ml-px w-0.5 rounded-sm"
          style={{ left: `${strip.meanPosition}%` }}
        />
        <b
          title={`${year} · ${withUnit(strip.reading.value)}`}
          className={`ring-bg-surface absolute top-1/2 -mt-2 -ml-2 size-4 rounded-full ring-[3px] ${strip.isLead ? THIS_YEAR_FILL[strip.band] : THIS_YEAR_FILL.usual}`}
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
    </>
  );
}

/** Every year of the run-up window as a dot; the event year is the large one (POC cfEvent strips). */
function EventStrips({ chart, translator }: { chart: StripsChart; translator: Translator }) {
  const { t } = translator;
  return (
    <div className="mt-3 grid gap-4">
      {chart.strips.map((strip) => (
        <figure key={strip.variable} className="m-0 flex flex-col gap-1.5">
          <figcaption className="flex flex-col gap-0.5">
            <strong className="text-body-m-strong text-text-primary inline-flex items-center gap-1.5 font-semibold">
              <Icon name={VARIABLE_ICON[strip.variable]} />
              {strip.name}
              {strip.isLead ? (
                <span className="bg-status-ok-bg text-text-link text-label-xs rounded-sm px-1.5 py-0.5 uppercase">
                  {t("ev.lead")}
                </span>
              ) : null}
            </strong>
            <span className="text-body-s text-text-secondary">
              {strip.said.charAt(0).toUpperCase() + strip.said.slice(1)}.
            </span>
          </figcaption>
          <StripTrack strip={strip} year={chart.year} usualLabel={t("cf.usual")} />
        </figure>
      ))}
    </div>
  );
}

type ReadingChartProps = { chart: ReadingChartData; translator: Translator };

export function ReadingChart({ chart, translator }: ReadingChartProps) {
  const { t, locale } = translator;
  if (chart.kind === "strips") return <EventStrips chart={chart} translator={translator} />;
  if (chart.kind === "bars") {
    const { category } = chart;
    return (
      <div className="bg-bg-surface-sunken rounded-field mt-3 p-2">
        <AuditBars
          years={category.years}
          span={category.span}
          breaks={category.breaks.map((item) => item.year)}
          partialFrom={chart.partialFrom}
          label={chart.label}
          spanLabel={t("audit.span")}
          locale={locale}
        />
      </div>
    );
  }
  const { file, direction } = chart;
  return (
    <div className="mt-3">
      <SeriesChart
        data={file.series}
        trend={file.t}
        digits={file.digits}
        unit={unitLabel(file.unit, locale)}
        direction={direction}
        label={chart.label}
        recordLabel={t(direction === "down" ? "chart.min" : "chart.max")}
        inline={{
          series: t("case.chart.inline.series"),
          trend: t("case.chart.inline.trend"),
          band: t("case.chart.inline.band"),
        }}
      />
    </div>
  );
}
