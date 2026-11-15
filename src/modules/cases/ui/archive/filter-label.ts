import type { Translator } from "@/shared/lib/i18n";
import type { ActiveFilter, FacetKey } from "../../domain/archive";
import { eventFamily } from "../../domain/case-file";
import { themeLabel } from "../../domain/file-text";

/* Wording and icons of the archive filters (POC renderArchive FACETS). */

export const FACET_TITLE_KEYS: Record<FacetKey, string> = {
  region: "f.where",
  theme: "f.what",
  ev: "f.how",
  dir: "f.dir",
  src: "f.who",
};

const SOURCE_ICONS: Record<string, string> = { power: "chart", modis: "satellite", eonet: "audit" };

export function facetOptionLabel(key: FacetKey, value: string, translator: Translator): string {
  switch (key) {
    case "region":
      return translator.t(`reg.${value}`);
    case "theme":
      return themeLabel(value, { translator });
    case "ev":
      return translator.t(`strength.${value}`);
    case "dir":
      return translator.t(`dir.${value}.short`);
    case "src":
      return translator.t(`src.${value}`);
  }
}

/** Sprite icon beside an option, if that facet has one. */
export function facetOptionIcon(
  key: FacetKey,
  value: string,
  translator: Translator,
): string | undefined {
  switch (key) {
    case "theme":
      return translator.has(`theme.${value}`) ? value : `ev-${eventFamily(value)}`;
    case "dir":
      return value;
    case "src":
      return SOURCE_ICONS[value];
    default:
      return undefined;
  }
}

/** A chip's text: the search keeps its quotes, everything else reads as its option. */
export function activeFilterLabel(filter: ActiveFilter, translator: Translator): string {
  switch (filter.type) {
    case "col":
      return translator.t(`col.${filter.value}`);
    case "q":
      return `“${filter.value}”`;
    case "facet":
      return facetOptionLabel(filter.key, filter.value, translator);
  }
}
