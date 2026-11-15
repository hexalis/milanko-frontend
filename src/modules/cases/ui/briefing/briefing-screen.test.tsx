import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getTranslator } from "@/modules/copy";
import { briefingLedger, featuredCase } from "../../domain/briefing";
import { getCaseCatalog } from "../../domain/catalog";
import { getEventAudit } from "../../domain/event-audit";
import { BriefingScreen } from "./briefing-screen";

const catalog = getCaseCatalog();
const audit = getEventAudit();

function renderBriefing(locale: "en" | "es" = "en") {
  return render(
    <BriefingScreen translator={getTranslator(locale)} catalog={catalog} audit={audit} />,
  );
}

describe("BriefingScreen", () => {
  it("opens with the slogan and a ledger counted from the data", () => {
    renderBriefing();
    const ledger = briefingLedger(catalog, audit);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Not every change is a trend.",
    );
    const trends = screen.getByRole("link", { name: /long-term trends confirmed/ });
    expect(trends).toHaveAttribute("href", "/cases?kind=trend");
    expect(trends).toHaveTextContent(`${ledger.trends.hits} of ${ledger.trends.total}`);
    expect(screen.getByRole("link", { name: /events after anomalous weeks/ })).toHaveTextContent(
      `${ledger.events.hits} of ${ledger.events.total}`,
    );
    expect(
      screen.getByRole("link", { name: /EONET categories with a real trend/ }),
    ).toHaveAttribute("href", "#suspect-title");
  });

  it("lists the three usage steps", () => {
    renderBriefing();
    const steps = within(screen.getByRole("region", { name: "How to use this portal" }));
    expect(steps.getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual([
      "/cases",
      "/regions",
      "/method",
    ]);
  });

  it("shows each opposite-trend pair with both sides linked", () => {
    renderBriefing();
    const pairs = within(
      screen.getByRole("region", { name: "Same variable, opposite directions" }),
    );
    expect(pairs.getAllByRole("article")).toHaveLength(2);
    const hrefs = pairs.getAllByRole("link").map((link) => link.getAttribute("href"));
    expect(hrefs).toEqual([
      "/cases/chile-drying",
      "/cases/sahel-wetting",
      "/cases/amazon-browning",
      "/cases/tundra-greening",
    ]);
  });

  it("names the false suspect with its growth factor and draws its audit chart", () => {
    renderBriefing();
    const suspect = within(screen.getByRole("region", { name: /grew 12-fold/ }));
    expect(suspect.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Wildfires in EONET grew 12-fold. The planet did not.",
    );
    expect(suspect.getByText(/none of the 13 EONET categories/)).toBeVisible();
    expect(suspect.getByTitle(/Wildfires: events per year from 2000/)).toBeInTheDocument();
    expect(
      suspect.getByText("No stretch of years without catalog changes is long enough to test."),
    ).toBeVisible();
    expect(suspect.getByText("coverage starts")).toBeVisible();
  });

  it("shelves three trend folders and three anomaly folders", () => {
    renderBriefing();
    const latest = within(screen.getByRole("region", { name: "Long-term trends" }));
    expect(latest.getAllByRole("article")).toHaveLength(3);
    expect(latest.getByRole("link", { name: /Trend files \(6\)/ })).toHaveAttribute(
      "href",
      "/cases?kind=trend",
    );
    const anomalies = within(screen.getByRole("region", { name: "Recent anomalies" }));
    expect(anomalies.getAllByRole("article")).toHaveLength(3);
    expect(anomalies.getByText(/whose 90 days before/)).toBeVisible();
  });

  it("features the confirmed trend with the most signal and closes on Case Files", () => {
    renderBriefing();
    const featured = featuredCase(catalog.trends);
    if (!featured) throw new Error("no confirmed trend");
    expect(screen.getByRole("link", { name: /Open case file/ })).toHaveAttribute(
      "href",
      `/cases/${featured.id}`,
    );
    const cta = within(screen.getByRole("region", { name: "Every case file, with its verdict" }));
    expect(cta.getByRole("link")).toHaveAttribute("href", "/cases");
  });

  it("reads in Spanish", () => {
    renderBriefing("es");
    expect(screen.getByRole("heading", { level: 1 })).not.toHaveTextContent("Not every change");
    expect(screen.getByRole("link", { name: /Ver expediente/ })).toBeVisible();
  });
});
