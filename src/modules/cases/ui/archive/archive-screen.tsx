import Form from "next/form";
import Link from "next/link";
import type { ReactNode } from "react";
import { getTranslator } from "@/modules/copy";
import type { Locale, Translator } from "@/shared/lib/i18n";
import { AutoSubmitSelect } from "@/shared/ui/auto-submit-select";
import { Icon } from "@/shared/ui/icon";
import { PageShell } from "@/shared/ui/page-shell";
import {
  ARCHIVE_PATH,
  ARCHIVE_SORTS,
  archiveHref,
  clearFilters,
  FACET_KEYS,
  type ArchiveState,
} from "../../domain/archive";
import {
  filterArchive,
  nearSummary,
  resolveNearSearch,
  shelfGroups,
  suggestRelaxation,
  topicCounts,
  topicPool,
  type NearSearch,
} from "../../domain/archive-results";
import type { CaseFile } from "../../domain/case-file";
import type { CaseCatalog } from "../../domain/catalog";
import type { EventAudit } from "../../domain/event-audit";
import { AUDIT_ARCHIVE_HREF } from "../../domain/reading-audit";
import { kmToFile, nearParam, roundKm, type NearPlace } from "../../domain/near";
import { CaseFolder } from "../case-folder";
import { ActiveFilters } from "./active-filters";
import { ArchiveEmpty } from "./archive-empty";
import { ArchiveFind } from "./archive-find";
import { ArchiveTopics } from "./archive-topics";
import { AuditIndex } from "./audit-index";
import { NearMessage } from "./near-message";

/*
 * The Case Files archive (POC app.js renderArchive, d2de23a). All of its state is in the URL:
 * topics and chips are links; the search box and the sort are one GET form that carries the rest
 * of the state as hidden fields. `?kind=audit` shows the catalog audit instead of the files.
 */

type ArchiveScreenProps = {
  state: ArchiveState;
  catalog: CaseCatalog;
  audit: EventAudit;
  locale: Locale;
  /** The shell's search opened the archive (`?focus=1`): the search box takes the focus. */
  isSearchFocused?: boolean;
  /** The page's tour button, beside the kicker. */
  tour?: ReactNode;
};

export function ArchiveScreen({
  state,
  catalog,
  audit,
  locale,
  isSearchFocused,
  tour,
}: ArchiveScreenProps) {
  const translator = getTranslator(locale);
  const { t } = translator;
  const shell = { kicker: t("nav.group.files"), title: t("arch.title") };
  if (state.kind === "audit") {
    return (
      <PageShell {...shell}>
        <AuditIndex audit={audit} translator={translator} backHref={ARCHIVE_PATH} />
      </PageShell>
    );
  }
  const search = resolveNearSearch(catalog, state);
  return (
    <PageShell {...shell} lead={t("arch.lead3", { n: catalog.all.length })} aside={tour}>
      <Form action={ARCHIVE_PATH}>
        <HiddenState state={search.state} />
        <section aria-labelledby="archive-results-title" className="flex min-w-0 flex-col gap-4">
          <h2 id="archive-results-title" className="sr-only">
            {t("arch.results")}
          </h2>
          <ArchiveFind
            state={search.state}
            translator={translator}
            isSearchFocused={isSearchFocused}
          />
          <ArchiveTopics
            state={search.state}
            counts={topicCounts(catalog, search.state)}
            translator={translator}
          />
          <ArchiveResults search={search} catalog={catalog} translator={translator} />
        </section>
      </Form>
    </PageShell>
  );
}

/** The rest of the state rides along when the search box or the sort submits the form. */
function HiddenState({ state }: { state: ArchiveState }) {
  return (
    <>
      {state.kind === "trend" ? <input type="hidden" name="kind" value="trend" /> : null}
      {state.topic === "all" ? null : <input type="hidden" name="topic" value={state.topic} />}
      {state.near ? <input type="hidden" name="near" value={nearParam(state.near)} /> : null}
      {state.col ? <input type="hidden" name="col" value={state.col} /> : null}
      {FACET_KEYS.flatMap((key) =>
        state.facets[key].map((value) => (
          <input key={`${key}:${value}`} type="hidden" name={key} value={value} />
        )),
      )}
    </>
  );
}

type ArchiveResultsProps = { search: NearSearch; catalog: CaseCatalog; translator: Translator };

