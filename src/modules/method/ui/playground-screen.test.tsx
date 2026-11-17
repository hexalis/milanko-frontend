import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getCaseCatalog } from "@/modules/cases";
import { getTranslator } from "@/modules/copy";
import { PlaygroundScreen } from "./playground-screen";

describe("PlaygroundScreen", () => {
  it("offers every experiment as a card, the real series first", () => {
    const catalog = getCaseCatalog();
    render(<PlaygroundScreen catalog={catalog} translator={getTranslator("en")} />);

    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(3);
    expect(tabs[0]).toHaveAccessibleName(/Change a real series/);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(screen.getAllByRole("radio", { name: /·/ })).toHaveLength(catalog.trends.length);
    expect(screen.getAllByRole("slider")).toHaveLength(5);

    fireEvent.click(tabs[2] as HTMLElement);
    expect(tabs[2]).toHaveAttribute("aria-selected", "true");
    expect(screen.getAllByRole("slider")).toHaveLength(2);
    expect(screen.getByRole("link", { name: /How we know/ })).toHaveAttribute("href", "/method");
  });
});
