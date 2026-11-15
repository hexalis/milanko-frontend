import Link from "next/link";
import type { ReactNode } from "react";
import { getEventAudit, type CaseCatalog } from "@/modules/cases";
import { TeamList } from "@/modules/team";
import type { Translator } from "@/shared/lib/i18n";
import { Icon } from "@/shared/ui/icon";
import { PageShell } from "@/shared/ui/page-shell";
import { ExternalLink, TextLink } from "@/shared/ui/text-link";
import { methodFacts } from "../domain/method-facts";
import { NOISE_LAB_KEYS, pickLabCopy, RARE_LAB_KEYS } from "./lab-copy";
import { NoiseLab } from "./noise-lab";
import { RareLab } from "./rare-lab";

/*
 * How we know (POC renderMethod, app.js L2592-2797; DESIGN.md "Method splits process (main) and
 * team (sticky aside)"): the key figures, the process as numbered rows, two more tests, both labs,
 * sources and glossary, limits, then thanks and AI. The aside holds the outline and the team.
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

const SECTIONS = [
  { id: "method-process", tocKey: "toc.process" },
  { id: "method-tests", tocKey: "toc.tests" },
  { id: "method-rare", tocKey: "toc.rare" },
  { id: "method-play", tocKey: "toc.play" },
  { id: "method-sources", tocKey: "toc.sources" },
  { id: "method-thanks", tocKey: "toc.thanks" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

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
const ANCHOR =
  "text-body-m text-text-secondary flex items-baseline gap-2 rounded-sm py-1 no-underline hover:text-text-brand focus-visible:focus-ring focus-visible:outline-focus-ring";

function SectionHeading({ id, children }: { id: SectionId; children: ReactNode }) {
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
    <section aria-labelledby="method-process" className="grid gap-4">
      <SectionHeading id="method-process">{t("method.proc.title")}</SectionHeading>
      <ol className="border-border-subtle m-0 list-none border-t p-0">
        {STATIONS.map((icon, index) => {
          const step = `st${index + 1}`;
          return (
            <li
              key={icon}
              className="border-border-subtle medium:grid-cols-[3rem_14rem_minmax(0,1fr)] grid gap-x-4 gap-y-2 border-b py-4"
            >
              <span
                className="text-text-brand font-mono text-[15px] font-semibold"
                aria-hidden="true"
              >
                {`0${index + 1}`}
              </span>
              <h3 className="text-heading-h4 text-text-primary flex items-center gap-2">
                <Icon name={icon} />
                {t(`${step}.t`)}
              </h3>
              <div className="grid gap-2">
                <p className="text-body-m text-text-primary">{t(`${step}.d`)}</p>
                <details className="group">
                  <summary className="text-label-m text-text-link focus-visible:focus-ring focus-visible:outline-focus-ring inline-flex cursor-pointer list-none items-center gap-1 rounded-sm">
                    {t("method.how")}
                    <span className="duration-fast transition-transform group-open:rotate-180">
                      <Icon name="caret-down" size="sm" />
                    </span>
                  </summary>
                  <p className="text-body-s text-text-secondary mt-2">{t(`${step}.how`)}</p>
                </details>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function TestCard({ icon, title, children }: { icon: string; title: string; children: ReactNode }) {
  return (
    <article className={`${SURFACE} flex flex-col gap-3`}>
      <span className="bg-surface-tone-2 text-text-primary grid size-10 place-items-center rounded-full">
        <Icon name={icon} size="lg" />
      </span>
      <h3 className="text-heading-h4 text-text-primary">{title}</h3>
      {children}
    </article>
  );
}

function MoreTests({
  catalog,
  translator: { t },
}: {
  catalog: CaseCatalog;
  translator: Translator;
}) {
  return (
    <section aria-labelledby="method-tests" className="grid gap-4">
      <SectionHeading id="method-tests">{t("method.more.title")}</SectionHeading>
      <div className="medium:grid-cols-2 grid gap-4">
        <TestCard icon="warning" title={t("method.anom.t")}>
          <p className="text-body-m text-text-secondary">
            {t("method.anom.d", { days: catalog.eventWindowDays })}
          </p>
          <TextLink href="/cases?kind=event">
            {`${t("arch.kind.event")} (${catalog.events.length})`}{" "}
            <Icon name="arrow-right" size="sm" />
          </TextLink>
        </TestCard>
        {/* The catalog audit files are not ported yet, so this test has no archive link. */}
        <TestCard icon="audit" title={t("method.audit.t")}>
          <p className="text-body-m text-text-secondary">{t("method.audit.d")}</p>
        </TestCard>
      </div>
    </section>
  );
}

type LabSectionProps = {
  id: Extract<SectionId, "method-rare" | "method-play">;
  icon: string;
  title: string;
  lead: string;
  children: ReactNode;
};

