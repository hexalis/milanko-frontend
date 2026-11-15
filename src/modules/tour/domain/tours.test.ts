import { describe, expect, it } from "vitest";
import { getTranslator } from "@/modules/copy";
import { LOCALES } from "@/shared/lib/i18n";
import {
  presentSteps,
  TOURS,
  tourLabels,
  tourSelector,
  tourSteps,
  tourWaitStep,
  type TourId,
} from "./tours";

const IDS = Object.keys(TOURS) as TourId[];

describe("tourSteps", () => {
  it("numbers the copy keys from one, in the order of the targets", () => {
    const steps = tourSteps("ask", (key) => key);
    expect(steps.map((step) => step.target)).toEqual([...TOURS.ask]);
    expect(steps[0]).toEqual({ target: "ask-theme", title: "tour.ask.1.t", text: "tour.ask.1.d" });
  });

  it("keeps every tour short; the home also walks the shell", () => {
    for (const id of IDS) expect(TOURS[id].length).toBeLessThanOrEqual(id === "home" ? 11 : 6);
  });

  it.each(LOCALES)("has copy for every step and label in %s", (locale) => {
    const { t } = getTranslator(locale);
    const missing = (key: string) => (t(key) === key ? key : "");
    for (const id of IDS) {
      const keys = tourSteps(id, (key) => key).flatMap((step) => [step.title, step.text]);
      expect(keys.map(missing).filter(Boolean)).toEqual([]);
    }
    const labels = Object.values(tourLabels((key) => key));
    expect(labels.map(missing).filter(Boolean)).toEqual([]);
  });

  it.each(LOCALES)("never names a fixed number of lesson steps in %s", (locale) => {
    const { t } = getTranslator(locale);
    const texts = IDS.flatMap((id) => tourSteps(id, t).map((step) => step.text));
    expect(
      texts.filter((text) => /\b(ocho|eight|cinco|five|\d+) (pasos|steps)\b/i.test(text)),
    ).toEqual([]);
  });
});

describe("tourWaitStep", () => {
  it("lets the globe's tour say to come back while the globe loads", () => {
    for (const locale of LOCALES) {
      const { t } = getTranslator(locale);
      const step = tourWaitStep("explore", t);
      expect(step?.target).toBe("exp-globe");
      expect(step?.title).not.toBe("tour.explore.wait.t");
      expect(step?.text).not.toBe("tour.explore.wait.d");
    }
  });

  it("has no wait step for pages that are ready at once", () => {
    expect(tourWaitStep("home", (key) => key)).toBeUndefined();
  });
});

describe("tourLabels", () => {
  it("keeps driver.js's progress placeholders", () => {
    for (const locale of LOCALES) {
      const { progress } = tourLabels(getTranslator(locale).t);
      expect(progress).toContain("{{current}}");
      expect(progress).toContain("{{total}}");
    }
  });
});

describe("presentSteps", () => {
  it("drops the steps whose element is not on screen and keeps the order", () => {
    const steps = tourSteps("case", (key) => key);
    const onScreen = new Set(["cf-answer", "cf-sure", "cf-copy"]);
    const found = presentSteps(steps, (target) => (onScreen.has(target) ? target : undefined));
    expect(found.map(({ step }) => step.target)).toEqual(["cf-answer", "cf-sure", "cf-copy"]);
    expect(found.every(({ step, element }) => step.target === element)).toBe(true);
  });
});

describe("tourSelector", () => {
  it("matches the data-tour attribute", () => {
    expect(tourSelector("home-key")).toBe('[data-tour="home-key"]');
  });
});
