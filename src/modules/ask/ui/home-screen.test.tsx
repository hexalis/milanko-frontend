import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getTranslator } from "@/modules/copy";
import { HomeScreen } from "./home-screen";

describe("HomeScreen", () => {
  it("welcomes on the night cover with the two ways in", () => {
    render(<HomeScreen translator={getTranslator("en")} />);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Hi. Here you investigate the Earth with NASA data.",
      }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "I have a question" })).toHaveAttribute("href", "/ask");
    expect(screen.getByRole("link", { name: "Explore the map" })).toHaveAttribute(
      "href",
      "/explore",
    );
    expect(screen.getByText(/NASA Blue Marble, via NASA GIBS/)).toBeVisible();
  });

  it("opens four doors, each tied to a station of the ring", () => {
    const { container } = render(<HomeScreen translator={getTranslator("en")} />);
    const doors = screen.getByRole("region", { name: "What do you want to do today?" });
    const links = within(doors).getAllByRole("link");
    expect(links.map((link) => [link.getAttribute("href"), link.dataset.st])).toEqual([
      ["/ask", "ask"],
      ["/explore", "map"],
      ["/cases", "cases"],
      ["/method", "method"],
    ]);
    const steps = within(doors).getByRole("list", { name: "The eight steps" });
    expect(within(steps).getAllByRole("listitem")).toHaveLength(8);
    // The cover art is decorative: the ring, the drawn planet and the Earth canvas.
    expect(
      container.querySelectorAll('svg[aria-hidden="true"][focusable="false"]').length,
    ).toBeGreaterThan(4);
    expect(container.querySelector("canvas")).toHaveAttribute("aria-hidden", "true");
  });

  it("names the three kinds of clue and closes on the motto", () => {
    render(<HomeScreen translator={getTranslator("en")} />);
    const key = screen.getByRole("region", { name: "Three words to read everything" });
    // Each term also holds its drawn glyph, hidden from assistive tech.
    const terms = within(key).getAllByRole("term");
    expect(terms.map((term) => term.lastElementChild?.textContent)).toEqual([
      "Trend",
      "Anomaly",
      "Event",
    ]);
    for (const term of terms)
      expect(term.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    const close = screen.getByRole("region", { name: "Not every change is a trend." });
    expect(within(close).getByRole("link", { name: "See the method" })).toHaveAttribute(
      "href",
      "/method",
    );
    expect(screen.getByRole("link", { name: "Meet the team" })).toHaveAttribute("href", "/team");
  });

  it("speaks Spanish when the reader chose it", () => {
    render(<HomeScreen translator={getTranslator("es")} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      getTranslator("es").t("home2.title"),
    );
  });
});
