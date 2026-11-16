import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Config } from "driver.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TourButton } from "./tour-button";

const driverMock = vi.hoisted(() => {
  const state: { config?: Config; drive: () => void } = { drive: () => {} };
  return state;
});

vi.mock("driver.js", () => ({
  driver: (config: Config) => {
    driverMock.config = config;
    return { drive: driverMock.drive };
  },
}));

const LABELS = {
  open: "How does this page work?",
  next: "Next",
  previous: "Back",
  done: "Done",
  close: "Close the tour",
  progress: "{{current}} of {{total}}",
};

const STEPS = [
  { target: "a", title: "First", text: "One" },
  { target: "gone", title: "Missing", text: "Not on this page" },
  { target: "b", title: "Second", text: "Two" },
];

function renderPage() {
  render(
    <>
      <div data-tour="a">A</div>
      {/* The same anchor twice, as the rail and the phone bar: only the one on screen counts. */}
      <div data-tour="b" hidden>
        B, hidden
      </div>
      <div data-tour="b">B</div>
      <TourButton steps={STEPS} labels={LABELS} />
    </>,
  );
  return screen.getByRole("button", { name: LABELS.open });
}

describe("TourButton", () => {
  beforeEach(() => {
    driverMock.config = undefined;
    driverMock.drive = vi.fn<() => void>();
    // jsdom lays nothing out: an element is "on screen" unless it is hidden.
    vi.spyOn(Element.prototype, "getClientRects").mockImplementation(function (this: Element) {
      return (this.closest("[hidden]") ? [] : [{}]) as unknown as DOMRectList;
    });
    vi.stubGlobal("matchMedia", (query: string) => ({ matches: false, media: query }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("does not start a tour on its own", () => {
    renderPage();
    expect(driverMock.config).toBeUndefined();
  });

  it("starts with the steps on screen, in order, on their visible element", async () => {
    fireEvent.click(renderPage());
    await waitFor(() => expect(driverMock.drive).toHaveBeenCalledOnce());

    const steps = driverMock.config?.steps ?? [];
    expect(steps.map((step) => step.popover?.title)).toEqual(["First", "Second"]);
    const second = steps[1]?.element;
    expect(second instanceof Element ? second.textContent : null).toBe("B");
    expect(driverMock.config).toMatchObject({
      focus: "popover",
      showProgress: true,
      progressText: LABELS.progress,
      nextBtnText: LABELS.next,
      prevBtnText: LABELS.previous,
      doneBtnText: LABELS.done,
      closeBtnLabel: LABELS.close,
    });
  });

  it("turns the animation off when the reader asks for less motion", async () => {
    vi.stubGlobal("matchMedia", (query: string) => ({ matches: true, media: query }));
    fireEvent.click(renderPage());
    await waitFor(() => expect(driverMock.drive).toHaveBeenCalledOnce());
    expect(driverMock.config).toMatchObject({ animate: false, smoothScroll: false });
  });

  it("gives the focus back to the button when the tour ends", async () => {
    const button = renderPage();
    fireEvent.click(button);
    await waitFor(() => expect(driverMock.drive).toHaveBeenCalledOnce());
    button.blur();

    driverMock.config?.onDestroyed?.(undefined, {}, {} as never);
    expect(button).toHaveFocus();
  });
});
