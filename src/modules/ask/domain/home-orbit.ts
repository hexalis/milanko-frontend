/*
 * The ring around the home's planet and its four stations (POC ask.js homeOrbit), in the 440×440
 * box of its SVG. The ring is tilted like the Earth's axis; its back half goes behind the planet
 * and its front half over it.
 */

export const ORBIT_BOX = 440;
const CENTRE = ORBIT_BOX / 2;
/** Radius of the drawn planet; the Earth canvas takes the same share of the box. */
export const PLANET_R = 126;
const RX = 204;
const RY = 78;
const TILT = (-23.5 * Math.PI) / 180;
const PATH_STEP = 4;

export type StationKey = "ask" | "map" | "cases" | "method";

export type Station = {
  key: StationKey;
  icon: string;
  x: number;
  y: number;
  /** Radius of its ring. */
  r: number;
  /** Size of its icon. */
  size: number;
  /** Baseline of its label: under the station on the lower half, over it on the upper half. */
  labelY: number;
};

const STATIONS: readonly [StationKey, string, number][] = [
  ["ask", "ask", 110],
  ["map", "explore", 20],
  ["cases", "cases", 300],
  ["method", "method", 200],
];

const round = (value: number) => Math.round(value * 10) / 10;

/** A point of the tilted ring, `deg` degrees along it. */
export function orbitPoint(deg: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  const x = RX * Math.cos(a);
  const y = RY * Math.sin(a);
  return [
    round(CENTRE + x * Math.cos(TILT) - y * Math.sin(TILT)),
    round(CENTRE + x * Math.sin(TILT) + y * Math.cos(TILT)),
  ];
}

/** SVG path of the ring from one angle to another. */
export function orbitPath(from: number, to: number): string {
  const points: string[] = [];
  for (let deg = from; deg <= to; deg += PATH_STEP) points.push(orbitPoint(deg).join(","));
  return `M${points.join("L")}`;
}

export function orbitStations(): Station[] {
  return STATIONS.map(([key, icon, deg]) => {
    const [x, y] = orbitPoint(deg);
    const r = key === "ask" ? 24 : 19;
    return {
      key,
      icon,
      x,
      y,
      r,
      size: key === "ask" ? 24 : 20,
      labelY: round(y > CENTRE - 30 ? y + r + 18 : y - r - 9),
    };
  });
}
