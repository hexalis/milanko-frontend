import { describe, expect, it } from "vitest";
import type { CaseSummary } from "@/modules/cases";
import { sectorFiles } from "./sector-files";

function file(partial: Partial<CaseSummary> & Pick<CaseSummary, "id">): CaseSummary {
  return {
    kind: "event",
    catalog: "ETD-0",
    region: "africa",
    lat: 0,
    lon: 0,
    category: "floods",
    title: partial.id,
    name: partial.id,
    themeLabel: "",
    themeIcon: "",
    place: "",
    direction: "up",
    verdict: "confirmed",
    verdictLabel: "",
    strength: "strong",
    strengthWord: "",
    figure: "",
    figureNote: "",
    short: "",
    rowNote: "",
    summary: "",
    series: [],
    trend: null,
    snr: 1,
    ...partial,
  };
}

describe("sectorFiles", () => {
  const files = [
    file({ id: "weak", strength: "weak", snr: 9 }),
    file({ id: "strong-low", strength: "strong", snr: 2 }),
    file({ id: "strong-high", strength: "strong", snr: 3 }),
    file({ id: "moderate", strength: "moderate" }),
    file({ id: "trend", kind: "trend", category: null }),
    file({ id: "elsewhere", region: "europe" }),
  ];

  it("orders anomaly files by strength, then by how extreme they were", () => {
    expect(sectorFiles(files, "africa").anomalies.map((f) => f.id)).toEqual([
      "strong-high",
      "strong-low",
      "moderate",
      "weak",
    ]);
  });

  it("counts the sector's files and keeps trends apart", () => {
    expect(sectorFiles(files, "africa")).toMatchObject({ total: 5, anomalous: 2, unusual: 1 });
    expect(sectorFiles(files, "africa").trends.map((f) => f.id)).toEqual(["trend"]);
    expect(sectorFiles(files, "asia").total).toBe(0);
  });
});