function ArchiveResults({ search, catalog, translator }: ArchiveResultsProps) {
  const { state } = search;
  const hits = filterArchive(catalog, state);
  const showsAudit = state.topic === "all" || state.topic === "disasters";
  return (
    <>
      {/* With no file left there is no nearest one to measure: the empty state says enough. */}
      {state.near && hits.length > 0 ? (
        <NearMessage
          kind="place"
          place={state.near}
          translator={translator}
          {...nearSummary(state.near, hits)}
        />
      ) : search.place === "not-found" ? (
        <NearMessage kind="not-found" text={search.text} translator={translator} />
      ) : null}
      <div data-tour="arch-filters" className="flex flex-wrap items-center justify-between gap-3">
        <ActiveFilters
          state={state}
          shown={hits.length}
          total={topicPool(catalog, state)}
          translator={translator}
        />
        {state.near ? null : <SortSelect sort={state.sort} translator={translator} />}
      </div>
      {hits.length ? (
        <Shelf files={hits} state={state} translator={translator} catalog={catalog} />
      ) : (
        <ArchiveEmpty
          query={state.q}
          suggestion={suggestRelaxation(catalog, state)}
          resetHref={archiveHref(clearFilters(state))}
          translator={translator}
        />
      )}
      {showsAudit ? <AuditCard translator={translator} /> : null}
    </>
  );
}

function SortSelect({ sort, translator }: { sort: ArchiveState["sort"]; translator: Translator }) {
  const { t } = translator;
  return (
    <label className="text-label-s text-text-secondary flex items-center gap-2">
      <span className="shrink-0">{t("arch.sort")}</span>
      <AutoSubmitSelect name="sort" urlValue={sort}>
        {ARCHIVE_SORTS.map((option) => (
          <option key={option} value={option}>
            {t(`arch.sort.${option}`)}
          </option>
        ))}
      </AutoSubmitSelect>
    </label>
  );
}

/** "Are there more disasters, or are more being counted?": the way into the catalog audit. */
function AuditCard({ translator }: { translator: Translator }) {
  const { t } = translator;
  return (
    <Link
      href={AUDIT_ARCHIVE_HREF}
      data-tour="arch-audit"
      className="rounded-card bg-bg-surface shadow-card text-text-primary focus-visible:focus-ring focus-visible:outline-focus-ring mt-4 flex flex-wrap items-center gap-x-3.5 gap-y-2 p-4 no-underline"
    >
      <span className="text-text-brand">
        <Icon name="audit" size="lg" />
      </span>
      <span className="text-body-m">{t("arch.audit.q")}</span>
      <span className="text-label-m text-text-link ms-auto inline-flex items-center gap-1.5">
        {t("arch.audit.go")}
        <Icon name="arrow-right" />
      </span>
    </Link>
  );
}

type ShelfProps = {
  files: CaseFile[];
  state: ArchiveState;
  translator: Translator;
  catalog: CaseCatalog;
};

/* Rows leave room above each folder for its sheets to rise into (up to 72px). */
const SHELF_GRID =
  "grid grid-cols-[repeat(auto-fill,minmax(min(290px,100%),1fr))] gap-x-5 gap-y-20 pt-18";

type NearShelfProps = Omit<ShelfProps, "state"> & { near: NearPlace };

function NearShelf({ files, near, translator, catalog }: NearShelfProps) {
  return (
    <ul className={SHELF_GRID}>
      {files.map((file, index) => (
        <li key={file.id} data-tour={index === 0 ? "arch-card" : undefined}>
          <CaseFolder
            file={file}
            translator={translator}
            catalog={catalog}
            km={roundKm(kmToFile(near, file))}
          />
        </li>
      ))}
    </ul>
  );
}

/** Trend files, then anomaly files, under short headings; one list nearest first near a place. */
function Shelf({ files, state, translator, catalog }: ShelfProps) {
  const { t } = translator;
  const { near } = state;
  if (near) {
    return <NearShelf files={files} near={near} translator={translator} catalog={catalog} />;
  }
  return (
    <div className="flex flex-col gap-8">
      {shelfGroups(files).map((group) => (
        <section key={group.kind} aria-labelledby={`shelf-${group.kind}`}>
          <header className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h3
              id={`shelf-${group.kind}`}
              className="text-heading-h3 text-text-primary flex items-center gap-2"
            >
              <span className="text-icon-secondary">
                <Icon name={group.kind === "trend" ? "chart" : "warning"} />
              </span>
              {t(`arch.kind.${group.kind}`)}
              <span className="text-label-m text-text-tertiary tabular-nums">
                {group.files.length}
              </span>
            </h3>
            <p className="text-body-s text-text-secondary">{t(`arch.kind.${group.kind}.d`)}</p>
          </header>
          <ul className={SHELF_GRID}>
            {group.files.map((file, index) => (
              <li key={file.id} data-tour={index === 0 ? "arch-card" : undefined}>
                <CaseFolder
                  file={file}
                  translator={translator}
                  catalog={catalog}
                  headingLevel="h4"
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
