import type { Translator } from "@/shared/lib/i18n";
import { Icon } from "@/shared/ui/icon";
import { Table, Td, Th, Tr } from "@/shared/ui/table";
import { ExternalLink } from "@/shared/ui/text-link";
import {
  period,
  relativeChange,
  trendDirection,
  verdictOf,
  type Direction,
  type TrendCase,
} from "../../domain/case-file";
import { nextFile, pairFile } from "../../domain/case-links";
import type { CaseCatalog } from "../../domain/catalog";
import {
  changeLabel,
  fileName,
  rateLabel,
  strengthWord,
  themeLabel,
  trendText,
  verdictLabel,
} from "../../domain/file-text";
import {
  formatCoordinates,
  formatFigure,
  formatOdds,
  formatP,
  unitLabel,
  variableUnit,
} from "../../domain/format";
import { EvidenceMeter } from "../evidence-meter";
import { SeriesChart } from "../series-chart";
import { VerdictStamp } from "../verdict-stamp";
import {
  ChartCaption,
  ChartHead,
  EvidenceBlock,
  EvidenceTabs,
  Lead,
  PropsList,
  SourcesList,
  THEME_TONE,
} from "./doc-parts";
import { DocHeading, DocSection, DossierFrame } from "./dossier-frame";
import { ExactNumbers, Mono } from "./exact-numbers";
import { GlossaryTerm } from "./glossary-term";
import { NextCase } from "./next-case";
import { TrendReadout } from "./trend-readout";

/* Trend file (POC renderCase, app.js L1202): five numbered documents on a sticky spine. */

type TrendDossierProps = { file: TrendCase; translator: Translator; catalog: CaseCatalog };

const POWER_URL = "https://power.larc.nasa.gov/";
const MODIS_URL = "https://modis.ornl.gov/";

const DIRECTION_INK: Record<Direction, string> = {
  up: "text-trend-up",
  down: "text-trend-down",
  flat: "text-trend-neutral",
};

function CoverDoc({ file, translator, catalog }: TrendDossierProps) {
  const { t, locale } = translator;
  const context = { translator, catalog };
  const { from, to } = period(file.series);
  const unit = variableUnit(file.unit, locale);
  return (
    <DocSection id="cover" label={t("doc.cover")}>
      <p className="text-overline text-text-secondary font-mono">
        {file.catalog} · {themeLabel(file.theme, context)}
      </p>
      <h1 className="text-display-s font-display text-text-primary text-balance">
        {trendText(file, "title", context)}
      </h1>
      <Lead>{trendText(file, "summary", context)}</Lead>
      <PropsList
        rows={[
          {
            icon: "decide",
            label: (
              <GlossaryTerm term="verdict" label={t("prop.verdict")} translator={translator} />
            ),
            value: (
              <>
                <VerdictStamp verdict={verdictOf(file)} label={verdictLabel(file, context)} />
                <EvidenceMeter strength={file.t.strength} word={strengthWord(file, context)} />
              </>
            ),
          },
          {
            icon: file.theme,
            label: t("prop.variable"),
            value: (
              <span>
                {t(`var.${file.variable}`)}
                {unit ? <span className="text-text-secondary"> ({unit})</span> : null}
              </span>
            ),
          },
          {
            icon: "map-pin",
            label: t("prop.place"),
            value: (
              <span>
                {fileName(file, context)} · {trendText(file, "region", context)} ·{" "}
                <Mono>{formatCoordinates(file.lat, file.lon)}</Mono>
              </span>
            ),
          },
          {
            icon: "calendar",
            label: t("prop.period"),
            value: (
              <span>
                <span className="tabular-nums">
                  {from}–{to}
                </span>{" "}
                · {t("prop.years", { n: file.series.length })}
              </span>
            ),
          },
          {
            icon: "satellite",
            label: t("prop.source"),
            value:
              file.source === "modis" ? (
                <span>MODIS/Terra MOD13Q1 · 250 m · ORNL DAAC</span>
              ) : (
                <span>
                  NASA POWER · <GlossaryTerm term="merra" label="MERRA-2" translator={translator} />{" "}
                  · 0.5° × 0.625°
                </span>
              ),
          },
        ]}
      />
    </DocSection>
  );
}

