import { describe, expect, it } from "vitest";
import {
  isoDaysAgo,
  lastDaysRange,
  orderedRange,
  readIsoDate,
  readNonNegativeInt,
  readOption,
  readString,
  toQueryString,
} from "./search-params";

describe("readString", () => {
  it("takes the first value and trims it", () => {
    expect(readString({ q: ["  hola ", "otra"] }, "q")).toBe("hola");
  });

  it("treats blank values as missing", () => {
    expect(readString({ q: "   " }, "q")).toBeUndefined();
    expect(readString({}, "q")).toBeUndefined();
  });
});

describe("readIsoDate", () => {
  it("accepts real calendar days only", () => {
    expect(readIsoDate({ d: "2024-02-29" }, "d")).toBe("2024-02-29");
    expect(readIsoDate({ d: "2023-02-29" }, "d")).toBeUndefined();
    expect(readIsoDate({ d: "2024-1-5" }, "d")).toBeUndefined();
    expect(readIsoDate({ d: "ayer" }, "d")).toBeUndefined();
  });
});

describe("readNonNegativeInt", () => {
  it("rejects negatives, decimals and text", () => {
    expect(readNonNegativeInt({ n: "200" }, "n")).toBe(200);
    expect(readNonNegativeInt({ n: "-1" }, "n")).toBeUndefined();
    expect(readNonNegativeInt({ n: "1.5" }, "n")).toBeUndefined();
    expect(readNonNegativeInt({ n: "diez" }, "n")).toBeUndefined();
  });
});

describe("readOption", () => {
  it("falls back when the value is not allowed", () => {
    const options = ["asc", "desc"] as const;
    expect(readOption({ o: "asc" }, "o", options, "desc")).toBe("asc");
    expect(readOption({ o: "random" }, "o", options, "desc")).toBe("desc");
  });
});

describe("date ranges", () => {
  it("counts days back in UTC", () => {
    const now = new Date("2026-03-01T12:00:00Z");
    expect(isoDaysAgo(1, now)).toBe("2026-02-28");
    expect(lastDaysRange(30, now)).toEqual({ start: "2026-01-30", end: "2026-03-01" });
  });
});

describe("toQueryString", () => {
  it("skips undefined and empty values", () => {
    expect(toQueryString({ region: 24, variable: "T2M", start: undefined, q: "" })).toBe(
      "?region=24&variable=T2M",
    );
    expect(toQueryString({})).toBe("");
  });
});

describe("orderedRange", () => {
  it("swaps a reversed range and keeps an ordered one", () => {
    expect(orderedRange("2025-02-01", "2025-01-01")).toEqual({
      start: "2025-01-01",
      end: "2025-02-01",
    });
    expect(orderedRange("2025-01-01", "2025-02-01")).toEqual({
      start: "2025-01-01",
      end: "2025-02-01",
    });
  });
});
