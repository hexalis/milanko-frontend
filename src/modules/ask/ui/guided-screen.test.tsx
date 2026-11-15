import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getCaseCatalog, trendDirection } from "@/modules/cases";
import { getTranslator } from "@/modules/copy";
import type { Depth, Hunch, Reading, Screen } from "../domain/ask-state";
import { getRules } from "../domain/engine";
import { openGuided } from "../domain/guided";
import { GuidedScreen } from "./guided-screen";

vi.mock("next/form", () => ({
  default: ({
    children,
    action,
    id,
  }: {
    children: React.ReactNode;
    action: string;
    id: string;
  }) => (
    <form id={id} action={action}>
      {children}
    </form>
  ),
}));

const catalog = getCaseCatalog();
const rules = getRules();

type Answers = { depth?: Depth; hunch?: Hunch; reading?: Reading };

function renderScreen(id: string, at: Screen, { depth = "simple", hunch, reading }: Answers = {}) {
  const found = openGuided(rules, catalog, id);
  if (!found) throw new Error(`not guided: ${id}`);
  const view = {
    ...found,
    direction: trendDirection(found.file.t),
    screen: at,
    depth,
    hunch,
    reading,
  };
  return render(
    <GuidedScreen view={view} translator={getTranslator("en")} catalog={catalog} rules={rules} />,
  );
}

describe("GuidedScreen", () => {
  it("fills the progress up to the current screen, with one heading", () => {
    renderScreen("warmer", "check", { hunch: "up" });
    const progress = screen.getByRole("list", { name: "Progress of the investigation" });
    const items = within(progress).getAllByRole("listitem");
    expect(items).toHaveLength(5);
    expect(items[2]).toHaveAttribute("aria-current", "step");
    expect(items[2]).toHaveTextContent("3 / 5");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Leave the investigation" })).toHaveAttribute(
      "href",
      "/ask",
    );
  });

  it("keeps the depth behind Aa, with the current one pressed", () => {
    renderScreen("warmer", "look", { depth: "science" });
    expect(screen.getByRole("button", { name: /^Scientific/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: /^Simple/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("goes back to the question from the first screen and on to the hypothesis", () => {
    renderScreen("warmer", "look");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "This is what we will look at",
    );
    const bar = screen.getByRole("navigation", { name: "Investigation steps" });
    expect(within(bar).getByRole("link", { name: "Back" })).toHaveAttribute("href", "/ask");
    expect(within(bar).getByRole("link", { name: /Continue/ })).toHaveAttribute(
      "href",
      "/ask/warmer?s=guess&depth=simple",
    );
  });

  it("asks for the hunch with a Check submit and a Skip link until it is answered", () => {
    renderScreen("warmer", "guess", { depth: "guided" });
    const guide = screen.getByRole("complementary", { name: "Question to guide you" });
    expect(within(guide).getByText("Show a hint")).toBeInTheDocument();
    const radios = screen.getAllByRole("radio");
    expect(radios.map((radio) => radio.getAttribute("value"))).toEqual(["up", "down", "unsure"]);
    expect(screen.getByRole("radio", { name: "It is going up" })).toBeRequired();
    expect(screen.getByRole("button", { name: /Check/ })).toHaveAttribute("form", "ask-quiz");
    expect(screen.getByRole("link", { name: "Skip" })).toHaveAttribute(
      "href",
      "/ask/warmer?s=check&depth=guided",
    );
    expect(screen.queryByRole("heading", { level: 2 })).not.toBeInTheDocument();
  });

  it("shows the result and the answer sheet once the hunch is in the URL", () => {
    renderScreen("warmer", "guess", { hunch: "down" });
    expect(screen.getByRole("radio", { name: "It is going down" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "It is going up" })).toBeDisabled();
    expect(screen.getByText("The test found something else")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(/since 1981/);
    expect(screen.getByRole("link", { name: /Continue/ })).toHaveAttribute(
      "href",
      "/ask/warmer?s=check&depth=simple&h=down",
    );
  });

  it("checks the reading against the test and carries both answers on", () => {
    renderScreen("warmer", "check", { hunch: "up", reading: "real" });
    expect(screen.getByText("The test finds a clear direction")).toBeInTheDocument();
    expect(screen.getByText(/^You thought the same\./)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Continue/ })).toHaveAttribute(
      "href",
      "/ask/warmer?s=verdict&depth=simple&h=up&r=real",
    );
  });

  it("answers in one sentence and compares the hunch with the result", () => {
    renderScreen("warmer", "verdict", { hunch: "up" });
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Is it warmer here than before?",
    );
    expect(screen.getByText(/^Yes, it changed\. Air temperature rose/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy this answer" })).toBeInTheDocument();
    expect(screen.getByText("That is also what the test finds.")).toBeInTheDocument();
  });

  it("closes with the reader's answers, the next question and the data", () => {
    renderScreen("warmer", "done", { hunch: "up" });
    expect(screen.getByText("It is going up")).toBeInTheDocument();
    expect(screen.getByText("You skipped it")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Compare with another question/ })).toHaveAttribute(
      "href",
      "/ask/rainfall?s=verdict&depth=simple",
    );
    expect(screen.getByRole("link", { name: /Download data/ })).toHaveAttribute(
      "href",
      "/cases/svalbard-warming/data",
    );
    expect(screen.getByRole("link", { name: /See on the globe/ })).toHaveAttribute(
      "href",
      "/explore?case=svalbard-warming",
    );
    expect(screen.getByRole("link", { name: /Ask another question/ })).toHaveAttribute(
      "href",
      "/ask",
    );
  });

  it("offers the comparison of a composed question's pair", () => {
    renderScreen("soil_water@chile-drying", "done");
    expect(screen.getByRole("link", { name: /the same question in two places/ })).toHaveAttribute(
      "href",
      "/ask/compare?theme=soil_water&a=chile-drying&b=sahel-wetting&depth=simple",
    );
  });
});
