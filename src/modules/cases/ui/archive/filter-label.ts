import type { Translator } from "@/shared/lib/i18n";
import type { ActiveFilter, FacetKey } from "../../domain/archive";
import { themeLabel } from "../../domain/file-text";

/* Wording of the archive's removable chips (POC renderArchive activeFilters). */

function facetOptionLabel(key: FacetKey, value: string, translator: Translator): string {
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

/** A chip's text: the search keeps its quotes, the place reads "Near …", the rest as its option. */
export function activeFilterLabel(filter: ActiveFilter, translator: Translator): string {
  switch (filter.type) {
    case "kind":
      return translator.t("arch.kind.trend");
    case "col":
      return translator.t(`col.${filter.value}`);
    case "near":
      return translator.t("near.chip", { name: filter.value.split(",")[0]?.trim() ?? "" });
    case "q":
      return `“${filter.value}”`;
    case "facet":
      return facetOptionLabel(filter.key, filter.value, translator);
  }
}
