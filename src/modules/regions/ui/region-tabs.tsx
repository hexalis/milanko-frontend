import type { ReactNode } from "react";
import { formatDate } from "@/modules/cases";
import { withUnit } from "@/shared/lib/format";
import type { Translator } from "@/shared/lib/i18n";
import { Icon } from "@/shared/ui/icon";
import { Notice } from "@/shared/ui/notice";
import { Panel } from "@/shared/ui/panel";
import { CellNote, EmptyRow, Table, Td, Th } from "@/shared/ui/table";
import { TextLink } from "@/shared/ui/text-link";
import { layoutCalendar, recentAnomalies, type AnomalyPoint } from "../domain/analysis";
import type { LatestVariable, RegionEvent } from "../domain/region";
import { formatFor, normalBand, readableUnit } from "../domain/reading";
import { toSeries, type Observation } from "../domain/series";
import { AnomalyBarsChart } from "./anomaly-bars-chart";
import { AnomalyCalendar } from "./anomaly-calendar";
import { SeriesChart } from "./series-chart";

export const REGION_TABS = ["history", "calendar", "variables", "events"] as const;
export type RegionTab = (typeof REGION_TABS)[number];

type Loaded<T> = { data: T } | { error: string };

type RegionTabsProps = {
  tab: RegionTab;
  translator: Translator;
  /** The variable on screen, in words. */
  variableLabel: string;
  unit: string;
  observations: readonly Observation[];
  anomalies: Loaded<AnomalyPoint[]>;
  anomalySince: string;
  latest: Loaded<LatestVariable[]>;
  events: Loaded<{ total: number; events: RegionEvent[] }>;
  currentVariable: string;
  variableHref: (code: string) => string;
};

const RECENT_ROWS = 40;
/** Cards and events shown before the "see all" fold. */
const SHOWN_VARIABLES = 6;
const SHOWN_EVENTS = 3;

/** "How do I read this?": folded under its chart, or open where a chart needs it the first time. */
function HowToRead({
  label,
  children,
  isOpen = false,
}: {
  label: string;
  children: ReactNode;
  isOpen?: boolean;
}) {
  return (
    <details open={isOpen} className="group/how border-border-subtle mt-4 border-t pt-3">
      <summary className="text-label-m text-text-link flex w-fit cursor-pointer list-none items-center gap-1.5 font-semibold [&::-webkit-details-marker]:hidden">
        <Icon name="info" />
        {label}
        <span className="transition-transform group-open/how:rotate-90" aria-hidden="true">
          <Icon name="caret-right" size="sm" />
        </span>
      </summary>
      <p className="text-body-m text-text-secondary mt-2 max-w-[70ch]">{children}</p>
    </details>
  );
}

