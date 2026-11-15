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
    expect(within(lead).getByRole("heading", { level: 3 })).toHaveTextContent("Jorge Ramos");
    expect(within(lead).getByText("Diseñador de producto")).toBeVisible();
    expect(within(lead).getByText(/Diseñó y construyó/)).toBeVisible();
    const linkedin = within(lead).getByRole("link", { name: /Jorge Ramos/ });
    expect(linkedin).toHaveAttribute("href", "https://www.linkedin.com/");
    expect(linkedin).toHaveAttribute("target", "_blank");
    expect(linkedin).toHaveAttribute("rel", "noopener noreferrer");
    expect(linkedin).toHaveTextContent("LinkedIn");
    expect(within(lead).getByText("JR")).toBeInTheDocument();

    expect(within(mate).getByText("Integrante 2")).toBeVisible();
    expect(within(mate).getByText("Rol por confirmar")).toBeVisible();
  });
});
