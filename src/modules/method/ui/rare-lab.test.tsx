import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getTranslator } from "@/modules/copy";
import { pickLabCopy, RARE_LAB_KEYS } from "./lab-copy";
import { RareLab } from "./rare-lab";

describe("RareLab", () => {
  it("states the false-alarm rate with its figure in bold", () => {
    const { container } = render(
      <RareLab copy={pickLabCopy(getTranslator("en"), RARE_LAB_KEYS)} />,
    );
    // 3 variables, 45 years, anomalous bar: 1 − 0.95³ ≈ 14 %.
    const strong = screen.getByText("14 of 100");
    expect(strong.tagName).toBe("STRONG");
    expect(strong.closest("p")).toHaveTextContent("at least one of 3 variables");
    expect(container.querySelectorAll("i.bg-action-primary")).toHaveLength(14);
  });

  it("follows the bar and the number of variables", () => {
    render(<RareLab copy={pickLabCopy(getTranslator("es"), RARE_LAB_KEYS)} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "moderate" } });
    fireEvent.change(screen.getByRole("slider", { name: "Variables revisadas" }), {
      target: { value: "1" },
    });
    expect(screen.getByText("20 de cada 100")).toBeVisible();
  });
});
