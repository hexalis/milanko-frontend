import Form from "next/form";
import Link from "next/link";
import { formatDate } from "@/modules/cases";
import type { VariableCoverage } from "@/modules/coverage";
import { withBasePath } from "@/shared/lib/base-path";
import { formatNumber, withUnit } from "@/shared/lib/format";
import type { Translator } from "@/shared/lib/i18n";
import { toQueryString } from "@/shared/lib/search-params";
import { AutoSubmitSelect } from "@/shared/ui/auto-submit-select";
import { Button, buttonLink } from "@/shared/ui/button";
import { CopyLinkButton } from "@/shared/ui/copy-link-button";
import { Field, TextInput } from "@/shared/ui/field";
import { Icon } from "@/shared/ui/icon";
import { Notice } from "@/shared/ui/notice";
import { StatCard, StatGrid } from "@/shared/ui/stat-card";
import { latestAnomaly, readTrend, type AnomalyPoint, type RegionTrend } from "../domain/analysis";
import {
  formatRegionCode,
  type LatestVariable,
  type Region,
  type RegionEvent,
} from "../domain/region";
import {
  formatFor,
  isConfirmed,
  oneIn,
  perDecade,
  RAREST,
  readableUnit,
  type RegionPlace,
} from "../domain/reading";
import { summarizeObservations, type Observation } from "../domain/series";
import { RegionTabs, REGION_TABS, type RegionTab } from "./region-tabs";

type RegionExplorerQuery = {
  region: Region;
  variable: VariableCoverage;
  start: string;
  end: string;
  /** Where the region sits, when the link from the globe says so. */
  place?: RegionPlace;
  tab: RegionTab;
  /** Anomalies on or after this date fill the 12-month chart. */
  anomalySince: string;
  /** Shortcut range for the "last 30 days" link. */
  lastMonth: { start: string; end: string };
};

/** A section that loaded, or the reason it did not. */
export type Loaded<T> = { data: T } | { error: string };

type RegionExplorerScreenProps = {
  translator: Translator;
  regions: readonly Region[];
  variables: readonly VariableCoverage[];
  query: RegionExplorerQuery;
  observations: Observation[];
  trend: Loaded<RegionTrend | null>;
  anomalies: Loaded<AnomalyPoint[]>;
  latest: Loaded<LatestVariable[]>;
  events: Loaded<{ total: number; events: RegionEvent[] }>;
  maxObservations: number;
};

/** A NASA variable in words, or the catalog's own name when the copy has none. */
function variableName(translator: Translator, code: string, fallback: string): string {
  return translator.has(`var.${code}`) ? translator.t(`var.${code}`) : fallback;
}

function TrendCard({
  trend,
  unit,
  translator,
}: {
  trend: Loaded<RegionTrend | null>;
  unit: string;
  translator: Translator;
}) {
  const { t, locale } = translator;
  const label = t("rx.trend.label");
  if ("error" in trend)
    return <StatCard label={label} value="—" meta={t("rx.trend.error", { error: trend.error })} />;
  const reading = readTrend(trend.data);
  if (reading.kind === "missing")
    return <StatCard label={label} value="—" meta={t("rx.trend.missing")} />;
  if (reading.kind === "too-short")
    return (
      <StatCard label={label} value="—" meta={t("rx.trend.short", { months: reading.months })} />
    );
  const slope = withUnit(
    formatFor(perDecade(reading.slopePerYear), locale, { signed: true }),
    unit,
  );
  return (
    <StatCard
      label={label}
      value={t("rx.trend.value", { slope })}
      meta={t(isConfirmed(reading.pValue) ? "rx.trend.yes" : "rx.trend.no", {
        months: reading.months,
      })}
    />
  );
}

