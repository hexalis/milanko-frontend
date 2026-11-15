import { extent, greatest, least } from "d3-array";
import { scaleLinear } from "d3-scale";
import { area, line } from "d3-shape";
import type { Direction, Point } from "../domain/case-file";
import { median } from "../domain/trend-stats";

type SeriesTrend = { slope: number; intercept: number; slopeLow: number; slopeHigh: number };

type SeriesChartProps = {
  data: readonly Point[];
  trend?: SeriesTrend | null;
  digits: number;
  unit: string;
  direction: Direction;
  /** Accessible summary of what the chart shows. */
  label: string;
  /** Direct labels at the right edge replace a legend. */
  inline?: { series: string; trend?: string; band?: string };
  /** Annotate the record year ("Record 2016 · 1.2 °C"). */
  recordLabel?: string;
  /** Mark one year, e.g. an event's run-up against every earlier year. */
  mark?: { year: number; text: string };
};

const WIDTH = 720;
const HEIGHT = 300;
const MAX_X_TICKS = 9;
const Y_TICKS = 5;
const MIN_LABEL_GAP = 14;

function trendAt(trend: SeriesTrend, year: number): number {
  return trend.intercept + trend.slope * year;
}

/**
 * Yearly series with the Sen trend and its 95 % band (POC charts.series), rendered on the server
 * as a fixed-viewBox SVG. Exact values live in the chart's table tab, so there is no hover tooltip.
 */
