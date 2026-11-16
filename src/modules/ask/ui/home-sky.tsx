"use client";

import { useEffect, useRef, type CSSProperties } from "react";

/*
 * The night behind the home's cover and closing band: the 3D globe's sky (public/globe/world3d/
 * sky.js) in two dimensions. A faint Milky Way crosses the stage with violet, teal and rose
 * nebulae, and stars with real colours gather along it; a few bright ones carry a telescope's
 * spikes. All of it is painted once per size. On top, a handful of stars twinkle and now and then
 * a meteor crosses (CSS, globals.css "Home sky"); reduced motion keeps only the still sky.
 * Decoration only: nothing here is data.
 */

export type SkyScene = "dawn" | "dusk";

type Rgb = readonly [number, number, number];

// Share of stars by colour, from blue-white hot stars to orange cool ones (as in sky.js).
const STAR_KINDS: readonly (readonly [number, Rgb])[] = [
  [0.08, [157, 180, 255]],
  [0.2, [200, 214, 255]],
  [0.26, [244, 243, 255]],
  [0.2, [255, 242, 224]],
  [0.17, [255, 215, 168]],
  [0.09, [255, 190, 134]],
];

const WHITE: Rgb = [244, 243, 255];
const MAX_DPR = 2;
const MAX_STARS = 2400;

// The same sky on every visit, so the cover never reshuffles.
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16_807) % 2_147_483_647;
    return (s - 1) / 2_147_483_646;
  };
}

type Scene = {
  seed: number;
  /** The Milky Way, from one edge to the other, in fractions of the stage. */
  band: readonly [number, number, number, number];
  /** Where along the band its bright core sits (0 to 1). */
  core: number;
  nebulae: readonly { x: number; y: number; r: number; rgb: Rgb; a: number }[];
};

const SCENES: Record<SkyScene, Scene> = {
  // The cover: the band climbs from the lower left towards the Earth on the right.
  dawn: {
    seed: 1969,
    band: [-0.1, 1.05, 1.1, -0.1],
    core: 0.7,
    nebulae: [
      { x: 0.16, y: 0.18, r: 0.5, rgb: [150, 60, 210], a: 0.2 },
      { x: 0.86, y: 0.82, r: 0.55, rgb: [30, 150, 190], a: 0.18 },
      { x: 0.62, y: 0.34, r: 0.32, rgb: [210, 70, 120], a: 0.1 },
    ],
  },
  // The closing band: the band falls towards the horizon, the light of the dusk under it.
  dusk: {
    seed: 2026,
    band: [-0.1, -0.05, 1.1, 0.95],
    core: 0.35,
    nebulae: [
      { x: 0.82, y: 0.12, r: 0.45, rgb: [150, 60, 210], a: 0.16 },
      { x: 0.12, y: 0.7, r: 0.5, rgb: [30, 150, 190], a: 0.14 },
    ],
  },
};

const rgba = ([r, g, b]: Rgb, a: number) => `rgba(${r}, ${g}, ${b}, ${a})`;

function blob(g: CanvasRenderingContext2D, x: number, y: number, r: number, rgb: Rgb, a: number) {
  const fill = g.createRadialGradient(x, y, 0, x, y, r);
  fill.addColorStop(0, rgba(rgb, a));
  fill.addColorStop(0.45, rgba(rgb, a * 0.4));
  fill.addColorStop(1, rgba(rgb, 0));
  g.fillStyle = fill;
  g.fillRect(x - r, y - r, r * 2, r * 2);
}

