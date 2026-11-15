import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getTranslator } from "@/modules/copy";
import { getCaseCatalog } from "../../domain/catalog";
import { getEventAudit } from "../../domain/event-audit";
import { findReading } from "../../domain/reading";
import { CaseFileView } from "./case-file-view";

const translator = getTranslator("en");
const context = { translator, catalog: getCaseCatalog(), audit: getEventAudit() };

function renderFile(id: string) {
  const reading = findReading(id, context);
  if (!reading) throw new Error(`missing ${id}`);
  return render(<CaseFileView reading={reading} translator={translator} />);
}

const SECTION_TITLES = [
  "The answer",
  "What the data show",
  "How sure are we?",
  "What this does not say",
  "Where the data come from",
  "Use it",
];

describe("CaseFileView", () => {
  it.each(["svalbard-warming", "eonet-24723", "audit-wildfires"])(
    "draws %s as one h1 and the same sections",
    (id) => {
      renderFile(id);
      expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
      for (const title of SECTION_TITLES) {
        expect(screen.getByRole("heading", { level: 2, name: title })).toBeInTheDocument();
      }
      expect(screen.getByRole("link", { name: /Download data/ })).toHaveAttribute(
        "href",
        `/cases/${id}/data`,
      );
    },
  );

  it("gives each chart an accessible name", () => {
    renderFile("audit-wildfires");
    expect(screen.getByTitle(/Wildfires/)).toBeInTheDocument();
  });

  it("links an anomaly file to its category's audit file", () => {
    renderFile("eonet-24723");
    expect(screen.getByRole("heading", { level: 2, name: /more events like this/ })).toBeVisible();
    expect(screen.getByRole("link", { name: /floods/i })).toHaveAttribute(
      "href",
      "/cases/audit-floods",
    );
  });
});