function EvidenceDoc({ file, translator, catalog }: TrendDossierProps) {
  const { t, locale } = translator;
  const context = { translator, catalog };
  const direction = trendDirection(file.t);
  const { from, to } = period(file.series);
  const unit = unitLabel(file.unit, locale);
  const variable = t(`var.${file.variable}`);
  const columnUnit = variableUnit(file.unit, locale);
  const digits = file.digits + 1;
  const source =
    file.source === "modis"
      ? "MODIS/Terra MOD13Q1 · 250 m · ORNL DAAC"
      : "NASA POWER · MERRA-2 · 0.5° × 0.625°";
  const claim = t(file.t.significant ? "case.claim" : "case.claim.flat", {
    v: variable,
    place: fileName(file, context),
    total: changeLabel(file, context),
    from,
  });
  const subtitle = t(!unit || file.unit === "NDVI" ? "chart.case.sub.index" : "chart.case.sub", {
    v: variable,
    agg: t(file.source === "modis" ? "chart.case.agg.season" : "chart.case.agg.year"),
    unit,
    from,
    to,
    n: file.series.length,
  });

  return (
    <DocSection id="evidence" labelledBy="doc-evidence-title" width="full">
      <DocHeading id="doc-evidence-title">{claim}</DocHeading>
      <p
        className={`text-figure-l flex items-baseline gap-2.5 font-mono ${DIRECTION_INK[direction]}`}
      >
        <span className="self-center">
          <Icon name={direction} size="lg" />
        </span>
        {rateLabel(file, context)}
        <span className="text-body-m text-text-secondary font-sans">{t("perDecade")}</span>
      </p>
      <ChartHead subtitle={subtitle} purpose={t("chart.case.purpose")} />
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
              data={file.series}
              trend={file.t}
              digits={file.digits}
              unit={unit}
              direction={direction}
              label={trendText(file, "summary", context)}
              recordLabel={t(direction === "down" ? "chart.min" : "chart.max")}
              inline={{
                series: t("case.chart.inline.series"),
                trend: t("case.chart.inline.trend"),
                band: t("case.chart.inline.band"),
              }}
            />
            <ChartCaption>
              {t("case.evidence.caption", { source })}
              {relativeChange(file) === null ? "" : ` ${t("case.rel.note", { from, to })}`}
            </ChartCaption>
          </>
        }
        table={
          <Table
            caption={subtitle}
            head={
              <>
                <Th>{t("tbl.year")}</Th>
                <Th>
                  {variable}
                  {columnUnit ? ` (${columnUnit})` : ""}
                </Th>
                <Th>{t("case.chart.inline.trend")}</Th>
              </>
            }
          >
            {file.series.map(([year, value]) => (
              <Tr key={year}>
                <Td>
                  <Mono>{year}</Mono>
                </Td>
                <Td>
                  <span className="tabular-nums">{formatFigure(value, digits)}</span>
                </Td>
                <Td>
                  <span className="tabular-nums">
                    {formatFigure(file.t.intercept + file.t.slope * year, digits)}
                  </span>
                </Td>
              </Tr>
            ))}
          </Table>
        }
        sources={
          <SourcesList
            newTabHint={t("link.newTab")}
            items={[
              file.source === "modis"
                ? {
                    icon: "satellite",
                    name: "MODIS/Terra MOD13Q1 v061 · ORNL DAAC",
                    url: MODIS_URL,
                    description: t("src.d.modis"),
                  }
                : {
                    icon: "chart",
                    name: `NASA POWER · ${file.variable}`,
                    url: POWER_URL,
                    description: t("src.d.power"),
                  },
              {
                icon: "csv",
                name: "portal/scripts/build_cases.py",
                description: t("src.d.script"),
              },
            ]}
          />
        }
      />
      <p className="text-body-m text-text-secondary max-w-[72ch]">
        {t("case.chance", { odds: formatOdds(file.t.p, translator) })}
      </p>
      {/* Deferred (POC L1250-1258): GIBS then/now images from orbit and nearby EONET events. */}
    </DocSection>
  );
}

