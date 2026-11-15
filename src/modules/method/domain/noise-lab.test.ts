import { describe, expect, it } from "vitest";
import {
  buildPlanet,
  createRandom,
  DEFAULT_PLANET,
  INITIAL_SEED,
  MAX_PLANET_YEARS,
  nextSeed,
  noiseDraws,
  readPlanet,
} from "./noise-lab";

describe("createRandom", () => {
  it("repeats the Park-Miller sequence for the same seed", () => {
    const first = createRandom(INITIAL_SEED);
    const second = createRandom(INITIAL_SEED);
    const values = Array.from({ length: 5 }, first);
    expect(Array.from({ length: 5 }, second)).toEqual(values);
    // 7 × 16807 = 117649, the generator's first state.
    expect(values[0]).toBeCloseTo((117_649 - 1) / 2_147_483_645, 12);
    for (const value of values) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });

  it("accepts seeds outside the generator's range", () => {
    expect(() => createRandom(0)()).not.toThrow();
    expect(createRandom(-7)()).toBe(createRandom(7)());
  });
});

describe("noiseDraws", () => {
  it("draws one standard normal value per year, deterministically", () => {
    const draws = noiseDraws(INITIAL_SEED);
    expect(draws).toHaveLength(MAX_PLANET_YEARS);
    expect(noiseDraws(INITIAL_SEED)).toEqual(draws);
    expect(draws.every(Number.isFinite)).toBe(true);
  });

  it("looks like N(0, 1) over many draws", () => {
    const draws = noiseDraws(12_345, 20_000);
    const mean = draws.reduce((sum, value) => sum + value, 0) / draws.length;
    const variance = draws.reduce((sum, value) => sum + (value - mean) ** 2, 0) / draws.length;
    expect(Math.abs(mean)).toBeLessThan(0.05);
    expect(variance).toBeGreaterThan(0.9);
    expect(variance).toBeLessThan(1.1);
  });
});

describe("nextSeed", () => {
  it("moves to a fresh set of draws and stays deterministic", () => {
    const next = nextSeed(INITIAL_SEED);
    expect(next).toBe(nextSeed(INITIAL_SEED));
    expect(next).not.toBe(INITIAL_SEED);
    expect(noiseDraws(next)).not.toEqual(noiseDraws(INITIAL_SEED));
  });
});

describe("buildPlanet", () => {
  it("lays the trend per decade over the noise, ending at the last year", () => {
    const data = buildPlanet({ trend: 1, noise: 0, years: 11 }, noiseDraws(1), 2025);
    expect(data).toHaveLength(11);
    expect(data[0]).toEqual([2015, 10]);
    expect(data.at(-1)?.[0]).toBe(2025);
    expect(data.at(-1)?.[1]).toBeCloseTo(11, 10);
  });

  it("never asks for more years than there are draws", () => {
    expect(buildPlanet({ ...DEFAULT_PLANET, years: 45 }, [0, 0, 0], 2025)).toHaveLength(3);
  });
});

describe("readPlanet", () => {
  const draws = noiseDraws(INITIAL_SEED);

  it("confirms a strong trend over little noise", () => {
    const reading = readPlanet({ trend: 1, noise: 0.1, years: 45 }, draws, 2025);
    expect(reading.verdict).toBe("confirmed");
    expect(reading.direction).toBe("up");
    expect(reading.trend?.perDecade).toBeCloseTo(1, 0);
  });

  it("cannot see a weak trend drowned in noise", () => {
    const reading = readPlanet({ trend: 0, noise: 2, years: 10 }, draws, 2025);
    expect(reading.trend?.significant).toBe(false);
    expect(reading.verdict).toBe("inconclusive");
    expect(reading.direction).toBe("flat");
  });

  it("reads a falling planet as down", () => {
    expect(readPlanet({ trend: -1, noise: 0.1, years: 30 }, draws, 2025).direction).toBe("down");
  });
});
