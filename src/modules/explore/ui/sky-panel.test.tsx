import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getTranslator } from "@/modules/copy";
import { exploreTranslator, pickExploreMessages } from "../domain/explore-copy";
import { SkyPanel } from "./sky-panel";

const es = exploreTranslator(pickExploreMessages(getTranslator("es")));
const en = exploreTranslator(pickExploreMessages(getTranslator("en")));

describe("SkyPanel", () => {
  it("shows the Moon with today's phase, and Apollo 11 only once its mark is found", () => {
    const { rerender } = render(
      <SkyPanel id="moon" apollo={false} t={es} titleRef={{ current: null }} />,
    );
    expect(screen.getByRole("heading", { level: 2, name: "La Luna" })).toBeVisible();
    expect(screen.getByText("Satélite natural")).toBeVisible();
    expect(screen.getByText(/\d+ % iluminada/)).toBeVisible();
    expect(screen.getByText("384.400 km")).toBeVisible();
    expect(screen.queryByRole("heading", { name: /Apolo 11/ })).not.toBeInTheDocument();

    rerender(<SkyPanel id="moon" apollo t={es} titleRef={{ current: null }} />);
    expect(screen.getByRole("heading", { level: 3, name: /Apolo 11/ })).toBeVisible();
    expect(screen.getByRole("link", { name: /La misión Apolo 11 en la NASA/ })).toHaveAttribute(
      "href",
      "https://www.nasa.gov/mission/apollo-11/",
    );
  });

  it("shows a constellation's card in the reader's language", () => {
    render(<SkyPanel id="canis-major" apollo={false} t={en} titleRef={{ current: null }} />);
    expect(screen.getByRole("heading", { level: 2, name: "Canis Major" })).toBeVisible();
    expect(screen.getByText("Constellation")).toBeVisible();
    expect(screen.getByText("Sirius")).toBeVisible();
    expect(screen.getByText("The whole planet")).toBeVisible();
    expect(screen.getByText(/Orion's belt points to Sirius/)).toBeVisible();
  });
});
