import { useId } from "react";
import { max } from "d3-array";
import { scaleBand, scaleLinear } from "d3-scale";
import type { Locale } from "@/shared/lib/i18n";

type AuditBarsProps = {
  years: readonly (readonly [year: number, count: number])[];
  /** The tested stretch with no catalog change, drawn as a band behind its bars. */
  span: readonly [from: number, to: number] | null;
  /** Years the catalog itself changed, drawn as dashed rules. */
  breaks: readonly number[];
  /** First year still running; its bar is faded. */
  partialFrom: number;
  /** Accessible name of the chart. */
  label: string;
  spanLabel: string;
  locale: Locale;
};

const WIDTH = 600;
const HEIGHT = 190;
const MARGIN = { top: 22, right: 8, bottom: 24, left: 44 };
const BAND_PADDING = 0.18;
const Y_TICKS = 3;
/** Room above the plot for the span label and the top of the break rules. */
const HEADROOM = 14;
/** Roughly one year label per this many pixels. */
const X_LABEL_SPACING = 46;

/**
 * EONET events per year with the catalog's breaks (POC charts.eventBars), rendered on the server
 * as a fixed-viewBox SVG. The POC's hover tooltip is left out; the text beside it carries the reading.
 */
export function AuditBars({
  years,
  span,
  breaks,
  partialFrom,
  label,
  spanLabel,
  locale,
}: AuditBarsProps) {
  const titleId = useId();
  if (!years.length) return null;
  const x = scaleBand<number>()
    .domain(years.map(([year]) => year))
    .range([MARGIN.left, WIDTH - MARGIN.right])
    .padding(BAND_PADDING);
  const y = scaleLinear()
    .domain([0, max(years, ([, count]) => count) || 1])
    .nice()
    .range([HEIGHT - MARGIN.bottom, MARGIN.top]);
  const baseline = y(0);
  const compact = new Intl.NumberFormat(locale, { notation: "compact" });
  const labelEvery = Math.ceil(
    years.length / Math.max(2, Math.floor((WIDTH - MARGIN.left) / X_LABEL_SPACING)),
  );
  // A break sits on the gap just before its year's bar.
  const gap = (x.step() - x.bandwidth()) / 2;
  const spanStart = span ? x(span[0]) : undefined;
  const spanEnd = span ? x(span[1]) : undefined;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      aria-labelledby={titleId}
      className="block h-auto w-full text-[11px]"
    >
      <title id={titleId}>{label}</title>
      {y.ticks(Y_TICKS).map((tick) => (
        <g key={tick}>
          <line
            x1={MARGIN.left}
            x2={WIDTH - MARGIN.right}
            y1={y(tick)}
            y2={y(tick)}
            className="stroke-chart-grid"
          />
          <text
            x={MARGIN.left - 8}
            y={y(tick)}
            dy="0.32em"
            textAnchor="end"
            className="fill-text-tertiary"
          >
            {compact.format(tick)}
          </text>
        </g>
      ))}
      {spanStart !== undefined && spanEnd !== undefined ? (
        <g data-part="span">
          <rect
            x={spanStart - 2}
            width={Math.max(0, spanEnd + x.bandwidth() - spanStart + 4)}
            y={MARGIN.top - HEADROOM}
            height={baseline - MARGIN.top + HEADROOM}
            rx={3}
            className="fill-chart-band"
          />
          <text
            x={spanStart + 4}
            y={MARGIN.top - 4}
            className="fill-text-secondary text-[11px] font-semibold"
          >
            {spanLabel}
          </text>
        </g>
      ) : null}
      {years.map(([year, count]) => (
        <rect
          key={year}
          data-part={year >= partialFrom ? "partial-bar" : "bar"}
          x={x(year)}
          width={x.bandwidth()}
          y={y(count)}
          height={baseline - y(count)}
          rx={1.5}
          className={year >= partialFrom ? "fill-chart-1 opacity-35" : "fill-chart-1"}
        />
      ))}
      {breaks.map((year) => {
        const start = x(year);
        if (start === undefined) return null;
        return (
          <line
            key={year}
            data-part="break"
            x1={start - gap}
            x2={start - gap}
            y1={MARGIN.top - HEADROOM}
            y2={baseline}
            strokeWidth={1.5}
            strokeDasharray="4 3"
            className="stroke-chart-annotation"
          />
        );
      })}
      <line
        x1={MARGIN.left}
        x2={WIDTH - MARGIN.right}
        y1={baseline}
        y2={baseline}
        className="stroke-chart-axis"
      />
      {years
        .filter((_, index) => index % labelEvery === 0)
        .map(([year]) => (
          <text
            key={year}
            x={(x(year) ?? 0) + x.bandwidth() / 2}
            y={HEIGHT - 8}
            textAnchor="middle"
            className="fill-text-tertiary"
          >
            {year}
          </text>
        ))}
    </svg>
  );
}