export function SeriesChart({
  data,
  trend,
  digits,
  unit,
  direction,
  label,
  inline,
  recordLabel,
  mark,
}: SeriesChartProps) {
  if (!data.length) return null;
  const margin = { top: 16, right: inline ? 128 : 16, bottom: 28, left: 52 };
  const years = data.map(([year]) => year);
  const [xMin = 0, xMax = 1] = extent(years);
  const [yMin = 0, yMax = 1] = extent(data, ([, value]) => value);
  const pad = (yMax - yMin) * 0.12 || 1;
  const x = scaleLinear()
    .domain([xMin, xMax])
    .range([margin.left, WIDTH - margin.right]);
  const y = scaleLinear()
    .domain([yMin - pad, yMax + pad])
    .nice()
    .range([HEIGHT - margin.bottom, margin.top]);
  const yTicks = y.ticks(Y_TICKS);
  const tickStep = (yTicks[1] ?? 0) - (yTicks[0] ?? 0);
  const tickDigits = tickStep > 0 ? Math.max(0, Math.min(3, -Math.floor(Math.log10(tickStep)))) : 0;
  const xTicks = x.ticks(Math.min(MAX_X_TICKS, data.length)).filter(Number.isInteger);
  const toX = ([year]: Point) => x(year);
  const toY = ([, value]: Point) => y(value);
  const value = (n: number) => n.toFixed(Math.min(digits, 3));

  const yearMedian = median(years);
  const band = trend
    ? years.map((year) => {
        const center = trendAt(trend, yearMedian);
        const a = center + trend.slopeLow * (year - yearMedian);
        const b = center + trend.slopeHigh * (year - yearMedian);
        return [year, Math.min(a, b), Math.max(a, b)] as const;
      })
    : [];

  const record = direction === "down" ? least(data, ([, v]) => v) : greatest(data, ([, v]) => v);
  const marked = mark ? data.find(([year]) => year === mark.year) : undefined;
  const last = data.at(-1);

  let seriesLabelY = last ? toY(last) : 0;
  let trendLabelY = trend && last ? y(trendAt(trend, last[0])) : null;
  if (trendLabelY !== null && Math.abs(seriesLabelY - trendLabelY) < MIN_LABEL_GAP) {
    const middle = (seriesLabelY + trendLabelY) / 2;
    seriesLabelY = middle - MIN_LABEL_GAP / 2;
    trendLabelY = middle + MIN_LABEL_GAP / 2;
  }

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="block h-auto w-full text-[11px]">
      <title>{label}</title>
      {yTicks.map((tick) => (
        <g key={tick}>
          <line
            x1={margin.left}
            x2={WIDTH - margin.right}
            y1={y(tick)}
            y2={y(tick)}
            className="stroke-chart-grid"
          />
          <text
            x={margin.left - 8}
            y={y(tick)}
            dy="0.32em"
            textAnchor="end"
            className="fill-text-tertiary"
          >
            {tick.toFixed(tickDigits).replace("-", "−")}
          </text>
        </g>
      ))}
      {xTicks.map((tick) => (
        <text
          key={tick}
          x={x(tick)}
          y={HEIGHT - 8}
          textAnchor="middle"
          className="fill-text-tertiary"
        >
          {tick}
        </text>
      ))}
      <line
        x1={margin.left}
        x2={WIDTH - margin.right}
        y1={HEIGHT - margin.bottom}
        y2={HEIGHT - margin.bottom}
        className="stroke-chart-axis"
      />
      {trend ? (
        <path
          d={
            area<(typeof band)[number]>()
              .x(([year]) => x(year))
              .y0(([, low]) => y(low))
              .y1(([, , high]) => y(high))(band) ?? ""
          }
          className="fill-chart-band"
        />
      ) : null}
      <path
        d={line<Point>().x(toX).y(toY)(data) ?? ""}
        fill="none"
        strokeWidth={2}
        className="stroke-chart-1"
      />
      {trend ? (
        <line
          x1={x(xMin)}
          x2={x(xMax)}
          y1={y(trendAt(trend, xMin))}
          y2={y(trendAt(trend, xMax))}
          strokeWidth={2.2}
          strokeDasharray="7 5"
          className="stroke-chart-trend"
        />
      ) : null}
      {data.map((point) => (
        <circle key={point[0]} cx={toX(point)} cy={toY(point)} r={2.6} className="fill-chart-1" />
      ))}
      {record && recordLabel ? (
        <g>
          <circle
            cx={toX(record)}
            cy={toY(record)}
            r={5}
            fill="none"
            strokeWidth={2}
            className="stroke-trend-up"
          />
          <text
            x={toX(record) > WIDTH * 0.7 ? toX(record) - 10 : toX(record) + 10}
            y={direction === "down" ? toY(record) + 16 : toY(record) - 10}
            textAnchor={toX(record) > WIDTH * 0.7 ? "end" : "start"}
            className="fill-text-primary text-[12px] font-bold"
          >
            {`${recordLabel} ${record[0]} · ${value(record[1])} ${unit}`.trim()}
          </text>
        </g>
      ) : null}
      {marked && mark ? (
        <g>
          <circle
            cx={toX(marked)}
            cy={toY(marked)}
            r={7}
            fill="none"
            strokeWidth={2}
            className="stroke-trend-up"
          />
          <text
            x={toX(marked) > WIDTH * 0.6 ? toX(marked) - 12 : toX(marked) + 12}
            y={toY(marked) - 10}
            textAnchor={toX(marked) > WIDTH * 0.6 ? "end" : "start"}
            className="fill-text-primary text-[12px] font-bold"
          >
            {mark.text}
          </text>
        </g>
      ) : null}
      {inline && last ? (
        <g className="text-[12px] font-bold">
          <text x={WIDTH - margin.right + 6} y={seriesLabelY} dy="0.35em" className="fill-chart-1">
            {inline.series}
          </text>
          {inline.trend && trendLabelY !== null ? (
            <text
              x={WIDTH - margin.right + 6}
              y={trendLabelY}
              dy="0.35em"
              className="fill-chart-trend"
            >
              {inline.trend}
            </text>
          ) : null}
          {inline.band && trend && trendLabelY !== null ? (
            <text
              x={WIDTH - margin.right + 6}
              y={Math.max(trendLabelY + MIN_LABEL_GAP, trendLabelY + 6)}
              dy="0.35em"
              className="fill-text-tertiary font-semibold"
            >
              {inline.band}
            </text>
          ) : null}
        </g>
      ) : null}
    </svg>
  );
}
