import { describe, expect, it } from "vitest";
import { isSkyId, moonPhase } from "./sky";

describe("moonPhase", () => {
  it("names the phase and how much of the face is lit", () => {
    // Full Moon of 21 January 2000 and new Moon of 6 January 2000.
    expect(moonPhase(new Date(Date.UTC(2000, 0, 21, 5, 0)))).toEqual({
      key: "full",
      lit: expect.closeTo(1, 2),
    });
    expect(moonPhase(new Date(Date.UTC(2000, 0, 6, 18, 14))).key).toBe("new");
    // First quarter on 17 November 2026: half lit, give or take the mean month's error.
    const quarter = moonPhase(new Date(Date.UTC(2026, 10, 17, 12, 0)));
    expect(quarter.key).toBe("first-quarter");
    expect(quarter.lit).toBeGreaterThan(0.4);
    expect(quarter.lit).toBeLessThan(0.65);
  });

  it("counts back before the reference new Moon", () => {
    expect(moonPhase(new Date(Date.UTC(1969, 6, 20))).key).toBe("waxing-crescent");
  });
});

describe("isSkyId", () => {
  it("accepts the Moon and the globe's constellations only", () => {
    expect(isSkyId("moon")).toBe(true);
    expect(isSkyId("crux")).toBe(true);
    expect(isSkyId("terra")).toBe(false);
    expect(isSkyId(3)).toBe(false);
  });
});
