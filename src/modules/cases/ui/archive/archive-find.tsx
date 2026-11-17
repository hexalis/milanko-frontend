import type { Translator } from "@/shared/lib/i18n";
import { Icon } from "@/shared/ui/icon";
import { ARCHIVE_SEARCH_ID, type ArchiveState } from "../../domain/archive";
import { ArchiveSearchInput } from "./archive-search-input";

/*
 * The one search box (POC arch-find): words filter the files; when they match none, the archive
 * reads them as a place and orders the files around it. It belongs to the archive's GET form.
 */

const SEARCH_INPUT =
  "h-13 w-full min-w-0 rounded-field border border-border-input bg-bg-surface ps-11 pe-3 text-[17px] text-text-primary shadow-control transition-colors duration-fast hover:border-border-strong focus-visible:focus-ring focus-visible:outline-focus-ring placeholder:text-text-tertiary [&::-webkit-search-cancel-button]:appearance-none";

/* On phones the button is a square beside the box (its word for screen readers only). */
const SUBMIT =
  "h-13 inline-flex min-w-13 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-field bg-action-primary medium:px-5 text-label-m text-text-on-primary shadow-control hover:bg-action-primary-hover active:bg-action-primary-pressed focus-visible:focus-ring focus-visible:outline-focus-ring";

type ArchiveFindProps = {
  state: ArchiveState;
  translator: Translator;
  /** Focus the search box on arrival (`?focus=1`, from the shell's search). */
  isSearchFocused?: boolean;
};

export function ArchiveFind({ state, translator, isSearchFocused }: ArchiveFindProps) {
  const { t } = translator;
  return (
    <search data-tour="arch-search" className="flex gap-2.5">
      <label className="relative min-w-0 flex-1">
        <span className="sr-only">{t("arch.search.label")}</span>
        <span className="text-icon-secondary pointer-events-none absolute inset-y-0 start-3.5 flex items-center">
          <Icon name="search" />
        </span>
        <ArchiveSearchInput
          id={ARCHIVE_SEARCH_ID}
          shouldFocus={isSearchFocused}
          name="q"
          urlValue={state.q}
          placeholder={t("arch.find.ph")}
          autoComplete="off"
          maxLength={120}
          className={SEARCH_INPUT}
        />
      </label>
      <button type="submit" className={SUBMIT}>
        <Icon name="map-pin" />
        <span className="max-medium:sr-only">{t("arch.find.btn")}</span>
      </button>
    </search>
  );
}
