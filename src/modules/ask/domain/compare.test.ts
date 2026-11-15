import { describe, expect, it } from "vitest";
import { getCaseCatalog } from "@/modules/cases";
import { compareHref, compareJoin, compareSide, parseCompare, sideHref } from "./compare";
import { getRules } from "./engine";

const catalog = getCaseCatalog();
const rules = getRules();

describe("parseCompare", () => {
  it("accepts two different reviewed places of the theme", () => {
    expect(
      parseCompare(rules, { theme: "soil_water", a: "chile-drying", b: "sahel-wetting" }),
    ).toEqual({ theme: "soil_water", a: "chile-drying", b: "sahel-wetting" });
    expect(
      parseCompare(rules, { theme: "temperature", a: "planet", b: "svalbard-warming" }),
    ).toEqual({ theme: "temperature", a: "planet", b: "svalbard-warming" });
  });

  it("rejects missing, equal, unreviewed or free-point sides and unknown themes", () => {
    expect(parseCompare(rules, { theme: "soil_water", a: "chile-drying" })).toBeUndefined();
    expect(
      parseCompare(rules, { theme: "soil_water", a: "chile-drying", b: "chile-drying" }),
    ).toBeUndefined();
    expect(
      parseCompare(rules, { theme: "soil_water", a: "chile-drying", b: "murray-rain" }),
    ).toBeUndefined();
    expect(
      parseCompare(rules, { theme: "soil_water", a: "chile-drying", b: "p:10,20:Home" }),
    ).toBeUndefined();
    expect(parseCompare(rules, { theme: "nope", a: "a", b: "b" })).toBeUndefined();
  });
});

describe("compareSide", () => {
  it("reads the planet-wide sample", () => {
    const side = compareSide("planet", catalog);
    expect(side).toMatchObject({
      kind: "planet",
      isSignificant: true,
      direction: "up",
      from: 1981,
    });
  });

  it("reads a reviewed case and nothing else", () => {
    expect(compareSide("chile-drying", catalog)).toMatchObject({
      kind: "case",
      id: "chile-drying",
    });
    expect(compareSide("unknown", catalog)).toBeUndefined();
  });
});

describe("compareJoin", () => {
  const up = { isSignificant: true, direction: "up" as const };
  const down = { isSignificant: true, direction: "down" as const };
  const open = { isSignificant: false, direction: "flat" as const };

  it("joins only two confirmed results", () => {
    expect(compareJoin(up, up)).toBe("same");
    expect(compareJoin(up, down)).toBe("opposite");
    expect(compareJoin(up, open)).toBe("pending");
    expect(compareJoin(open, open)).toBe("pending");
  });
});

describe("links", () => {
  it("builds the comparison URL", () => {
    expect(compareHref({ theme: "soil_water", a: "x", b: "y", depth: "guided" })).toBe(
      "/ask/compare?theme=soil_water&a=x&b=y&depth=guided",
    );
  });

  it("sends a side to its guided investigation, or the planet to the method", () => {
    const side = compareSide("chile-drying", catalog);
    const planet = compareSide("planet", catalog);
    if (!side || !planet) throw new Error("missing side");
    expect(sideHref(rules, catalog, "soil_water", side, "simple")).toBe(
      "/ask/soil_water%40chile-drying?s=look&depth=simple",
    );
    expect(sideHref(rules, catalog, "temperature", planet, "simple")).toBe("/method");
  });
});
