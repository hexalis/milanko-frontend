/*
 * The popover must never cover what it explains. The tour normally scrolls a step's element to the
 * middle of the screen, which leaves the popover room above and below only for short elements.
 * A taller one is aligned to the top of the screen instead (below any sticky bar), so the popover
 * gets all the room under it; one taller still is replaced by its largest part that fits.
 */

/** Height the popover needs above or below the element, with its gap and the screen's margins. */
export const POPOVER_ROOM = 200;

export type FitTarget = {
  element: Element;
  /** "start": scroll the element to the top of the screen before it is highlighted. */
  align: "center" | "start";
};

const height = (element: Element) => element.getBoundingClientRect().height;

/** Visibly drawn: screen-reader-only text (1px boxes) and hidden parts do not count. */
const isDrawn = (element: Element) => {
  const box = element.getBoundingClientRect();
  return box.width > 1 && box.height > 1;
};

/**
 * The largest drawn block inside `root` no taller than `limit`: each child that fits is a
 * candidate, and a child too tall is searched in turn. Ties go to the first, in reading order.
 */
function largestFit(root: Element, limit: number): Element | undefined {
  let best: Element | undefined;
  for (const child of Array.from(root.children)) {
    if (!isDrawn(child)) continue;
    const candidate = height(child) <= limit ? child : largestFit(child, limit);
    if (candidate && (!best || height(candidate) > height(best))) best = candidate;
  }
  return best;
}

const isPinned = (bar: Element) => {
  const { position } = getComputedStyle(bar);
  return position === "sticky" || position === "fixed";
};

/** A bar counts as pinned to the top when it sits in the top band of the screen. */
const TOP_BAND = 160;

/**
 * How far down the screen the sticky or fixed bars at its top reach above `element` (the phone's
 * top bar, the lesson's progress bar). Side rails and bottom bars (the phone's tabbar) do not count.
 */
export function topCover(element: Element): number {
  const box = element.getBoundingClientRect();
  let cover = 0;
  for (const bar of Array.from(document.querySelectorAll("header, nav"))) {
    if (bar.contains(element) || !isPinned(bar)) continue;
    const barBox = bar.getBoundingClientRect();
    const isOver = barBox.right > box.left && barBox.left < box.right;
    if (isOver && barBox.top < TOP_BAND && barBox.bottom <= TOP_BAND) {
      cover = Math.max(cover, barBox.bottom);
    }
  }
  return cover;
}

/** Scrolls the page so `element` starts just under the bars pinned to the top. */
export function alignToTop(element: Element): void {
  const top = element.getBoundingClientRect().top + window.scrollY - topCover(element) - 8;
  window.scrollTo({ top: Math.max(0, top), behavior: "instant" });
}

/**
 * @param barsHeight height of the sticky bars over the top of the screen, which an element aligned
 *   to the top must clear.
 */
export function fitTarget(element: Element, viewportHeight: number, barsHeight = 0): FitTarget {
  if (height(element) <= viewportHeight - 2 * POPOVER_ROOM) return { element, align: "center" };
  const limit = viewportHeight - POPOVER_ROOM - barsHeight;
  if (height(element) <= limit) return { element, align: "start" };
  return { element: largestFit(element, limit) ?? element, align: "start" };
}