function LabSection({ id, icon, title, lead, children }: LabSectionProps) {
  return (
    <section aria-labelledby={id} className={`${SURFACE} grid gap-5`}>
      <header className="grid gap-1">
        <SectionHeading id={id}>
          <span className="inline-flex items-center gap-2">
            <Icon name={icon} />
            {title}
          </span>
        </SectionHeading>
        <p className="text-body-m text-text-secondary max-w-[65ch]">{lead}</p>
      </header>
      {children}
    </section>
  );
}

function SourcesAndGlossary({ translator: { t } }: { translator: Translator }) {
  const newTabHint = t("link.newTab");
  return (
    <div className="expanded:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] grid gap-4">
      <article aria-labelledby="method-sources" className={`${SURFACE} grid gap-4`}>
        <SectionHeading id="method-sources">{t("method.sources")}</SectionHeading>
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
        <h3 className="text-heading-h3 text-text-primary mt-2">{t("method.gloss.title")}</h3>
        <dl className="medium:grid-cols-2 grid gap-x-6 gap-y-3">
          {GLOSSARY.map((term) => (
            <div key={term} className="grid gap-0.5">
              <dt className="text-body-m-strong text-text-primary">{t(`gloss.${term}`)}</dt>
              <dd className="text-body-s text-text-secondary">{t(`gloss.${term}.d`)}</dd>
            </div>
          ))}
        </dl>
      </article>
      <article aria-labelledby="method-limits" className={`${SURFACE} grid content-start gap-3`}>
        <h2 id="method-limits" className="text-heading-h2 font-display text-text-primary">
          {t("method.limits.title")}
        </h2>
        <p className="text-body-m text-text-primary">{t("method.limits.d")}</p>
      </article>
    </div>
  );
}

function Thanks({ translator: { t } }: { translator: Translator }) {
  const newTabHint = t("link.newTab");
  return (
    <section
      aria-labelledby="method-thanks"
      className="expanded:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] grid gap-4"
    >
      <div className="grid content-start gap-3">
        <SectionHeading id="method-thanks">{t("team.thanks")}</SectionHeading>
        <p className="text-body-m text-text-secondary">{t("team.thanks.lead")}</p>
        <ul className="medium:grid-cols-2 m-0 grid list-none gap-3 p-0">
          {CREDITS.map((credit) => (
            <li
              key={credit.url}
              className="rounded-card border-border-subtle bg-bg-surface grid grid-cols-[auto_minmax(0,1fr)] gap-3 border p-3"
            >
              <span className="text-text-brand mt-0.5">
                <Icon name={credit.icon} />
              </span>
              <span className="grid gap-0.5">
                <ExternalLink href={credit.url} newTabHint={newTabHint}>
                  {credit.name}
                </ExternalLink>
                <span className="text-body-s text-text-secondary">
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

function Aside({ translator }: { translator: Translator }) {
  const { t } = translator;
  return (
    <aside className="expanded:sticky expanded:top-6 grid content-start gap-4 self-start">
      <nav aria-labelledby="method-toc" className={SURFACE}>
        <h2 id="method-toc" className="text-overline text-text-tertiary">
          {t("method.jump")}
        </h2>
        <ol className="m-0 mt-2 list-none p-0">
          {SECTIONS.map((section, index) => (
            <li key={section.id}>
              <a href={`#${section.id}`} className={ANCHOR}>
                <span className="text-text-brand font-mono text-[13px]">{`0${index + 1}`}</span>
                {t(section.tocKey)}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <section aria-labelledby="method-team" className={SURFACE}>
        <h2 id="method-team" className="text-heading-h3 font-display text-text-primary">
          <TextLink href="/team">{t("method.team")}</TextLink>
        </h2>
        <TeamList translator={translator} labelledBy="method-team" layout="compact" />
      </section>
    </aside>
  );
}

type MethodScreenProps = { catalog: CaseCatalog; translator: Translator };

export function MethodScreen({ catalog, translator }: MethodScreenProps) {
  const { t } = translator;
  const lastYear = methodFacts(catalog, getEventAudit().events).lastYear;
  return (
    <PageShell kicker={t("method.eyebrow")} title={t("method.title")} lead={t("method.lead")}>
      <Facts catalog={catalog} translator={translator} />
      <div className="expanded:grid-cols-[minmax(0,1fr)_20rem] grid items-start gap-8">
        <div className="grid min-w-0 gap-10">
          <Process translator={translator} />
          <MoreTests catalog={catalog} translator={translator} />
          <LabSection
            id="method-rare"
            icon="dice"
            title={t("method.rare.title")}
            lead={t("method.rare.lead")}
          >
            <RareLab copy={pickLabCopy(translator, RARE_LAB_KEYS)} />
          </LabSection>
          <LabSection
            id="method-play"
            icon="chart"
            title={t("method.play.title")}
            lead={t("method.play.lead")}
          >
            <NoiseLab copy={pickLabCopy(translator, NOISE_LAB_KEYS)} lastYear={lastYear} />
          </LabSection>
          <SourcesAndGlossary translator={translator} />
          <Thanks translator={translator} />
          <NextCard translator={translator} />
        </div>
        <Aside translator={translator} />
      </div>
    </PageShell>
  );
}
