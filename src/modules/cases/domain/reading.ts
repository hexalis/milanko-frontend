import { isEvent } from "./case-file";
import type { CaseReading, ReadingContext } from "./case-reading";
import { findCaseFile, getCaseCatalog } from "./catalog";
import { auditFileId, findAuditCategory, getEventAudit } from "./event-audit";
import { auditReading } from "./reading-audit";
import { eventReading } from "./reading-event";
import { trendReading } from "./reading-trend";

/*
 * Every address under /cases/<id>: the trend and anomaly files, plus one audit file per EONET
 * category (`audit-<category>`). The adapter for the kind of data fills the reading.
 */

export function caseFileIds(): string[] {
  return [
    ...getCaseCatalog().all.map((file) => file.id),
    ...getEventAudit().categories.map(auditFileId),
  ];
}

export function hasCaseFile(id: string): boolean {
  return Boolean(findCaseFile(id) ?? findAuditCategory(id));
}

export function findReading(id: string, ctx: ReadingContext): CaseReading | undefined {
  const file = findCaseFile(id);
  if (file) return isEvent(file) ? eventReading(file, ctx) : trendReading(file, ctx);
  const category = findAuditCategory(id, ctx.audit);
  return category ? auditReading(category, ctx) : undefined;
}
