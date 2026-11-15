import { describe, expect, it } from "vitest";
import { busiestYear, categoryLabel, pageWindow } from "./event";
import { formatPeriod, hasCoordinates, snapshotDate } from "./event-context";

const events = Array.from({ length: 100 }, (_, index) => ({
  id: `E${index}`,
  title: "x",
  categories: [],
}));

describe("pageWindow", () => {
  it("describes the first page", () => {
    expect(pageWindow({ events, total: 250, offset: 0 }, 100)).toMatchObject({
      first: 1,
      last: 100,
      page: 1,
      pageCount: 3,
      hasPrevious: false,
      hasNext: true,
      nextOffset: 100,
    });
  });

  it("stops at the last page", () => {
    expect(pageWindow({ events: events.slice(0, 50), total: 250, offset: 200 }, 100)).toMatchObject(
      {
        first: 201,
        last: 250,
        page: 3,
        hasPrevious: true,
        hasNext: false,
        previousOffset: 100,
      },
    );
  });

  it("shows one empty page when nothing matches", () => {
    expect(pageWindow({ events: [], total: 0, offset: 0 }, 100)).toMatchObject({
      first: 0,
      last: 0,
      pageCount: 1,
    });
  });
});

describe("categoryLabel", () => {
  it("translates known EONET ids and keeps unknown ones", () => {
    expect(categoryLabel("wildfires")).toBe("Incendios");
    expect(categoryLabel("tempExtremes")).toBe("tempExtremes");
    expect(categoryLabel(null)).toBe("—");
  });
});

describe("busiestYear", () => {
  it("picks the year with the most events", () => {
    const stats = {
      total: 9,
      statuses: {},
      categories: [],
      years: [
        { year: 2024, count: 2 },
        { year: 2025, count: 7 },
      ],
    };
    expect(busiestYear(stats)).toEqual({ year: 2025, count: 7 });
  });
});

describe("event context helpers", () => {
  const event = { id: "E1", title: "Fire", first_date: "2026-01-01", last_date: "2026-01-09" };

  it("formats the period and picks the snapshot date", () => {
    expect(formatPeriod(event)).toBe("2026-01-01 → 2026-01-09");
    expect(formatPeriod({ ...event, last_date: null })).toBe("2026-01-01");
    expect(snapshotDate(event)).toBe("2026-01-09");
    expect(snapshotDate({ ...event, last_date: null })).toBe("2026-01-01");
  });

  it("requires both coordinates for the snapshot", () => {
    const region = { code: 1, name: "R", n_geometries: 1, is_primary: true };
    expect(hasCoordinates({ ...region, lat: 0, lon: 10 })).toBe(true);
    expect(hasCoordinates({ ...region, lat: 10, lon: null })).toBe(false);
    expect(hasCoordinates(null)).toBe(false);
  });
});
