import { fireEvent, render, screen, within } from "@testing-library/react";
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

  it("walks the five steps one at a time, with the how beside each", () => {
    render(<MethodScreen catalog={catalog} translator={getTranslator("en")} />);

    const process = screen.getByRole("region", { name: "How we collect and test the data" });
    const steps = within(process).getAllByRole("tab");
    expect(steps).toHaveLength(5);
    expect(steps[0]).toHaveAttribute("aria-selected", "true");
    expect(within(process).getByRole("heading", { name: "Observe" })).toBeVisible();
    expect(within(process).getByText("How?")).toBeVisible();

    fireEvent.click(within(process).getByRole("button", { name: "Next step" }));
    expect(steps[1]).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(steps[1] as HTMLElement, { key: "End" });
    expect(steps[4]).toHaveAttribute("aria-selected", "true");
    expect(within(process).getByRole("button", { name: "Next step" })).toBeDisabled();
  });

  it("folds the anomaly test with the count and window from the data", () => {
    render(<MethodScreen catalog={catalog} translator={getTranslator("en")} />);

    const deep = screen.getByRole("region", { name: "Learn more" });
    const anomaly = within(deep).getByRole("heading", { name: "Anomalies: how unusual was it?" });
    const card = anomaly.closest("details");
    if (!card) throw new Error("no anomaly card");
    expect(card).not.toHaveAttribute("open");
    card.open = true;
    expect(
      within(card).getByRole("link", { name: `Anomaly files (${catalog.events.length})` }),
    ).toHaveAttribute("href", "/cases?kind=event");
    expect(
      within(card).getByText(new RegExp(`${catalog.eventWindowDays} days before`)),
    ).toBeVisible();
  });

  it("holds both labs behind tabs, the sources, the folded glossary and the credits", () => {
    render(<MethodScreen catalog={catalog} translator={getTranslator("en")} />);

    const lab = screen.getByRole("region", { name: "Try it yourself" });
    const tabs = within(lab).getAllByRole("tab");
    expect(tabs).toHaveLength(2);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    // The trend lab shows first; the peak-or-record lab waits behind its tab.
    expect(within(lab).getAllByRole("slider")).toHaveLength(3);
    fireEvent.click(tabs[1] as HTMLElement);
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    expect(within(lab).getAllByRole("slider")).toHaveLength(2);

    expect(screen.getByRole("link", { name: /NASA EONET v3/ })).toHaveAttribute("target", "_blank");
    expect(screen.getByText("Mann-Kendall test").closest("details")).not.toHaveAttribute("open");
    expect(screen.getByRole("heading", { name: "How we used AI" })).toBeVisible();
  });

  it("leaves the team to its own page", () => {
    render(<MethodScreen catalog={catalog} translator={getTranslator("es")} />);

    expect(screen.queryByRole("complementary")).toBeNull();
    expect(screen.getByRole("link", { name: /El equipo/ })).toHaveAttribute("href", "/team");
  });
});
