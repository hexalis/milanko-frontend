import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getTranslator } from "@/modules/copy";
import { NOISE_LAB_KEYS, pickLabCopy } from "./lab-copy";
import { NoiseLab } from "./noise-lab";

const copy = pickLabCopy(getTranslator("en"), NOISE_LAB_KEYS);

function chartPath(container: HTMLElement) {
  return container.querySelector("svg path[fill='none']")?.getAttribute("d");
}

describe("NoiseLab", () => {
  it("draws the same first planet every time and reads it", () => {
    const first = render(<NoiseLab copy={copy} lastYear={2025} />);
    const path = chartPath(first.container);
    expect(screen.getByRole("slider", { name: "Real trend" })).toHaveValue("0.3");
    expect(screen.getByText("+0.30 / 10 yr")).toBeVisible();
    expect(screen.getByText(/^p [=<] .* · Sen /)).toBeVisible();
    expect(screen.getByText(/would appear by chance/)).toBeVisible();
    first.unmount();

    const second = render(<NoiseLab copy={copy} lastYear={2025} />);
    expect(chartPath(second.container)).toBe(path);
  });

  it("confirms a strong trend once the noise is turned down", () => {
    render(<NoiseLab copy={copy} lastYear={2025} />);
    fireEvent.change(screen.getByRole("slider", { name: "Real trend" }), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByRole("slider", { name: "Year-to-year noise" }), {
      target: { value: "0.1" },
    });
    fireEvent.change(screen.getByRole("slider", { name: "Years of data" }), {
      target: { value: "45" },
    });
    expect(screen.getByText("Confirmed")).toBeVisible();
    expect(screen.getByText("± 0.10")).toBeVisible();
    // 45 years end at the last year of the data.
    expect(screen.getByText("2025")).toBeInTheDocument();
  });

  it("calls a flat planet inconclusive", () => {
    render(<NoiseLab copy={copy} lastYear={2025} />);
    fireEvent.change(screen.getByRole("slider", { name: "Real trend" }), {
      target: { value: "0" },
    });
    fireEvent.change(screen.getByRole("slider", { name: "Year-to-year noise" }), {
      target: { value: "2" },
    });
    expect(screen.getByText("Inconclusive")).toBeVisible();
  });

  it("draws new random years on shuffle", () => {
    const { container } = render(<NoiseLab copy={copy} lastYear={2025} />);
    const before = chartPath(container);
    fireEvent.click(screen.getByRole("button", { name: "New random years" }));
    expect(chartPath(container)).not.toBe(before);
  });
});
