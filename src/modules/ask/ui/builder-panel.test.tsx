import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getCaseCatalog, getEventAudit } from "@/modules/cases";
import { getTranslator } from "@/modules/copy";
import type { SearchParams } from "@/shared/lib/search-params";
import factsData from "../data/facts.json";
import { builderExamples, builderState } from "../domain/builder";
import { previewLines } from "../domain/builder-view";
import { getRules } from "../domain/engine";
import type { Facts } from "../domain/rules";
import { QuestionBuilder } from "./builder-panel";

const rules = getRules();
const catalog = getCaseCatalog();
const facts = factsData as unknown as Facts;

function renderBuilder(params: SearchParams, path = "/ask") {
  const state = builderState(params, rules, catalog);
  return render(
    <QuestionBuilder
      state={state}
      examples={builderExamples(facts.examples, { state, rules, cases: catalog, path })}
      path={path}
      context={{ translator: getTranslator("en"), catalog }}
      themes={facts.themes}
      preview={previewLines(state, { ...catalog, audit: getEventAudit() })}
    />,
  );
}

const step = (name: RegExp) => screen.getByRole("group", { name });

describe("QuestionBuilder", () => {
  it("starts with theme tiles, the other steps locked, and examples as links", () => {
    renderBuilder({});
    const themes = within(step(/About what/)).getAllByRole("radio");
    expect(themes).toHaveLength(6);
    expect(themes.every((radio) => !(radio as HTMLInputElement).checked)).toBe(true);
    expect(within(step(/What to find out/)).queryByRole("radio")).toBeNull();
    expect(screen.getByText("First choose what it is about.")).toBeVisible();
    expect(screen.getByText("Then choose what you want to find out.")).toBeVisible();
    const yours = screen.getByRole("complementary", { name: "Your question" });
    expect(within(yours).getByText("Choose what you want to ask about.")).toBeVisible();
    expect(within(yours).getByText("Complete the three steps to investigate.")).toBeVisible();
    expect(screen.queryByRole("link", { name: /Investigate/ })).toBeNull();
    const chips = within(screen.getByRole("list", { name: "" })).getAllByRole("link");
    expect(chips).toHaveLength(4);
    expect(chips[0]).toHaveAttribute(
      "href",
      "/ask?theme=temperature&verb=trend&where=svalbard-warming&depth=simple",
    );
  });

  it("folds a chosen step behind Change and offers the reader's own place beside a reviewed one", () => {
    renderBuilder({ theme: "temperature", verb: "trend", depth: "guided" });
    const theme = step(/About what/);
    expect(within(theme).getByText("Change", { exact: false })).toBeInTheDocument();
    expect(within(theme).getByRole("radio", { name: /Air temperature/i })).toBeChecked();
    const where = step(/Where or when/);
    expect(within(where).getByRole("radio", { name: /Svalbard/ })).not.toBeChecked();
    expect(within(where).getByRole("radio", { name: /My own place/ })).not.toBeChecked();
    expect(screen.queryByRole("link", { name: /Investigate/ })).toBeNull();
    expect(document.querySelector('input[type="hidden"][name="depth"]')).toHaveValue("guided");
  });

  it("searches the reader's own place, and opens it once found", () => {
    renderBuilder({ theme: "temperature", verb: "trend", where: "mine" });
    expect(screen.getByRole("searchbox", { name: /Type a city/ })).toBeVisible();
    expect(screen.queryByRole("link", { name: /Investigate/ })).toBeNull();
    cleanup();
    renderBuilder({
      theme: "temperature",
      verb: "trend",
      where: "mine",
      lat: "12.93",
      lon: "-85.92",
      name: "Matagalpa, Nicaragua",
    });
    expect(screen.getByRole("searchbox")).toHaveValue("Matagalpa, Nicaragua");
    expect(screen.getByRole("link", { name: /Investigate/ })).toHaveAttribute(
      "href",
      "/place?lat=12.93&lon=-85.92&name=Matagalpa%2C+Nicaragua",
    );
    expect(document.querySelector('input[type="hidden"][name="lat"]')).toHaveValue("12.93");
  });

  it("links the finished question, says what it shows and marks its example", () => {
    renderBuilder({
      theme: "temperature",
      verb: "trend",
      where: "svalbard-warming",
      depth: "guided",
    });
    const go = screen.getByRole("link", { name: /Investigate/ });
    expect(go).toHaveAttribute("href", "/ask/warmer?s=look&depth=guided");
    expect(screen.getByText("Opens the guided investigation, step by step.")).toBeInTheDocument();
    const preview = screen.getByRole("list", { name: "What you will see" });
    expect(within(preview).getByText("45 years of data, 1981–2025")).toBeVisible();
    expect(within(preview).getByText("Reviewed by the team")).toBeVisible();
    const current = screen
      .getAllByRole("link")
      .filter((link) => link.getAttribute("aria-current") === "true");
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveAttribute(
      "href",
      "/ask?theme=temperature&verb=trend&where=svalbard-warming&depth=guided",
    );
  });

  it("asks for two places in a comparison and warns about the same one twice", () => {
    renderBuilder({
      theme: "soil_water",
      verb: "comparison",
      a: "chile-drying",
      b: "chile-drying",
    });
    expect(step(/Which two places/)).toBeVisible();
    expect(within(step(/First place/)).getByRole("radio", { name: /Central Chile/ })).toBeChecked();
    expect(
      within(step(/Second place/)).getByRole("radio", { name: /Central Chile/ }),
    ).toBeChecked();
    expect(screen.getByRole("alert")).toHaveTextContent("Choose two different places.");
    expect(screen.queryByRole("link", { name: /Investigate/ })).toBeNull();
  });

  it("keeps a long list of events as a dropdown and explains several variables", () => {
    renderBuilder({ theme: "weather", verb: "anomaly", where: "eonet-24723" });
    expect(screen.getByRole("combobox", { name: "Where or when" })).toHaveValue("eonet-24723");
    expect(screen.getByText(/we look at 3 things/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Investigate/ })).toHaveAttribute(
      "href",
      "/cases/eonet-24723",
    );
  });

  it("drops the later steps from the address when an earlier one changes", async () => {
    renderBuilder({ theme: "rain", verb: "trend" });
    const radio = within(step(/About what/)).getByRole("radio", { name: /Air temperature/i });
    const form = radio.closest("form");
    if (!form) throw new Error("no form");
    let submitted: [string, string][] = [];
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      submitted = [...new FormData(form).entries()].map(([key, value]) => [key, String(value)]);
    });

    fireEvent.click(radio);

    expect(submitted).toEqual([
      ["depth", "simple"],
      ["theme", "temperature"],
    ]);
    await Promise.resolve();
    expect(within(step(/What to find out/)).getByRole("radio", { name: /changed/ })).toBeEnabled();
  });
});
