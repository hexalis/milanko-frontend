import Form from "next/form";
import { getTranslator } from "@/modules/copy";
import type { Locale, Translator } from "@/shared/lib/i18n";
import { Icon } from "@/shared/ui/icon";
import { PageShell } from "@/shared/ui/page-shell";
import {
  ARCHIVE_PATH,
  archiveHref,
  clearFilters,
  collectionCounts,
  facetCounts,
  facetOptions,
  filterArchive,
  kindCounts,
  shelfGroups,
  suggestRelaxation,
  type ArchiveState,
  type ShelfGroup,
} from "../../domain/archive";
import type { CaseCatalog } from "../../domain/catalog";
import { CaseFolder } from "../case-folder";
import { ActiveFilters } from "./active-filters";
import { ArchiveEmpty } from "./archive-empty";
import { ArchiveToolbar } from "./archive-toolbar";
import { FacetFilters } from "./facet-filters";
import { KindTabs } from "./kind-tabs";

/*
 * The Case Files archive (POC app.js renderArchive). All of its state is in the URL: kind tabs,
 * shelves and chips are links; search, sort and facets are one GET form. Only the shelf view is
 * ported; the POC's table, board and timeline views and its catalog-audit tab come later.
 */

type ArchiveScreenProps = {
  state: ArchiveState;
  catalog: CaseCatalog;
  locale: Locale;
  /** The shell's search opened the archive (`?focus=1`): the search box takes the focus. */
  isSearchFocused?: boolean;
};

export function ArchiveScreen({ state, catalog, locale, isSearchFocused }: ArchiveScreenProps) {
  const translator = getTranslator(locale);
  const { t } = translator;
  const kinds = kindCounts(catalog);
  const hits = filterArchive(catalog, state);
  const resetHref = archiveHref(clearFilters(state));

  return (
    <PageShell kicker={t("nav.group.files")} title={t("arch.title")} lead={t("arch.lead2")}>
      <KindTabs state={state} counts={kinds} translator={translator} />
      <Form
        action={ARCHIVE_PATH}
        className="expanded:grid-cols-[250px_minmax(0,1fr)] grid grid-cols-1 items-start gap-6"
      >
        {state.kind === "all" ? null : <input type="hidden" name="kind" value={state.kind} />}
        {state.col ? <input type="hidden" name="col" value={state.col} /> : null}
        <div className="flex flex-col gap-3">
          <FacetFilters
            state={state}
            options={facetOptions(catalog)}
            counts={facetCounts(catalog, state)}
            collectionCounts={collectionCounts(catalog, state)}
            translator={translator}
          />
          <noscript>
            <button
              type="submit"
              className="text-label-m border-border-input bg-bg-surface rounded-field h-10 w-full border"
            >
              {t("f.apply")}
            </button>
          </noscript>
        </div>
        <section aria-labelledby="archive-results-title" className="flex min-w-0 flex-col gap-4">
          <h2 id="archive-results-title" className="sr-only">
            {t("arch.results")}
          </h2>
          <ArchiveToolbar state={state} translator={translator} isSearchFocused={isSearchFocused} />
          <ActiveFilters
            state={state}
            shown={hits.length}
            total={kinds[state.kind]}
            translator={translator}
          />
          {hits.length ? (
            <Shelf
              groups={shelfGroups(hits)}
              hasHeadings={state.kind === "all"}
              translator={translator}
              catalog={catalog}
            />
          ) : (
            <ArchiveEmpty
              suggestion={suggestRelaxation(catalog, state)}
              resetHref={resetHref}
              translator={translator}
            />
          )}
        </section>
      </Form>
    </PageShell>
  );
}

type ShelfProps = {
  groups: ShelfGroup[];
  /** Name each group when both kinds can show (POC: more than one group, or the "All" tab). */
  hasHeadings: boolean;
  translator: Translator;
  catalog: CaseCatalog;
};

function Shelf({ groups, hasHeadings, translator, catalog }: ShelfProps) {
  const { t } = translator;
  const isNamed = hasHeadings || groups.length > 1;
  return (
    <div className="flex flex-col gap-8">
      {groups.map((group) => (
        <section key={group.kind} aria-label={isNamed ? undefined : t(`arch.kind.${group.kind}`)}>
          {isNamed ? (
            <header className="mb-4">
              <h3 className="text-heading-h3 text-text-primary flex items-center gap-2">
                <span className="text-icon-secondary">
                  <Icon name={group.kind === "trend" ? "chart" : "warning"} />
                </span>
                {t(`arch.kind.${group.kind}`)}
                <span className="text-label-m text-text-tertiary tabular-nums">
                  {group.files.length}
                </span>
              </h3>
              <p className="text-body-s text-text-secondary mt-1">
                {t(`arch.kind.${group.kind}.d`)}
              </p>
            </header>
          ) : null}
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(290px,100%),1fr))] gap-x-5 gap-y-8">
            {group.files.map((file) => (
              <li key={file.id}>
                <CaseFolder
                  file={file}
                  translator={translator}
                  catalog={catalog}
                  headingLevel={isNamed ? "h4" : "h3"}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
