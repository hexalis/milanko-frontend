import Link from "next/link";
import { formatSigned } from "@/shared/lib/format";
import { toQueryString } from "@/shared/lib/search-params";
import { rankingBars, type RankingMetric, type RankingRow } from "../domain/ranking";
import { regionLabel } from "../domain/region";

type RankingBarsProps = {
  rows: readonly RankingRow[];
  metric: RankingMetric;
  variable: string;
  unit: string;
};

/** Horizontal bars scaled to the largest absolute value; negative values in the "down" signal. */
export function RankingBars({ rows, metric, variable, unit }: RankingBarsProps) {
  const bars = rankingBars(rows, metric);
  if (!bars.length) return <p className="text-text-tertiary">Sin datos para esta combinación.</p>;

  return (
    <ol className="grid gap-2">
      {bars.map(({ row, value, widthPercent, isNegative }) => (
        <li
          key={row.code}
          className="grid grid-cols-1 items-center gap-x-3 gap-y-1 sm:grid-cols-[minmax(170px,1.2fr)_3fr_minmax(120px,0.8fr)]"
        >
          <Link
            href={`/regions${toQueryString({ region: row.code, variable })}`}
            className="text-text-primary hover:text-text-brand truncate font-bold no-underline"
          >
            {regionLabel(row)}
          </Link>
          <span className="rounded-2xs bg-bg-surface-sunken h-4 overflow-hidden" aria-hidden="true">
            <span
              className={`rounded-2xs block h-full ${isNegative ? "bg-trend-down" : "bg-trend-up"}`}
              style={{ width: `${widthPercent.toFixed(1)}%` }}
            />
          </span>
          <span className="text-text-tertiary font-semibold tabular-nums sm:text-right">
            {formatSigned(value)} {unit}
          </span>
        </li>
      ))}
    </ol>
  );
}
