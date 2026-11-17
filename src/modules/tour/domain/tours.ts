/*
 * The optional guided tours: one per page, started only from its "How does this page work?" button.
 * A step points at an element marked `data-tour="<target>"`; its copy lives under
 * `tour.<page>.<n>.t` (title) and `tour.<page>.<n>.d` (text). Steps whose element is not on screen
 * (another layout, a section a case file lacks) are skipped when the tour starts.
 */

export const TOURS = {
  // The home also walks the shell. Wide screens: the rail (menu, case files, recent, search,
  // prefs). Phones: the tabbar and the top bar (prefs). Each layout skips the other's steps.
  home: [
    "home-hero",
    "home-door-ask",
    "home-doors",
    "home-key",
    "home-close",
    "shell-nav",
    "shell-tabbar",
    "shell-cases",
    "shell-recent",
    "shell-search",
    "shell-prefs",
  ],
  ask: ["ask-theme", "ask-verb", "ask-place", "ask-go", "ask-examples"],
  case: ["cf-answer", "cf-verdict", "cf-figure", "cf-sure", "cf-not", "cf-copy"],
  // The lesson at /ask/[qid]: one tour per screen. A quiz's result only exists once answered.
  "lesson-look": ["lesson-bar", "lesson-depth", "look-facts", "look-cell", "lesson-dock"],
  "lesson-guess": ["lesson-chart", "lesson-quiz", "guess-reveal", "lesson-dock"],
  "lesson-check": ["lesson-chart", "lesson-quiz", "check-readout", "lesson-dock"],
  "lesson-verdict": [
    "verdict-stamp",
    "verdict-answer",
    "verdict-howmuch",
    "verdict-cannot",
    "verdict-why",
  ],
  "lesson-done": ["done-card", "done-next", "done-deeper", "done-check"],
  cases: ["arch-search", "arch-topics", "arch-filters", "arch-card", "arch-audit"],
  // The globe runs in a sandboxed frame: it reports where its controls sit and the page lays empty
  // anchors over them (exp-search, exp-zoom…). The side panel joins once something is open.
  explore: ["exp-zoom", "exp-search", "exp-layers", "exp-drawer"],
  briefing: [
    "brief-ledger",
    "brief-steps",
    "brief-pairs",
    "brief-suspect",
    "brief-shelf",
    "brief-cta",
  ],
  method: [
    "method-toc",
    "method-process",
    "method-rare",
    "method-play",
    "method-sources",
    "method-limits",
  ],
  compare: ["cmp-sides", "cmp-verdict", "cmp-joined", "cmp-cannot", "cmp-nav"],
  // The region record (/regions): its own parts, the table being one fold away there.
  region: ["rx-filters", "rx-summary", "rx-figures", "rx-tabs"],
  // Rankings, events and coverage share their parts (filters, figures, table).
  data: ["data-filters", "data-stats", "data-table"],
} as const satisfies Record<string, readonly string[]>;

export type TourId = keyof typeof TOURS;

export type TourStep = { target: string; title: string; text: string };

export type TourLabels = {
  open: string;
  next: string;
  previous: string;
  done: string;
  close: string;
  /** Keeps driver.js's `{{current}}` and `{{total}}` placeholders. */
  progress: string;
};

type Translate = (key: string) => string;

/** The steps of a page's tour, with their copy. */
export function tourSteps(id: TourId, t: Translate): TourStep[] {
  return TOURS[id].map((target, index) => ({
    target,
    title: t(`tour.${id}.${index + 1}.t`),
    text: t(`tour.${id}.${index + 1}.d`),
  }));
}

/**
 * Where a tour waits while its page is not ready: the globe reports its controls only once it has
 * loaded, so until then its tour says to come back. Copy: tour.<page>.wait.t and .d.
 */
const WAIT_TARGETS: Partial<Record<TourId, string>> = { explore: "exp-globe" };

/** The single step shown when none of the tour's steps is on screen yet, if the page has one. */
export function tourWaitStep(id: TourId, t: Translate): TourStep | undefined {
  const target = WAIT_TARGETS[id];
  return target
    ? { target, title: t(`tour.${id}.wait.t`), text: t(`tour.${id}.wait.d`) }
    : undefined;
}

export function tourLabels(t: Translate): TourLabels {
  return {
    open: t("tour.open"),
    next: t("tour.next"),
    previous: t("tour.prev"),
    done: t("tour.done"),
    close: t("tour.close"),
    progress: t("tour.progress"),
  };
}

/** CSS selector of a step's element. */
export function tourSelector(target: string): string {
  return `[data-tour="${target}"]`;
}

/** Pairs each step with its element on screen, dropping the steps that have none. */
export function presentSteps<E>(
  steps: readonly TourStep[],
  find: (target: string) => E | undefined,
): { step: TourStep; element: E }[] {
  return steps.flatMap((step) => {
    const element = find(step.target);
    return element === undefined ? [] : [{ step, element }];
  });
}
