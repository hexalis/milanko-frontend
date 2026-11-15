/*
 * "Peak or record?" (POC app.js renderMethod, L2770-2780): the chance that a day with no real
 * anomaly still looks this extreme on at least one of k independent variables.
 */

export const RARE_BARS = ["strong", "record", "moderate"] as const;
export type RareBar = (typeof RARE_BARS)[number];

export const RARE_LIMITS = {
  variables: { min: 1, max: 6, step: 1 },
  years: { min: 10, max: 45, step: 1 },
} as const;

export type RareSettings = { variables: number; years: number; bar: RareBar };

export const DEFAULT_RARE: RareSettings = { variables: 3, years: 45, bar: "strong" };

/** Tails of the "Unusual" bar: 10 % on each side. */
const MODERATE_TAILS = 0.2;
/** "Anomalous" is a record or the 2.5 % tails, whichever is wider. */
const STRONG_TAILS = 0.05;

export function isRareBar(value: unknown): value is RareBar {
  return typeof value === "string" && (RARE_BARS as readonly string[]).includes(value);
}

/** Chance for one variable: a record high or low among `years + 1` values is 2 / (years + 1). */
function singleChance({ years, bar }: Pick<RareSettings, "years" | "bar">): number {
  const record = 2 / (years + 1);
  if (bar === "record") return record;
  if (bar === "strong") return Math.max(STRONG_TAILS, record);
  return MODERATE_TAILS;
}

export function rareChance(settings: RareSettings) {
  const chance = 1 - (1 - singleChance(settings)) ** settings.variables;
  return {
    chance,
    /** Days out of 100 that would look this extreme. */
    hits: Math.round(chance * 100),
    /** "About 1 in n". */
    oneIn: Math.max(1, Math.round(1 / chance)),
  };
}
