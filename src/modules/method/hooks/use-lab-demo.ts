"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

/*
 * A short show-and-tell for a lab: the first time it comes into view, a cursor drags its real
 * sliders through a few moves so the reader sees what they do, then hands over ("your turn").
 * Besides dragging a slider, the cursor can press a control (a choice, a button) to show that it
 * is there. A target out of view is brought into view first, so a tall lab can be shown on a phone.
 * The reader takes over at any moment: a press or a key inside the lab stops the demo where it is.
 * Reduced motion: no demo, the lab simply waits.
 */

export type DemoMove =
  | {
      /** Index of the slider (in DOM order) the cursor drags. */
      slider: number;
      to: number;
      ms: number;
    }
  | {
      /** A control inside the lab the cursor presses (a CSS selector); a wrapper presses its button. */
      press: string;
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

/** What a move points at: a slider's thumb, or the control it presses. */
function targetOf(root: HTMLElement, move: DemoMove): HTMLElement | null {
  if ("press" in move) {
    const found = root.querySelector<HTMLElement>(move.press);
    return found?.matches("button, label, input, a")
      ? found
      : (found?.querySelector("button") ?? null);
  }
  const input = root.querySelectorAll<HTMLInputElement>('input[type="range"]')[move.slider];
  return input?.parentElement ?? null;
}

/** Centre of an element, relative to the lab. */
function centreOf(root: HTMLElement, element: HTMLElement | null): { x: number; y: number } | null {
  if (!element) return null;
  const box = element.getBoundingClientRect();
  const frame = root.getBoundingClientRect();
  return { x: box.left + box.width / 2 - frame.left, y: box.top + box.height / 2 - frame.top };
}

/** Scrolls a target into view when it is not, and waits for the scroll to settle. */
async function bringIntoView(element: HTMLElement | null) {
  if (!element) return;
  const box = element.getBoundingClientRect();
  if (box.top >= 80 && box.bottom <= window.innerHeight - 96) return;
  element.scrollIntoView({ block: "center", behavior: "smooth" });
  await wait(550);
}

export function useLabDemo(
  rootRef: RefObject<HTMLElement | null>,
  moves: readonly DemoMove[],
  read: (slider: number) => number,
  write: (slider: number, value: number) => void,
  /** How much of the lab must show before the demo starts: less for a tall lab. */
  threshold = 0.6,
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
    const first = moves[0];
    const start = first ? centreOf(root, targetOf(root, first)) : null;
    if (!start) return;
    setCursor({ x: start.x + 120, y: start.y + 70, isDown: false, isDragging: false });
    await wait(450);
    for (const move of moves) {
      if (!alive()) return;
      const target = targetOf(root, move);
      await bringIntoView(target);
      if (!alive()) return;
      const at = centreOf(root, target);
      if (!target || !at) return;
      setCursor({ ...at, isDown: false, isDragging: false });
      await wait(650);
      if (!alive()) return;
      setCursor({ ...at, isDown: true, isDragging: false });
      await wait(180);
      if ("press" in move) {
        target.click();
        await wait(160);
        if (!alive()) return;
        setCursor({ ...at, isDown: false, isDragging: false });
        await wait(700);
        continue;
      }
      const from = read(move.slider);
      const began = performance.now();
      for (;;) {
        if (!alive()) return;
        const t = Math.min(1, (performance.now() - began) / move.ms);
        write(move.slider, from + (move.to - from) * ease(t));
        await nextFrame();
        // A run replaced while it waited for a frame leaves the cursor to the new one.
        if (!alive()) return;
        const now = centreOf(root, targetOf(root, move));
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
      { threshold },
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
  }, [play, rootRef, stop, threshold]);

  return { cursor, isTurn, replay: () => void play() };
}
