"use client";

import { useEffect, useRef } from "react";
import { useEarthTexture } from "../hooks/use-earth-texture";
import { EARTH_FACING, INTRO_MS, INTRO_TURN, easeOutCubic, type Texture } from "../domain/sphere";
import { createSpherePainter } from "./sphere-canvas";

/*
 * The cover planet (POC ask.js homePlanet): NASA's Blue Marble on a canvas, tilted 23.5° like the
 * logo, over the drawn planet that stands in while it loads. Once per session it turns into place;
 * after that only a drag turns it. Horizontal drags turn it; vertical ones still scroll a phone.
 */

const INTRO_KEY = "etd-home-intro";
const LATE_FRAME_MS = 200;

type Planet = { turn: number; isBusy: boolean; paint?: (turn: number) => void };

/** The welcome plays once per session and never with reduced motion. */
function shouldPlayIntro(): boolean {
  const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  try {
    if (window.sessionStorage.getItem(INTRO_KEY)) return false;
    window.sessionStorage.setItem(INTRO_KEY, "1");
  } catch {
    // Storage blocked: play it (unless motion is reduced) and do not remember.
  }
  return !isReduced;
}

function playIntro(planet: Planet): () => void {
  const from = EARTH_FACING + INTRO_TURN;
  const start = performance.now();
  let frame = 0;
  const step = (now: number) => {
    if (planet.isBusy) return;
    const k = Math.min(1, (now - start) / INTRO_MS);
    planet.turn = from + (EARTH_FACING - from) * easeOutCubic(k);
    planet.paint?.(planet.turn);
    if (k < 1) frame = requestAnimationFrame(step);
  };
  planet.turn = from;
  planet.paint?.(from);
  frame = requestAnimationFrame(step);
  // A hidden tab may never paint the next frame: make sure the last one lands.
  const timer = window.setTimeout(() => {
    if (planet.isBusy || planet.turn === EARTH_FACING) return;
    planet.turn = EARTH_FACING;
    planet.paint?.(planet.turn);
  }, INTRO_MS + LATE_FRAME_MS);
  return () => {
    cancelAnimationFrame(frame);
    window.clearTimeout(timer);
  };
}

/** Paints at most once per frame: pointer and resize events fire far more often than frames. */
function frameScheduler(planet: Planet) {
  let frame = 0;
  const request = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      planet.paint?.(planet.turn);
    });
  };
  return { request, cancel: () => cancelAnimationFrame(frame) };
}

function bindDrag(canvas: HTMLCanvasElement, planet: Planet, repaint: () => void): () => void {
  let lastX: number | undefined;
  const down = (event: PointerEvent) => {
    if (!event.isPrimary || event.button !== 0) return;
    planet.isBusy = true;
    lastX = event.clientX;
    canvas.setPointerCapture(event.pointerId);
    canvas.dataset.drag = "";
  };
  const move = (event: PointerEvent) => {
    if (lastX === undefined || !event.isPrimary) return;
    planet.turn += (event.clientX - lastX) / (canvas.clientWidth / 2);
    lastX = event.clientX;
    repaint();
  };
  const end = () => {
    lastX = undefined;
    delete canvas.dataset.drag;
  };
  const events = [
    ["pointerdown", down],
    ["pointermove", move],
    ["pointerup", end],
    ["pointercancel", end],
    ["lostpointercapture", end],
  ] as const;
  for (const [name, handler] of events) canvas.addEventListener(name, handler);
  return () => {
    for (const [name, handler] of events) canvas.removeEventListener(name, handler);
  };
}

function runPlanet(canvas: HTMLCanvasElement, texture: Texture): () => void {
  const planet: Planet = { turn: EARTH_FACING, isBusy: false };
  const scheduler = frameScheduler(planet);
  let fittedSize = 0;
  const fit = () => {
    const size = canvas.clientWidth;
    // The pixel map is rebuilt only when the size really changes.
    if (!size || size === fittedSize) return;
    fittedSize = size;
    const half = size / 2;
    planet.paint = createSpherePainter(
      canvas,
      { cssWidth: size, cssHeight: size, cx: half, cy: half, r: half - 1 },
      texture,
    );
    scheduler.request();
  };
  fit();
  planet.paint?.(planet.turn);
  const stopIntro = shouldPlayIntro() ? playIntro(planet) : undefined;
  const unbindDrag = bindDrag(canvas, planet, scheduler.request);
  const observer = new ResizeObserver(fit);
  observer.observe(canvas);
  return () => {
    stopIntro?.();
    unbindDrag();
    observer.disconnect();
    scheduler.cancel();
  };
}

export function HomeEarthCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const texture = useEarthTexture();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !texture) return;
    return runPlanet(canvas, texture);
  }, [texture]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      data-ready={texture ? "" : undefined}
      className="ease-enter absolute top-1/2 left-1/2 aspect-square w-[57.27%] -translate-1/2 cursor-grab touch-pan-y rounded-full opacity-0 transition-opacity duration-[600ms] data-drag:cursor-grabbing data-ready:opacity-100 motion-reduce:transition-none"
    />
  );
}
