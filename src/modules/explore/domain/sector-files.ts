import type { CaseSummary } from "@/modules/cases";

/*
 * A sector's dossier in the drawer (the POC's sectorPanel): what is unusual there first (anomaly
 * files, strongest and then most extreme first), then the long trends.
 */

const STRENGTH_ORDER: Record<CaseSummary["strength"], number> = {
  strong: 0,
  moderate: 1,
  weak: 2,
};

export type SectorFiles = {
  anomalies: CaseSummary[];
  trends: CaseSummary[];
  total: number;
  /** Anomaly files whose run-up is anomalous (strong). */
  anomalous: number;
  /** Anomaly files that are only unusual (moderate). */
  unusual: number;
};

export function sectorFiles(files: readonly CaseSummary[], sector: string): SectorFiles {
  const here = files.filter((file) => file.region === sector);
  const anomalies = here
    .filter((file) => file.kind === "event")
    .toSorted((a, b) => STRENGTH_ORDER[a.strength] - STRENGTH_ORDER[b.strength] || b.snr - a.snr);
  return {
    anomalies,
    trends: here.filter((file) => file.kind === "trend"),
    total: here.length,
    anomalous: anomalies.filter((file) => file.strength === "strong").length,
    unusual: anomalies.filter((file) => file.strength === "moderate").length,
  };
}
