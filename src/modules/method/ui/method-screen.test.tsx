import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getEventAudit, getCaseCatalog } from "@/modules/cases";
import { getTranslator } from "@/modules/copy";
import { MethodScreen } from "./method-screen";

const catalog = getCaseCatalog();

describe("MethodScreen", () => {
  it("opens with the key figures read from the case data", () => {
    const { container } = render(
      <MethodScreen catalog={catalog} translator={getTranslator("en")} />,
    );

    const facts = container.querySelector<HTMLElement>('dl[aria-label="The data in figures"]');
    if (!facts) throw new Error("no facts strip");
    expect(within(facts).getByText(String(catalog.all.length))).toBeVisible();
    expect(within(facts).getByText(getEventAudit().events.toLocaleString("en"))).toBeVisible();
    expect(within(facts).getByText(String(catalog.global.points))).toBeVisible();
    expect(within(facts).getByText(new RegExp(`^${catalog.global.from}–`))).toBeVisible();
  });

  it("walks the five steps, each with its details on demand", () => {
    render(<MethodScreen catalog={catalog} translator={getTranslator("en")} />);

    const process = screen.getByRole("region", { name: "How we collect and test the data" });
    expect(within(process).getAllByRole("listitem")).toHaveLength(5);
    expect(within(process).getAllByText("How?")).toHaveLength(5);
    expect(within(process).getByRole("heading", { name: "Observe" })).toBeVisible();
  });

  it("links the anomaly test to its files with the count and window from the data", () => {
    render(<MethodScreen catalog={catalog} translator={getTranslator("en")} />);

    expect(
      screen.getByRole("link", { name: `Anomaly files (${catalog.events.length})` }),
    ).toHaveAttribute("href", "/cases?kind=event");
    expect(screen.getByText(new RegExp(`${catalog.eventWindowDays} days before`))).toBeVisible();
  });

  it("holds both labs, the sources, the glossary and the credits", () => {
    render(<MethodScreen catalog={catalog} translator={getTranslator("en")} />);

    expect(screen.getByRole("region", { name: "Try it: peak or record?" })).toBeVisible();
    expect(screen.getByRole("region", { name: "Try it: make your own planet" })).toBeVisible();
    expect(screen.getAllByRole("slider")).toHaveLength(5);
    expect(screen.getByRole("link", { name: /NASA EONET v3/ })).toHaveAttribute("target", "_blank");
    expect(screen.getByText("Mann-Kendall test")).toBeVisible();
    expect(screen.getByRole("heading", { name: "How we used AI" })).toBeVisible();
  });

  it("keeps the outline and the team in the aside, lead first", () => {
    render(<MethodScreen catalog={catalog} translator={getTranslator("es")} />);

    const aside = screen.getByRole("complementary");
    const outline = within(aside).getByRole("navigation");
    expect(within(outline).getAllByRole("link")).toHaveLength(6);
    expect(within(outline).getAllByRole("link")[0]).toHaveAttribute("href", "#method-process");

    const team = within(aside).getByRole("list", { name: "Equipo" });
    const [lead] = within(team).getAllByRole("heading", { level: 3 });
    expect(lead).toHaveTextContent("Jorge Ramos");
    expect(screen.getByRole("link", { name: /El equipo/ })).toHaveAttribute("href", "/team");
  });
});
