/*
 * The app shell's destinations (POC portal/index.html: side rail and phone tabbar). Labels are
 * copy keys; icons are sprite ids, with an `-on` twin for the active state when `hasActiveIcon`.
 */

export type SectionHref =
  | "/"
  | "/ask"
  | "/briefing"
  | "/cases"
  | "/explore"
  | "/method"
  | "/team"
  | "/regions"
  | "/rankings"
  | "/events"
  | "/coverage";

export type NavSection = {
  href: SectionHref;
  labelKey: string;
  icon: string;
  hasActiveIcon: boolean;
};

const section = (
  href: SectionHref,
  labelKey: string,
  icon: string,
  hasActiveIcon = true,
): NavSection => ({ href, labelKey, icon, hasActiveIcon });

export const ASK = section("/ask", "nav.ask", "ask");

/** Before the separator: where an investigation starts. Case files is drawn apart (progress, kinds). */
export const RAIL_START: readonly NavSection[] = [
  section("/", "nav.home", "home"),
  section("/briefing", "nav.briefing", "briefing"),
];
export const CASES = section("/cases", "nav.cases.all", "cases");
export const EXPLORE = section("/explore", "nav.explore", "explore");

/** After the separator: how the project works and who made it. */
export const RAIL_LEARN: readonly NavSection[] = [
  section("/method", "nav.method", "method"),
  section("/team", "nav.team", "team"),
];

/** The persisted-data pages (live API), grouped under "Open data". */
export const RAIL_DATA: readonly NavSection[] = [
  section("/regions", "nav.regions", "place", false),
  section("/rankings", "nav.rankings", "graph", false),
  section("/events", "nav.events-db", "calendar", false),
  section("/coverage", "nav.coverage", "table", false),
];

/** Phone tabbar: five destinations with short labels (POC `.tabbar`). */
export const TABBAR: readonly NavSection[] = [
  section("/", "nav.home", "home"),
  section("/ask", "nav.ask.short", "ask"),
  section("/cases", "nav.cases", "cases"),
  EXPLORE,
  section("/method", "nav.method", "method"),
];

const ALL_HREFS: readonly SectionHref[] = [
  ASK,
  ...RAIL_START,
  CASES,
  EXPLORE,
  ...RAIL_LEARN,
  ...RAIL_DATA,
].map((entry) => entry.href);

/**
 * The section a pathname belongs to: an exact match or a page under it (`/cases/<id>` is Case
 * files). Home only matches `/` itself; an unknown path has no section.
 */
export function activeSection(pathname: string): SectionHref | null {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (path === "/") return "/";
  return (
    ALL_HREFS.find((href) => href !== "/" && (path === href || path.startsWith(`${href}/`))) ?? null
  );
}
