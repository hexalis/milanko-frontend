import Link from "next/link";
import type { ReactNode } from "react";
import type { Translator } from "@/shared/lib/i18n";
import { buttonLink } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import {
  briefingLedger,
  falseSuspect,
  featuredCase,
  latestStrongAnomalies,
  latestTrends,
  longestRecord,
  oppositePairs,
  type LedgerCount,
} from "../../domain/briefing";
import type { CaseFile } from "../../domain/case-file";
import type { CaseCatalog } from "../../domain/catalog";
import type { EventAudit } from "../../domain/event-audit";
import { CaseFolder } from "../case-folder";
import { FalseSuspect } from "./false-suspect";
import { FeaturedCase } from "./featured-case";
import { OppositePairs } from "./opposite-pairs";
import { ReadAFile } from "./read-a-file";

/*
 * The Briefing, front page of the case files (POC app.js renderBriefing L618-780), told as one
 * story a child, a curious reader and a scientist can all follow: the question (hero and ledger)
 * → how to read a case file (its three sheets, in plain words and for scientists) → the latest
 * folders → two lessons (opposite-trend pairs, the false suspect) → the featured case → where to
 * go next (steps and the closing CTA).
 */

type BriefingScreenProps = {
  translator: Translator;
  catalog: CaseCatalog;
  audit: EventAudit;
  /** The page's tour button, beside the title. */
  tour?: ReactNode;
};

const CARD_LINK = [
  "flex h-full rounded-card bg-bg-surface text-text-primary shadow-card no-underline",
  "transition-[transform,box-shadow] duration-fast ease-standard hover:-translate-y-0.5 hover:shadow-raised",
  "motion-reduce:hover:translate-y-0 focus-visible:focus-ring focus-visible:outline-focus-ring",
].join(" ");

/* Each count is a card (POC .ledger--kinds): the figure leads, the label says what it counts. */
const LEDGER_LINK = [
  "flex h-full flex-col gap-2 rounded-surface bg-bg-surface px-5 py-4 text-text-secondary no-underline shadow-card",
  "transition-[box-shadow,translate] duration-fast hover:-translate-y-0.5 hover:shadow-dropdown motion-reduce:transition-none motion-reduce:hover:translate-y-0",
  "focus-visible:focus-ring focus-visible:outline-focus-ring",
].join(" ");

type LedgerItem = { href: string; icon: string; label: string; count: LedgerCount };

