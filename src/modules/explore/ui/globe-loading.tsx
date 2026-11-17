import type { CSSProperties } from "react";

/*
 * The globe's loader, drawn by the portal while the page and the globe's frame load: the same planet,
 * in the same place (centred beside the rail), with the same stylesheet as the frame's own loader
 * (public/globe/world3d/loader-orb.css, imported by app/globals.css so it is there from the first
 * paint). The frame paints its loader under this one and takes over without a jump: the explore
 * screen fades this still out once the frame has loaded. The words, bar and steps are the frame's.
 */

/** The planet's tiles (x, y, colour, delay in ms), as in the frame's loader: they light up left to right. */
const TILES: readonly (readonly [number, number, string, number])[] = [
  [-31.2, -9, "#2b6cb0", 234],
  [-31.2, 0, "#2b6cb0", 243],
  [-31.2, 9, "#2b6cb0", 202],
  [-23.4, -22.5, "#2b6cb0", 411],
  [-23.4, -13.5, "#3f8f5a", 481],
  [-23.4, -4.5, "#2b6cb0", 369],
  [-23.4, 4.5, "#dfe8f2", 420],
  [-23.4, 13.5, "#3f8f5a", 373],
  [-23.4, 22.5, "#dfe8f2", 376],
  [-15.6, -27, "#2b6cb0", 543],
  [-15.6, -18, "#2b6cb0", 564],
  [-15.6, -9, "#dfe8f2", 609],
  [-15.6, 0, "#3f8f5a", 542],
  [-15.6, 9, "#2b6cb0", 541],
  [-15.6, 18, "#dfe8f2", 573],
  [-15.6, 27, "#2b6cb0", 554],
  [-7.8, -31.5, "#6aa84f", 781],
  [-7.8, -22.5, "#2b6cb0", 779],
  [-7.8, -13.5, "#3f8f5a", 721],
  [-7.8, -4.5, "#2b6cb0", 755],
  [-7.8, 4.5, "#2b6cb0", 778],
  [-7.8, 13.5, "#2b6cb0", 780],
  [-7.8, 22.5, "#3f8f5a", 787],
  [-7.8, 31.5, "#dfe8f2", 771],
  [0, -27, "#c9a66b", 979],
  [0, -18, "#1f4e8c", 939],
  [0, -9, "#6aa84f", 926],
  [0, 0, "#2b6cb0", 911],
  [0, 9, "#3f8f5a", 969],
  [0, 18, "#6aa84f", 890],
  [0, 27, "#1f4e8c", 947],
  [7.8, -31.5, "#c9a66b", 1163],
  [7.8, -22.5, "#1f4e8c", 1144],
  [7.8, -13.5, "#2b6cb0", 1087],
  [7.8, -4.5, "#dfe8f2", 1066],
  [7.8, 4.5, "#c9a66b", 1072],
  [7.8, 13.5, "#1f4e8c", 1070],
  [7.8, 22.5, "#2b6cb0", 1104],
  [7.8, 31.5, "#2b6cb0", 1136],
  [15.6, -27, "#c9a66b", 1320],
  [15.6, -18, "#c9a66b", 1266],
  [15.6, -9, "#1f4e8c", 1299],
  [15.6, 0, "#1f4e8c", 1297],
  [15.6, 9, "#2b6cb0", 1231],
  [15.6, 18, "#6aa84f", 1343],
  [15.6, 27, "#2b6cb0", 1283],
  [23.4, -22.5, "#6aa84f", 1401],
  [23.4, -13.5, "#1f4e8c", 1476],
  [23.4, -4.5, "#dfe8f2", 1430],
  [23.4, 4.5, "#c9a66b", 1507],
  [23.4, 13.5, "#1f4e8c", 1396],
  [23.4, 22.5, "#2b6cb0", 1439],
  [31.2, -9, "#2b6cb0", 1644],
  [31.2, 0, "#2b6cb0", 1629],
  [31.2, 9, "#6aa84f", 1593],
];

/** A flat-topped hexagon of radius 4.5 around (x, y). */
function hexagon(x: number, y: number): string {
  return [
    [4.5, 0],
    [2.25, 3.9],
    [-2.25, 3.9],
    [-4.5, 0],
    [-2.25, -3.9],
    [2.25, -3.9],
  ]
    .map(([dx, dy]) => `${(x + dx).toFixed(2)},${(y + dy).toFixed(2)}`)
    .join(" ");
}

function Orbit({ body, side }: { body: "sat" | "moon"; side: "back" | "front" }) {
  return (
    <span className={`ld-orbit${body === "moon" ? " ld-orbit--b" : ""} is-${side}`}>
      <span className="ld-run">
        <i className={`ld-${body}`} />
      </span>
    </span>
  );
}

type GlobeLoadingProps = {
  /** Said to screen readers where this still is the only loader (the page's fallback). */
  label?: string;
  className?: string;
};

export function GlobeLoading({ label, className = "" }: GlobeLoadingProps) {
  return (
    <div
      role={label ? "status" : undefined}
      aria-hidden={label ? undefined : true}
      className={`ld-sky shell:ps-[calc(var(--rail-w)+2.25rem)] grid grid-rows-[1fr_auto_1fr] items-center justify-items-center p-6 ${className}`}
    >
      {label ? <span className="sr-only">{label}</span> : null}
      <div className="ld-orb row-start-2" aria-hidden="true">
        <span className="ld-halo" />
        <span className="ld-ping" />
        <Orbit body="sat" side="back" />
        <Orbit body="moon" side="back" />
        <span className="ld-air" />
        <svg className="ld-globe" viewBox="-64 -64 128 128">
          <defs>
            <radialGradient id="ldShade" cx="35%" cy="30%" r="75%">
              <stop offset="0" stopColor="#fff" stopOpacity="0.12" />
              <stop offset="0.6" stopColor="#000" stopOpacity="0" />
              <stop offset="1" stopColor="#000" stopOpacity="0.55" />
            </radialGradient>
          </defs>
          <circle className="ld-ball" r="40" />
          <g className="ld-hex">
            {TILES.map(([x, y, fill, delay]) => (
              <polygon
                key={`${x},${y}`}
                points={hexagon(x, y)}
                fill={fill}
                style={{ "--d": `${delay}ms` } as CSSProperties}
              />
            ))}
          </g>
          <circle className="ld-shade" r="40" />
        </svg>
        <span className="ld-sweep" />
        <Orbit body="sat" side="front" />
        <Orbit body="moon" side="front" />
      </div>
    </div>
  );
}
