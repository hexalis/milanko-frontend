import Link from "next/link";
import type { ReactNode } from "react";
import { getEventAudit, type CaseCatalog } from "@/modules/cases";
import type { Translator } from "@/shared/lib/i18n";
import { Icon } from "@/shared/ui/icon";
import { PageShell } from "@/shared/ui/page-shell";
import { ExternalLink, TextLink } from "@/shared/ui/text-link";
import { methodFacts } from "../domain/method-facts";
import { NOISE_LAB_KEYS, pickLabCopy, RARE_LAB_KEYS } from "./lab-copy";
import { LabTabs } from "./lab-tabs";
import { NoiseLab } from "./noise-lab";
import { ProcessSteps } from "./process-steps";
import { RareLab } from "./rare-lab";

/*
 * How we know (POC renderMethod, app.js L2592-2797), told short: the key figures, the five steps
 * as one pipeline (a step at a time), the lab with a demo that shows the sliders at work, then the
 * details folded into cards (two more tests, sources, limits, glossary) and a short close
 * (thanks and AI). The team has its own page.
 */

const STATIONS = ["satellite", "download", "calendar", "chart", "decide"] as const;

const GLOSSARY = [
  "trend",
  "sig",
  "p",
  "ci",
  "sen",
  "mk",
  "reanalysis",
  "ndvi",
  "pct",
  "z",
  "break",
  "span",
] as const;

/** Data sources: proper names stay as written; the description is copy. */
const SOURCES = [
  {
    icon: "chart",
    name: "NASA POWER · MERRA-2",
    key: "source.power",
    url: "https://power.larc.nasa.gov/",
  },
  {
    icon: "satellite",
    name: "MODIS/Terra · ORNL DAAC",
    key: "source.modis",
    url: "https://modis.ornl.gov/",
  },
  {
    icon: "audit",
    name: "NASA EONET v3",
    key: "source.eonet",
    url: "https://eonet.gsfc.nasa.gov/",
  },
  {
    icon: "orbit",
    name: "NASA GIBS",
    key: "source.gibs",
    url: "https://nasa-gibs.github.io/gibs-api-docs/",
  },
] as const;

/** Credits: `who` is either an institution (proper name) or a copy key. */
const CREDITS = [
  {
    icon: "chart",
    name: "NASA POWER",
    who: { text: "Langley Research Center" },
    url: "https://power.larc.nasa.gov/",
  },
  {
    icon: "satellite",
    name: "MODIS/Terra · ORNL DAAC",
    who: { key: "credit.modis" },
    url: "https://modis.ornl.gov/",
  },
  {
    icon: "audit",
    name: "NASA EONET",
    who: { text: "Goddard Space Flight Center" },
    url: "https://eonet.gsfc.nasa.gov/",
  },
  {
    icon: "orbit",
    name: "NASA GIBS",
    who: { text: "ESDIS" },
    url: "https://nasa-gibs.github.io/gibs-api-docs/",
  },
  {
    icon: "sparkle",
    name: "NASA Space Apps Challenge",
    who: { key: "credit.spaceapps" },
    url: "https://www.spaceappschallenge.org/",
  },
] as const;

const SURFACE = "rounded-card bg-bg-surface shadow-card medium:p-6 p-4";

function SectionHeading({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="text-heading-h2 font-display text-text-primary scroll-mt-6">
      {children}
    </h2>
  );
}

