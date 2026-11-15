import { describe, expect, it } from "vitest";
import { getCaseCatalog, getEventAudit } from "@/modules/cases";
import { methodFacts } from "./method-facts";

describe("methodFacts", () => {
  it("reads every figure from the case catalog", () => {
    const catalog = getCaseCatalog();
    const facts = methodFacts(catalog, getEventAudit().events);
    expect(facts.firstYear).toBe(catalog.global.from);
    expect(facts.lastYear).toBeGreaterThanOrEqual(catalog.global.to);
    expect(facts.files).toBe(catalog.trends.length + catalog.events.length);
    expect(facts.anomalyFiles).toBe(catalog.events.length);
    expect(facts.points).toBe(catalog.global.points);
    expect(facts.windowDays).toBe(catalog.eventWindowDays);
    expect(facts.auditedEvents).toBe(getEventAudit().events);
    expect(facts.auditedEvents).toBeGreaterThan(0);
  });
});
