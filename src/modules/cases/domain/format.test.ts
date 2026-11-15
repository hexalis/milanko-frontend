import { describe, expect, it } from "vitest";
import { createTranslator } from "@/shared/lib/i18n";
import {
  formatCoordinates,
  formatDate,
  formatFigure,
  formatOdds,
  formatP,
  unitLabel,
} from "./format";

const translator = createTranslator(
  {
    en: {
      "odds.lt1000": "less than 1 in 1,000",
      "odds.n": "about 1 time in {n}",
      "odds.high": "{pct} % of the time",
    },
    es: {},
  },
  "en",
);

describe("formatFigure", () => {
  it("uses a true minus sign and a plus only when signed", () => {
    expect(formatFigure(-1.234, 2)).toBe("−1.23");
    expect(formatFigure(1.234, 2, true)).toBe("+1.23");
    expect(formatFigure(1.234, 2)).toBe("1.23");
  });

  it("writes tiny values as zero and missing ones as a dash", () => {
    expect(formatFigure(-0.0001, 2)).toBe("0.00");
    expect(formatFigure(null, 2)).toBe("—");
  });
});

describe("p and odds", () => {
  it("formats p", () => {
    expect(formatP(0.0002)).toBe("< 0.001");
    expect(formatP(0.0234)).toBe("= 0.023");
  });

  it("turns p into plain odds", () => {
    expect(formatOdds(0.0002, translator)).toBe("less than 1 in 1,000");
    expect(formatOdds(0.004, translator)).toBe("about 1 time in 250");
    expect(formatOdds(0.25, translator)).toBe("25 % of the time");
  });
});

describe("units, coordinates and dates", () => {
  it("translates per-day units and hides the soil index unit", () => {
    expect(unitLabel("mm/day", "es")).toBe("mm/día");
    expect(unitLabel("mm/day", "en")).toBe("mm/day");
    expect(unitLabel("0–1", "en")).toBe("");
  });

  it("writes coordinates with hemispheres", () => {
    expect(formatCoordinates(-33.45, -70.66)).toBe("33.5° S, 70.7° W");
  });

  it("formats dates in the reader's language", () => {
    expect(formatDate("2026-01-09", "en")).toBe("Jan 9, 2026");
    expect(formatDate("2026-01-09", "es")).toContain("2026");
  });
});
