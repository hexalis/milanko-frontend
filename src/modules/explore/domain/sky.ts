/*
 * What the globe's sky answers to: the Moon and ten constellations people know (public/globe/world3d/sky.js
 * draws them; its catalogue and the exp.sky.c.* copy come from one list, so the ids match).
 */

export const CONSTELLATION_IDS = [
  "orion",
  "ursa-major",
  "ursa-minor",
  "cassiopeia",
  "crux",
  "scorpius",
  "leo",
  "cygnus",
  "lyra",
  "canis-major",
] as const;

export type ConstellationId = (typeof CONSTELLATION_IDS)[number];

const SKY_IDS = ["moon", ...CONSTELLATION_IDS] as const;

export type SkyId = (typeof SKY_IDS)[number];

export function isSkyId(value: unknown): value is SkyId {
  return SKY_IDS.some((id) => id === value);
}

/** The mean time between two new Moons, in days. */
const SYNODIC_DAYS = 29.530588853;
/** A known new Moon: 6 January 2000, 18:14 UTC. */
const NEW_MOON_2000 = Date.UTC(2000, 0, 6, 18, 14);
const DAY_MS = 86_400_000;

/** The eight phases, each until the Moon's age (days since new) reaches its bound. */
const PHASE_ENDS = [
  [1, "new"],
  [6.4, "waxing-crescent"],
  [8.4, "first-quarter"],
  [13.8, "waxing-gibbous"],
  [15.8, "full"],
  [21.1, "waning-gibbous"],
  [23.1, "last-quarter"],
  [28.5, "waning-crescent"],
] as const;

export type MoonPhaseKey = (typeof PHASE_ENDS)[number][1];

export const MOON_PHASE_KEYS: readonly MoonPhaseKey[] = PHASE_ENDS.map(([, key]) => key);

/**
 * The real phase of the Moon on a date, from the mean synodic month (good to about a day): its name
 * and the share of its face that is lit, 0 to 1.
 */
export function moonPhase(date: Date): { key: MoonPhaseKey; lit: number } {
  const days = (date.getTime() - NEW_MOON_2000) / DAY_MS;
  const age = ((days % SYNODIC_DAYS) + SYNODIC_DAYS) % SYNODIC_DAYS;
  const key = PHASE_ENDS.find(([end]) => age < end)?.[1] ?? "new";
  return { key, lit: (1 - Math.cos((2 * Math.PI * age) / SYNODIC_DAYS)) / 2 };
}