/** A fold for the rest of a list or the raw table: a quiet link-like summary. */
function More({ label, children }: { label: string; children: ReactNode }) {
  return (
    <details className="group/more mt-4">
      <summary className="text-label-m text-text-link flex w-fit cursor-pointer list-none items-center gap-1.5 font-semibold [&::-webkit-details-marker]:hidden">
        <span className="transition-transform group-open/more:rotate-90" aria-hidden="true">
          <Icon name="caret-right" size="sm" />
        </span>
        {label}
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}

function History(props: RegionTabsProps) {
  const { translator, observations, anomalies, unit } = props;
  const { t, locale } = translator;
  const series = toSeries(observations);
  const band = series.isMonthlyMean ? normalBand(series.points) : undefined;
  const first = series.points[0];
  const last = series.points.at(-1);
  const range =
    first && last
      ? { from: formatDate(first.date, locale), to: formatDate(last.date, locale) }
      : null;
  const bars = recentAnomalies("data" in anomalies ? anomalies.data : [], props.anomalySince);
  const recent = observations.slice(-RECENT_ROWS).toReversed();

  return (
    <>
      <Panel
        title={t("rx.hist.title")}
        meta={
          range
            ? `${t(series.isMonthlyMean ? "rx.hist.meta.month" : "rx.hist.meta.day", range)}${unit ? ` · ${unit}` : ""}`
            : undefined
        }
      >
        {band ? (
          <ul className="text-label-s text-text-secondary mb-2 flex flex-wrap gap-x-4 gap-y-1">
            <li className="flex items-center gap-1.5">
              <span className="bg-chart-1 inline-block h-0.5 w-5 rounded-full" aria-hidden="true" />
              {t("rx.hist.line")}
            </li>
            <li className="flex items-center gap-1.5">
              <span
                className="bg-text-tertiary inline-block size-3 rounded-sm opacity-40"
                aria-hidden="true"
              />
              {t("rx.hist.band")}
            </li>
          </ul>
        ) : null}
        <SeriesChart
          points={series.points}
          band={band}
          label={props.variableLabel}
          translator={translator}
        />
        <HowToRead label={t("rx.how")}>
          {t(series.isMonthlyMean ? "rx.hist.how.month" : "rx.hist.how.day")}
        </HowToRead>
      </Panel>
      <Panel
        title={t("rx.bars.title")}
        meta={t("rx.bars.meta", { date: formatDate(props.anomalySince, locale) })}
      >
        <AnomalyBarsChart bars={bars} translator={translator} />
        <HowToRead label={t("rx.how")}>{t("rx.bars.how")}</HowToRead>
      </Panel>
      <More label={t("rx.table.open")}>
        <p className="text-body-s text-text-secondary mb-2">
          {t("rx.table.note", { n: recent.length })}
        </p>
        <Table
          caption={t("rx.table.caption")}
          head={
            <>
              <Th>{t("rx.table.date")}</Th>
              <Th>{t("rx.table.value")}</Th>
              <Th>{t("rx.table.quality")}</Th>
              <Th>{t("rx.table.valid")}</Th>
            </>
          }
        >
          {recent.length ? (
            recent.map((row) => (
              <tr key={row.date}>
                <Td>{formatDate(row.date, locale)}</Td>
                <Td>
                  {withUnit(
                    formatFor(row.value, locale, { digits: 3 }),
                    readableUnit(row.unit, locale),
                  )}
                </Td>
                <Td>{row.quality}</Td>
                <Td>{formatFor(row.valid_fraction, locale, { digits: 3 })}</Td>
              </tr>
            ))
          ) : (
            <EmptyRow columns={4}>{t("rx.empty")}</EmptyRow>
          )}
        </Table>
      </More>
    </>
  );
}

function Calendar({ translator, anomalies, variableLabel }: RegionTabsProps) {
  const { t, locale } = translator;
  const calendar = "data" in anomalies ? layoutCalendar(anomalies.data) : null;
  return (
    <Panel
      title={t("rx.cal.title")}
      meta={
        calendar
          ? t("rx.cal.meta", {
              from: calendar.firstYear,
              to: calendar.lastYear,
              days: formatFor(calendar.dayCount, locale, { digits: 0 }),
            })
          : undefined
      }
    >
      {"error" in anomalies ? (
        <Notice tone="error">{t("rx.cal.error", { error: anomalies.error })}</Notice>
      ) : calendar ? (
        <AnomalyCalendar layout={calendar} variable={variableLabel} translator={translator} />
      ) : (
        <p className="text-text-tertiary">{t("rx.cal.none")}</p>
      )}
      {/* The calendar is the least familiar chart: its explanation starts open. */}
      <HowToRead label={t("rx.how")} isOpen>
        {t("rx.cal.how")}
      </HowToRead>
    </Panel>
  );
}

function VariableCard({ row, props }: { row: LatestVariable; props: RegionTabsProps }) {
  const { t, locale } = props.translator;
  const isCurrent = row.variable === props.currentVariable;
  const name = props.translator.has(`var.${row.variable}`) ? t(`var.${row.variable}`) : row.name;
  return (
    <li className="rounded-field border-border-subtle bg-bg-surface flex flex-col gap-1 border p-4">
      <p className="text-label-l text-text-primary">{name}</p>
      <p className="text-heading-h4 font-display text-text-primary tabular-nums">
        {withUnit(formatFor(row.value, locale), readableUnit(row.unit, locale))}
      </p>
      <p className="text-body-s text-text-tertiary">
        {t("rx.vars.on", { date: formatDate(row.date, locale) })} · {row.source} · {row.variable}
      </p>
      <p className="text-body-s mt-auto pt-1">
        {isCurrent ? (
          <span className="text-text-secondary">{t("rx.vars.current")}</span>
        ) : (
          <TextLink href={props.variableHref(row.variable)} scroll={false}>
            {t("rx.vars.see")}
          </TextLink>
        )}
      </p>
    </li>
  );
}

function Variables(props: RegionTabsProps) {
  const { t } = props.translator;
  const { latest } = props;
  if ("error" in latest)
    return <Notice tone="error">{t("rx.vars.error", { error: latest.error })}</Notice>;
  // The variable on screen first, then the rest as the API lists them.
  const rows = latest.data.toSorted(
    (a, b) =>
      Number(b.variable === props.currentVariable) - Number(a.variable === props.currentVariable),
  );
  const grid = (items: readonly LatestVariable[]) => (
    <ul className="medium:grid-cols-2 expanded:grid-cols-3 grid grid-cols-1 gap-3">
      {items.map((row) => (
        <VariableCard key={`${row.source}:${row.variable}`} row={row} props={props} />
      ))}
    </ul>
  );
  return (
    <Panel title={t("rx.vars.title")} meta={t("rx.vars.meta", { n: rows.length })}>
      {rows.length ? (
        grid(rows.slice(0, SHOWN_VARIABLES))
      ) : (
        <p className="text-text-tertiary">{t("rx.empty")}</p>
      )}
      {rows.length > SHOWN_VARIABLES ? (
        <More label={t("rx.vars.more", { n: rows.length })}>
          {grid(rows.slice(SHOWN_VARIABLES))}
        </More>
      ) : null}
    </Panel>
  );
}

const DAY_MS = 86_400_000;

function EventItem({ event, translator }: { event: RegionEvent; translator: Translator }) {
  const { t, locale } = translator;
  const days =
    event.first_date && event.last_date
      ? Math.round((Date.parse(event.last_date) - Date.parse(event.first_date)) / DAY_MS) + 1
      : null;
  return (
    <li className="border-border-subtle grid gap-0.5 border-l-2 py-1 ps-4">
      <p className="text-label-s text-text-tertiary">
        {event.first_date ? formatDate(event.first_date, locale) : "—"}
      </p>
      <p className="text-label-l text-text-primary">{event.title}</p>
      <p className="text-body-s text-text-secondary">
        {[
          event.category,
          days ? (days === 1 ? t("rx.ev.day") : t("rx.ev.days", { n: days })) : null,
        ]
          .filter(Boolean)
          .join(" · ")}
        {" · "}
        <TextLink href={`/events/${encodeURIComponent(event.id)}`}>
          {t("rx.ev.context")} <span aria-hidden="true">→</span>
        </TextLink>
      </p>
      <CellNote>{event.id}</CellNote>
    </li>
  );
}

function Events({ translator, events }: RegionTabsProps) {
  const { t } = translator;
  if ("error" in events)
    return <Notice tone="error">{t("rx.ev.error", { error: events.error })}</Notice>;
  const { total, events: rows } = events.data;
  const list = (items: readonly RegionEvent[]) => (
    <ol className="grid gap-3">
      {items.map((event) => (
        <EventItem key={event.id} event={event} translator={translator} />
      ))}
    </ol>
  );
  return (
    <Panel title={t("rx.ev.title")} meta={t("rx.ev.meta", { n: total })}>
      {rows.length ? (
        list(rows.slice(0, SHOWN_EVENTS))
      ) : (
        <p className="text-text-tertiary">{t("rx.ev.none")}</p>
      )}
      {rows.length > SHOWN_EVENTS ? (
        <More label={t("rx.ev.more", { n: rows.length })}>{list(rows.slice(SHOWN_EVENTS))}</More>
      ) : null}
    </Panel>
  );
}

/** The tab on screen; the others are links that load their own view. */
export function RegionTabs(props: RegionTabsProps) {
  const panel = {
    history: <History {...props} />,
    calendar: <Calendar {...props} />,
    variables: <Variables {...props} />,
    events: <Events {...props} />,
  }[props.tab];
  return <div className="grid gap-4">{panel}</div>;
}