function Ledger({ items, of }: { items: LedgerItem[]; of: string }) {
  return (
    <ul data-tour="brief-ledger" className="medium:grid-cols-3 grid gap-4 pt-2">
      {items.map((item) => (
        <li key={item.href} className="min-w-0">
          <Link href={item.href} className={LEDGER_LINK}>
            <span className="text-body-m tabular-nums">
              <strong className="text-display-s font-display text-text-brand me-1">
                {item.count.hits}
              </strong>{" "}
              {of} {item.count.total}
            </span>
            <span className="text-body-m text-text-primary flex items-start gap-2 font-semibold">
              <span className="text-icon-brand mt-0.5 shrink-0">
                <Icon name={item.icon} />
              </span>
              {item.label}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

type Step = { href: string; icon: string; title: string; description: string };

function Steps({ title, steps }: { title: string; steps: Step[] }) {
  return (
    <section aria-labelledby="steps-title" data-tour="brief-steps">
      <h2 id="steps-title" className="sr-only">
        {title}
      </h2>
      <ol className="medium:grid-cols-3 grid gap-4">
        {steps.map((step) => (
          <li key={step.href}>
            <Link href={step.href} className={`${CARD_LINK} items-start gap-3.5 p-5`}>
              <span className="text-text-brand">
                <Icon name={step.icon} size="lg" />
              </span>
              <span className="flex flex-col gap-0.5">
                <strong className="text-label-l">{step.title}</strong>
                <span className="text-body-s text-text-secondary">{step.description}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

type ShelfProps = {
  id: string;
  title: string;
  lead: string;
  more: { href: string; label: string };
  files: CaseFile[];
  translator: Translator;
  catalog: CaseCatalog;
  /** Anchor of this shelf in the page's tour (`data-tour`). */
  tour?: string;
};

/* Deferred: the POC's "read" mark on folders already opened (localStorage etd-read). */
function Shelf({ id, title, lead, more, files, translator, catalog, tour }: ShelfProps) {
  return (
    <section aria-labelledby={id} data-tour={tour} className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 id={id} className="text-heading-h2 font-display text-text-primary">
            {title}
          </h2>
          <p className="text-body-m text-text-secondary max-w-[60ch]">{lead}</p>
        </div>
        <Link href={more.href} className={buttonLink({ intent: "secondary" })}>
          {more.label}
          <Icon name="arrow-right" />
        </Link>
      </div>
      {/* Room above each folder for its sheets to rise into. */}
      <div className="medium:grid-cols-2 expanded:grid-cols-3 grid gap-x-6 gap-y-20 pt-14">
        {files.map((file) => (
          <CaseFolder key={file.id} file={file} translator={translator} catalog={catalog} />
        ))}
      </div>
    </section>
  );
}

function ClosingCta({
  eyebrow,
  title,
  lead,
  action,
}: Record<"eyebrow" | "title" | "lead", string> & { action: ReactNode }) {
  return (
    <section
      aria-labelledby="cta-title"
      data-tour="brief-cta"
      className="rounded-shell bg-bg-surface shadow-card medium:flex-row medium:items-center medium:p-9 flex flex-col justify-between gap-6 p-6"
    >
      <div className="flex flex-col gap-1">
        <p className="text-overline text-text-tertiary">{eyebrow}</p>
        <h2 id="cta-title" className="text-heading-h2 font-display text-text-primary">
          {title}
        </h2>
        <p className="text-body-m text-text-secondary max-w-[60ch]">{lead}</p>
      </div>
      {action}
    </section>
  );
}

export function BriefingScreen({ translator, catalog, audit, tour }: BriefingScreenProps) {
  const { t } = translator;
  const ledger = briefingLedger(catalog, audit);
  const pairs = oppositePairs(catalog.trends);
  const suspect = falseSuspect(audit.categories);
  const featured = featuredCase(catalog.trends);

  return (
    <main className="max-w-content-max medium:px-6 expanded:px-12 mx-auto flex w-full flex-col gap-12 px-4 pt-8 pb-16">
      <header className="flex max-w-[900px] flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <h1 className="text-display-s font-display text-text-primary text-balance">
            {t("brief.title")}
          </h1>
          {tour}
        </div>
        <p className="text-body-l font-reading text-text-secondary max-w-[60ch]">
          {t("brief.lead", { n: catalog.all.length, years: longestRecord(catalog.trends) })}
        </p>
        <Ledger
          of={t("brief.of")}
          items={[
            {
              href: "/cases?kind=trend",
              icon: "chart",
              label: t("brief.k.trend"),
              count: ledger.trends,
            },
            {
              href: "/cases?kind=event",
              icon: "warning",
              label: t("brief.k.event"),
              count: ledger.events,
            },
            // The POC opened the audit tab of Case Files (not ported yet); the false suspect below shows it.
            {
              href: suspect ? "#suspect-title" : "/cases",
              icon: "audit",
              label: t("brief.k.audit"),
              count: ledger.audit,
            },
          ]}
        />
      </header>

      <ReadAFile translator={translator} />

      {/* Deferred: the live "Today in EONET" day card (POC dayFile/fillDayFile L2110-2169) reads the EONET API. */}

      <Shelf
        id="latest-title"
        tour="brief-shelf"
        title={t("brief.cases.title")}
        lead={t("brief.cases.lead")}
        more={{
          href: "/cases?kind=trend",
          label: `${t("arch.kind.trend")} (${catalog.trends.length})`,
        }}
        files={latestTrends(catalog.trends)}
        translator={translator}
        catalog={catalog}
      />

      <Shelf
        id="anomalies-title"
        title={t("brief.anoms.title")}
        lead={t("brief.anoms.lead", { days: catalog.eventWindowDays })}
        more={{
          href: "/cases?kind=event",
          label: `${t("arch.kind.event")} (${catalog.events.length})`,
        }}
        files={latestStrongAnomalies(catalog.events)}
        translator={translator}
        catalog={catalog}
      />

      {pairs.length ? (
        <OppositePairs pairs={pairs} translator={translator} catalog={catalog} />
      ) : null}

      {suspect ? (
        <FalseSuspect
          suspect={suspect}
          audit={audit}
          realTrends={ledger.audit.hits}
          translator={translator}
        />
      ) : null}

      {featured ? <FeaturedCase file={featured} translator={translator} catalog={catalog} /> : null}

      <Steps
        title={t("brief.steps.title")}
        steps={[
          {
            href: "/cases",
            icon: "cases-on",
            title: t("brief.step1.t"),
            description: t("brief.step1.d"),
          },
          {
            href: "/explore",
            icon: "explore-on",
            title: t("brief.step2.t"),
            description: t("brief.step2.d"),
          },
          {
            href: "/method",
            icon: "method-on",
            title: t("brief.step3.t"),
            description: t("brief.step3.d"),
          },
        ]}
      />

      {/* Deferred: the POC's place search (Open-Meteo geocoding, then a live file); this CTA opens Case Files. */}
      <ClosingCta
        eyebrow={t("brief.cta.eyebrow")}
        title={t("brief.end.title")}
        lead={t("brief.end.lead", { n: catalog.all.length })}
        action={
          <Link href="/cases" className={`${buttonLink()} shrink-0`}>
            {t("brief.end.btn")}
            <Icon name="arrow-right" />
          </Link>
        }
      />
    </main>
  );
}