function Facts({ catalog, translator }: { catalog: CaseCatalog; translator: Translator }) {
  const { t, locale } = translator;
  const facts = methodFacts(catalog, getEventAudit().events);
  const items = [
    { label: t("facts.years"), value: `${facts.firstYear}–${facts.lastYear}` },
    { label: t("facts.files"), value: facts.files.toLocaleString(locale) },
    { label: t("facts.events"), value: facts.auditedEvents.toLocaleString(locale) },
    { label: t("facts.points"), value: facts.points.toLocaleString(locale) },
  ];
  return (
    <dl
      aria-label={t("facts.aria")}
      data-tour="method-facts"
      className="border-border-subtle medium:grid-cols-4 grid grid-cols-2 border-y"
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="border-border-subtle medium:border-l medium:first:border-l-0 medium:px-4 flex flex-col-reverse gap-1 px-1 py-4"
        >
          <dt className="text-label-m text-text-secondary">{item.label}</dt>
          <dd className="text-heading-h2 font-display text-text-primary tabular-nums">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Process({ translator: { t } }: { translator: Translator }) {
  return (
    <section aria-labelledby="method-process" data-tour="method-process" className="grid gap-4">
      <SectionHeading id="method-process">{t("method.proc.title")}</SectionHeading>
      <ProcessSteps
        steps={STATIONS.map((icon, index) => ({
          icon,
          title: t(`st${index + 1}.t`),
          text: t(`st${index + 1}.d`),
          how: t(`st${index + 1}.how`),
        }))}
        copy={{
          label: t("method.steps.label"),
          how: t("method.how"),
          prev: t("method.steps.prev"),
          next: t("method.steps.next"),
          of: t("method.steps.of"),
        }}
      />
    </section>
  );
}

type DeepCardProps = {
  icon: string;
  title: string;
  /** A short line under the title: what is inside, at a glance. */
  meta?: string;
  isWide?: boolean;
  children: ReactNode;
};

const DEEP_CARD = {
  narrow:
    "group rounded-card bg-bg-surface shadow-card transition-shadow duration-fast open:shadow-dropdown",
  wide: "group rounded-card bg-bg-surface shadow-card transition-shadow duration-fast open:shadow-dropdown medium:col-span-2",
} as const;

/** One detail, folded: the title and a hint stay on screen, the rest opens on demand. */
function DeepCard({ icon, title, meta, isWide = false, children }: DeepCardProps) {
  return (
    <details className={isWide ? DEEP_CARD.wide : DEEP_CARD.narrow}>
      <summary className="rounded-card focus-visible:focus-ring focus-visible:outline-focus-ring hover:bg-bg-hover duration-fast flex cursor-pointer list-none items-center gap-4 p-5 transition-colors">
        <span className="bg-surface-tone-2 text-text-primary grid size-11 shrink-0 place-items-center rounded-full text-xl">
          <Icon name={icon} />
        </span>
        <span className="grid min-w-0 flex-1 gap-0.5">
          <h3 className="text-heading-h4 text-text-primary">{title}</h3>
          {meta ? <span className="text-body-s text-text-tertiary">{meta}</span> : null}
        </span>
        <span className="text-icon-secondary duration-base flex transition-transform group-open:rotate-180">
          <Icon name="caret-down" />
        </span>
      </summary>
      <div className="grid gap-3 px-5 pb-5">{children}</div>
    </details>
  );
}

function Deep({ catalog, translator: { t } }: { catalog: CaseCatalog; translator: Translator }) {
  const newTabHint = t("link.newTab");
  const eventFiles = `${t("arch.kind.event")} (${catalog.events.length})`;
  return (
    <section aria-labelledby="method-deep" data-tour="method-deep" className="grid gap-4">
      <header className="grid gap-1">
        <SectionHeading id="method-deep">{t("method.more.h")}</SectionHeading>
        <p className="text-body-m text-text-secondary max-w-[65ch]">{t("method.deep.lead")}</p>
      </header>
      <div className="medium:grid-cols-2 grid items-start gap-4">
        <DeepCard icon="warning" title={t("method.anom.t")} meta={eventFiles}>
          <p className="text-body-m text-text-secondary">
            {t("method.anom.d", { days: catalog.eventWindowDays })}
          </p>
          <TextLink href="/cases?kind=event">
            {eventFiles} <Icon name="arrow-right" size="sm" />
          </TextLink>
        </DeepCard>
        {/* The catalog audit files are not ported yet, so this test has no archive link. */}
        <DeepCard icon="audit" title={t("method.audit.t")}>
          <p className="text-body-m text-text-secondary">{t("method.audit.d")}</p>
        </DeepCard>
        <DeepCard
          icon="satellite"
          title={t("method.sources")}
          meta={t("method.sources.count", { n: SOURCES.length })}
        >
          <ul className="m-0 grid list-none gap-3 p-0">
            {SOURCES.map((source) => (
              <li key={source.url} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
                <span className="text-text-brand mt-0.5">
                  <Icon name={source.icon} />
                </span>
                <span className="grid gap-0.5">
                  <ExternalLink href={source.url} newTabHint={newTabHint}>
                    {source.name}
                  </ExternalLink>
                  <span className="text-body-s text-text-secondary">{t(source.key)}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="text-body-s text-text-secondary flex items-start gap-2">
            <span className="mt-0.5">
              <Icon name="info" />
            </span>
            {t("source.context")}
          </p>
        </DeepCard>
        <DeepCard icon="info" title={t("method.limits.title")}>
          <p className="text-body-m text-text-secondary">{t("method.limits.d")}</p>
        </DeepCard>
        <DeepCard
          icon="chart"
          title={t("method.gloss.title")}
          meta={t("method.gloss.count", { n: GLOSSARY.length })}
          isWide
        >
          <dl className="medium:grid-cols-2 expanded:grid-cols-3 grid gap-x-6 gap-y-3">
            {GLOSSARY.map((term) => (
              <div key={term} className="grid gap-0.5">
                <dt className="text-body-m-strong text-text-primary">{t(`gloss.${term}`)}</dt>
                <dd className="text-body-s text-text-secondary">{t(`gloss.${term}.d`)}</dd>
              </div>
            ))}
          </dl>
        </DeepCard>
      </div>
    </section>
  );
}

function Lab({ translator, lastYear }: { translator: Translator; lastYear: number }) {
  const { t } = translator;
  return (
    <section
      aria-labelledby="method-lab"
      data-tour="method-lab"
      className={`${SURFACE} grid gap-5`}
    >
      <header className="grid gap-1">
        <SectionHeading id="method-lab">{t("method.lab.title")}</SectionHeading>
        <p className="text-body-m text-text-secondary max-w-[65ch]">{t("method.lab.lead")}</p>
      </header>
      <LabTabs
        label={t("method.lab.title")}
        tabs={[
          {
            id: "trend",
            icon: "chart",
            label: t("method.lab.trend"),
            lead: t("method.play.lead"),
            panel: <NoiseLab copy={pickLabCopy(translator, NOISE_LAB_KEYS)} lastYear={lastYear} />,
          },
          {
            id: "rare",
            icon: "dice",
            label: t("method.lab.rare"),
            lead: t("method.rare.lead"),
            panel: <RareLab copy={pickLabCopy(translator, RARE_LAB_KEYS)} />,
          },
        ]}
      />
    </section>
  );
}

function Thanks({ translator: { t } }: { translator: Translator }) {
  const newTabHint = t("link.newTab");
  return (
    <section
      aria-labelledby="method-thanks"
      data-tour="method-thanks"
      className="expanded:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] grid gap-4"
    >
      <div className="grid content-start gap-3">
        <SectionHeading id="method-thanks">{t("team.thanks")}</SectionHeading>
        <p className="text-body-m text-text-secondary">{t("team.thanks.lead")}</p>
        <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
          {CREDITS.map((credit) => (
            <li
              key={credit.url}
              className="rounded-chip border-border-subtle bg-bg-surface flex items-center gap-2.5 border py-1.5 ps-3 pe-4"
            >
              <span className="text-text-brand flex">
                <Icon name={credit.icon} />
              </span>
              <span className="text-body-s grid">
                <ExternalLink href={credit.url} newTabHint={newTabHint}>
                  {credit.name}
                </ExternalLink>
                <span className="text-label-s text-text-tertiary">
                  {"key" in credit.who ? t(credit.who.key) : credit.who.text}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <article
        aria-labelledby="method-ai"
        className={`${SURFACE} bg-surface-tone-4 grid content-start gap-3`}
      >
        <h2
          id="method-ai"
          className="text-heading-h3 font-display text-text-primary flex items-center gap-2"
        >
          <Icon name="sparkle" />
          {t("team.ai")}
        </h2>
        <p className="text-body-m text-text-primary">{t("team.ai.d")}</p>
      </article>
    </section>
  );
}

function NextCard({ translator: { t } }: { translator: Translator }) {
  return (
    <Link
      href="/team"
      data-tour="method-next"
      // A night card in both themes: its light-theme tokens make bg-inverse the night sky.
      data-theme="light"
      className="rounded-card bg-bg-inverse text-text-inverse shadow-card duration-fast hover:shadow-raised focus-visible:focus-ring focus-visible:outline-focus-ring group grid gap-1 p-5 no-underline transition-shadow"
    >
      <span className="text-overline">{t("method.next")}</span>
      <span className="text-heading-h3 font-display flex items-center justify-between gap-3">
        {t("team.title")}
        <span className="duration-fast transition-transform group-hover:translate-x-1">
          <Icon name="arrow-right" size="lg" />
        </span>
      </span>
      <span className="text-body-s">{t("method.next.d")}</span>
    </Link>
  );
}

type MethodScreenProps = {
  catalog: CaseCatalog;
  translator: Translator;
  /** The page's tour button, beside the kicker. */
  tour?: ReactNode;
};

export function MethodScreen({ catalog, translator, tour }: MethodScreenProps) {
  const { t } = translator;
  const lastYear = methodFacts(catalog, getEventAudit().events).lastYear;
  return (
    <PageShell
      kicker={t("method.eyebrow")}
      title={t("method.title")}
      lead={t("method.lead.short")}
      aside={tour}
    >
      <Facts catalog={catalog} translator={translator} />
      <div className="grid min-w-0 gap-12">
        <Process translator={translator} />
        <Lab translator={translator} lastYear={lastYear} />
        <Deep catalog={catalog} translator={translator} />
        <Thanks translator={translator} />
        <NextCard translator={translator} />
      </div>
    </PageShell>
  );
}
