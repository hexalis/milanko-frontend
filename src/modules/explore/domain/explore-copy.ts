import { interpolate, type MessageVars, type Translator } from "@/shared/lib/i18n";
import { SECTOR_IDS } from "./sectors";

/*
 * The explorer's drawer is a client component. Rather than ship both message files to the browser,
 * the server resolves the few templates the drawer uses in the reader's language and passes them
 * down; the client only fills in the {placeholders}.
 */

const EVENT_CATEGORIES = [
  "drought",
  "dustHaze",
  "earthquakes",
  "floods",
  "landslides",
  "manmade",
  "seaLakeIce",
  "severeStorms",
  "snow",
  "tempExtremes",
  "volcanoes",
  "waterColor",
  "wildfires",
] as const;

const DRAWER_KEYS = [
  "arch.kind.trend",
  "case.globe",
  "drawer.close",
  "drawer.view",
  "event.date",
  "event.eonet",
  "event.kind",
  "event.magnitude",
  "event.point",
  "event.record",
  "event.source",
  "exp.event.missing",
  "exp.events.loading",
  "exp.k.anom",
  "exp.k.files",
  "exp.k.unusual",
  "exp.lat",
  "exp.lon",
  "exp.point",
  "exp.point.regions",
  "exp.sec.anom",
  "exp.sec.anom.d",
  "exp.sector.archive",
  "exp.sector.files",
  "exp.sector.none",
  "exp.sector.one",
  "exp.sectors",
  "exp.yours",
  "link.newTab",
  "pt.tile",
  "pt.tile.d",
  "pt.tile.none",
  "reg.ocean",
  "w3.period.all",
  "w3.period.live",
  "w3.period.year",
  "w3.tile.latest",
] as const;

const EXPLORE_KEYS: readonly string[] = [
  ...DRAWER_KEYS,
  ...SECTOR_IDS.map((id) => `reg.${id}`),
  ...EVENT_CATEGORIES.map((id) => `cat.${id}`),
];

export type ExploreMessages = Readonly<Record<string, string>>;

/** The drawer's templates in the translator's language. */
export function pickExploreMessages({ t }: Translator): ExploreMessages {
  return Object.fromEntries(EXPLORE_KEYS.map((key) => [key, t(key)]));
}

export type ExploreT = (key: string, vars?: MessageVars) => string;

/** Looks a key up in the picked templates; an unknown key comes back as written, like the POC. */
export function exploreTranslator(messages: ExploreMessages): ExploreT {
  return (key, vars) => interpolate(messages[key] ?? key, vars);
}

/** An EONET category's name, or its id when the portal has no name for it. */
export function categoryName(t: ExploreT, category: string): string {
  const key = `cat.${category}`;
  const name = t(key);
  return name === key ? category : name;
}
