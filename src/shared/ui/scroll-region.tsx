"use client";

import { useEffect, useRef, type ReactNode } from "react";

type ScrollRegionProps = {
  /** Layout classes; the overflow utility (overflow-x-auto, overflow-auto) belongs here. */
  className: string;
  /** Name of the frame while it scrolls; or point at an existing caption with `labelledBy`. */
  label?: string;
  labelledBy?: string;
  children: ReactNode;
};

const FOCUS = "focus-visible:focus-ring focus-visible:outline-focus-ring";
const SCROLL_ATTRIBUTES = ["tabindex", "role", "aria-label", "aria-labelledby"];

function isOverflowing(element: HTMLElement): boolean {
  return element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight;
}

/** The frame is a named, focusable group only while it scrolls; otherwise a plain div. */
function syncScrollable(element: HTMLElement, label?: string, labelledBy?: string) {
  if (!isOverflowing(element)) {
    for (const name of SCROLL_ATTRIBUTES) element.removeAttribute(name);
    return;
  }
  element.tabIndex = 0;
  element.setAttribute("role", "group");
  if (labelledBy) element.setAttribute("aria-labelledby", labelledBy);
  else if (label) element.setAttribute("aria-label", label);
}

/**
 * A frame that may scroll (a wide table or chart). Keyboard users can only scroll what they can
 * focus (WCAG 2.1.1), so the frame takes a tab stop, a group role and a name while its content
 * overflows, and drops them when it fits: no empty tab stops on wide screens.
 */
export function ScrollRegion({ className, label, labelledBy, children }: ScrollRegionProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const sync = () => syncScrollable(element, label, labelledBy);
    sync();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(sync);
    observer.observe(element);
    if (element.firstElementChild) observer.observe(element.firstElementChild);
    return () => observer.disconnect();
  }, [label, labelledBy]);

  return (
    <div ref={ref} className={`${className} ${FOCUS}`}>
      {children}
    </div>
  );
}
