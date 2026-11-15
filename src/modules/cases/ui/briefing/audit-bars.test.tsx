import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuditBars } from "./audit-bars";

const YEARS: [number, number][] = [
  [2020, 10],
  [2021, 12],
  [2022, 40],
  [2023, 45],
  [2024, 20],
];

describe("AuditBars", () => {
  it("draws one bar per year, fading the running year, with the breaks and the tested span", () => {
    const { container } = render(
      <AuditBars
        years={YEARS}
        span={[2020, 2021]}
        breaks={[2022]}
        partialFrom={2024}
        label="Wildfires: events per year from 2020 to 2024"
        spanLabel="Tested span"
        locale="en"
      />,
    );

    const chart = container.querySelector("svg");
    expect(chart?.querySelector("title")).toHaveTextContent(
      "Wildfires: events per year from 2020 to 2024",
    );
    expect(chart).toHaveAttribute("aria-labelledby", chart?.querySelector("title")?.id);
    expect(container.querySelectorAll('[data-part="bar"]')).toHaveLength(4);
    expect(container.querySelectorAll('[data-part="partial-bar"]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-part="break"]')).toHaveLength(1);
    expect(container.querySelector('[data-part="span"]')).toHaveTextContent("Tested span");
  });

  it("leaves out the span band without a tested span, and ignores breaks outside the years", () => {
    const { container } = render(
      <AuditBars
        years={YEARS}
        span={null}
        breaks={[1999]}
        partialFrom={2030}
        label="Floods"
        spanLabel="Tested span"
        locale="en"
      />,
    );

    expect(container.querySelector('[data-part="span"]')).toBeNull();
    expect(container.querySelectorAll('[data-part="break"]')).toHaveLength(0);
    expect(container.querySelectorAll('[data-part="partial-bar"]')).toHaveLength(0);
  });

  it("renders nothing without years", () => {
    const { container } = render(
      <AuditBars
        years={[]}
        span={null}
        breaks={[]}
        partialFrom={2026}
        label="Empty"
        spanLabel="Tested span"
        locale="en"
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
