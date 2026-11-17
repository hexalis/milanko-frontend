import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getTranslator } from "@/modules/copy";
import { mapPosition } from "../../domain/case-reading";
import { getCaseCatalog } from "../../domain/catalog";
import { getEventAudit } from "../../domain/event-audit";
import { findReading } from "../../domain/reading";
import { CaseGlance } from "./case-glance";

const translator = getTranslator("en");
const context = { translator, catalog: getCaseCatalog(), audit: getEventAudit() };

function renderGlance(id: string) {
  const reading = findReading(id, context);
  if (!reading) throw new Error(`missing ${id}`);
  render(<CaseGlance reading={reading} translator={translator} />);
  return reading;
}

/** Each sheet opens with its folio: "01 · Series", "02 · Test", "03 · Source". */
const sheetFolios = () => screen.queryAllByText(/^0[1-3] · /);

describe("CaseGlance", () => {
  it("deals one sheet per level of evidence, as the archive folder does", () => {
    renderGlance("svalbard-warming");
    expect(sheetFolios()).toHaveLength(3);
    expect(screen.queryByText("Missing sheet")).not.toBeInTheDocument();
  });

  it("says in words what the test means and which bars it clears", () => {
    renderGlance("svalbard-warming");
    expect(
      screen.getByText(/chance alone would give a change like this less than once/),
    ).toBeVisible();
    expect(screen.getByText("Strict bar · p < 0.01")).toHaveTextContent("cleared");
  });

  it("leaves a weak file with one sheet, says why the others are missing and stamps it", () => {
    renderGlance("murray-rain");
    expect(sheetFolios()).toHaveLength(1);
    expect(screen.getByText(/Two sheets missing/)).toBeVisible();
    expect(screen.getByText("Inconclusive")).toBeInTheDocument();
  });

  it("marks the place on the map and links to it on the globe", () => {
    renderGlance("chile-drying");
    expect(screen.getByRole("img", { name: /NASA world map with the place marked/ })).toBeVisible();
    expect(screen.getByRole("link", { name: "See on the globe" })).toHaveAttribute(
      "href",
      "/explore?case=chile-drying&region=south-america",
    );
    expect(screen.getByRole("heading", { level: 3, name: "Why it matters" })).toBeVisible();
    expect(screen.getByText(/megadrought since 2010/)).toBeVisible();
  });

  it("shows a catalog audit on the whole planet, without a pin", () => {
    renderGlance("audit-wildfires");
    expect(screen.getByRole("img", { name: "NASA world map." })).toBeVisible();
    expect(screen.getByText(/When the way events are logged changes/)).toBeVisible();
  });

  it("explains an anomaly file by the kind of event", () => {
    const reading = renderGlance("eonet-24723");
    expect(reading.glance.impact).toBe(translator.t("cf.impact.ev.water"));
    expect(reading.glance.sheets[0]?.note).toMatch(/days before the event/);
  });
});

describe("mapPosition", () => {
  it("places a point on the equirectangular world map", () => {
    expect(mapPosition(0, 0)).toEqual({ x: 50, y: 50 });
    expect(mapPosition(90, -180)).toEqual({ x: 0, y: 0 });
    expect(mapPosition(-90, 180)).toEqual({ x: 100, y: 100 });
  });
});
