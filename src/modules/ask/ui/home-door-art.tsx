/*
 * Drawings for the home's three small doors (POC ask.js HOME_DOOR_ART). None of them is data: they
 * show what is behind each door, in its door's tone (currentColor), and move a little when the
 * door is pointed at (the door is the `door` group).
 */

const SVG = "block h-auto w-full";
const PIN =
  "transition-transform duration-[220ms] ease-enter group-hover/door:-translate-y-1 motion-reduce:transition-none";
const PIN_PATH = "M0 -9c-5 0-9 4-9 9 0 7 9 15 9 15s9-8 9-15c0-5-4-9-9-9z";
const FOLDER = "M70 40h34l8 8h58a6 6 0 0 1 6 6v46a6 6 0 0 1-6 6H70a6 6 0 0 1-6-6V46a6 6 0 0 1 6-6z";
const FOLDER_SHAPE = "fill-bg-surface stroke-current stroke-[1.5] [stroke-linejoin:round]";
const FOLDER_MOVE =
  "origin-bottom [transform-box:fill-box] transition-transform duration-[220ms] ease-enter motion-reduce:transition-none";

function MapArt() {
  const pins = [
    [98, 39],
    [140, 55],
    [114, 79],
  ] as const;
  return (
    <svg className={SVG} viewBox="0 0 240 120" aria-hidden="true" focusable="false">
      <circle
        cx="120"
        cy="64"
        r="46"
        className="fill-[color-mix(in_srgb,var(--color-bg-surface)_55%,transparent)] stroke-current stroke-[1.5] [stroke-opacity:0.6]"
      />
      <ellipse
        cx="120"
        cy="64"
        rx="20"
        ry="46"
        className="fill-none stroke-current stroke-[1.5] opacity-55"
      />
      <ellipse
        cx="120"
        cy="64"
        rx="46"
        ry="16"
        className="fill-none stroke-current stroke-[1.5] opacity-55"
      />
      {pins.map(([x, y], index) => (
        <g key={x} className={PIN} style={{ transitionDelay: `${index * 40}ms` }}>
          <path transform={`translate(${x} ${y})`} d={PIN_PATH} className="fill-current" />
          <circle cx={x} cy={y} r="3" className="fill-bg-surface" />
        </g>
      ))}
    </svg>
  );
}

function CasesArt() {
  return (
    <svg className={SVG} viewBox="0 0 240 120" aria-hidden="true" focusable="false">
      <g
        className={`${FOLDER_MOVE} -translate-x-2.5 -translate-y-2.5 opacity-55 group-hover/door:-translate-x-4 group-hover/door:-translate-y-2 group-hover/door:-rotate-6`}
      >
        <path d={FOLDER} className={FOLDER_SHAPE} />
      </g>
      <g
        className={`${FOLDER_MOVE} -translate-x-[5px] -translate-y-[5px] opacity-80 group-hover/door:-translate-x-[7px] group-hover/door:-translate-y-1.5 group-hover/door:-rotate-3`}
      >
        <path d={FOLDER} className={FOLDER_SHAPE} />
      </g>
      <g>
        <path d={FOLDER} className={FOLDER_SHAPE} />
        <line
          x1="80"
          x2="140"
          y1="66"
          y2="66"
          className="stroke-current stroke-2 opacity-35 [stroke-linecap:round]"
        />
        <line
          x1="80"
          x2="124"
          y1="78"
          y2="78"
          className="stroke-current stroke-2 opacity-35 [stroke-linecap:round]"
        />
        <circle cx="156" cy="88" r="10" className="fill-current" />
        <path
          d="M151 88l4 4 7-8"
          className="stroke-bg-surface fill-none stroke-[2.2] [stroke-linecap:round] [stroke-linejoin:round]"
        />
      </g>
    </svg>
  );
}

function MethodArt() {
  return (
    <svg className={SVG} viewBox="0 0 240 120" aria-hidden="true" focusable="false">
      <line x1="24" x2="196" y1="98" y2="98" className="stroke-current opacity-30" />
      <polyline
        points="28,84 52,80 76,82 100,70 124,68 148,56 172,52 196,40"
        className="fill-none stroke-current stroke-[2.5] [stroke-linecap:round] [stroke-linejoin:round]"
      />
      <polyline
        points="28,64 52,76 76,58 100,80 124,60 148,78 172,62 196,72"
        className="stroke-text-secondary fill-none stroke-2 opacity-60 [stroke-dasharray:5_5] [stroke-linecap:round] [stroke-linejoin:round]"
      />
      <g className="ease-enter origin-center transition-transform duration-[300ms] [transform-box:fill-box] group-hover/door:rotate-90 motion-reduce:transition-none">
        <rect
          x="200"
          y="18"
          width="26"
          height="26"
          rx="6"
          className="fill-bg-surface stroke-current stroke-[1.5]"
        />
        <circle cx="207" cy="25" r="2.2" className="fill-current" />
        <circle cx="213" cy="31" r="2.2" className="fill-current" />
        <circle cx="219" cy="37" r="2.2" className="fill-current" />
      </g>
    </svg>
  );
}

export const DOOR_ART = { map: MapArt, cases: CasesArt, method: MethodArt } as const;
