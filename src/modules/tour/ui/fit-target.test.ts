import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fitTarget, POPOVER_ROOM, topCover } from "./fit-target";

const SCREEN = 800;
const BAR = 60;
/** Tallest element centred with the popover's room on both sides. */
const CENTRED = SCREEN - 2 * POPOVER_ROOM;
/** Tallest element aligned to the top, under the bar, with the popover's room below. */
const TOP = SCREEN - POPOVER_ROOM - BAR;

/** jsdom lays nothing out: each element's height comes from its data-h attribute (0 if absent). */
function mockHeights() {
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
    const h = Number(this.getAttribute("data-h") ?? 0);
    return { width: h ? 300 : 0, height: h, top: 0, left: 0, right: 300, bottom: h } as DOMRect;
  });
}

function build(html: string): Element {
  document.body.innerHTML = html;
  return document.body.firstElementChild as Element;
}

describe("fitTarget", () => {
  beforeEach(mockHeights);
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("centres a short element, with room for the popover above and below", () => {
    const element = build(`<section data-h="${CENTRED}"></section>`);
    expect(fitTarget(element, SCREEN, BAR)).toEqual({ element, align: "center" });
  });

  it("aligns a taller element to the top, under the bar, so the popover fits below", () => {
    const element = build(`<section data-h="${TOP}"></section>`);
    expect(fitTarget(element, SCREEN, BAR)).toEqual({ element, align: "start" });
  });

  it("points at the largest part that fits when the element does not", () => {
    const element = build(`
      <section data-h="1400">
        <h2 data-h="40">Title</h2>
        <p data-h="1">Screen-reader note</p>
        <div data-h="1200">
          <div id="lab" data-h="420">Lab</div>
          <div data-h="300">Notes</div>
        </div>
      </section>`);
    const fit = fitTarget(element, SCREEN, BAR);
    expect((fit.element as HTMLElement).id).toBe("lab");
    expect(fit.align).toBe("start");
  });

  it("counts the bars pinned at the top, not the tabbar pinned at the bottom", () => {
    vi.restoreAllMocks();
    const boxes: Record<string, [top: number, bottom: number]> = {
      top: [0, 56],
      tabbar: [740, 804],
      target: [300, 600],
    };
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (
      this: Element,
    ) {
      const [top, bottom] = boxes[this.id] ?? [0, 0];
      return { top, bottom, height: bottom - top, left: 0, right: 375, width: 375 } as DOMRect;
    });
    document.body.innerHTML = `
      <header id="top" style="position: sticky"></header>
      <main><section id="target"></section></main>
      <nav id="tabbar" style="position: fixed"></nav>`;
    expect(topCover(document.getElementById("target") as Element)).toBe(56);
  });

  it("keeps the element when no part of it fits", () => {
    const element = build(`<div data-h="2000"><div data-h="1500">Only child</div></div>`);
    expect(fitTarget(element, SCREEN, BAR).element).toBe(element);
  });
});
