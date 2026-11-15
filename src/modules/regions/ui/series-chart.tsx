import { formatNumber } from "@/shared/lib/format";
import type { SeriesPoint } from "../domain/series";

type SeriesChartProps = {
  points: readonly SeriesPoint[];
  label: string;
};

const WIDTH = 1000;
const HEIGHT = 290;
const PAD = { left: 58, right: 18, top: 18, bottom: 34 };
const TICKS = 4;
/** Dots are drawn only while they stay readable. */
const MAX_DOTS = 120;

export function SeriesChart({ points, label }: SeriesChartProps) {
  const first = points[0];
  const last = points.at(-1);
  if (!first || !last)
    return <p className="text-ink-muted">No hay valores numéricos para graficar.</p>;

  const values = points.map((point) => point.value);
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const x = (index: number) =>
    PAD.left + (index / Math.max(1, points.length - 1)) * (WIDTH - PAD.left - PAD.right);
  const y = (value: number) =>
    PAD.top + (1 - (value - min) / (max - min)) * (HEIGHT - PAD.top - PAD.bottom);
  const path = points
    .map(
      (point, index) => `${index ? "L" : "M"}${x(index).toFixed(1)},${y(point.value).toFixed(1)}`,
    )
    .join(" ");
  const ticks = Array.from(
    { length: TICKS + 1 },
    (_, index) => min + ((max - min) * index) / TICKS,
  );

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="block h-[290px] w-full min-w-[640px] text-[11px]"
      >
        <title>{`${label}: ${first.date} a ${last.date}, entre ${formatNumber(min)} y ${formatNumber(max)}`}</title>
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={y(tick)}
              y2={y(tick)}
              className="stroke-data-grid"
            />
            <text x={PAD.left - 8} y={y(tick) + 4} textAnchor="end" className="fill-ink-muted">
              {formatNumber(tick)}
            </text>
          </g>
        ))}
        <line
          x1={PAD.left}
          x2={PAD.left}
          y1={PAD.top}
          y2={HEIGHT - PAD.bottom}
          className="stroke-ink-faint"
        />
        <line
          x1={PAD.left}
          x2={WIDTH - PAD.right}
          y1={HEIGHT - PAD.bottom}
          y2={HEIGHT - PAD.bottom}
          className="stroke-ink-faint"
        />
        <text x={PAD.left} y={HEIGHT - 8} className="fill-ink-muted">
          {first.date}
        </text>
        <text x={WIDTH - PAD.right} y={HEIGHT - 8} textAnchor="end" className="fill-ink-muted">
          {last.date}
        </text>
        <path
          d={path}
          fill="none"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
          className="stroke-data-series"
        />
        {points.length <= MAX_DOTS
          ? points.map((point, index) => (
              <circle
                key={point.date}
                cx={x(index)}
                cy={y(point.value)}
                r={2.2}
                className="fill-data-series"
              />
            ))
          : null}
      </svg>
    </div>
  );
}
