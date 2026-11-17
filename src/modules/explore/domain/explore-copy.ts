import { interpolate, type MessageVars, type Translator } from "@/shared/lib/i18n";
import { SECTOR_IDS } from "./sectors";
import { CONSTELLATION_IDS, MOON_PHASE_KEYS } from "./sky";

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
  "exp.sat.kind",
  "exp.sat.lead",
  "exp.sat.since",
  "exp.sat.height",
  "exp.sat.lap",
  "exp.sat.sees",
  "exp.sat.sees.v",
  "exp.sat.uses",
  "exp.sat.use.ndvi",
  "exp.sat.use.data",
  "exp.sat.use.img",
  "exp.sat.note",
  "exp.sat.see",
  "exp.sat.link",
  "exp.sat.img",
  "exp.sat.credit",
  "exp.sat.ride",
  "exp.reg.kind",
  "exp.reg.title",
  "exp.reg.lead",
  "exp.reg.lead.month",
  "exp.reg.hint",
  "exp.reg.above",
  "exp.reg.below",
  "exp.reg.equal",
  "exp.reg.none",
  "exp.reg.normal",
  "exp.reg.diff",
  "exp.reg.rarity",
  "exp.reg.r.normal",
  "exp.reg.r.uncommon",
  "exp.reg.r.rare",
  "exp.reg.r.exceptional",
  "exp.reg.source",
  "exp.reg.about",
  "exp.reg.open",
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

/** The sky panel's copy: the Moon, its phases, Apollo 11, and each constellation's card. */
const SKY_KEYS = [
  ...[
    "kind",
    "title",
    "lead",
    "today",
    "phase",
    "distance",
    "distance.v",
    "size",
    "size.v",
    "turn",
    "turn.v",
    "f1",
    "f2",
    "f3",
    "note",
    "link",
  ].map((key) => `exp.sky.moon.${key}`),
  ...MOON_PHASE_KEYS.map((key) => `exp.sky.phase.${key}`),
  ...["title", "found", "f1", "f2", "f3", "link"].map((key) => `exp.sky.apollo.${key}`),
  ...["kind", "star", "seen", "figure", "note"].map((key) => `exp.sky.c.${key}`),
  ...CONSTELLATION_IDS.flatMap((id) =>
    ["name", "lead", "f1", "f2", "f3", "star", "seen"].map((key) => `exp.sky.c.${id}.${key}`),
  ),
];

const EXPLORE_KEYS: readonly string[] = [
  ...DRAWER_KEYS,
  ...SKY_KEYS,
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
