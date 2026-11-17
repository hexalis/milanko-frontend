"use client";

import { type ReactNode, useEffect, useRef } from "react";

/*
 * The case file's sections, shown as the reader scrolls to them: each one fades and rises a little
 * the first time it comes into view, then stays put. Only sections still below the fold are held
 * back, and only once this runs, so the page reads in full without JavaScript, for anything already
 * on screen and when the reader asks for less motion.
 */

/** Hidden until revealed; children always ease their opacity and position back. */
const REVEAL = [
  "*:transition-[opacity,translate] *:duration-700 *:ease-[cubic-bezier(0.22,1,0.36,1)]",
  "[&>[data-reveal]]:translate-y-4 [&>[data-reveal]]:opacity-0",
].join(" ");

/** Between sections that come into view together, so they arrive one after another. */
const STAGGER_MS = 90;

export function ScrollReveal({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const fold = window.innerHeight;
    const waiting = [...root.children].filter(
      (child): child is HTMLElement =>
        child instanceof HTMLElement && child.getBoundingClientRect().top > fold * 0.92,
    );
    for (const child of waiting) child.dataset.reveal = "";

    const observer = new IntersectionObserver(
      (entries) => {
        const arriving = entries.filter((entry) => entry.isIntersecting);
        arriving.forEach((entry, index) => {
          const section = entry.target as HTMLElement;
          observer.unobserve(section);
          section.style.transitionDelay = `${index * STAGGER_MS}ms`;
          delete section.dataset.reveal;
          section.addEventListener(
            "transitionend",
            () => {
              section.style.transitionDelay = "";
            },
            { once: true },
          );
        });
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    for (const child of waiting) observer.observe(child);

    return () => {
      observer.disconnect();
      for (const child of waiting) delete child.dataset.reveal;
    };
  }, []);

  return (
    <div ref={ref} className={`${REVEAL} ${className}`}>
      {children}
    </div>
  );
}
