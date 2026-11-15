import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getCaseCatalog } from "@/modules/cases";
import { getTranslator } from "@/modules/copy";
import factsData from "../data/facts.json";
import { builderExamples, builderState } from "../domain/builder";
import { getRules } from "../domain/engine";
import type { Facts } from "../domain/rules";
import type { SearchParams } from "@/shared/lib/search-params";
import { QuestionBuilder } from "./builder-panel";

const rules = getRules();
const catalog = getCaseCatalog();
const examples = (factsData as unknown as Facts).examples;

function renderBuilder(params: SearchParams, path = "/ask") {
  const state = builderState(params, rules, catalog);
  return render(
    <QuestionBuilder
      state={state}
      examples={builderExamples(examples, { state, rules, cases: catalog, path })}
      path={path}
      context={{ translator: getTranslator("en"), catalog }}
    />,
  );
}

describe("QuestionBuilder", () => {
  it("starts with the theme only, and examples as links", () => {
    renderBuilder({});
    const builder = screen.getByRole("region", { name: "Build your question" });
    expect(within(builder).getByRole("combobox", { name: /About what/ })).toBeEnabled();
    expect(within(builder).getByRole("combobox", { name: /What to find out/ })).toBeDisabled();
    expect(within(builder).getByRole("combobox", { name: /Where or when/ })).toBeDisabled();
    expect(screen.getByText("Choose what you want to ask about.")).toBeVisible();
    expect(screen.queryByRole("link", { name: /Investigate/ })).toBeNull();
    const chips = within(screen.getByRole("list")).getAllByRole("link");
    expect(chips).toHaveLength(4);
    expect(chips[0]).toHaveAttribute(
      "href",
      "/ask?theme=temperature&verb=trend&where=svalbard-warming&depth=simple",
    );
  });

  it("links the finished question to the guided flow and marks its example", () => {
    renderBuilder({ theme: "temperature", verb: "trend", depth: "guided" }, "/");
    const go = screen.getByRole("link", { name: /Investigate/ });
    expect(go).toHaveAttribute("href", "/ask/warmer?step=2&depth=guided");
    expect(screen.getByText("Opens the guided investigation, step by step.")).toBeVisible();
    const current = screen
      .getAllByRole("link")
      .filter((link) => link.getAttribute("aria-current") === "true");
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveAttribute(
      "href",
      "/?theme=temperature&verb=trend&where=svalbard-warming&depth=guided",
    );
    expect(document.querySelector('input[type="hidden"][name="depth"]')).toHaveValue("guided");
  });

  it("swaps the place for two places in a comparison and warns about the same one twice", () => {
    renderBuilder({
      theme: "soil_water",
      verb: "comparison",
      a: "chile-drying",
      b: "chile-drying",
    });
    expect(screen.queryByRole("combobox", { name: /Where or when/ })).toBeNull();
    expect(screen.getByRole("combobox", { name: /First place/ })).toHaveValue("chile-drying");
    expect(screen.getByRole("combobox", { name: /Second place/ })).toHaveValue("chile-drying");
    expect(screen.getByRole("alert")).toHaveTextContent("Choose two different places.");
    expect(screen.queryByRole("link", { name: /Investigate/ })).toBeNull();
  });

  it("explains a question that reads several variables", () => {
    renderBuilder({ theme: "weather", verb: "anomaly", where: "eonet-24723" });
    expect(screen.getByText(/we look at 3 things/)).toBeVisible();
    expect(screen.getByRole("link", { name: /Investigate/ })).toHaveAttribute(
      "href",
      "/cases/eonet-24723",
    );
  });

  it("drops the later segments from the address when an earlier one changes", async () => {
    renderBuilder({ theme: "rain", verb: "trend" });
    const form = screen.getByRole("combobox", { name: /About what/ }).closest("form");
    if (!form) throw new Error("no form");
    let submitted: [string, string][] = [];
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      submitted = [...new FormData(form).entries()].map(([key, value]) => [key, String(value)]);
    });

    fireEvent.change(screen.getByRole("combobox", { name: /About what/ }), {
      target: { value: "temperature" },
    });

    expect(submitted).toEqual([
      ["depth", "simple"],
      ["theme", "temperature"],
    ]);
    await Promise.resolve();
    expect(screen.getByRole("combobox", { name: /What to find out/ })).toBeEnabled();
  });
});
