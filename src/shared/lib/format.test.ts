import { describe, expect, it } from "vitest";
import { formatNumber, formatSigned, withUnit } from "./format";

describe("formatNumber", () => {
  it("uses the es-CL separators", () => {
    expect(formatNumber(1234567.891, 2)).toBe("1.234.567,89");
  });

  it("returns an em dash for missing or non-numeric values", () => {
    expect(formatNumber(null)).toBe("—");
    expect(formatNumber(undefined)).toBe("—");
    expect(formatNumber("abc")).toBe("—");
    expect(formatNumber(Number.NaN)).toBe("—");
  });
});

describe("formatSigned", () => {
  it("adds a plus sign only to positive values", () => {
    expect(formatSigned(1.5)).toBe("+1,5");
    expect(formatSigned(-1.5)).toBe("-1,5");
    expect(formatSigned(0)).toBe("0");
  });
});

describe("withUnit", () => {
  it("appends the unit to a value", () => {
    expect(withUnit("12,3", "C")).toBe("12,3 C");
  });

  it("omits the unit when the value is missing", () => {
    expect(withUnit("—", "C")).toBe("—");
    expect(withUnit("12,3", null)).toBe("12,3");
  });
});
