import type { Locale } from "@/shared/lib/i18n";

/*
 * EONET titles come in English ("Wildfire in Spain", "Etna Volcano, Italy", "Tropical Storm Alpha").
 * In Spanish the common patterns are rebuilt and country names come from Intl (POC app.js evTitle).
 */

const COUNTRY_ALIASES: Record<string, string> = {
  "The Democratic Republic of Congo": "CD",
  "Democratic Republic of the Congo": "CD",
  "DR Congo": "CD",
  "Republic of the Congo": "CG",
  Türkiye: "TR",
  Turkey: "TR",
  Laos: "LA",
  Russia: "RU",
  "United States": "US",
  USA: "US",
  Iran: "IR",
  Syria: "SY",
  "South Korea": "KR",
  "North Korea": "KP",
  Vietnam: "VN",
  Bolivia: "BO",
  Venezuela: "VE",
  Tanzania: "TZ",
  "Czech Republic": "CZ",
  "Ivory Coast": "CI",
  "Côte d'Ivoire": "CI",
  Myanmar: "MM",
  Burma: "MM",
  Moldova: "MD",
  Micronesia: "FM",
};

const EVENT_KIND_ES: Record<string, string> = {
  Wildfire: "Incendio",
  Flood: "Inundación",
  Drought: "Sequía",
  "Dust Storm": "Tormenta de polvo",
  Landslide: "Deslizamiento",
  Earthquake: "Terremoto",
};

const STORM_ES: Record<string, string> = {
  "Super Typhoon": "Supertifón",
  Typhoon: "Tifón",
  "Tropical Cyclone": "Ciclón tropical",
  "Tropical Storm": "Tormenta tropical",
  "Tropical Depression": "Depresión tropical",
  "Subtropical Storm": "Tormenta subtropical",
  Hurricane: "Huracán",
  Cyclone: "Ciclón",
};

let countryCodes: Map<string, string> | undefined;

function buildCountryCodes(): Map<string, string> {
  const codes = new Map(Object.entries(COUNTRY_ALIASES));
  const english = new Intl.DisplayNames(["en"], { type: "region" });
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (const first of letters) {
    for (const second of letters) {
      const code = first + second;
      try {
        const name = english.of(code);
        if (name && name !== code && !codes.has(name)) codes.set(name, code);
      } catch {
        // Not a region code.
      }
    }
  }
  return codes;
}

function countryInSpanish(name: string): string {
  countryCodes ??= buildCountryCodes();
  const code = countryCodes.get(name.trim());
  if (!code) return name;
  return new Intl.DisplayNames(["es"], { type: "region" }).of(code) ?? name;
}

const PATTERNS: ReadonlyArray<[RegExp, (match: RegExpMatchArray) => string]> = [
  [
    /^(Wildfire|Flood|Drought|Dust Storm|Landslide|Earthquake) in (.+)$/,
    (m) => `${EVENT_KIND_ES[m[1] ?? ""] ?? m[1]} en ${countryInSpanish(m[2] ?? "")}`,
  ],
  [/^(.+) Volcano, (.+)$/, (m) => `Volcán ${m[1]}, ${countryInSpanish(m[2] ?? "")}`],
  [/^(.+) Volcano$/, (m) => `Volcán ${m[1]}`],
  [
    /^(Super Typhoon|Typhoon|Tropical Cyclone|Tropical Storm|Tropical Depression|Subtropical Storm|Hurricane|Cyclone) (.+)$/,
    (m) => `${STORM_ES[m[1] ?? ""] ?? m[1]} ${m[2]}`,
  ],
  [/^(.+) Wildfire, (.+)$/, (m) => `Incendio ${m[1]}, ${m[2]}`],
  [/^(.+) Floods?$/, (m) => `Inundaciones en ${countryInSpanish(m[1] ?? "")}`],
];

export function eventTitle(title: string, locale: Locale): string {
  if (locale !== "es") return title;
  for (const [pattern, rebuild] of PATTERNS) {
    const match = title.match(pattern);
    if (match) return rebuild(match);
  }
  return title;
}
