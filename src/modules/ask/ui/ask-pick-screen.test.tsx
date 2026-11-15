import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getCaseCatalog } from "@/modules/cases";
import { getTranslator } from "@/modules/copy";
import { AskPickScreen } from "./ask-pick-screen";

const catalog = getCaseCatalog();

describe("AskPickScreen", () => {
  it("is step 1 of 8, with a breadcrumb back home and examples on /ask", () => {
    render(<AskPickScreen params={{}} translator={getTranslator("en")} catalog={catalog} />);
    const crumbs = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(within(crumbs).getByRole("link", { name: "I have a question" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByText("Step 1 of 8 · Question")).toBeVisible();
    expect(
      screen.getByRole("heading", { level: 1, name: "What do you want to find out?" }),
    ).toBeVisible();
    expect(screen.getAllByRole("link", { name: /\?$/ })[0]?.getAttribute("href")).toMatch(
      /^\/ask\?/,
    );
    expect(screen.getByRole("region", { name: "I want to explore" })).toBeVisible();
  });
});
