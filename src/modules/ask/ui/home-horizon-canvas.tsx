"use client";

import { useEffect, useRef } from "react";
import { useEarthTexture } from "../hooks/use-earth-texture";
import type { Texture } from "../domain/sphere";
import { createSpherePainter } from "./sphere-canvas";

/*
 * The curve of the Earth seen from orbit, under the home's closing band (POC ask.js homeHorizon).
 * A slice of a sphere far larger than the band, drawn once per size; it does not turn.
 */

const MIN_HEIGHT = 140;
const MAX_HEIGHT = 220;
const TURN = -0.35;

function paintHorizon(canvas: HTMLCanvasElement, texture: Texture) {
  const width = canvas.clientWidth;
  if (!width) return;
  const height = Math.round(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, width * 0.2)));
  canvas.style.height = `${height}px`;
  const r = width * 0.9;
  const frame = { cssWidth: width, cssHeight: height, cx: width * 0.58, cy: 36 + r, r };
  createSpherePainter(canvas, { ...frame, roll: 8, pitch: 28 }, texture)?.(TURN);
}

export function HomeHorizonCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const texture = useEarthTexture();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !texture) return;
    let lastWidth = 0;
    const observer = new ResizeObserver(() => {
      if (canvas.clientWidth === lastWidth) return;
      lastWidth = canvas.clientWidth;
      paintHorizon(canvas, texture);
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [texture]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      data-ready={texture ? "" : undefined}
      className="ease-enter block h-[140px] w-full max-w-none opacity-0 transition-opacity duration-[800ms] data-ready:opacity-100 motion-reduce:transition-none"
    />
  );
}
