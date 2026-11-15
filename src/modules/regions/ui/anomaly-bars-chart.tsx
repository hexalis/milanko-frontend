import { formatNumber } from "@/shared/lib/format";
import type { AnomalyBar } from "../domain/analysis";

type AnomalyBarsChartProps = {
  bars: readonly AnomalyBar[];
};

const WIDTH = 1000;
const HEIGHT = 150;
const PAD = { left: 46, right: 12, top: 10, bottom: 24 };
const MIN_BOUND = 0.001;

/** Daily anomalies around zero: above in the "up" signal, below in the "down" signal. */
export function AnomalyBarsChart({ bars }: AnomalyBarsChartProps) {
  const first = bars[0];
  const last = bars.at(-1);
  if (!first || !last) return <p className="text-text-tertiary">Sin anomalías para graficar.</p>;

  const bound = Math.max(...bars.map((bar) => Math.abs(bar.value)), MIN_BOUND);
  const x = (index: number) =>
    PAD.left + (index / Math.max(1, bars.length - 1)) * (WIDTH - PAD.left - PAD.right);
  const y = (value: number) =>
    PAD.top + (1 - (value + bound) / (2 * bound)) * (HEIGHT - PAD.top - PAD.bottom);
  const zero = y(0);
  const barWidth = Math.max(1, (WIDTH - PAD.left - PAD.right) / bars.length - 1);

  const shape = (isPositive: boolean) =>
    bars
      .flatMap((bar, index) => {
        if (bar.value >= 0 !== isPositive) return [];
        const top = isPositive ? y(bar.value) : zero;
        const height = Math.max(1, (isPositive ? zero : y(bar.value)) - top);
        return [
          `M${(x(index) - barWidth / 2).toFixed(1)},${top.toFixed(1)}h${barWidth.toFixed(1)}v${height.toFixed(1)}h${(-barWidth).toFixed(1)}z`,
        ];
      })
      .join("");

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="block h-[150px] w-full text-[11px]">
      <title>{`Anomalías diarias de ${first.time} a ${last.time}, entre ${formatNumber(-bound)} y ${formatNumber(bound)}`}</title>
      <line
        x1={PAD.left}
        x2={WIDTH - PAD.right}
        y1={zero}
        y2={zero}
        strokeDasharray="4 4"
        className="stroke-chart-axis"
      />
      <text x={PAD.left - 6} y={zero + 4} textAnchor="end" className="fill-text-tertiary">
        0
      </text>
      <text x={PAD.left - 6} y={PAD.top + 8} textAnchor="end" className="fill-text-tertiary">
        {formatNumber(bound)}
      </text>
      <text
        x={PAD.left - 6}
        y={HEIGHT - PAD.bottom}
        textAnchor="end"
        className="fill-text-tertiary"
      >
        {formatNumber(-bound)}
      </text>
      <path d={shape(true)} className="fill-trend-up" opacity={0.8} />
      <path d={shape(false)} className="fill-trend-down" opacity={0.8} />
      <text x={PAD.left} y={HEIGHT - 6} className="fill-text-tertiary">
        {first.time}
      </text>
      <text x={WIDTH - PAD.right} y={HEIGHT - 6} textAnchor="end" className="fill-text-tertiary">
        {last.time}
      </text>
    </svg>
  );
}