function AppendixDoc({ file, translator, catalog }: TrendDossierProps) {
  const { t, locale } = translator;
  const context = { translator, catalog };
  const unit = unitLabel(file.unit, locale);
  const digits = file.digits + 1;
  const newTabHint = t("link.newTab");
  return (
    <DocSection id="appendix" labelledBy="doc-appendix-title">
      <DocHeading id="doc-appendix-title">{t("case.detail")}</DocHeading>
      <p className="text-body-m text-text-secondary">{t("ro.lead")}</p>
      <TrendReadout file={file} translator={translator} />
      <ExactNumbers
        title={t("ro.numbers")}
        csv={{ href: `/cases/${file.id}/data`, label: t("case.download") }}
        rows={[
          {
            key: "test",
            term: <GlossaryTerm term="mk" label={t("case.detail.test")} translator={translator} />,
            value: (
              <Mono>
                S = {file.t.s} · Z = {file.t.z.toFixed(2)} · τ = {file.t.tau.toFixed(2)} · p{" "}
                {formatP(file.t.p)}
              </Mono>
            ),
          },
          {
            key: "slope",
            term: (
              <GlossaryTerm
                term="theilsen"
                label={t("case.detail.slope")}
                translator={translator}
              />
            ),
            value: (
              <Mono>
                {[formatFigure(file.t.slope, file.digits + 2, true), unit]
                  .filter(Boolean)
                  .join(" ")}{" "}
                {t("unit.year")}
              </Mono>
            ),
          },
          {
            key: "ci",
            term: t("case.detail.ci"),
            value: (
              <Mono>
                [{formatFigure(file.t.slopeLow * 10, digits, true)},{" "}
                {formatFigure(file.t.slopeHigh * 10, digits, true)}] {unit} {t("unit.decade")}
              </Mono>
            ),
          },
          {
            key: "snr",
            term: t("case.appendix.snr"),
            value: (
              <>
                <Mono>{file.t.snr.toFixed(1)}×</Mono>{" "}
                <span className="text-text-secondary">
                  · {t("case.metric.snr.d", { x: file.t.snr.toFixed(1) })}
                </span>
              </>
            ),
          },
          { key: "n", term: t("case.detail.n"), value: <Mono>n = {file.t.n}</Mono> },
          {
            key: "metric",
            term: t("case.detail.metric"),
            value: trendText(file, "metric", context),
          },
          {
            key: "source",
            term: t("case.detail.source"),
            value:
              file.source === "modis" ? (
                <ExternalLink href={MODIS_URL} newTabHint={newTabHint}>
                  MOD13Q1 v061 · ORNL DAAC
                </ExternalLink>
              ) : (
                <ExternalLink href={POWER_URL} newTabHint={newTabHint}>
                  NASA POWER · {file.variable}
                </ExternalLink>
              ),
          },
        ]}
      />
    </DocSection>
  );
}

export function TrendDossier({ file, translator, catalog }: TrendDossierProps) {
  const { t } = translator;
  const context = { translator, catalog };
  const next = nextFile(file, catalog);
  const pair = pairFile(file, catalog);
  return (
    <DossierFrame
      crumbs={{
        href: "/cases",
        label: t("crumb.cases"),
        current: file.catalog,
        navLabel: t("nav.breadcrumb"),
      }}
      spine={{
        label: t("doc.index"),
        docs: (["cover", "evidence", "why", "limits", "appendix"] as const).map((id) => ({
          id,
          label: t(`doc.${id}`),
        })),
      }}
    >
      {/* Deferred: read/recent tracking in localStorage (POC markRead). */}
      <CoverDoc file={file} translator={translator} catalog={catalog} />
      <EvidenceDoc file={file} translator={translator} catalog={catalog} />
      <DocSection id="why" labelledBy="doc-why-title" width="full">
        <EvidenceBlock tone={THEME_TONE[file.theme] ?? "stone"}>
          <DocHeading id="doc-why-title">{t("case.why")}</DocHeading>
          <p className="text-label-m text-text-secondary flex items-center gap-2">
            <Icon name="info" />
            {t("case.why.tag")}
          </p>
          <p className="text-body-l text-text-primary max-w-[68ch]">
            {trendText(file, "why", context)}
          </p>
        </EvidenceBlock>
      </DocSection>
      <DocSection id="limits" labelledBy="doc-limits-title">
        <DocHeading id="doc-limits-title">{t("case.limits")}</DocHeading>
        <Lead>{trendText(file, "limits", context)}</Lead>
      </DocSection>
      <AppendixDoc file={file} translator={translator} catalog={catalog} />
      <NextCase
        label={t("case.next.label")}
        relatedLabel={t("case.related")}
        next={{
          href: `/cases/${next.id}`,
          title: next.kind === "trend" ? trendText(next, "title", context) : next.title,
          meta: `${next.catalog} · ${fileName(next, context)}`,
        }}
        links={[
          ...(pair
            ? [
                {
                  href: `/cases/${pair.id}`,
                  icon: "flat",
                  label: `${t("case.pair")}: ${fileName(pair, context)}`,
                },
              ]
            : []),
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
