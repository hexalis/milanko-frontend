import { isEvent, type CaseFile, type TrendCase } from "./case-file";
import type { CaseCatalog } from "./catalog";

/*
 * Where a case file leads (POC renderCase / renderEventFile): the next file of the same kind, in
 * catalog order and wrapping around, and the opposite-trend pair of a trend case.
 */

export function nextFile(
  file: CaseFile,
  catalog: Pick<CaseCatalog, "trends" | "events">,
): CaseFile {
  const files: readonly CaseFile[] = isEvent(file) ? catalog.events : catalog.trends;
  const index = files.findIndex((candidate) => candidate.id === file.id);
  return files[(index + 1) % files.length] ?? file;
}

export function pairFile(
  file: CaseFile,
  catalog: Pick<CaseCatalog, "trends">,
): TrendCase | undefined {
  if (isEvent(file) || !file.pair) return undefined;
  return catalog.trends.find((candidate) => candidate.id === file.pair);
}
