import { describe, expect, it } from "vitest";
import { getTranslator } from "@/modules/copy";
import { auditEvidence, auditSubtitle, breakText } from "./audit-text";
import type { AuditTrend } from "./event-audit";

const en = getTranslator("en");
const es = getTranslator("es");
const audit = { firstYear: 2000, lastCompleteYear: 2025 };
const trend = (p: number, perDecade: number) => ({ p, perDecade }) as AuditTrend;

describe("auditSubtitle", () => {
  it("marks a running year as so far", () => {
    const category = {
      total: 19895,
      years: [
        [2000, 0],
        [2026, 5],
      ] as [number, number][],
    };
    expect(auditSubtitle(category, audit, en)).toBe(
      "Natural events logged per year in NASA EONET · 2000–2026 (2026 so far) · 19,895 in total",
    );
  });

  it("names a closed period plainly, in the reader's language", () => {
    const category = { total: 2410, years: [[2025, 97]] as [number, number][] };
    expect(auditSubtitle(category, audit, es)).toBe(
      `Eventos naturales registrados por año en NASA EONET · 2000–2025 · ${(2410).toLocaleString("es")} en total`,
    );
  });
});

describe("auditEvidence", () => {
  it("quotes the odds of a real trend", () => {
    const text = auditEvidence(
      { verdict: "trend", span: [2001, 2014], trend: trend(0.004, 3) },
      en,
    );
    expect(text).toContain("2001–2014");
    expect(text).toContain("250");
  });

  it("quotes the rate a steady count could owe to chance", () => {
    const text = auditEvidence(
      { verdict: "no-trend", span: [2000, 2025], trend: trend(0.79, -0.66667) },
      en,
    );
    expect(text).toBe(
      "We tested 2000–2025, a stretch with no catalog change. A change of −0.7 events a decade could be chance.",
    );
  });

  it("says when an artifact has no clean stretch long enough to test", () => {
    expect(auditEvidence({ verdict: "artifact", span: null, trend: null }, en)).toBe(
      "No stretch of years without catalog changes is long enough to test.",
    );
    expect(
      auditEvidence({ verdict: "artifact", span: [2000, 2014], trend: trend(0.45, -3.75) }, en),
    ).toContain("2000–2014");
  });
});

describe("breakText", () => {
  it("lists what changed and which sources joined, by their full name", () => {
    expect(
      breakText(
        { year: 2024, kinds: ["composition", "volume"], entering: ["GDACS", "XYZ"] },
        { GDACS: "Global Disaster Alert and Coordination System" },
        en,
      ),
    ).toBe(
      "source mix changed · volume jump · Global Disaster Alert and Coordination System enters · XYZ enters",
    );
  });
});
