"use client";

import { useEffect, useRef, type ReactNode } from "react";

/*
 * Brings a result into view when it appears: after an answer, the chart or the test's readout
 * slides up under the reader's eyes instead of waiting below the fold. Nothing moves when the
 * result is already on screen, and it jumps instead of gliding under reduced motion.
 */

/** Room kept clear for the lesson's sticky top bar. */
const TOP_CLEAR = 96;

export function RevealScroll({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el?.scrollIntoView) return;
    const box = el.getBoundingClientRect();
    if (box.height === 0) return;
    const isVisible = box.top >= TOP_CLEAR && box.top < window.innerHeight * 0.45;
    if (isVisible) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }, []);
  return (
    <div ref={ref} className={`scroll-mt-24 ${className ?? ""}`}>
      {children}
    </div>
  );
}
