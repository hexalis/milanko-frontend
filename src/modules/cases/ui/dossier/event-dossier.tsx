import type { Translator } from "@/shared/lib/i18n";
import { Icon } from "@/shared/ui/icon";
import { Table, Td, Th, Tr } from "@/shared/ui/table";
import { ExternalLink } from "@/shared/ui/text-link";
import {
  EVENT_UNITS,
  fileDirection,
  verdictOf,
  type EventFile,
  type EventVariable,
  type EventVariableReading,
} from "../../domain/case-file";
import { nextFile } from "../../domain/case-links";
import type { CaseCatalog } from "../../domain/catalog";
import { eonetSourceName } from "../../domain/eonet-sources";
import {
  eventHeadline,
  eventSummary,
  fileTitle,
  strengthWord,
  themeLabel,
  verdictLabel,
} from "../../domain/file-text";
import { formatCoordinates, formatDate, formatFigure } from "../../domain/format";
import { eventWindow, eventYear, percentileBand, type PercentileBand } from "../../domain/readout";
import { EvidenceMeter } from "../evidence-meter";
import { SeriesChart } from "../series-chart";
import { VerdictStamp } from "../verdict-stamp";
import { AnomalyReadout, EVENT_VARIABLE_ICON, LeadTag } from "./anomaly-readout";
import {
  ChartCaption,
  ChartHead,
  EvidenceBlock,
  EvidenceTabs,
  FAMILY_TONE,
  Lead,
  PropsList,
  SourcesList,
} from "./doc-parts";
import { DocHeading, DocSection, DossierFrame } from "./dossier-frame";
import { ExactNumbers, Mono } from "./exact-numbers";
import { GlossaryTerm } from "./glossary-term";
import { NextCase } from "./next-case";

/* Anomaly file (POC renderEventFile, app.js L1453): one EONET event and its 90-day run-up. */

type EventDossierProps = { file: EventFile; translator: Translator; catalog: CaseCatalog };

const POWER_URL = "https://power.larc.nasa.gov/";
const POWER_DAILY = "T2M_MAX, PRECTOTCORR, GWETROOT";
const EONET_EVENTS = "https://eonet.gsfc.nasa.gov/api/v3/events/";

const BAND_MARK: Record<PercentileBand, string> = {
  "very-high": "bg-trend-up",
  high: "bg-trend-up",
  usual: "bg-text-primary",
  low: "bg-trend-down",
  "very-low": "bg-trend-down",
};

const readings = (file: EventFile) =>
  Object.entries(file.vars) as [EventVariable, EventVariableReading][];

const eonetLink = (file: EventFile) => file.link ?? `${EONET_EVENTS}${file.eonet}`;

/** EONET magnitudes come with short English units ("kts", "hectare"). */
const magnitudeUnit = (unit: string, { t, has }: Translator) =>
  has(`evunit.${unit}`) ? t(`evunit.${unit}`) : unit;

function SourceName({ file, newTabHint }: { file: EventFile; newTabHint: string }) {
  if (!file.source) return <span>—</span>;
  const name = eonetSourceName(file.source.id);
  return file.source.url ? (
    <ExternalLink href={file.source.url} newTabHint={newTabHint}>
      {name}
    </ExternalLink>
  ) : (
    <span>{name}</span>
  );
}

