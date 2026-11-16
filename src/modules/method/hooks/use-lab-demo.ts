"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

/*
 * A short show-and-tell for a lab: the first time it comes into view, a cursor drags its real
 * sliders through a few moves so the reader sees what they do, then hands over ("your turn").
 * The reader takes over at any moment: a press or a key inside the lab stops the demo where it is.
 * Reduced motion: no demo, the lab simply waits.
 */

export type DemoMove = {
  /** Index of the slider (in DOM order) the cursor drags. */
  slider: number;
  to: number;
  ms: number;
};

export type DemoCursor = { x: number; y: number; isDown: boolean; isDragging: boolean };

type LabDemo = {
  cursor: DemoCursor | null;
  isTurn: boolean;
  replay: () => void;
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** Centre of a slider's thumb, relative to the lab. */
function thumbAt(root: HTMLElement, slider: number): { x: number; y: number } | null {
  const input = root.querySelectorAll<HTMLInputElement>('input[type="range"]')[slider];
  const thumb = input?.parentElement;
  if (!thumb) return null;
  const box = thumb.getBoundingClientRect();
  const frame = root.getBoundingClientRect();
  return { x: box.left + box.width / 2 - frame.left, y: box.top + box.height / 2 - frame.top };
}

export function useLabDemo(
  rootRef: RefObject<HTMLElement | null>,
  moves: readonly DemoMove[],
  read: (slider: number) => number,
  write: (slider: number, value: number) => void,
): LabDemo {
  const [cursor, setCursor] = useState<DemoCursor | null>(null);
  const [isTurn, setIsTurn] = useState(false);
  const run = useRef(0);

  const stop = useCallback(() => {
    run.current += 1;
    setCursor(null);
    setIsTurn(false);
  }, []);

  const play = useCallback(async () => {
    const root = rootRef.current;
    if (!root) return;
    const id = ++run.current;
    const alive = () => run.current === id;
    setIsTurn(false);
    const start = thumbAt(root, moves[0]?.slider ?? 0);
    if (!start) return;
    setCursor({ x: start.x + 120, y: start.y + 70, isDown: false, isDragging: false });
    await wait(450);
    for (const move of moves) {
      if (!alive()) return;
      const at = thumbAt(root, move.slider);
      if (!at) return;
      setCursor({ ...at, isDown: false, isDragging: false });
      await wait(650);
      if (!alive()) return;
      setCursor({ ...at, isDown: true, isDragging: false });
      await wait(180);
      const from = read(move.slider);
      const began = performance.now();
      for (;;) {
        if (!alive()) return;
        const t = Math.min(1, (performance.now() - began) / move.ms);
        write(move.slider, from + (move.to - from) * ease(t));
        await nextFrame();
        const now = thumbAt(root, move.slider);
        if (now) setCursor({ ...now, isDown: true, isDragging: true });
        if (t === 1) break;
      }
      await wait(160);
      if (!alive()) return;
      setCursor((current) => current && { ...current, isDown: false, isDragging: false });
      await wait(500);
    }
    if (!alive()) return;
    setCursor(null);
    setIsTurn(true);
  }, [moves, read, rootRef, write]);

  useEffect(() => {
    const root = rootRef.current;
    // No demo without the APIs it needs (older browsers, tests) or when the reader asks for less motion.
    if (!root || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        void play();
      },
      { threshold: 0.6 },
    );
    observer.observe(root);
    // The reader's own hand always wins over the demo.
    root.addEventListener("pointerdown", stop);
    root.addEventListener("keydown", stop);
    return () => {
      observer.disconnect();
      root.removeEventListener("pointerdown", stop);
      root.removeEventListener("keydown", stop);
      run.current += 1;
    };
  }, [play, rootRef, stop]);

  return { cursor, isTurn, replay: () => void play() };
}
