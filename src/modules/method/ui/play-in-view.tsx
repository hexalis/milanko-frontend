"use client";

import { useEffect, useRef, type ReactNode } from "react";

/*
 * Marks itself [data-playing] while it is on screen, so a CSS loop inside it (lab-banner.css)
 * runs only while someone can see it. Without the API, or before it loads, the loop rests.
 */
export function PlayInView({ className, children }: { className: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) element.dataset.playing = "";
      else delete element.dataset.playing;
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} aria-hidden="true" className={className}>
      {children}
    </div>
  );
}
