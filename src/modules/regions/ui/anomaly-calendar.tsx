import { zColor, type CalendarLayout } from "../domain/analysis";

type AnomalyCalendarProps = {
  layout: CalendarLayout;
  variable: string;
};

const PAD = { left: 38, top: 20, right: 8, bottom: 8 };
const CELL_WIDTH = 2.4;
const ROW_HEIGHT = 15;
const DAYS_IN_YEAR = 366;
const MONTH_STARTS = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
const MONTH_INITIALS = ["E", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
const MAX_LABELED_YEARS = 15;
const LEGEND = [-3, -2, -1, 0, 1, 2, 3];

/**
 * One row per year, one cell per day, colored by z against the daily climatology.
 * Cells are merged into one path per color so a 20-year record stays a light SVG.
 */
export function AnomalyCalendar({ layout, variable }: AnomalyCalendarProps) {
  const yearCount = layout.lastYear - layout.firstYear + 1;
  const width = PAD.left + DAYS_IN_YEAR * CELL_WIDTH + PAD.right;
  const height = PAD.top + yearCount * ROW_HEIGHT + PAD.bottom;
  const rowY = (year: number) => PAD.top + (year - layout.firstYear) * ROW_HEIGHT;
  const yearStep = yearCount > MAX_LABELED_YEARS ? 2 : 1;
  const years = Array.from({ length: yearCount }, (_, index) => layout.firstYear + index);
  const cellPath = (cells: CalendarLayout["buckets"][number]["cells"]) =>
    cells
      .map(
        (cell) =>
          `M${(PAD.left + cell.dayOfYear * CELL_WIDTH).toFixed(1)},${rowY(cell.year) + 1}h${CELL_WIDTH - 0.4}v${ROW_HEIGHT - 2}h${-(CELL_WIDTH - 0.4)}z`,
      )
      .join("");

  return (
    <>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="block h-auto w-full min-w-[900px] text-[10px]"
          shapeRendering="crispEdges"
        >
          <title>{`Calendario de anomalías de ${variable}, ${layout.firstYear} a ${layout.lastYear}, ${layout.dayCount} días`}</title>
          {years.map((year) =>
            (year - layout.firstYear) % yearStep === 0 ? (
              <text
                key={year}
                x={PAD.left - 6}
                y={rowY(year) + ROW_HEIGHT / 2 + 3}
                textAnchor="end"
                className="fill-text-tertiary"
              >
                {year}
              </text>
            ) : null,
          )}
          {MONTH_STARTS.map((day, index) => (
            <text
              key={day}
              x={PAD.left + day * CELL_WIDTH}
              y={PAD.top - 6}
              className="fill-text-tertiary"
            >
              {MONTH_INITIALS[index]}
            </text>
          ))}
          {layout.buckets.map((bucket) => (
            <path key={bucket.z} d={cellPath(bucket.cells)} fill={bucket.color} />
          ))}
        </svg>
      </div>
      <div className="text-text-tertiary mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] font-semibold">
        <span>
          Cada celda es un día; el color es z respecto de la climatología diaria. Sin celda = sin
          dato.
        </span>
        <span className="flex items-center gap-1" aria-hidden="true">
          z −3
          {LEGEND.map((z) => (
            <span
              key={z}
              className="inline-block size-3 rounded-[2px]"
              style={{ background: zColor(z) }}
            />
          ))}
          +3
        </span>
      </div>
    </>
  );
}
