import type { Translator } from "@/shared/lib/i18n";
import { AutoSubmitSelect } from "@/shared/ui/auto-submit-select";
import { ArchiveSearchInput } from "./archive-search-input";
import { Icon } from "@/shared/ui/icon";
import { ARCHIVE_SORTS, type ArchiveState } from "../../domain/archive";

/*
 * Search and sort (POC renderArchive toolbar). Both belong to the archive's GET form: Enter or the
 * search button submits the words, the sort applies on change. The view switch (table, board,
 * timeline) and "Surprise me" are not ported in this phase: the archive shows the shelf only.
 */

const SEARCH_INPUT =
  "h-touch-min medium:h-10 w-full min-w-0 rounded-field border border-border-input bg-bg-surface ps-10 pe-3 text-body-m text-text-primary shadow-control transition-colors duration-fast hover:border-border-strong focus-visible:focus-ring focus-visible:outline-focus-ring placeholder:text-text-tertiary [&::-webkit-search-cancel-button]:appearance-none";

const ICON_BUTTON =
  "h-touch-min medium:h-10 inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-field border border-border-input bg-bg-surface px-3 text-label-m text-text-primary shadow-control hover:bg-bg-hover active:bg-bg-pressed focus-visible:focus-ring focus-visible:outline-focus-ring";

type ArchiveToolbarProps = { state: ArchiveState; translator: Translator };

export function ArchiveToolbar({ state, translator }: ArchiveToolbarProps) {
  const { t } = translator;
  return (
    <div className="medium:flex-row medium:items-center flex flex-col gap-3">
      <search className="flex min-w-0 flex-1 gap-2">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">{t("arch.search.label")}</span>
          <span className="text-icon-secondary pointer-events-none absolute inset-y-0 start-3 flex items-center">
            <Icon name="search" />
          </span>
          <ArchiveSearchInput
            name="q"
            urlValue={state.q}
            placeholder={t("arch.search")}
            autoComplete="off"
            maxLength={120}
            className={SEARCH_INPUT}
          />
        </label>
        <button type="submit" className={ICON_BUTTON} aria-label={t("arch.search.label")}>
          <Icon name="arrow-right" />
        </button>
      </search>
      <label className="text-label-m text-text-secondary medium:w-56 flex items-center gap-2">
        <span className="shrink-0">{t("arch.sort")}</span>
        <AutoSubmitSelect name="sort" urlValue={state.sort}>
          {ARCHIVE_SORTS.map((sort) => (
            <option key={sort} value={sort}>
              {t(`arch.sort.${sort}`)}
            </option>
          ))}
        </AutoSubmitSelect>
      </label>
    </div>
  );
}
