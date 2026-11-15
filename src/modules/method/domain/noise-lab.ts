import { analyzeTrend, trendDirection, type Point } from "@/modules/cases";

/*
 * "Make your own planet" (POC app.js renderMethod, L2741-2766): a straight trend plus Gaussian
 * year-to-year noise, read with the same Mann-Kendall / Theil-Sen test as the case files.
 * The noise comes from a seeded Park-Miller generator, so a seed always draws the same planet.
 */

const MODULUS = 2_147_483_647;
const MULTIPLIER = 16_807;
/** Guards log(0) in the Box-Muller transform, as the POC did. */
const MIN_UNIFORM = 1e-9;
/** The planet starts at 10 units; only the change matters to the test. */
const BASELINE = 10;

export const MAX_PLANET_YEARS = 45;
export const INITIAL_SEED = 7;

export const PLANET_LIMITS = {
  trend: { min: -1, max: 1, step: 0.05 },
  noise: { min: 0.1, max: 2, step: 0.05 },
  years: { min: 10, max: MAX_PLANET_YEARS, step: 1 },
} as const;

export type PlanetSettings = {
  /** Real change per decade. */
  trend: number;
  /** Standard deviation of the year-to-year noise. */
  noise: number;
  years: number;
};

export const DEFAULT_PLANET: PlanetSettings = { trend: 0.3, noise: 0.6, years: 30 };

/** A seed the generator accepts: an integer in [1, MODULUS - 1]. */
function toState(seed: number): number {
  const state = Math.abs(Math.trunc(seed)) % MODULUS;
  return state === 0 ? 1 : state;
}

/** Park-Miller minimal standard generator; each call returns a number in [0, 1]. */
export function createRandom(seed: number): () => number {
  let state = toState(seed);
  return () => {
    state = (state * MULTIPLIER) % MODULUS;
    return (state - 1) / (MODULUS - 2);
  };
}

/** Standard normal draws (Box-Muller), two uniforms per draw. */
export function noiseDraws(seed: number, count = MAX_PLANET_YEARS): number[] {
  const random = createRandom(seed);
  return Array.from(
    { length: count },
    () => Math.sqrt(-2 * Math.log(random() || MIN_UNIFORM)) * Math.cos(2 * Math.PI * random()),
  );
}

/** The seed after a full set of draws: "New random years" continues the same stream. */
export function nextSeed(seed: number, count = MAX_PLANET_YEARS): number {
  let state = toState(seed);
  for (let step = 0; step < count * 2; step++) state = (state * MULTIPLIER) % MODULUS;
  return state;
}

/** One value per year, ending at `lastYear`. */
export function buildPlanet(
  { trend, noise, years }: PlanetSettings,
  draws: readonly number[],
  lastYear: number,
): Point[] {
  const count = Math.min(years, draws.length);
  return Array.from({ length: count }, (_, index): Point => [
    lastYear - count + 1 + index,
    BASELINE + (trend / 10) * index + noise * (draws[index] ?? 0),
  ]);
}

export function readPlanet(settings: PlanetSettings, draws: readonly number[], lastYear: number) {
  const data = buildPlanet(settings, draws, lastYear);
  const trend = analyzeTrend(
    data.map(([year]) => year),
    data.map(([, value]) => value),
  );
  return {
    data,
    trend,
    direction: trendDirection(trend),
    verdict: trend?.significant ? ("confirmed" as const) : ("inconclusive" as const),
  };
}
