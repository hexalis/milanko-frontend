import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Point } from "@/modules/cases";
import { getTranslator } from "@/modules/copy";
import { pickLabCopy, PLAYGROUND_KEYS } from "./lab-copy";
import { Playground, type PlaygroundSeries } from "./playground";

const copy = pickLabCopy(getTranslator("en"), PLAYGROUND_KEYS);

/* A clear rise (+0.5 a decade, small wobble) and a flat, noisy record. */
const rising: Point[] = Array.from({ length: 30 }, (_, i): Point => [
  1996 + i,
  5 + 0.05 * i + (i % 2 ? 0.04 : -0.04),
]);
const flat: Point[] = Array.from({ length: 30 }, (_, i): Point => [
  1996 + i,
  0.4 + ((i * 7) % 5) * 0.01,
]);

const SERIES: PlaygroundSeries[] = [
  {
    id: "warm",
    code: "ETD-1",
    place: "Somewhere cold",
    variable: "Air temperature",
    unit: "°C",
    rawUnit: "°C",
    digits: 2,
    href: "/cases/warm",
    series: rising,
  },
  {
    id: "soil",
    code: "ETD-2",
    place: "Somewhere dry",
    variable: "Soil wetness (root zone)",
    unit: "",
    rawUnit: "0–1",
    digits: 3,
    href: "/cases/soil",
    series: flat,
  },
];

const yours = () => screen.getByRole("region", { name: "Your version" });

describe("Playground", () => {
  it("starts on the measured record, judged like the case file", () => {
    render(<Playground copy={copy} series={SERIES} />);
    expect(screen.getByRole("radio", { name: /Air temperature/ })).toBeChecked();
    expect(screen.getByText(/This is the series as measured/)).toBeVisible();
    expect(
      within(screen.getByRole("region", { name: "Measured data" })).getByText("Confirmed"),
    ).toBeVisible();
    expect(within(yours()).getByText("Confirmed")).toBeVisible();
    expect(screen.getByRole("link", { name: "Open case file ETD-1" })).toHaveAttribute(
      "href",
      "/cases/warm",
    );
  });

  it("says when a change flips the verdict, and goes back", () => {
    render(<Playground copy={copy} series={SERIES} />);
    fireEvent.change(screen.getByRole("slider", { name: "Added trend" }), {
      target: { value: "-0.5" },
    });
    fireEvent.change(screen.getByRole("slider", { name: "Year-to-year noise" }), {
      target: { value: "3" },
    });
    expect(within(yours()).getByText("Inconclusive")).toBeVisible();
    expect(
      screen.getByText(/The verdict changed: from “Confirmed” to “Inconclusive”/),
    ).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Back to the measured data" }));
    expect(within(yours()).getByText("Confirmed")).toBeVisible();
  });

  it("switches to another real series and to an invented one", () => {
    render(<Playground copy={copy} series={SERIES} />);
    fireEvent.click(screen.getByRole("radio", { name: /Soil wetness/ }));
    expect(screen.getByRole("link", { name: "Open case file ETD-2" })).toBeVisible();
    fireEvent.click(screen.getByRole("radio", { name: /An invented series/ }));
    expect(screen.getByRole("button", { name: "New random years" })).toBeVisible();
    expect(screen.getByText(/The verdict (holds|changed)/)).toBeVisible();
  });
});
