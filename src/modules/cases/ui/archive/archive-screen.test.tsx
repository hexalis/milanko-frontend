import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_ARCHIVE_STATE, parseArchiveState } from "../../domain/archive";
import { getCaseCatalog } from "../../domain/catalog";
import { getEventAudit } from "../../domain/event-audit";
import { ArchiveScreen } from "./archive-screen";

vi.mock("next/form", () => ({
  default: ({ children, action }: { children: React.ReactNode; action: string }) => (
    <form action={action}>{children}</form>
  ),
}));

const catalog = getCaseCatalog();
const audit = getEventAudit();

describe("ArchiveScreen", () => {
  it("shows every folder on the shelf, grouped by kind, and the audit card", () => {
    // Plain queries: role queries over 38 folders are slow enough to time out a busy test run.
    const { container } = render(
      <ArchiveScreen state={DEFAULT_ARCHIVE_STATE} catalog={catalog} audit={audit} locale="en" />,
    );

    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(container.querySelector("h1")).toHaveTextContent("Case Files");
    expect(screen.getByText("38 case files")).toBeVisible();
    expect(container.querySelector("#shelf-trend")).toHaveTextContent(/Trend files/);
    expect(container.querySelectorAll("h4")).toHaveLength(38);
    expect(container.querySelector('a[href="/cases?kind=audit"]')).toHaveTextContent(
      /more disasters/,
    );
  });

  it("marks the current topic and keeps the search in the other topics' links", () => {
    const state = parseArchiveState({ topic: "heat", q: "arctic" }, catalog);
    render(<ArchiveScreen state={state} catalog={catalog} audit={audit} locale="en" />);

    const topics = within(screen.getByRole("navigation", { name: /topic/i }));
    expect(topics.getByRole("link", { name: /Heat/ })).toHaveAttribute("aria-current", "true");
    expect(topics.getByRole("link", { name: /Disasters/ })).toHaveAttribute(
      "href",
      "/cases?topic=disasters&q=arctic",
    );
    expect(screen.queryByRole("link", { name: /more disasters/ })).toBeNull();
    expect(screen.getByRole("link", { name: "Remove filter “arctic”" })).toHaveAttribute(
      "href",
      "/cases?topic=heat",
    );
  });

  it("puts the search and the sort in one GET form that carries the topic", () => {
    const state = parseArchiveState({ topic: "disasters", q: "fire", sort: "magnitude" }, catalog);
    const { container } = render(
      <ArchiveScreen state={state} catalog={catalog} audit={audit} locale="en" />,
    );

    const form = container.querySelector("form");
    expect(form).toHaveAttribute("action", "/cases");
    expect(form?.querySelector('input[type="hidden"][name="topic"]')).toHaveValue("disasters");
    expect(screen.getByRole("searchbox", { name: "Search case files" })).toHaveValue("fire");
    expect(screen.getByRole("combobox", { name: "Sort" })).toHaveValue("magnitude");
  });

  it("orders the files around a place and shows their distance", () => {
    const state = parseArchiveState({ near: "12.93,-85.92,Matagalpa" }, catalog);
    render(<ArchiveScreen state={state} catalog={catalog} audit={audit} locale="en" />);

    expect(screen.getByText(/closest to/)).toBeVisible();
    expect(screen.getAllByText(/^about [\d,]+ km away$/)).toHaveLength(38);
    expect(screen.getByRole("link", { name: "Remove filter Near Matagalpa" })).toBeVisible();
  });

  it("says when a typed place cannot be found", () => {
    const state = parseArchiveState({ q: "Matagalpa" }, catalog);
    render(<ArchiveScreen state={state} catalog={catalog} audit={audit} locale="en" />);

    expect(screen.getByText(/could not find/)).toBeVisible();
  });

  it("shows the catalog audit with a link to each category's file", () => {
    const state = parseArchiveState({ kind: "audit" }, catalog);
    render(<ArchiveScreen state={state} catalog={catalog} audit={audit} locale="en" />);

    expect(screen.getByRole("heading", { level: 2, name: "Signal or catalog?" })).toBeVisible();
    const links = screen.getAllByRole("link", { name: /Open as a case file/ });
    expect(links).toHaveLength(audit.categories.length);
    expect(links[0]).toHaveAttribute("href", "/cases/audit-wildfires");
  });

  it("speaks Spanish when asked", () => {
    render(
      <ArchiveScreen state={DEFAULT_ARCHIVE_STATE} catalog={catalog} audit={audit} locale="es" />,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Expedientes" })).toBeVisible();
    expect(screen.getByText("38 expedientes")).toBeVisible();
  });
});
