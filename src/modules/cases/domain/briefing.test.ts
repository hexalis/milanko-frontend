import { describe, expect, it } from "vitest";
import {
  briefingLedger,
  falseSuspect,
  featuredCase,
  latestStrongAnomalies,
  latestTrends,
  longestRecord,
  oppositePairs,
} from "./briefing";
import type { EventFile, TrendCase } from "./case-file";
import { getCaseCatalog } from "./catalog";
import { getEventAudit, type AuditCategory } from "./event-audit";

/* Minimal stand-ins: the selection only reads a few fields of each file. */

type TrendStub = {
  id: string;
  pair?: string;
  publishedAt?: string;
  catalog?: string;
  significant?: boolean;
  snr?: number;
  years?: number;
};

function trend({
  id,
  pair,
  publishedAt = "2026-01-01",
  catalog = id,
  significant = true,
  snr = 1,
  years = 10,
}: TrendStub): TrendCase {
  return {
    id,
    pair,
    publishedAt,
    catalog,
    series: Array.from({ length: years }, (_, index) => [2000 + index, index]),
    t: { significant, snr },
  } as unknown as TrendCase;
}

function anomaly(id: string, category: string, date: string, strength = "strong"): EventFile {
  return { id, category, date, strength } as unknown as EventFile;
}

function auditCategory(
  id: string,
  verdict: AuditCategory["verdict"],
  naiveFactor: number | null = null,
): AuditCategory {
  return { id, verdict, naiveFactor } as unknown as AuditCategory;
}

describe("briefingLedger", () => {
  it("counts the hits of each kind of evidence against its total", () => {
    const ledger = briefingLedger(
      {
        trends: [trend({ id: "a" }), trend({ id: "b", significant: false })],
        events: [
          anomaly("e1", "floods", "2026-01-01"),
          anomaly("e2", "floods", "2026-01-02", "moderate"),
          anomaly("e3", "wildfires", "2026-01-03", "weak"),
        ],
      },
      {
        categories: [
          auditCategory("x", "trend"),
          auditCategory("y", "artifact", 3),
          auditCategory("z", "insufficient"),
        ],
      },
    );
    expect(ledger).toEqual({
      trends: { hits: 1, total: 2 },
      events: { hits: 1, total: 3 },
      audit: { hits: 1, total: 3 },
    });
  });

  it("reads the shipped data: no EONET category shows a real trend", () => {
    const catalog = getCaseCatalog();
    const audit = getEventAudit();
    const ledger = briefingLedger(catalog, audit);
    expect(ledger.trends.total).toBe(catalog.trends.length);
    expect(ledger.events.total).toBe(catalog.events.length);
    expect(ledger.events.hits).toBeGreaterThan(0);
    expect(ledger.audit).toEqual({ hits: 0, total: audit.categories.length });
  });
});

describe("longestRecord", () => {
  it("is the longest trend series, or 0 without files", () => {
    expect(longestRecord([trend({ id: "a", years: 25 }), trend({ id: "b", years: 45 })])).toBe(45);
    expect(longestRecord([])).toBe(0);
  });
});

describe("oppositePairs", () => {
  it("lists each pair once, led by the file that comes first", () => {
    const files = [
      trend({ id: "solo" }),
      trend({ id: "dry", pair: "wet" }),
      trend({ id: "wet", pair: "dry" }),
    ];
    expect(oppositePairs(files).map(([a, b]) => [a.id, b.id])).toEqual([["dry", "wet"]]);
  });

  it("skips a pair whose partner is missing", () => {
    expect(oppositePairs([trend({ id: "dry", pair: "gone" })])).toEqual([]);
  });

  it("finds the two pairs of the shipped catalog", () => {
    const pairs = oppositePairs(getCaseCatalog().trends).map(([a, b]) => [a.id, b.id]);
    expect(pairs).toEqual([
      ["chile-drying", "sahel-wetting"],
      ["amazon-browning", "tundra-greening"],
    ]);
  });
});

describe("latestTrends", () => {
  it("sorts by publication date, then by catalog number, newest first", () => {
    const files = [
      trend({ id: "old", publishedAt: "2025-01-01", catalog: "ETD-9" }),
      trend({ id: "new-1", publishedAt: "2026-05-01", catalog: "ETD-1" }),
      trend({ id: "new-2", publishedAt: "2026-05-01", catalog: "ETD-2" }),
      trend({ id: "mid", publishedAt: "2026-02-01", catalog: "ETD-3" }),
    ];
    expect(latestTrends(files).map((file) => file.id)).toEqual(["new-2", "new-1", "mid"]);
    expect(latestTrends(files, 1).map((file) => file.id)).toEqual(["new-2"]);
  });
});

describe("latestStrongAnomalies", () => {
  it("keeps the newest strong file of each category", () => {
    const files = [
      anomaly("f-old", "floods", "2026-01-01"),
      anomaly("f-new", "floods", "2026-03-01"),
      anomaly("w-weak", "wildfires", "2026-04-01", "weak"),
      anomaly("w", "wildfires", "2026-02-01"),
      anomaly("v", "volcanoes", "2025-12-01"),
      anomaly("s", "severeStorms", "2025-11-01"),
    ];
    expect(latestStrongAnomalies(files).map((file) => file.id)).toEqual(["f-new", "w", "v"]);
  });

  it("shows three different kinds of event from the shipped files", () => {
    const shelf = latestStrongAnomalies(getCaseCatalog().events);
    expect(shelf).toHaveLength(3);
    expect(new Set(shelf.map((file) => file.category)).size).toBe(3);
    expect(shelf.every((file) => file.strength === "strong")).toBe(true);
  });
});

describe("featuredCase", () => {
  it("picks the confirmed trend with the most signal against noise", () => {
    const files = [
      trend({ id: "loud-but-unproven", significant: false, snr: 9 }),
      trend({ id: "clear", snr: 4 }),
      trend({ id: "faint", snr: 2 }),
    ];
    expect(featuredCase(files)?.id).toBe("clear");
  });

  it("is undefined when no trend is confirmed", () => {
    expect(featuredCase([trend({ id: "a", significant: false })])).toBeUndefined();
  });
});

describe("falseSuspect", () => {
  it("picks the artifact whose raw count grew the most", () => {
    const suspect = falseSuspect([
      auditCategory("trend", "trend", 20),
      auditCategory("small", "artifact", 2),
      auditCategory("big", "artifact", 12),
      auditCategory("no-factor", "artifact", null),
    ]);
    expect(suspect?.id).toBe("big");
  });

  it("is undefined without a measured artifact", () => {
    expect(falseSuspect([auditCategory("x", "artifact", null)])).toBeUndefined();
  });

  it("is wildfires in the shipped audit", () => {
    expect(falseSuspect(getEventAudit().categories)?.id).toBe("wildfires");
  });
});
