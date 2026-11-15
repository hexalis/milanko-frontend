import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScrollRegion } from "./scroll-region";

let sizes = { scrollWidth: 0, clientWidth: 0 };
let notify: () => void = () => {};

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockImplementation(() => sizes.scrollWidth);
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(() => sizes.clientWidth);
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: () => void) {
        notify = callback;
      }
      observe() {}
      disconnect() {}
    },
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function renderFrame(props: { label?: string; labelledBy?: string }) {
  render(
    <ScrollRegion className="overflow-x-auto" {...props}>
      <p>Wide content</p>
    </ScrollRegion>,
  );
  return screen.getByText("Wide content").parentElement as HTMLElement;
}

describe("ScrollRegion", () => {
  it("has no tab stop, role or name while the content fits", () => {
    sizes = { scrollWidth: 300, clientWidth: 300 };
    const frame = renderFrame({ label: "Series" });
    expect(frame).not.toHaveAttribute("tabindex");
    expect(frame).not.toHaveAttribute("role");
    expect(frame).not.toHaveAttribute("aria-label");
  });

  it("becomes a named, focusable group when it overflows", () => {
    sizes = { scrollWidth: 900, clientWidth: 300 };
    const frame = renderFrame({ label: "Series" });
    expect(frame).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("group", { name: "Series" })).toBe(frame);
  });

  it("takes its name from a caption and follows resizes", () => {
    sizes = { scrollWidth: 300, clientWidth: 300 };
    const frame = renderFrame({ labelledBy: "cap" });
    expect(frame).not.toHaveAttribute("aria-labelledby");

    sizes = { scrollWidth: 900, clientWidth: 300 };
    act(() => notify());
    expect(frame).toHaveAttribute("aria-labelledby", "cap");
    expect(frame).toHaveAttribute("tabindex", "0");

    sizes = { scrollWidth: 300, clientWidth: 300 };
    act(() => notify());
    expect(frame).not.toHaveAttribute("tabindex");
    expect(frame).not.toHaveAttribute("aria-labelledby");
  });
});
