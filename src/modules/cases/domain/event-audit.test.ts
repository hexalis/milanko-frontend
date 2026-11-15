import { describe, expect, it } from "vitest";
import { getEventAudit, lastAuditYear } from "./event-audit";

const VERDICTS = ["trend", "no-trend", "artifact", "insufficient"];

describe("getEventAudit", () => {
  const audit = getEventAudit();

  it("loads the snapshot's catalog-wide figures", () => {
    expect(audit.firstYear).toBe(2000);
    expect(audit.lastCompleteYear).toBeGreaterThanOrEqual(audit.firstYear);
    expect(audit.events).toBeGreaterThan(0);
    expect(audit.catalogBreaks.length).toBeGreaterThan(0);
    expect(audit.generated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("is built once per process", () => {
    expect(getEventAudit()).toBe(audit);
  });

  it("types every category with a known verdict", () => {
    expect(audit.categories.length).toBeGreaterThan(0);
    for (const category of audit.categories) {
      expect(VERDICTS).toContain(category.verdict);
      expect(category.total).toBeGreaterThan(0);
    }
  });

  it("keeps the yearly counts as [year, count] tuples that add up to the total", () => {
    for (const category of audit.categories) {
      expect(category.years[0]?.[0]).toBe(audit.firstYear);
      const sum = category.years.reduce((total, [, count]) => total + count, 0);
      expect(sum).toBe(category.total);
    }
  });

  it("dates every break inside the counted years", () => {
    for (const category of audit.categories) {
      const first = category.years[0]?.[0] ?? 0;
      const last = lastAuditYear(category);
      for (const catalogBreak of category.breaks) {
        expect(catalogBreak.year).toBeGreaterThanOrEqual(first);
        expect(catalogBreak.year).toBeLessThanOrEqual(last);
        expect(catalogBreak.kinds.length).toBeGreaterThan(0);
      }
    }
  });

  it("tests a trend over every span, and every span runs forward from the first year on", () => {
    const tested = audit.categories.flatMap((category) =>
      category.span ? [{ span: category.span, trend: category.trend }] : [],
    );
    expect(tested.length).toBeGreaterThan(0);
    for (const { span, trend } of tested) {
      expect(span[0]).toBeLessThan(span[1]);
      expect(span[0]).toBeGreaterThanOrEqual(audit.firstYear);
      expect(trend).not.toBeNull();
    }
  });

  it("reads wildfires as an artifact whose raw count grew about 12-fold", () => {
    const wildfires = audit.categories.find((category) => category.id === "wildfires");
    expect(wildfires?.verdict).toBe("artifact");
    expect(wildfires?.naiveFactor).toBeCloseTo(12.2);
    expect(wildfires?.breaks.map((catalogBreak) => catalogBreak.year)).toContain(2015);
  });
});

describe("lastAuditYear", () => {
  it("is the last counted year, or 0 with no years", () => {
    expect(
      lastAuditYear({
        years: [
          [2000, 1],
          [2026, 3],
        ],
      }),
    ).toBe(2026);
    expect(lastAuditYear({ years: [] })).toBe(0);
  });
});
