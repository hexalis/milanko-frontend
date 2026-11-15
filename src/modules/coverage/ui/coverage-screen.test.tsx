import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { VariableCoverage } from "../domain/coverage";
import { CoverageScreen } from "./coverage-screen";

vi.mock("next/form", () => ({
  default: ({ children, action }: { children: React.ReactNode; action: string }) => (
    <form action={action}>{children}</form>
  ),
}));

const rows: VariableCoverage[] = [
  { variable: "T2M", source: "NASA POWER", name: "Temperature at 2 Meters", unit: "C", count: 500, start: "2006-01-01", end: "2026-11-01" },
  { variable: "NDVI", source: "NASA GIBS", name: "MODIS NDVI", unit: "index", count: 900, start: "2010-01-01", end: "2026-10-01" },
];

describe("CoverageScreen", () => {
  it("lists every variable with a link to its regional series", () => {
    render(<CoverageScreen rows={rows} filters={{ isSortedByCount: false }} />);

    const table = screen.getByRole("table", { name: "Variables persistidas" });
    expect(within(table).getAllByRole("row")).toHaveLength(3);
    expect(within(table).getByRole("link", { name: "T2M" })).toHaveAttribute("href", "/regions?variable=T2M");
    expect(screen.getByText("2 de 2 variables")).toBeVisible();
  });

  it("applies the filters from the URL and explains an empty result", () => {
    render(<CoverageScreen rows={rows} filters={{ query: "sin coincidencias", isSortedByCount: false }} />);

    expect(screen.getByText("No hay variables para el filtro.")).toBeVisible();
    expect(screen.getByRole("searchbox", { name: "Buscar" })).toHaveValue("sin coincidencias");
  });
});