function RarityCard({
  point,
  translator,
}: {
  point: AnomalyPoint | undefined;
  translator: Translator;
}) {
  const { t, locale } = translator;
  const label = t("rx.rare.label");
  if (!point) return <StatCard label={label} value="—" meta={t("rx.rare.none")} />;
  const date = formatDate(point.time, locale);
  const n = oneIn(point.z);
  if (n === null)
    return (
      <StatCard
        label={label}
        value={t("rx.rare.normal")}
        meta={t("rx.rare.normal.meta", { date })}
      />
    );
  return (
    <StatCard
      label={label}
      value={
        n >= RAREST
          ? t("rx.rare.rarest")
          : t("rx.rare.value", { n: formatFor(n, locale, { digits: 0 }) })
      }
      meta={t("rx.rare.meta", { date })}
    />
  );
}

/**
 * A data region's record: one sentence on what matters (the latest day against normal), three
 * figures in words, and the rest in tabs, each chart with its "How do I read this?". Filters,
 * period and tab live in the URL, so a record can be shared as it is.
 */
export function RegionExplorerScreen(props: RegionExplorerScreenProps) {
  const { translator, regions, variables, query, observations, anomalies } = props;
  const { t, locale } = translator;
  const { region, variable, place } = query;
  const code = formatRegionCode(region.code);
  const unit = readableUnit(variable.unit, locale);
  const name = variableName(translator, variable.variable, variable.name);
  const where = place
    ? t("rx.where.place", { code, place: t(`reg.${place}`) })
    : t("rx.where", { code });
  const summary = summarizeObservations(observations);
  const anomalyPoints = "data" in anomalies ? anomalies.data : [];
  const lastPoint = latestAnomaly(anomalyPoints);
  const viewHref = (overrides: Record<string, string | number | undefined>) =>
    `/regions${toQueryString({ region: region.code, variable: variable.variable, start: query.start, end: query.end, place, tab: query.tab, ...overrides })}`;
  const csvHref = withBasePath(
    `/regions/${region.code}/observations${toQueryString({ variable: variable.variable, start: query.start, end: query.end })}`,
  );
  const globeHref = `/explore${toQueryString({ layer: "data", variable: variable.variable, date: query.end })}`;

  // The sentence: the latest day, and how it sat against normal when that day was compared.
  const latest = summary.latest;
  const compared =
    latest && lastPoint?.time === latest.date && typeof lastPoint.anomaly === "number"
      ? lastPoint
      : undefined;
  const value = latest ? withUnit(formatFor(latest.value, locale), unit) : "";
  const date = latest ? formatDate(latest.date, locale) : "";
  const vars = { variable: name, where, value, date };
  const headline = !latest
    ? t("rx.head.none", { variable: name.toLowerCase(), where })
    : !compared || typeof compared.anomaly !== "number"
      ? t("rx.head.value", vars)
      : t(
          compared.anomaly > 0
            ? "rx.head.above"
            : compared.anomaly < 0
              ? "rx.head.below"
              : "rx.head.equal",
          { ...vars, diff: withUnit(formatFor(Math.abs(compared.anomaly), locale), unit) },
        );
  const pct = typeof compared?.percentile === "number" ? Math.round(compared.percentile) : null;
  const sinceYear = anomalyPoints[0]?.time.slice(0, 4);

  return (
    <>
      <Link
        href={globeHref}
        className="text-label-m text-text-link hover:text-text-brand inline-flex w-fit items-center gap-1.5 font-semibold"
      >
        <span aria-hidden="true">←</span>
        {t("rx.back")}
      </Link>

      <Form
        action="/regions"
        data-tour="rx-filters"
        className="rounded-card border-border-subtle bg-bg-surface shadow-card flex flex-wrap items-end gap-3 border p-4"
      >
        <input type="hidden" name="tab" value={query.tab} />
        <div className="medium:w-56 w-full">
          <Field label={t("rx.f.region")}>
            <AutoSubmitSelect name="region" urlValue={String(region.code)}>
              {regions.map((row) => (
                <option key={row.code} value={row.code}>
                  {t("rx.f.region.opt", { code: formatRegionCode(row.code) })}
                </option>
              ))}
            </AutoSubmitSelect>
          </Field>
        </div>
        <div className="medium:w-80 w-full">
          <Field label={t("rx.f.variable")}>
            <AutoSubmitSelect name="variable" urlValue={variable.variable}>
              {variables.map((row) => (
                <option key={row.variable} value={row.variable}>
                  {variableName(translator, row.variable, row.name)} · {row.variable}
                </option>
              ))}
            </AutoSubmitSelect>
          </Field>
        </div>
        {/* The period is the least used part: one tap away, with the current one written beside it. */}
        <details className="group/period w-full">
          <summary className="text-label-m text-text-link w-fit cursor-pointer py-2 font-semibold">
            {t("rx.f.period")} ·{" "}
            <span className="text-text-secondary font-normal">
              {formatDate(query.start, locale)} – {formatDate(query.end, locale)}
            </span>
          </summary>
          <div className="flex flex-wrap items-end gap-3 pt-2">
            <div className="w-44">
              <Field label={t("rx.f.from")}>
                <TextInput name="start" type="date" defaultValue={query.start} />
              </Field>
            </div>
            <div className="w-44">
              <Field label={t("rx.f.to")}>
                <TextInput name="end" type="date" defaultValue={query.end} />
              </Field>
            </div>
            <Button type="submit">{t("rx.f.load")}</Button>
            <Link className={buttonLink({ intent: "secondary" })} href={viewHref(query.lastMonth)}>
              {t("rx.f.month")}
            </Link>
          </div>
        </details>
        <div className="flex flex-wrap gap-2">
          <a className={buttonLink({ intent: "secondary" })} href={csvHref} download>
            <Icon name="download" />
            {t("rx.f.csv")}
          </a>
          <CopyLinkButton />
        </div>
      </Form>

      {observations.length >= props.maxObservations ? (
        <Notice>{t("rx.cap", { max: formatNumber(props.maxObservations, 0) })}</Notice>
      ) : null}

      <section
        data-tour="rx-summary"
        aria-label={t("rx.meta")}
        className="rounded-card border-border-subtle bg-bg-surface-sunken grid gap-2 border p-5"
      >
        <p className="text-heading-h3 font-display text-text-primary max-w-[60ch] text-balance">
          {headline}
        </p>
        {pct !== null && sinceYear ? (
          <p className="text-body-m text-text-secondary">
            {t(pct >= 50 ? "rx.head.pct.above" : "rx.head.pct.below", {
              pct: pct >= 50 ? pct : 100 - pct,
              year: sinceYear,
            })}
          </p>
        ) : null}
      </section>

      <div data-tour="rx-figures">
        <StatGrid columns={3}>
          <TrendCard trend={props.trend} unit={unit} translator={translator} />
          <RarityCard point={lastPoint} translator={translator} />
          <StatCard
            label={t("rx.src.label")}
            value={variable.source}
            meta={t("rx.src.meta", { code: variable.variable })}
          />
        </StatGrid>
      </div>

      <nav aria-label={t("rx.tabs")} data-tour="rx-tabs" className="border-border-subtle border-b">
        <ul className="-mb-px flex gap-1 overflow-x-auto">
          {REGION_TABS.map((tab) => (
            <li key={tab}>
              <Link
                href={viewHref({ tab })}
                scroll={false}
                aria-current={tab === query.tab ? "page" : undefined}
                className="text-label-l text-text-secondary hover:text-text-primary aria-[current=page]:border-action-primary aria-[current=page]:text-text-primary block border-b-2 border-transparent px-3 py-2.5 whitespace-nowrap"
              >
                {t(`rx.tab.${tab}`)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <RegionTabs
        tab={query.tab}
        translator={translator}
        variableLabel={name}
        unit={unit}
        observations={observations}
        anomalies={anomalies}
        anomalySince={query.anomalySince}
        latest={props.latest}
        events={props.events}
        currentVariable={variable.variable}
        variableHref={(next) => viewHref({ variable: next })}
      />
    </>
  );
}
