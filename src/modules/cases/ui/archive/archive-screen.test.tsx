import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_ARCHIVE_STATE, parseArchiveState } from "../../domain/archive";
import { getCaseCatalog } from "../../domain/catalog";
import { ArchiveScreen } from "./archive-screen";

vi.mock("next/form", () => ({
  default: ({ children, action }: { children: React.ReactNode; action: string }) => (
    <form action={action}>{children}</form>
  ),
}));

const catalog = getCaseCatalog();

describe("ArchiveScreen", () => {
  it("shows every folder on the shelf, grouped by kind", () => {
    render(<ArchiveScreen state={DEFAULT_ARCHIVE_STATE} catalog={catalog} locale="en" />);

    expect(screen.getByRole("heading", { level: 1, name: "Case Files" })).toBeVisible();
    expect(screen.getByText("38 case files")).toBeVisible();
    expect(screen.getByRole("heading", { level: 3, name: /Trend files/ })).toBeVisible();
    expect(screen.getByRole("heading", { level: 3, name: /Anomaly files/ })).toBeVisible();
    expect(screen.getAllByRole("heading", { level: 4 })).toHaveLength(38);
  });

  it("marks the current kind tab and keeps the filters in the other tabs' links", () => {
    const state = parseArchiveState({ kind: "trend", region: "arctic" }, catalog);
    render(<ArchiveScreen state={state} catalog={catalog} locale="en" />);

    const tabs = within(screen.getByRole("navigation", { name: "Kind of file" }));
    expect(tabs.getByRole("link", { name: /Trend files/ })).toHaveAttribute("aria-current", "page");
    expect(tabs.getByRole("link", { name: /All files/ })).toHaveAttribute(
      "href",
      "/cases?region=arctic",
    );
    expect(screen.getByText("Showing 2 of 6 case files")).toBeVisible();
    expect(screen.getByRole("checkbox", { name: /Arctic/ })).toBeChecked();
    expect(screen.getByRole("link", { name: "Remove filter Arctic" })).toHaveAttribute(
      "href",
      "/cases?kind=trend",
    );
  });

  it("puts search, sort and facets in one GET form with the hidden kind", () => {
    const state = parseArchiveState({ kind: "event", q: "fire", sort: "magnitude" }, catalog);
    const { container } = render(<ArchiveScreen state={state} catalog={catalog} locale="en" />);

    const form = container.querySelector("form");
    expect(form).toHaveAttribute("action", "/cases");
    expect(form?.querySelector('input[type="hidden"][name="kind"]')).toHaveValue("event");
    expect(screen.getByRole("searchbox", { name: "Search case files" })).toHaveValue("fire");
    expect(screen.getByRole("combobox", { name: "Sort" })).toHaveValue("magnitude");
  });

  it("explains an empty result and offers the most helpful filter to drop", () => {
    const state = parseArchiveState({ kind: "trend", col: "records", region: "arctic" }, catalog);
    render(<ArchiveScreen state={state} catalog={catalog} locale="en" />);

    expect(screen.getByText("No case file matches all of that.")).toBeVisible();
    expect(screen.getByText("Remove “Records” to see 2 more.")).toBeVisible();
    expect(screen.getByRole("link", { name: "Clear all filters" })).toHaveAttribute(
      "href",
      "/cases?kind=trend",
    );
    // A selected option stays visible even when it gives nothing.
    expect(screen.getByRole("link", { name: /Records/, current: true })).toBeVisible();
  });

  it("speaks Spanish when asked", () => {
    render(<ArchiveScreen state={DEFAULT_ARCHIVE_STATE} catalog={catalog} locale="es" />);

    expect(screen.getByRole("heading", { level: 1, name: "Expedientes" })).toBeVisible();
    expect(screen.getByText("38 expedientes")).toBeVisible();
  });
});
