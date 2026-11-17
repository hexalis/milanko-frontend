import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getTranslator } from "@/modules/copy";
import { exploreTranslator, pickExploreMessages } from "../domain/explore-copy";
import type { RegionReading } from "../domain/globe-messages";
import { RegionPanel } from "./region-panel";

const t = exploreTranslator(pickExploreMessages(getTranslator("en")));

const MONTH: RegionReading = {
  variable: "T2M",
  label: "Air temperature",
  source: "NASA POWER",
  unit: "°C",
  date: "2026-11-01",
  period: "month",
  value: -2.06,
  anomaly: 11.88,
  z: 3.33,
  baseline: -13.94,
};

describe("RegionPanel", () => {
  it("says the month against its normal in words, and links to the full region file", () => {
    render(
      <RegionPanel
        code={25}
        place="north-america"
        reading={MONTH}
        locale="en"
        t={t}
        titleRef={{ current: null }}
      />,
    );

    expect(screen.getByRole("heading", { level: 2, name: "Region 025" })).toBeVisible();
    expect(screen.getByText(/Data region · North America/)).toBeVisible();
    expect(screen.getByText("Air temperature, average for November 2026")).toBeVisible();
    expect(screen.getByText(/above normal for this time of year/)).toBeVisible();
    expect(screen.getByText("Exceptional")).toBeVisible();
    expect(screen.getByRole("link", { name: /Open the full region file/ })).toHaveAttribute(
      "href",
      "/regions?region=25&variable=T2M&end=2026-11-01&place=north-america",
    );
  });

  it("shows a day's value without empty figures, and says how to compare it", () => {
    render(
      <RegionPanel
        code={61}
        place={null}
        reading={{
          ...MONTH,
          period: "day",
          date: "2026-11-12",
          value: 31.79,
          anomaly: null,
          z: null,
          baseline: null,
        }}
        locale="en"
        t={t}
        titleRef={{ current: null }}
      />,
    );

    expect(screen.getByText("Data region")).toBeVisible();
    expect(screen.queryByText("Normal")).toBeNull();
    expect(screen.queryByText("How unusual")).toBeNull();
    expect(screen.getByText(/how unusual it was/)).toBeVisible();
  });
});
