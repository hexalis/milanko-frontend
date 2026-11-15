import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getCaseCatalog } from "@/modules/cases";
import { getTranslator } from "@/modules/copy";
import { compareJoin, compareSide, type CompareQuery } from "../domain/compare";
import { getRules } from "../domain/engine";
import { CompareScreen } from "./compare-screen";

const catalog = getCaseCatalog();
const rules = getRules();

function renderCompare(query: CompareQuery) {
  const a = compareSide(query.a, catalog);
  const b = compareSide(query.b, catalog);
  if (!a || !b) throw new Error("missing side");
  render(
    <CompareScreen
      query={query}
      sides={[a, b]}
      depth="guided"
      rules={rules}
      translator={getTranslator("en")}
      catalog={catalog}
    />,
  );
  return { a, b };
}

describe("CompareScreen", () => {
  it("shows both reviewed places and the sentence that joins them", () => {
    const { a, b } = renderCompare({ theme: "soil_water", a: "chile-drying", b: "sahel-wetting" });
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(2);
    expect(
      screen.getByText(getTranslator("en").t(`ask.cmp.${compareJoin(a, b)}`)),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Open this investigation/ })[0]).toHaveAttribute(
      "href",
      "/ask/soil_water%40chile-drying?s=look&depth=guided",
    );
  });

  it("reads the planet as its own side and links it to the method", () => {
    renderCompare({ theme: "temperature", a: "planet", b: "svalbard-warming" });
    expect(screen.getByRole("heading", { name: "The planet" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /How the test works/ })).toHaveAttribute(
      "href",
      "/method",
    );
    expect(screen.getByRole("link", { name: /Back/ })).toHaveAttribute(
      "href",
      "/ask?theme=temperature&verb=comparison",
    );
  });
});
