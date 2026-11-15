import { describe, expect, it } from "vitest";
import { getTranslator } from "@/modules/copy";
import type { CaseReading, ReadingContext } from "./case-reading";
import { getCaseCatalog } from "./catalog";
import { getEventAudit } from "./event-audit";
import { caseFileIds, findReading, hasCaseFile } from "./reading";

const context = (locale: "en" | "es" = "en"): ReadingContext => ({
  translator: getTranslator(locale),
  catalog: getCaseCatalog(),
  audit: getEventAudit(),
});

/** A filled text: present, and with no copy key or placeholder left in it. */
const isFilled = (text: string | undefined) =>
  Boolean(text?.trim()) &&
  !/\{[a-zA-Z]+\}/.test(text ?? "") &&
  !/^[a-z]+(\.[a-zA-Z0-9-]+)+$/.test(text ?? "");

/** Every one of the seven sections carries its plain sentence and its exact figures. */
function expectSevenSections(reading: CaseReading) {
  // 1 · The answer
  expect(isFilled(reading.question)).toBe(true);
  expect(isFilled(reading.answer.word)).toBe(true);
  expect(isFilled(reading.answer.plain)).toBe(true);
  expect(isFilled(reading.answer.fig)).toBe(true);
  expect(reading.answer.exact.length).toBeGreaterThan(0);
  // 2 · What the data show
  expect(isFilled(reading.chart.plain)).toBe(true);
  expect(reading.chart.exact.length).toBeGreaterThan(0);
  expect(reading.chart.table.rows.length).toBeGreaterThan(0);
  for (const row of reading.chart.table.rows)
    expect(row).toHaveLength(reading.chart.table.head.length);
  // 3 · How sure
  expect(isFilled(reading.sure.word)).toBe(true);
  expect(isFilled(reading.sure.plain)).toBe(true);
  // 4 · What this does not say
  const exact = [...reading.answer.exact, ...reading.chart.exact, ...reading.sure.exact];
  for (const row of exact) expect(row.value).not.toMatch(/&\w+;|<\/?\w+>/);
  expect(reading.notSay.length).toBeGreaterThanOrEqual(3);
  // 5 · Why
  expect(isFilled(reading.why?.plain)).toBe(true);
  // 6 · Where the data come from
  expect(isFilled(reading.data.plain)).toBe(true);
  expect(reading.data.rows.length).toBeGreaterThan(2);
  // 7 · Use it
  expect(isFilled(reading.use.quote)).toBe(true);
  expect(reading.use.cite.at(-1)).toBe(reading.path);
  expect(reading.use.think).toHaveLength(3);
  for (const text of [
    ...reading.notSay,
    ...reading.use.think.flatMap((item) => [item.q, item.a]),
  ]) {
    expect(isFilled(text)).toBe(true);
  }
  expect(isFilled(reading.next.title)).toBe(true);
}

describe("case file ids", () => {
  it("lists trend, anomaly and audit files, all of them readable", () => {
    const ids = caseFileIds();
    expect(ids).toContain("svalbard-warming");
    expect(ids).toContain("eonet-24723");
    expect(ids).toContain("audit-wildfires");
    expect(ids).toHaveLength(6 + 32 + getEventAudit().categories.length);
    expect(ids.every(hasCaseFile)).toBe(true);
    expect(hasCaseFile("audit-unknown")).toBe(false);
    expect(hasCaseFile("nope")).toBe(false);
  });
});

describe("adapters fill the same seven sections", () => {
  it.each(caseFileIds())("%s", (id) => {
    for (const locale of ["en", "es"] as const) {
      const reading = findReading(id, context(locale));
      expect(reading).toBeDefined();
      expectSevenSections(reading!);
    }
  });
});

describe("trend reading", () => {
  const reading = findReading("svalbard-warming", context())!;

  it("asks the question and answers it with the confirmed change", () => {
    expect(reading.kind).toBe("trend");
    expect(reading.question).toBe("Has air temperature changed in Svalbard, Arctic, since 1981?");
    expect(reading.answer).toMatchObject({ tone: "yes", fig: "+3.48 °C", figDirection: "up" });
    expect(reading.answer.plain).not.toContain("<strong>");
    expect(reading.chart.visual.kind).toBe("series");
    expect(reading.data.orbit.map((image) => image.date)).toEqual(["2001-07-15", "2025-07-15"]);
    expect(reading.data.orbit[0]?.src).toMatch(/^https:\/\/gibs\.earthdata\.nasa\.gov\/wms/);
  });

  it("does not dress an inconclusive trend as a finding", () => {
    const murray = findReading("murray-rain", context())!;
    expect(murray.answer).toMatchObject({ tone: "no", isSoft: true, figDirection: "flat" });
    expect(murray.notSay[0]).toMatch(/does not say nothing changed/);
  });
});

describe("anomaly reading", () => {
  it("speaks of the event year and leads its strips with the lead variable", () => {
    const reading = findReading("eonet-24723", context())!;
    expect(reading.kind).toBe("event");
    expect(reading.question).toMatch(/90 days before the flood in Japan\?$/);
    expect(reading.answer.plain).toMatch(/^In the 90 days before, .*since \d{4}\.$/);
    if (reading.chart.visual.kind !== "strips") throw new Error("strips expected");
    expect(reading.chart.visual.strips[0]?.isLead).toBe(true);
    expect(reading.why?.link?.href).toBe("/cases/audit-floods");
  });

  it("reads the Spanish question with the right article", () => {
    expect(findReading("eonet-24723", context("es"))!.question).toMatch(
      /la inundación en Japón\?$/,
    );
  });
});

describe("audit reading", () => {
  it("answers whether the catalog or the planet changed", () => {
    const reading = findReading("audit-wildfires", context())!;
    expect(reading.kind).toBe("audit");
    expect(reading.question).toMatch(/more and more wildfires/);
    expect(reading.answer.tone).toBe("art");
    expect(reading.answer.fig).toMatch(/^×/);
    expect(reading.why?.breaks?.length).toBeGreaterThan(0);
    expect(reading.chart.csvHref).toBe("/cases/audit-wildfires/data");
    expect(reading.use.isShareable).toBe(false);
    expect(reading.next.href).toBe("/cases/audit-severeStorms");
  });

  it("says when a category has too few events", () => {
    const reading = findReading("audit-snow", context())!;
    expect(reading.sure).toMatchObject({ level: "weak", tone: "no" });
    expect(reading.answer.isSoft).toBe(true);
  });
});
