import type { RegionReading } from "./globe-messages";

/*
 * What a data region's reading means in words: how far the day sits from normal, told by its z
 * (how many standard deviations from the baseline for that date).
 */

export type Rarity = "normal" | "uncommon" | "rare" | "exceptional";

/** |z| under 1: within normal; under 2: uncommon; under 3: rare; beyond: exceptional. */
export function rarityOf(z: number | null): Rarity | null {
  if (z === null || !Number.isFinite(z)) return null;
  const size = Math.abs(z);
  if (size < 1) return "normal";
  if (size < 2) return "uncommon";
  if (size < 3) return "rare";
  return "exceptional";
}

export type Direction = "above" | "below" | "equal";

/** Which side of normal the day fell on; null when the layer has no difference for it. */
export function directionOf(reading: Pick<RegionReading, "anomaly">): Direction | null {
  const { anomaly } = reading;
  if (anomaly === null) return null;
  if (anomaly > 0) return "above";
  if (anomaly < 0) return "below";
  return "equal";
}

/** The region's code as the map and the explorer write it ("014"). */
export function regionCode(code: number): string {
  return String(code).padStart(3, "0");
}
