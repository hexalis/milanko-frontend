import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getCaseCatalog, trendDirection } from "@/modules/cases";
import { getTranslator } from "@/modules/copy";
import type { Depth, Hunch } from "../domain/ask-state";
import { getRules } from "../domain/engine";
import { openGuided } from "../domain/guided";
import { GuidedScreen } from "./guided-screen";

const catalog = getCaseCatalog();
const rules = getRules();

function renderStep(id: string, step: number, depth: Depth = "simple", hunch?: Hunch) {
  const found = openGuided(rules, catalog, id);
  if (!found) throw new Error(`not guided: ${id}`);
  const view = { ...found, direction: trendDirection(found.file.t), step, depth, hunch };
  return render(
    <GuidedScreen view={view} translator={getTranslator("en")} catalog={catalog} rules={rules} />,
  );
}

describe("GuidedScreen", () => {
  it("marks the current step and carries depth and hunch in every step link", () => {
    renderStep("warmer", 3, "guided", "up");
    const steps = screen.getByRole("list", { name: "Investigation steps" });
    expect(within(steps).getByText("Clues").closest("[aria-current]")).toHaveAttribute(
      "aria-current",
      "step",
    );
    expect(within(steps).getByRole("link", { name: /Question/ })).toHaveAttribute("href", "/ask");
    expect(within(steps).getByRole("link", { name: /Verdict/ })).toHaveAttribute(
      "href",
      "/ask/warmer?step=7&depth=guided&h=up",
    );
    expect(screen.getByRole("link", { name: /Next: Hypothesis/ })).toHaveAttribute(
      "href",
      "/ask/warmer?step=4&depth=guided&h=up",
    );
  });

  it("shows the depth switch with the current depth pressed", () => {
    renderStep("warmer", 2, "science");
    expect(screen.getByRole("button", { name: "Scientific" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Simple" })).toHaveAttribute("aria-pressed", "false");
  });

  it("asks a guiding question only at the guided depth, with a hint on step 4", () => {
    renderStep("warmer", 4, "guided");
    const guide = screen.getByRole("complementary", { name: "Question to guide you" });
    expect(within(guide).getByText("Show a hint")).toBeInTheDocument();
    renderStep("warmer", 3, "simple");
    expect(screen.getAllByRole("complementary")).toHaveLength(1);
  });

  it("offers three hunches as links and renders the chosen one's feedback", () => {
    renderStep("warmer", 4, "simple", "down");
    const chosen = screen.getByRole("link", { name: "It is going down" });
    expect(chosen).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: "It is going up" })).toHaveAttribute(
      "href",
      "/ask/warmer?step=4&depth=simple&h=up",
    );
    expect(screen.getByText(/You see the points dropping/)).toBeInTheDocument();
  });

  it("answers in one sentence and compares the hunch with the result on step 7", () => {
    renderStep("warmer", 7, "simple", "up");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Is it warmer here than before?",
    );
    expect(screen.getByText(/^Yes, it changed\. Air temperature rose/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy this answer" })).toBeInTheDocument();
    expect(screen.getByText("That is also what the test finds.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Compare with another question/ })).toHaveAttribute(
      "href",
      "/ask/rainfall?step=7&depth=simple",
    );
  });

  it("offers the comparison of a composed question's pair", () => {
    renderStep("soil_water@chile-drying", 7);
    expect(screen.getByRole("link", { name: /the same question in two places/ })).toHaveAttribute(
      "href",
      "/ask/compare?theme=soil_water&a=chile-drying&b=sahel-wetting&depth=simple",
    );
  });

  it("links the last step to the data, the case file and another question", () => {
    renderStep("warmer", 8);
    expect(screen.getByRole("link", { name: /Download data/ })).toHaveAttribute(
      "href",
      "/cases/svalbard-warming/data",
    );
    expect(screen.getByRole("link", { name: /Open the full case file/ })).toHaveAttribute(
      "href",
      "/cases/svalbard-warming",
    );
    expect(screen.getByRole("link", { name: /Ask another question/ })).toHaveAttribute(
      "href",
      "/ask",
    );
  });
});
