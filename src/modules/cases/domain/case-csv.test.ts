import { describe, expect, it } from "vitest";
import { caseCsv, eventCsv, trendCsv, auditCsv } from "./case-csv";
import { getCaseCatalog } from "./catalog";

const catalog = getCaseCatalog();
const svalbard = catalog.trends.find((file) => file.id === "svalbard-warming");
const event = catalog.events[0];
if (!svalbard || !event) throw new Error("missing fixtures");

const lines = (csv: string) => csv.trimEnd().split("\n");

describe("trendCsv", () => {
  it("starts with the provenance line and the header", () => {
    const [meta, header] = lines(trendCsv(svalbard));
    expect(meta).toMatch(/^# ETD-\S+ Svalbard, Arctic 78\.2° N/);
    expect(meta).toContain("Mann-Kendall p=");
    expect(meta).toContain("NASA POWER");
    expect(header).toBe(`year,${svalbard.variable} (${svalbard.unit}),sen_trend`);
  });

  it("writes one row per year with the Sen line value", () => {
    const rows = lines(trendCsv(svalbard)).slice(2);
    expect(rows).toHaveLength(svalbard.series.length);
    const [year, value] = svalbard.series[0] ?? [0, 0];
    expect(rows[0]).toBe(
      `${year},${value},${(svalbard.t.intercept + svalbard.t.slope * year).toFixed(6)}`,
    );
  });
});

describe("eventCsv", () => {
  it("lists every variable of the window per year", () => {
    const [meta, header, ...rows] = lines(eventCsv(event, 90));
    expect(meta).toContain(event.eonet);
    expect(meta).toContain(`first reported ${event.date}`);
    expect(header).toBe(
      `year,${Object.keys(event.vars)
        .map((key) => `${key}_90d_before`)
        .join(",")}`,
    );
    expect(rows).toHaveLength(event.lv.series.length);
    expect(rows[0]?.split(",")).toHaveLength(Object.keys(event.vars).length + 1);
  });
});

describe("caseCsv", () => {
  it("names the file after the catalog number", () => {
    expect(caseCsv(svalbard, 90).filename).toBe(`${svalbard.catalog}-svalbard-warming.csv`);
    expect(caseCsv(event, 90).filename).toBe(`${event.catalog}.csv`);
  });
});

describe("auditCsv", () => {
  it("writes events per year of one audit category", () => {
    const { filename, body } = auditCsv(
      {
        id: "floods",
        years: [
          [2000, 3],
          [2001, 5],
        ],
      },
      "2026-10-01",
    );
    expect(filename).toBe("eonet-floods.csv");
    expect(body).toBe(
      "# NASA EONET floods | events per year | data version 2026-10-01\nyear,events\n2000,3\n2001,5\n",
    );
  });
});
