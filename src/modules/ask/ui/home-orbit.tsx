import { withBasePath } from "@/shared/lib/base-path";
import {
  ORBIT_BOX,
  PLANET_R,
  orbitPath,
  orbitStations,
  type StationKey,
} from "../domain/home-orbit";
import { HomeEarthCanvas } from "./home-earth-canvas";

/*
 * The home's cover art (POC ask.js homeOrbit): the ring and its four stations in the colours of the
 * doors below. Three layers: the back half of the ring and a drawn planet, the Earth canvas, and
 * the front half of the ring with its stations. Pointing at a door lights its station (the home's
 * root is the `home` group; each door carries data-st), so the cover and the doors read as one map.
 */

const C = ORBIT_BOX / 2;
const R = PLANET_R;
const SPRITE = withBasePath("/icons/sprite.svg");

const LAYER = "pointer-events-none absolute inset-0 size-full overflow-visible";
const PATH =
  "fill-none stroke-[#7a9feb] stroke-[1.4] opacity-80 [stroke-dasharray:2_7] [stroke-linecap:round]";

/** Each station's colour, and its "lit" switch when its door is pointed at or focused. */
const STATION: Record<StationKey, string> = {
  ask: "text-[#7a9feb] group-has-[[data-st=ask]:hover]/home:[--hot:1] group-has-[[data-st=ask]:focus-visible]/home:[--hot:1]",
  map: "text-[#9cc8ff] group-has-[[data-st=map]:hover]/home:[--hot:1] group-has-[[data-st=map]:focus-visible]/home:[--hot:1]",
  cases:
    "text-[#9fe0bf] group-has-[[data-st=cases]:hover]/home:[--hot:1] group-has-[[data-st=cases]:focus-visible]/home:[--hot:1]",
  method:
    "text-[#cdbff3] group-has-[[data-st=method]:hover]/home:[--hot:1] group-has-[[data-st=method]:focus-visible]/home:[--hot:1]",
};

const RING = [
  "fill-[color-mix(in_srgb,currentColor_calc(var(--hot,0)*24%),#0a0e1c)] stroke-current stroke-2",
  "origin-center [transform-box:fill-box] scale-[calc(1+var(--hot,0)*0.14)]",
  "transition-[scale,fill] duration-fast ease-standard",
].join(" ");

const LABEL = [
  "fill-[color-mix(in_srgb,#fff_calc(var(--hot,0)*100%),#c3cad5)] font-sans text-[13px] font-semibold",
  "stroke-[#0a0e1c] stroke-4 [paint-order:stroke] [stroke-linejoin:round] transition-[fill] duration-fast",
].join(" ");

function BackLayer() {
  return (
    <svg
      className={LAYER}
      viewBox={`0 0 ${ORBIT_BOX} ${ORBIT_BOX}`}
      aria-hidden="true"
      focusable="false"
    >
      <path className={PATH} d={orbitPath(180, 360)} />
      <circle cx={C} cy={C} r={R} className="fill-[#11182e] stroke-[#232d48] stroke-[1.5]" />
      <path
        className="fill-[#16213f]"
        d={`M${C} ${C - R} A${R} ${R} 0 0 1 ${C} ${C + R} A${R * 0.42} ${R} 0 0 0 ${C} ${C - R}Z`}
      />
      <ellipse cx={C} cy={C} rx={R * 0.42} ry={R} className="fill-none stroke-[#232d48]" />
      <ellipse cx={C} cy={C} rx={R} ry={R * 0.34} className="fill-none stroke-[#232d48]" />
    </svg>
  );
}

function FrontLayer({ t }: { t: (key: string) => string }) {
  return (
    <svg
      className={LAYER}
      viewBox={`0 0 ${ORBIT_BOX} ${ORBIT_BOX}`}
      aria-hidden="true"
      focusable="false"
    >
      <path className={PATH} d={orbitPath(0, 180)} />
      {orbitStations().map((station) => (
        <g key={station.key} className={STATION[station.key]}>
          <circle className={RING} cx={station.x} cy={station.y} r={station.r} />
          <use
            href={`${SPRITE}#i-${station.icon}`}
            x={station.x - station.size / 2}
            y={station.y - station.size / 2}
            width={station.size}
            height={station.size}
            className="fill-current"
          />
          <text className={LABEL} x={station.x} y={station.labelY} textAnchor="middle">
            {t(`home2.st.${station.key}`)}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function HomeOrbit({ t }: { t: (key: string) => string }) {
  return (
    <div className="relative aspect-square">
      <BackLayer />
      <HomeEarthCanvas />
      <FrontLayer t={t} />
    </div>
  );
}