function CoverDoc({ file, translator, catalog }: EventDossierProps) {
  const { t, locale } = translator;
  const context = { translator, catalog };
  const category = themeLabel(file.category, context);
  return (
    <DocSection id="cover" label={t("doc.cover")}>
      <p className="text-overline text-text-secondary font-mono">
        {file.catalog} · {category} · EONET
      </p>
      <h1 className="text-display-s font-display text-text-primary text-balance">
        {fileTitle(file, context)}
      </h1>
      <Lead>{eventSummary(file, context)}</Lead>
      <PropsList
        rows={[
          {
            icon: "decide",
            label: t("prop.verdict"),
            value: (
              <>
                <VerdictStamp verdict={verdictOf(file)} label={verdictLabel(file, context)} />
                <EvidenceMeter strength={file.strength} word={strengthWord(file, context)} />
              </>
            ),
          },
          { icon: `ev-${file.family}`, label: t("prop.category"), value: category },
          {
            icon: "calendar",
            label: t("event.date"),
            value: <span className="tabular-nums">{formatDate(file.date, locale)}</span>,
          },
          {
            icon: "map-pin",
            label: t("prop.place"),
            value: (
              <span>
                {t(`reg.${file.region}`)} · <Mono>{formatCoordinates(file.lat, file.lon)}</Mono>
              </span>
            ),
          },
          ...(typeof file.magnitude === "number"
            ? [
                {
                  icon: "chart",
                  label: t("ev.peak"),
                  value: (
                    <span className="tabular-nums">
                      {file.magnitude.toLocaleString(locale)}{" "}
                      {magnitudeUnit(file.unit ?? "", translator)}
                    </span>
                  ),
                },
              ]
            : []),
          {
            icon: "satellite",
            label: t("event.source"),
            value: <SourceName file={file} newTabHint={t("link.newTab")} />,
          },
        ]}
      />
    </DocSection>
  );
}

