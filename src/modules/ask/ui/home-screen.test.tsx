import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getCaseCatalog } from "@/modules/cases";
import { getTranslator } from "@/modules/copy";
import { HomeScreen } from "./home-screen";

const catalog = getCaseCatalog();

describe("HomeScreen", () => {
  it("opens two doors: the question builder and the ways to explore", () => {
    render(<HomeScreen params={{}} translator={getTranslator("en")} catalog={catalog} />);
    expect(
      screen.getByRole("heading", { level: 1, name: "What do you want to find out?" }),
    ).toBeVisible();
    expect(screen.getByRole("region", { name: "I have a question" })).toContainElement(
      screen.getByRole("region", { name: "Build your question" }),
    );
    const explore = screen.getByRole("region", { name: "I want to explore" });
    expect(
      within(explore)
        .getAllByRole("link")
        .map((link) => link.getAttribute("href")),
    ).toEqual(["/regions", "/cases", "/briefing"]);
    expect(
      within(explore).getByText(new RegExp(`${catalog.all.length} investigations`)),
    ).toBeVisible();
    expect(screen.getByText("Not every change is a trend.")).toBeVisible();
    // Examples stay on the home.
    expect(screen.getAllByRole("link", { name: /\?$/ })[0]?.getAttribute("href")).toMatch(/^\/\?/);
  });

  it("speaks Spanish when the reader chose it", () => {
    render(<HomeScreen params={{}} translator={getTranslator("es")} catalog={catalog} />);
    expect(
      screen.getByRole("heading", { level: 1, name: "¿Qué quieres averiguar?" }),
    ).toBeVisible();
  });
});
