import { formatDate } from "@/modules/cases";
import type { Translator } from "@/shared/lib/i18n";
import { ScrollRegion } from "@/shared/ui/scroll-region";
import { formatFor, type Band } from "../domain/reading";
import type { SeriesPoint } from "../domain/series";

type SeriesChartProps = {
  points: readonly SeriesPoint[];
  label: string;
  /** What is normal for each point's month, drawn as a grey band behind the line. */
  band?: readonly (Band | null)[];
  translator: Translator;
};

const WIDTH = 1000;
const HEIGHT = 290;
const PAD = { left: 58, right: 18, top: 18, bottom: 34 };
const TICKS = 4;
/** Dots are drawn only while they stay readable. */
const MAX_DOTS = 120;

/** The band as closed paths: along the highs, back along the lows; a month without one splits it. */
function bandPaths(
  band: readonly (Band | null)[],
  x: (index: number) => number,
  y: (value: number) => number,
): string[] {
  const runs: { index: number; band: Band }[][] = [[]];
  band.forEach((item, index) => {
    if (item) runs.at(-1)?.push({ index, band: item });
    else if (runs.at(-1)?.length) runs.push([]);
  });
  return runs
    .filter((run) => run.length > 1)
    .map((run) => {
      const top = run.map(({ index, band: b }) => `${x(index).toFixed(1)},${y(b.high).toFixed(1)}`);
      const bottom = run
        .toReversed()
        .map(({ index, band: b }) => `${x(index).toFixed(1)},${y(b.low).toFixed(1)}`);
      return `M${top.join("L")}L${bottom.join("L")}Z`;
    });
}

export function SeriesChart({ points, label, band, translator }: SeriesChartProps) {
  const { t, locale } = translator;
  const first = points[0];
  const last = points.at(-1);
  if (!first || !last) return <p className="text-text-tertiary">{t("rx.chart.empty")}</p>;

  const bands = band?.filter((item) => item !== null) ?? [];
  const values = [
    ...points.map((point) => point.value),
    ...bands.flatMap((item) => [item.low, item.high]),
  ];
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
  const from = formatDate(first.date, locale);
  const to = formatDate(last.date, locale);

  const title = t("rx.chart.aria", {
    label,
    from,
    to,
    min: formatFor(min, locale),
    max: formatFor(max, locale),
  });
  // Wider than a phone: the frame scrolls, and is focusable while it does.
  return (
    <ScrollRegion className="overflow-x-auto" label={title}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="block h-[290px] w-full min-w-[640px] text-[11px]"
      >
        <title>{title}</title>
        {band
          ? bandPaths(band, x, y).map((d) => (
              <path key={d.slice(0, 32)} d={d} className="fill-text-tertiary" opacity={0.22} />
            ))
          : null}
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={y(tick)}
              y2={y(tick)}
              className="stroke-chart-grid"
            />
            <text x={PAD.left - 8} y={y(tick) + 4} textAnchor="end" className="fill-text-tertiary">
              {formatFor(tick, locale)}
            </text>
          </g>
        ))}
        <line
          x1={PAD.left}
          x2={PAD.left}
          y1={PAD.top}
          y2={HEIGHT - PAD.bottom}
          className="stroke-chart-axis"
        />
        <line
          x1={PAD.left}
          x2={WIDTH - PAD.right}
          y1={HEIGHT - PAD.bottom}
          y2={HEIGHT - PAD.bottom}
          className="stroke-chart-axis"
        />
        <text x={PAD.left} y={HEIGHT - 8} className="fill-text-tertiary">
          {from}
        </text>
        <text x={WIDTH - PAD.right} y={HEIGHT - 8} textAnchor="end" className="fill-text-tertiary">
          {to}
        </text>
        <path
          d={path}
          fill="none"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
          className="stroke-chart-1"
        />
        {points.length <= MAX_DOTS
          ? points.map((point, index) => (
              <circle
                key={point.date}
                cx={x(index)}
                cy={y(point.value)}
                r={2.2}
                className="fill-chart-1"
              />
            ))
          : null}
      </svg>
    </ScrollRegion>
  );
}
