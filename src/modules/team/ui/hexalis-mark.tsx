/*
 * The Hexalis mark, "Panal abierto" (Hexalis identity guide v1.0): six raised cells around a light
 * core, with one dashed cell left free at the top right, the seat for whoever joins next. Drawn
 * with the identity's own cell (point up, softened corners) and its colours; transparent version,
 * for the brand's night backgrounds.
 */

/** The identity's cell: point up, 100 × 115.5, softened corners. */
export const HEXALIS_CELL =
  "M57.8 4.5 L92.2 24.4 Q100 28.9 100 37.9 L100 77.6 Q100 86.6 92.2 91.1 L57.8 111 Q50 115.5 42.2 111 L7.8 91.1 Q0 86.6 0 77.6 L0 37.9 Q0 28.9 7.8 24.4 L42.2 4.5 Q50 0 57.8 4.5Z";

/** Brand colours from the identity guide (brand-800, brand-400, brand-300 → brand-600, core). */
const RELIEF = "#1E3780";
const CORE_RELIEF = "#688BE0";
const CORE = "#F2F4FA";
const FREE = "#7A9FEB";

type Cell = { x: number; y: number; kind: "face" | "core" | "free" };

const CELLS: readonly Cell[] = [
  { x: 143, y: 84.46, kind: "face" },
  { x: 261, y: 84.46, kind: "free" },
  { x: 84, y: 186.65, kind: "face" },
  { x: 202, y: 186.65, kind: "core" },
  { x: 320, y: 186.65, kind: "face" },
  { x: 143, y: 288.84, kind: "face" },
  { x: 261, y: 288.84, kind: "face" },
];

export function HexalisMark({ className, gradientId }: { className?: string; gradientId: string }) {
  const face = `url(#${gradientId})`;
  return (
    <svg aria-hidden="true" viewBox="72 72 368 368" className={className}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7A9FEB" />
          <stop offset="1" stopColor="#4064C6" />
        </linearGradient>
      </defs>
      {CELLS.map(({ x, y, kind }) =>
        kind === "free" ? (
          <path
            key={`${x}-${y}`}
            d={HEXALIS_CELL}
            transform={`translate(${x} ${y}) scale(1.08)`}
            fill="none"
            stroke={FREE}
            strokeWidth={5.56}
            strokeDasharray="13.89 8.33"
            strokeLinecap="round"
          />
        ) : (
          <g key={`${x}-${y}`}>
            {/* The relief sits 14 units lower, so each cell reads as raised. */}
            <path
              d={HEXALIS_CELL}
              transform={`translate(${x} ${y + 14}) scale(1.08)`}
              fill={kind === "core" ? CORE_RELIEF : RELIEF}
            />
            <path
              d={HEXALIS_CELL}
              transform={`translate(${x} ${y}) scale(1.08)`}
              fill={kind === "core" ? CORE : face}
            />
          </g>
        ),
      )}
    </svg>
  );
}
