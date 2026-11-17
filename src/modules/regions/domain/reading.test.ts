import { describe, expect, it } from "vitest";
import {
  formatFor,
  isConfirmed,
  normalBand,
  oneIn,
  perDecade,
  RAREST,
  readableUnit,
  readPlace,
} from "./reading";

describe("oneIn", () => {
  it("leaves a day within one standard deviation as normal", () => {
    expect(oneIn(0.4)).toBeNull();
    expect(oneIn(-0.99)).toBeNull();
    expect(oneIn(null)).toBeNull();
  });

  it("says how often a day lands this far out on the same side", () => {
    expect(oneIn(1)).toBe(6);
    expect(oneIn(2)).toBe(44);
    expect(oneIn(-2)).toBe(44);
    expect(oneIn(3)).toBe(741);
  });

  it("stops at 1 in 1,000", () => {
    expect(oneIn(5)).toBe(RAREST);
  });
});

describe("trend in words", () => {
  it("speaks per decade and calls p under 0.05 confirmed", () => {
    expect(perDecade(0.042)).toBeCloseTo(0.42);
    expect(isConfirmed(0.01)).toBe(true);
    expect(isConfirmed(0.2)).toBe(false);
    expect(isConfirmed(null)).toBe(false);
  });
});

describe("normalBand", () => {
  it("gives each month the range 8 years in 10 fall into, once it has three years", () => {
    const points = [2020, 2021, 2022, 2023, 2024].flatMap((year, index) => [
      { date: `${year}-01-01`, value: 10 + index },
      ...(year < 2022 ? [{ date: `${year}-02-01`, value: 20 }] : []),
    ]);
    const bands = normalBand(points);
    expect(bands[0]).toEqual({ low: expect.closeTo(10.4), high: expect.closeTo(13.6) });
    expect(bands[1]).toBeNull();
  });
});

describe("readableUnit and formatFor", () => {
  it("writes units as people read them", () => {
    expect(readableUnit("C", "es")).toBe("°C");
    expect(readableUnit("mm/day", "es")).toBe("mm/día");
    expect(readableUnit("mm/day", "en")).toBe("mm/day");
    expect(readableUnit("kg m-2", "en")).toBe("kg/m²");
    expect(readableUnit("dimensionless", "en")).toBe("");
  });

  it("formats numbers in the reader's language", () => {
    expect(formatFor(31.41, "es")).toBe("31,41");
    expect(formatFor(31.41, "en")).toBe("31.41");
    expect(formatFor(4.2, "en", { signed: true })).toBe("+4.2");
    expect(formatFor(-0.5, "es", { digits: 1 })).toBe("−0,5");
    expect(formatFor(null, "es")).toBe("—");
    expect(formatFor(373_117_392_231_096.9, "es")).toBe("3,73 × 10¹⁴");
    expect(readableUnit("mg/m3", "en")).toBe("mg/m³");
    expect(readableUnit("mol/m2", "en")).toBe("mol/m²");
  });
});

describe("readPlace", () => {
  it("accepts only the globe's places", () => {
    expect(readPlace("africa")).toBe("africa");
    expect(readPlace("ocean")).toBe("ocean");
    expect(readPlace("mars")).toBeUndefined();
  });
});
