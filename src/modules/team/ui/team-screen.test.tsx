import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getTranslator } from "@/modules/copy";
import { teamMembers } from "../domain/team";
import { TeamScreen } from "./team-screen";

describe("TeamScreen", () => {
  it("introduces the team and links back to the method", () => {
    render(<TeamScreen translator={getTranslator("en")} />);

    expect(screen.getByRole("heading", { level: 1, name: "The team" })).toBeVisible();
    expect(screen.getByText(`${teamMembers("en").length} people`)).toBeVisible();
    expect(screen.getByRole("link", { name: /How we know/ })).toHaveAttribute("href", "/method");
  });

  it("shows the lead first, then each card with localized roles and links", () => {
    render(<TeamScreen translator={getTranslator("es")} />);

    const list = screen.getByRole("list", { name: "Integrantes del equipo" });
    const cards = within(list)
      .getAllByRole("listitem")
      .filter((item) => item.parentElement === list);
    expect(cards).toHaveLength(teamMembers("es").length);

    const [lead, mate] = cards;
    if (!lead || !mate) throw new Error("missing cards");
    expect(within(lead).getByRole("heading", { level: 3 })).toHaveTextContent(
      "Jorge Alberto Ramos Tellez",
    );
    expect(within(lead).getByText("Diseño de producto")).toBeVisible();
    // No bio is shown for anyone.
    expect(screen.queryByText(/Diseñó y construyó/)).toBeNull();
    const linkedin = within(lead).getByRole("link", { name: /Jorge Alberto Ramos Tellez/ });
    expect(linkedin).toHaveAttribute("href", "https://www.linkedin.com/in/jorge-ramos-tellez/");
    expect(linkedin).toHaveAttribute("target", "_blank");
    expect(linkedin).toHaveAttribute("rel", "noopener noreferrer");
    expect(linkedin).toHaveTextContent("LinkedIn");
    // The photo fills the frame; it is decorative because the name sits beside it.
    const photo = lead.querySelector("img");
    expect(photo).not.toBeNull();
    expect(photo).toHaveAttribute("alt", "");
    expect(photo?.getAttribute("src")).toContain("jorge-ramos.jpg");

    expect(within(mate).getByRole("heading", { level: 3 })).toHaveTextContent(
      "Roger Fernando Guido Cisneros",
    );
    expect(within(mate).getByText("Desarrollo de software")).toBeVisible();
    // Every seat is filled: no card is left as a placeholder.
    expect(screen.queryByText("Rol por confirmar")).toBeNull();
  });
});