function VariableRows({ file, translator }: Pick<EventDossierProps, "file" | "translator">) {
  const { t } = translator;
  return (
    <ul className="rounded-card bg-bg-surface shadow-card divide-border-subtle flex flex-col divide-y px-4">
      {readings(file).map(([variable, reading]) => {
        const { unit, digits } = EVENT_UNITS[variable];
        return (
          <li
            key={variable}
            className="medium:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.3fr)] grid items-center gap-x-4 gap-y-2 py-3"
          >
            <span className="text-body-m-strong text-text-primary inline-flex flex-wrap items-center gap-2">
              <Icon name={EVENT_VARIABLE_ICON[variable]} />
              {t(`pt.recent.${variable}`)}
              {variable === file.lead ? <LeadTag label={t("ev.lead")} /> : null}
            </span>
            <span className="text-body-m tabular-nums">
              {`${formatFigure(reading.value, digits)} ${unit}`.trim()}{" "}
              <span className="text-text-secondary">
                · {t("ev.usual", { v: formatFigure(reading.mean, digits), unit })}
              </span>
            </span>
            <span className="text-body-s text-text-secondary flex items-center gap-3">
              <span
                className="bg-bg-surface-sunken relative h-2 w-20 shrink-0 rounded-full"
                aria-hidden="true"
              >
                <i
                  className={`ring-bg-surface absolute top-1/2 -mt-1.5 -ml-1.5 size-3 rounded-full ring-2 ${BAND_MARK[percentileBand(reading.percentile)]}`}
                  style={{ left: `${reading.percentile}%` }}
                />
              </span>
              {eventHeadline(variable, reading, { translator })}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function EvidenceDoc({ file, translator, catalog }: EventDossierProps) {
  const { t, locale } = translator;
  const context = { translator, catalog };
  const days = catalog.eventWindowDays;
  const { unit, digits } = EVENT_UNITS[file.lead];
  const window = eventWindow(file, days);
  const variable = t(`pt.recent.${file.lead}`);
  const subtitle = t(unit ? "chart.ev.sub" : "chart.ev.sub.index", {
    v: variable,
    days,
    unit,
    from: file.lv.from,
    to: file.lv.series.at(-1)?.[0],
    n: file.lv.years,
  });
  return (
    <DocSection id="evidence" labelledBy="doc-evidence-title" width="full">
      <DocHeading id="doc-evidence-title">
        {t(`chart.ev.title.${file.strength}`, {
          finding: eventHeadline(file.lead, file.lv, context),
          days,
        })}
      </DocHeading>
      <ChartHead subtitle={subtitle} purpose={t("chart.ev.purpose")} />
      <EvidenceTabs
        labels={{
          aria: t("tabs.aria"),
          chart: t("tabs.chart"),
          table: t("tabs.table"),
          sources: t("tabs.sources"),
        }}
        chart={
          <>
            <SeriesChart
              data={file.lv.series}
              trend={file.lv.trend}
              digits={digits}
              unit={unit}
              direction={fileDirection(file)}
              label={eventSummary(file, context)}
              mark={{
                year: Number(window.end.slice(0, 4)),
                text: `${t("ev.mark")} · ${formatFigure(file.lv.value, digits)} ${unit}`.trim(),
              }}
              inline={{
                series: t("ev.chart.series", { days }),
                trend: file.lv.trend ? t("case.chart.inline.trend") : undefined,
              }}
            />
            <ChartCaption>
              {t("ev.evidence.caption", {
                start: formatDate(window.start, locale),
                end: formatDate(window.end, locale),
              })}
            </ChartCaption>
          </>
        }
        table={
          <Table
            caption={subtitle}
            head={
              <>
                <Th>{t("tbl.year")}</Th>
                {readings(file).map(([key]) => (
                  <Th key={key}>
                    {t(`pt.recent.${key}`)}
                    {EVENT_UNITS[key].unit ? ` (${EVENT_UNITS[key].unit})` : ""}
                  </Th>
                ))}
              </>
            }
          >
            {file.lv.series.map(([year]) => (
              <Tr key={year}>
                <Td>
                  <Mono>{year}</Mono>
                </Td>
                {readings(file).map(([key, reading]) => {
                  const point = reading.series.find(([seriesYear]) => seriesYear === year);
                  return (
                    <Td key={key}>
                      <span className="tabular-nums">
                        {point ? formatFigure(point[1], EVENT_UNITS[key].digits) : "—"}
                      </span>
                    </Td>
                  );
                })}
              </Tr>
            ))}
          </Table>
        }
        sources={
          <SourcesList
            newTabHint={t("link.newTab")}
            items={[
              {
                icon: "audit",
                name: `NASA EONET · ${file.eonet}`,
                url: eonetLink(file),
                description: t("src.d.eonet"),
              },
              ...(file.source
                ? [
                    {
                      icon: "satellite",
                      name: eonetSourceName(file.source.id),
                      url: file.source.url || null,
                      description: t("src.d.partner"),
                    },
                  ]
                : []),
              {
                icon: "chart",
                name: `NASA POWER ${t("src.daily")} · ${POWER_DAILY}`,
                url: POWER_URL,
                description: t("src.d.powerDaily", { days }),
              },
              {
                icon: "csv",
                name: "portal/scripts/build_event_files.py",
                description: t("src.d.script"),
              },
            ]}
          />
        }
      />
      <VariableRows file={file} translator={translator} />
      <p className="text-body-m text-text-secondary max-w-[72ch]">{t("ev.chance")}</p>
    </DocSection>
  );
}

function ContextDoc({ file, translator }: Pick<EventDossierProps, "file" | "translator">) {
  const { t, locale } = translator;
  return (
    <DocSection id="context" labelledBy="doc-context-title" width="full">
      <EvidenceBlock tone={FAMILY_TONE[file.family] ?? "stone"}>
        <DocHeading id="doc-context-title">{t("ev.context.title")}</DocHeading>
        {/*
         * Deferred (POC L1517-1525): the catalog audit link for this category, the GIBS image of
         * the event day, nearby EONET events (lazy year files) and the live EONET detail fetch.
         * Until then, the block keeps the event record from the static snapshot.
         */}
        <dl className="medium:grid-cols-3 grid gap-4">
          <div className="flex flex-col gap-1">
            <dt className="text-label-m text-text-secondary">{t("event.date")}</dt>
            <dd className="text-body-l text-text-primary tabular-nums">
              {formatDate(file.date, locale)}
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-label-m text-text-secondary">{t("ev.closed")}</dt>
            <dd className="text-body-l text-text-primary tabular-nums">
              {file.closed ? formatDate(file.closed.slice(0, 10), locale) : t("ev.open")}
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-label-m text-text-secondary">EONET</dt>
            <dd className="text-body-l text-text-primary">
              <ExternalLink href={eonetLink(file)} newTabHint={t("link.newTab")}>
                <Mono>{file.eonet}</Mono>
              </ExternalLink>
            </dd>
          </div>
        </dl>
        <p className="text-body-m text-text-primary">{t("src.d.eonet")}</p>
      </EvidenceBlock>
    </DocSection>
  );
}

function AppendixDoc({ file, translator, catalog }: EventDossierProps) {
  const { t } = translator;
  const days = catalog.eventWindowDays;
  const window = eventWindow(file, days);
  const newTabHint = t("link.newTab");
  return (
    <DocSection id="appendix" labelledBy="doc-appendix-title">
      <DocHeading id="doc-appendix-title">{t("case.detail")}</DocHeading>
      <p className="text-body-m text-text-secondary">
        {t("ro.strip.lead", { days, from: file.lv.from })}
      </p>
      <AnomalyReadout file={file} translator={translator} />
      <ExactNumbers
        title={t("ro.numbers")}
        csv={{ href: `/cases/${file.id}/data`, label: t("case.download") }}
        rows={[
          {
            key: "eonet",
            term: "EONET",
            value: (
              <ExternalLink href={eonetLink(file)} newTabHint={newTabHint}>
                <Mono>{file.eonet}</Mono>
              </ExternalLink>
            ),
          },
          {
            key: "source",
            term: t("event.source"),
            value: <SourceName file={file} newTabHint={newTabHint} />,
          },
          {
            key: "window",
            term: t("ev.window"),
            value: (
              <Mono>
                {window.start} → {window.end} ({t("ev.window.days", { n: days })})
              </Mono>
            ),
          },
          {
            key: "baseline",
            term: t("ev.baseline"),
            value: (
              <Mono>
                {file.lv.from}–{eventYear(file) - 1} · n = {file.lv.years - 1}
              </Mono>
            ),
          },
          {
            key: "stat",
            term: t("ev.stat"),
            value: (
              <Mono>
                <GlossaryTerm term="z" label="z" translator={translator} /> ={" "}
                {formatFigure(file.lv.z, 2, true)} · P{file.lv.percentile} ·{" "}
                {t("ev.rank", { r: file.lv.rank, n: file.lv.years })}
              </Mono>
            ),
          },
          {
            key: "dataset",
            term: t("case.detail.source"),
            value: (
              <ExternalLink href={POWER_URL} newTabHint={newTabHint}>
                NASA POWER {t("src.daily")} · {POWER_DAILY}
              </ExternalLink>
            ),
          },
        ]}
      />
    </DocSection>
  );
}

export function EventDossier({ file, translator, catalog }: EventDossierProps) {
  const { t } = translator;
  const context = { translator, catalog };
  const next = nextFile(file, catalog);
  const nextMeta =
    next.kind === "event"
      ? `${next.catalog} · ${themeLabel(next.category, context)} · ${t(`reg.${next.region}`)}`
      : next.catalog;
  return (
    <DossierFrame
      crumbs={{
        href: "/cases?kind=event",
        label: t("arch.kind.event"),
        current: file.catalog,
        navLabel: t("nav.breadcrumb"),
      }}
      spine={{
        label: t("doc.index"),
        docs: (["cover", "evidence", "context", "limits", "appendix"] as const).map((id) => ({
          id,
          label: t(`doc.${id}`),
        })),
      }}
    >
      {/* Deferred: read/recent tracking in localStorage (POC markRead). */}
      <CoverDoc file={file} translator={translator} catalog={catalog} />
      <EvidenceDoc file={file} translator={translator} catalog={catalog} />
      <ContextDoc file={file} translator={translator} />
      <DocSection id="limits" labelledBy="doc-limits-title">
        <DocHeading id="doc-limits-title">{t("case.limits")}</DocHeading>
        <Lead>
          {t("ev.limits", {
            cat: themeLabel(file.category, context).toLocaleLowerCase(translator.locale),
          })}
        </Lead>
      </DocSection>
      <AppendixDoc file={file} translator={translator} catalog={catalog} />
      <NextCase
        label={t("case.next.label")}
        relatedLabel={t("case.related")}
        next={{ href: `/cases/${next.id}`, title: fileTitle(next, context), meta: nextMeta }}
        links={[
          {
            href: `/cases?region=${file.region}`,
            icon: "cases",
            label: t("case.sector", { region: t(`reg.${file.region}`) }),
          },
        ]}
      />
    </DossierFrame>
  );
}
