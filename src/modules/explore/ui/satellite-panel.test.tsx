import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getTranslator } from "@/modules/copy";
import { exploreTranslator, pickExploreMessages } from "../domain/explore-copy";
import { SatellitePanel } from "./satellite-panel";

const t = exploreTranslator(pickExploreMessages(getTranslator("es")));

describe("SatellitePanel", () => {
  it("says what Terra does for the portal and shows its greenness on the globe", () => {
    const onShowGreenness = vi.fn<() => void>();
    render(<SatellitePanel t={t} titleRef={{ current: null }} onShowGreenness={onShowGreenness} />);

    expect(screen.getByRole("heading", { level: 2, name: "Terra" })).toBeVisible();
    expect(screen.getByText("Satélite de la NASA")).toBeVisible();
    expect(
      screen.getByRole("img", { name: /Ilustración de la NASA del satélite Terra/ }),
    ).toBeVisible();
    expect(screen.getByText("Imágenes: NASA")).toBeVisible();
    expect(screen.getByText(/La cámara viaja con Terra/)).toBeVisible();
    expect(
      screen.getByRole("heading", { level: 3, name: "Lo que Milanko usa de Terra" }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: /Conocer Terra en la NASA/ })).toHaveAttribute(
      "href",
      "https://terra.nasa.gov/",
    );

    fireEvent.click(screen.getByRole("button", { name: /Ver el verdor en el globo/ }));
    expect(onShowGreenness).toHaveBeenCalledOnce();
  });
});
