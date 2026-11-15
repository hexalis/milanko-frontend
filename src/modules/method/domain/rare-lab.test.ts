import { describe, expect, it } from "vitest";
import { DEFAULT_RARE, isRareBar, rareChance } from "./rare-lab";

describe("rareChance", () => {
  it("counts a record among 46 values for one variable", () => {
    const { chance, hits, oneIn } = rareChance({ variables: 1, years: 45, bar: "record" });
    expect(chance).toBeCloseTo(2 / 46, 10);
    expect(hits).toBe(4);
    expect(oneIn).toBe(23);
  });

  it("grows with every variable checked", () => {
    const one = rareChance({ ...DEFAULT_RARE, variables: 1 }).chance;
    const six = rareChance({ ...DEFAULT_RARE, variables: 6 }).chance;
    expect(six).toBeGreaterThan(one);
    expect(six).toBeCloseTo(1 - (1 - 0.05) ** 6, 10);
  });

  it("uses the wider of a record and the 2.5 % tails for anomalous", () => {
    // 10 years: a record is 2 / 11, wider than the 5 % tails.
    expect(rareChance({ variables: 1, years: 10, bar: "strong" }).chance).toBeCloseTo(2 / 11, 10);
    expect(rareChance({ variables: 1, years: 45, bar: "strong" }).chance).toBeCloseTo(0.05, 10);
  });

  it("uses the 10 % tails on both sides for unusual", () => {
    expect(rareChance({ variables: 3, years: 20, bar: "moderate" }).hits).toBe(49);
  });

  it("never says less than 1 in 1", () => {
    expect(rareChance({ variables: 6, years: 10, bar: "moderate" }).oneIn).toBe(1);
  });
});

describe("isRareBar", () => {
  it("accepts only the three bars", () => {
    expect(isRareBar("record")).toBe(true);
    expect(isRareBar("extreme")).toBe(false);
    expect(isRareBar(undefined)).toBe(false);
  });
});
