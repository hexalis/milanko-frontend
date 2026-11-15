import { extent } from "d3-array";
import { scaleLinear } from "d3-scale";
import { area, line } from "d3-shape";
import type { Direction, Point } from "../domain/case-file";

type SparklineProps = {
  series: readonly Point[];
  /** Sen line to draw over the series, if any. */
  trend?: { slope: number; intercept: number } | null;
  direction: Direction;
  /** Highlight the last point (an event year against every earlier year). */
  isLastMarked?: boolean;
  /** Unique within the page: names the area gradient. */
  id: string;
};

const WIDTH = 300;
const HEIGHT = 72;
const DIRECTION_STROKE: Record<Direction, string> = {
  up: "stroke-trend-up",
  down: "stroke-trend-down",
  flat: "stroke-trend-neutral",
};
const DIRECTION_FILL: Record<Direction, string> = {
  up: "fill-trend-up",
  down: "fill-trend-down",
  flat: "fill-trend-neutral",
};

/** Decorative yearly sparkline (the figures beside it carry the meaning). */
export function Sparkline({ series, trend, direction, isLastMarked = false, id }: SparklineProps) {
  const [x0 = 0, x1 = 1] = extent(series, ([year]) => year);
  const [y0 = 0, y1 = 1] = extent(series, ([, value]) => value);
  const x = scaleLinear()
    .domain([x0, x1])
    .range([2, WIDTH - 2]);
  const y = scaleLinear()
    .domain([y0, y1])
    .nice()
    .range([HEIGHT - 4, 4]);
  const toX = ([year]: Point) => x(year);
  const toY = ([, value]: Point) => y(value);
  const last = series.at(-1);
  const gradientId = `spark-${id}`;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="block h-auto w-full"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--color-trend-down)" stopOpacity={0.22} />
          <stop offset="100%" stopColor="var(--color-trend-down)" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path
        d={area<Point>().x(toX).y0(HEIGHT).y1(toY)(series) ?? ""}
        fill={`url(#${gradientId})`}
      />
      <path
        d={line<Point>().x(toX).y(toY)(series) ?? ""}
        fill="none"
        strokeWidth={1.6}
        className="stroke-chart-1"
      />
      {trend ? (
        <line
          x1={x(x0)}
          x2={x(x1)}
          y1={y(trend.intercept + trend.slope * x0)}
          y2={y(trend.intercept + trend.slope * x1)}
          strokeWidth={2}
          strokeDasharray="5 4"
          className={DIRECTION_STROKE[direction]}
        />
      ) : null}
      {isLastMarked && last ? (
        <circle
          cx={toX(last)}
          cy={toY(last)}
          r={3.5}
          strokeWidth={1.5}
          className={`stroke-bg-surface ${DIRECTION_FILL[direction]}`}
        />
      ) : null}
    </svg>
  );
}
