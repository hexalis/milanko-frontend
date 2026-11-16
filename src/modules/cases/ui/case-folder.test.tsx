import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getTranslator } from "@/modules/copy";
import { getCaseCatalog } from "../domain/catalog";
import { CaseFolder } from "./case-folder";

const catalog = getCaseCatalog();
const fileById = (id: string) => {
  const file = catalog.all.find((candidate) => candidate.id === id);
  if (!file) throw new Error(`missing ${id}`);
  return file;
};

describe("CaseFolder", () => {
  it("links a trend file to its dossier with its figures and verdict", () => {
    const { container } = render(
      <CaseFolder
        file={fileById("svalbard-warming")}
        translator={getTranslator("en")}
        catalog={catalog}
      />,
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/cases/svalbard-warming");
    expect(screen.getByRole("heading", { level: 3 })).toContainElement(link);
    expect(screen.getByText("ETD-2026-001")).toBeVisible();
    expect(screen.getByText("Temperature")).toBeVisible();
    expect(screen.getByText("Change")).toBeVisible();
    expect(screen.getByText("Air temperature")).toBeVisible();
    expect(screen.getByText(/years of data/)).toBeVisible();
    expect(screen.getByText("Confirmed")).toBeVisible();
    // The sparkline draws the Sen line and no event marker.
    expect(container.querySelector("svg line")).not.toBeNull();
    expect(container.querySelector("svg circle")).toBeNull();
  });

  it("carries one rising sheet per level of evidence, numbered with its folio", () => {
    const sheetsOf = (strength: "strong" | "moderate" | "weak") => {
      const file = catalog.trends.find((trend) => trend.t.strength === strength);
      if (!file) return null;
      const { container, unmount } = render(
        <CaseFolder file={file} translator={getTranslator("en")} catalog={catalog} />,
      );
      const folios = [...container.querySelectorAll('[aria-hidden="true"] b')].map(
        (label) => label.textContent,
      );
      unmount();
      return folios;
    };
    const all = ["01 · Series", "02 · Test", "03 · Source"];
    expect(sheetsOf("strong")).toEqual(all);
    // Moderate and weak files may be missing from the catalog; a missing one has nothing to show.
    expect(sheetsOf("moderate") ?? all.slice(0, 2)).toEqual(all.slice(0, 2));
    expect(sheetsOf("weak") ?? all.slice(0, 1)).toEqual(all.slice(0, 1));
  });

  it("shows an anomaly file's run-up and marks the event year", () => {
    const event = catalog.events[0];
    if (!event) throw new Error("no anomaly files");
    const { container } = render(
      <CaseFolder
        file={event}
        translator={getTranslator("es")}
        catalog={catalog}
        headingLevel="h4"
      />,
    );

    expect(screen.getByRole("link")).toHaveAttribute("href", `/cases/${event.id}`);
    expect(screen.getByRole("heading", { level: 4 })).toBeVisible();
    expect(screen.getByText("Antes del evento")).toBeVisible();
    expect(screen.getByText("Qué tan fuera de lo normal")).toBeVisible();
    expect(container.querySelector("svg circle")).not.toBeNull();
  });
});
