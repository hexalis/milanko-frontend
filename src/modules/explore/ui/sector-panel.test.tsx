import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getCaseCatalog, getCaseSummaries } from "@/modules/cases";
import { getTranslator } from "@/modules/copy";
import { exploreTranslator, pickExploreMessages } from "../domain/explore-copy";
import { SectorPanel } from "./sector-panel";

const translator = getTranslator("en");
const files = getCaseSummaries(getCaseCatalog(), translator);
const t = exploreTranslator(pickExploreMessages(translator));

describe("SectorPanel", () => {
  it("lists the sector's files linking to their dossiers, and the archive filtered to it", () => {
    const onCase = vi.fn<(id: string) => void>();
    render(
      <SectorPanel
        id="arctic"
        files={files}
        windowDays={90}
        t={t}
        titleRef={{ current: null }}
        onCase={onCase}
      />,
    );

    expect(screen.getByRole("heading", { level: 2, name: "Arctic" })).toBeVisible();
    const arctic = files.filter((file) => file.region === "arctic");
    const dossiers = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"))
      .filter((href) => href?.startsWith("/cases/"));
    expect(dossiers.toSorted()).toEqual(arctic.map((file) => `/cases/${file.id}`).toSorted());
    expect(screen.getByRole("link", { name: /Open in Case Files/ })).toHaveAttribute(
      "href",
      "/cases?region=arctic",
    );

    const first = screen.getAllByRole("button", { name: /^See on the globe/ })[0];
    if (!first) throw new Error("no globe buttons");
    fireEvent.click(first);
    expect(onCase).toHaveBeenCalledTimes(1);
  });

  it("says when a sector has no case files", () => {
    const empty = files.filter((file) => file.region !== "asia");
    const { container } = render(
      <SectorPanel
        id="asia"
        files={empty}
        windowDays={90}
        t={t}
        titleRef={{ current: null }}
        onCase={() => {}}
      />,
    );
    expect(container.querySelector("dd")).toHaveTextContent("0");
    expect(screen.getByText(/No case files in this sector yet/)).toBeVisible();
  });
});