function paintSky(canvas: HTMLCanvasElement, sceneName: SkyScene) {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (!w || !h) return;
  const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const g = canvas.getContext("2d");
  if (!g) return;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, w, h);
  g.globalCompositeOperation = "lighter";

  const scene = SCENES[sceneName];
  const rand = seeded(scene.seed);
  const gauss = () => Math.sqrt(-2 * Math.log(rand() || 1e-9)) * Math.cos(Math.PI * 2 * rand());
  const big = Math.max(w, h);
  const [ax, ay, bx, by] = scene.band;
  const x0 = ax * w;
  const y0 = ay * h;
  const dx = bx * w - x0;
  const dy = by * h - y0;
  const length = Math.hypot(dx, dy);
  const nx = -dy / length;
  const ny = dx / length;
  const spread = big * 0.09;
  const coreAt = (t: number) => Math.exp(-(((t - scene.core) / 0.2) ** 2));

  // Nebulae first, the widest and faintest light.
  for (const n of scene.nebulae) blob(g, n.x * w, n.y * h, n.r * big, n.rgb, n.a);

  // The Milky Way: soft clouds along the band, warmer and brighter at its core.
  for (let i = 0; i <= 30; i++) {
    const t = i / 30;
    const k = coreAt(t);
    const wobble = gauss() * spread * 0.35;
    const x = x0 + dx * t + nx * wobble;
    const y = y0 + dy * t + ny * wobble;
    const tone: Rgb = [
      Math.round(120 + 135 * k),
      Math.round(140 + 50 * k),
      Math.round(230 - 80 * k),
    ];
    blob(g, x, y, spread * (1.4 + rand() * 1.2), tone, 0.05 + 0.07 * k);
  }

  // Stars: a steep brightness curve, as in a real sky; nearly half crowd the band.
  const count = Math.min(MAX_STARS, Math.round((w * h) / 520));
  const colour = () => {
    let r = rand();
    for (const [share, rgb] of STAR_KINDS) if ((r -= share) <= 0) return rgb;
    return WHITE;
  };
  for (let i = 0; i < count; i++) {
    let x: number;
    let y: number;
    if (i < count * 0.45) {
      const t = rand();
      const off = gauss() * spread * (0.6 + coreAt(t));
      x = x0 + dx * t + nx * off;
      y = y0 + dy * t + ny * off;
    } else {
      x = rand() * w;
      y = rand() * h;
    }
    const bright = Math.pow(rand(), 6);
    const glow = 0.28 + 0.72 * Math.min(1, bright * 2.5 + Math.pow(rand(), 3) * 0.6);
    g.fillStyle = rgba(colour(), glow);
    g.beginPath();
    g.arc(x, y, 0.3 + bright * 1.5, 0, Math.PI * 2);
    g.fill();
  }

  // A few bright stars: a core, a halo and the four spikes of a telescope's struts.
  const flares = Math.max(3, Math.round((w * h) / 140_000));
  for (let i = 0; i < flares; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const rgb = colour();
    const size = 4 + rand() * 6;
    blob(g, x, y, size, rgb, 0.45);
    for (const [ex, ey] of [
      [size * 1.5, 0],
      [0, size * 1.5],
    ] as const) {
      const spike = g.createLinearGradient(x - ex, y - ey, x + ex, y + ey);
      spike.addColorStop(0, rgba(rgb, 0));
      spike.addColorStop(0.5, rgba([255, 255, 255], 0.6));
      spike.addColorStop(1, rgba(rgb, 0));
      g.strokeStyle = spike;
      g.lineWidth = 0.8;
      g.beginPath();
      g.moveTo(x - ex, y - ey);
      g.lineTo(x + ex, y + ey);
      g.stroke();
    }
    g.fillStyle = "#fff";
    g.beginPath();
    g.arc(x, y, 1.1, 0, Math.PI * 2);
    g.fill();
  }
}

// The stars that twinkle: place, size, how long one breath takes and when it starts.
const TWINKLES: readonly { x: string; y: string; s: number; t: string; d: string }[] = [
  { x: "8%", y: "14%", s: 2, t: "4.2s", d: "0s" },
  { x: "23%", y: "62%", s: 1.5, t: "5.1s", d: "1.3s" },
  { x: "37%", y: "9%", s: 2.5, t: "3.6s", d: "0.6s" },
  { x: "49%", y: "78%", s: 1.5, t: "4.8s", d: "2.2s" },
  { x: "58%", y: "22%", s: 2, t: "5.6s", d: "0.9s" },
  { x: "71%", y: "6%", s: 1.5, t: "4.4s", d: "3.1s" },
  { x: "83%", y: "48%", s: 2.5, t: "3.9s", d: "1.7s" },
  { x: "94%", y: "18%", s: 1.5, t: "5.3s", d: "2.6s" },
];

type SkyVars = CSSProperties & Record<`--${string}`, string>;

export function HomeSky({
  scene,
  meteorDelay = "3s",
}: {
  scene: SkyScene;
  /** When the first meteor crosses; each one then waits for the next cycle. */
  meteorDelay?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || typeof ResizeObserver === "undefined") return;
    let last = "";
    const observer = new ResizeObserver(() => {
      const size = `${canvas.clientWidth}x${canvas.clientHeight}`;
      if (size === last) return;
      last = size;
      paintSky(canvas, scene);
      canvas.dataset.ready = "";
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [scene]);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <canvas
        ref={ref}
        aria-hidden="true"
        className="ease-enter absolute inset-0 size-full opacity-0 transition-opacity duration-[1200ms] data-ready:opacity-100 motion-reduce:transition-none"
      />
      {TWINKLES.map((star) => (
        <span
          key={`${star.x}${star.y}`}
          className="sky-twinkle absolute rounded-full bg-white shadow-[0_0_6px_1px_rgba(200,214,255,0.7)]"
          style={
            {
              left: star.x,
              top: star.y,
              width: star.s,
              height: star.s,
              "--t": star.t,
              "--d": star.d,
            } as SkyVars
          }
        />
      ))}
      <span
        className="sky-meteor absolute top-[12%] left-[18%] h-px w-[130px] rotate-[24deg] bg-linear-to-r from-transparent via-white/40 to-white"
        style={{ "--d": meteorDelay } as SkyVars}
      />
    </div>
  );
}
