import Form from "next/form";
import Link from "next/link";
import type { VariableCoverage } from "@/modules/coverage";
import { formatNumber, formatSigned, withUnit } from "@/shared/lib/format";
import { toQueryString } from "@/shared/lib/search-params";
import { AutoSubmitSelect } from "@/shared/ui/auto-submit-select";
import { Button, button } from "@/shared/ui/button";
import { CopyLinkButton } from "@/shared/ui/copy-link-button";
import { Field, FilterBar, TextInput } from "@/shared/ui/field";
import { Notice } from "@/shared/ui/notice";
import { Panel } from "@/shared/ui/panel";
import { StatCard, StatGrid } from "@/shared/ui/stat-card";
import { CellNote, EmptyRow, Table, Td, Th } from "@/shared/ui/table";
import { TextLink } from "@/shared/ui/text-link";
import {
  latestAnomaly,
  layoutCalendar,
  readTrend,
  recentAnomalies,
  type AnomalyPoint,
  type RegionTrend,
} from "../domain/analysis";
import {
  formatRegionCode,
  regionLabel,
  type LatestVariable,
  type Region,
  type RegionEvent,
} from "../domain/region";
import { summarizeObservations, toSeries, type Observation } from "../domain/series";
import { AnomalyBarsChart } from "./anomaly-bars-chart";
import { AnomalyCalendar } from "./anomaly-calendar";
import { SeriesChart } from "./series-chart";

type RegionExplorerQuery = {
  region: Region;
  variable: VariableCoverage;
  start: string;
  end: string;
  /** Anomalies on or after this date fill the 12-month chart. */
  anomalySince: string;
  /** Shortcut range for the "last 30 days" link. */
  lastMonth: { start: string; end: string };
};

/** A section that loaded, or the reason it did not. */
export type Loaded<T> = { data: T } | { error: string };

type RegionExplorerScreenProps = {
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

const RECENT_ROWS = 40;

function TrendCard({ trend }: { trend: RegionExplorerScreenProps["trend"] }) {
  if ("error" in trend)
    return <StatCard label="Tendencia · Mann-Kendall" value="—" meta={trend.error} />;
  const reading = readTrend(trend.data);
  if (reading.kind === "missing") {
    return <StatCard label="Tendencia · Mann-Kendall" value="—" meta="sin datos suficientes" />;
  }
  if (reading.kind === "too-short") {
    return (
      <StatCard
        label="Tendencia · Mann-Kendall"
        value={`${reading.months} meses`}
        meta="se necesitan al menos 12 meses"
      />
    );
  }
  return (
    <StatCard
      label="Tendencia · Mann-Kendall"
      value={`${formatSigned(reading.slopePerYear, 4)} / año`}
      meta={`${reading.label} · p=${formatNumber(reading.pValue, 4)} · n=${reading.months} meses`}
    />
  );
}

export function RegionExplorerScreen(props: RegionExplorerScreenProps) {
  const { regions, variables, query, observations, anomalies, latest, events } = props;
  const { region, variable } = query;
  const unit = variable.unit;
  const summary = summarizeObservations(observations);
  const series = toSeries(observations);
  const anomalyPoints = "data" in anomalies ? anomalies.data : [];
  const lastAnomaly = latestAnomaly(
    anomalyPoints.filter((point) => point.time >= query.anomalySince),
  );
  const calendar = layoutCalendar(anomalyPoints);
  const viewHref = (overrides: Record<string, string | number>) =>
    `/regions${toQueryString({ region: region.code, variable: variable.variable, start: query.start, end: query.end, ...overrides })}`;
  const csvHref = `/regions/${region.code}/observations${toQueryString({ variable: variable.variable, start: query.start, end: query.end })}`;

  return (
    <>
      <Form action="/regions">
        <FilterBar>
          <Field label="Región">
            <AutoSubmitSelect name="region" defaultValue={String(region.code)}>
              {regions.map((row) => (
                <option key={row.code} value={row.code}>
                  {regionLabel(row)}
                </option>
              ))}
            </AutoSubmitSelect>
          </Field>
          <Field label="Variable">
            <AutoSubmitSelect name="variable" defaultValue={variable.variable}>
              {variables.map((row) => (
                <option key={row.variable} value={row.variable}>
                  {row.variable} · {row.source}
                  {row.unit ? ` · ${row.unit}` : ""}
                </option>
              ))}
            </AutoSubmitSelect>
          </Field>
          <Field label="Desde">
            <TextInput name="start" type="date" defaultValue={query.start} />
          </Field>
          <Field label="Hasta">
            <TextInput name="end" type="date" defaultValue={query.end} />
          </Field>
          <Button type="submit">Cargar serie</Button>
          <Link className={button({ intent: "secondary" })} href={viewHref(query.lastMonth)}>
            Últimos 30 días
          </Link>
          <a className={button({ intent: "secondary" })} href={csvHref} download>
            Descargar CSV
          </a>
          <CopyLinkButton />
        </FilterBar>
      </Form>

      {observations.length >= props.maxObservations ? (
        <Notice>
          La serie llegó al máximo de {formatNumber(props.maxObservations, 0)} filas; acorta el
          rango para ver el período completo.
        </Notice>
      ) : null}

      <StatGrid>
        <StatCard
          label="Región seleccionada"
          value={regionLabel(region)}
          meta={`${formatNumber(region.lat, 3)}, ${formatNumber(region.lon, 3)} · ${formatNumber(region.area_km2, 0)} km²`}
        />
        <StatCard
          label="Observaciones"
          value={formatNumber(summary.count, 0)}
          meta={
            summary.firstDate && summary.lastDate
              ? `${summary.firstDate} → ${summary.lastDate}`
              : "sin datos"
          }
        />
        <StatCard
          label="Último valor"
          value={
            summary.latest
              ? withUnit(formatNumber(summary.latest.value, 3), summary.latest.unit)
              : "—"
          }
          meta={summary.latest ? `${summary.latest.date} · ${summary.latest.quality}` : "sin valor"}
        />
        <StatCard
          label="Media del rango"
          value={withUnit(formatNumber(summary.mean, 3), unit)}
          meta={
            summary.numericCount
              ? `mín ${formatNumber(summary.min, 3)} · máx ${formatNumber(summary.max, 3)} · n=${summary.numericCount}`
              : "sin valores numéricos"
          }
        />
      </StatGrid>

      <Panel
        title="Serie"
        meta={`${formatRegionCode(region.code)} · ${variable.variable}${series.isMonthlyMean ? " · media mensual" : ""}`}
      >
        <SeriesChart points={series.points} label={`${variable.variable} en ${region.name}`} />
      </Panel>

      <Panel
        title="Calendario de anomalías"
        meta={
          calendar
            ? `${variable.variable} · ${calendar.firstYear}–${calendar.lastYear} · z (${formatNumber(calendar.dayCount, 0)} días)`
            : "sin datos"
        }
      >
        {"error" in anomalies ? (
          <Notice tone="error">No se pudieron cargar las anomalías: {anomalies.error}</Notice>
        ) : calendar ? (
          <AnomalyCalendar layout={calendar} variable={variable.variable} />
        ) : (
          <p className="text-ink-muted">Sin datos suficientes para el calendario.</p>
        )}
      </Panel>

      <StatGrid columns={3}>
        <TrendCard trend={props.trend} />
        <StatCard
          label="Última anomalía"
          value={lastAnomaly ? withUnit(formatSigned(lastAnomaly.anomaly), unit) : "—"}
          meta={
            lastAnomaly
              ? `z=${formatNumber(lastAnomaly.z, 2)} · percentil ${formatNumber(lastAnomaly.percentile, 0)} · ${lastAnomaly.time}`
              : "sin anomalías en el rango"
          }
        />
        <StatCard label="Fuente" value={variable.source} meta={variable.name} />
      </StatGrid>

      <Panel title="Anomalías · últimos 12 meses" meta={`desde ${query.anomalySince}`}>
        <AnomalyBarsChart bars={recentAnomalies(anomalyPoints, query.anomalySince)} />
      </Panel>

      <Panel title="Últimas observaciones" meta={`las ${RECENT_ROWS} más recientes del rango`}>
        <Table
          caption="Últimas observaciones de la serie"
          head={
            <>
              <Th>Fecha</Th>
              <Th>Valor</Th>
              <Th>Unidad</Th>
              <Th>Calidad</Th>
              <Th>Fracción válida</Th>
            </>
          }
        >
          {observations.length ? (
            observations
              .slice(-RECENT_ROWS)
              .toReversed()
              .map((row) => (
                <tr key={row.date}>
                  <Td>{row.date}</Td>
                  <Td>{formatNumber(row.value, 3)}</Td>
                  <Td>{row.unit ?? ""}</Td>
                  <Td>{row.quality}</Td>
                  <Td>{formatNumber(row.valid_fraction, 3)}</Td>
                </tr>
              ))
          ) : (
            <EmptyRow columns={5}>Sin datos.</EmptyRow>
          )}
        </Table>
      </Panel>

      <Panel
        title="Últimos valores por variable"
        meta={
          "data" in latest
            ? `${latest.data.length} variables · región ${formatRegionCode(region.code)}`
            : "sin datos"
        }
      >
        {"error" in latest ? (
          <Notice tone="error">No se pudieron cargar los últimos valores: {latest.error}</Notice>
        ) : (
          <Table
            caption="Último valor válido de cada variable en la región"
            head={
              <>
                <Th>Variable</Th>
                <Th>Fuente</Th>
                <Th>Fecha</Th>
                <Th>Valor</Th>
                <Th>Unidad</Th>
                <Th>Calidad</Th>
              </>
            }
          >
            {latest.data.length ? (
              latest.data.map((row) => (
                <tr key={`${row.source}:${row.variable}`}>
                  <Td>
                    <TextLink href={viewHref({ variable: row.variable })}>{row.variable}</TextLink>
                    <CellNote>{row.name}</CellNote>
                  </Td>
                  <Td>{row.source}</Td>
                  <Td>{row.date}</Td>
                  <Td>{formatNumber(row.value, 3)}</Td>
                  <Td>{row.unit ?? ""}</Td>
                  <Td>{row.quality}</Td>
                </tr>
              ))
            ) : (
              <EmptyRow columns={6}>Sin datos.</EmptyRow>
            )}
          </Table>
        )}
      </Panel>

      <Panel
        title="Eventos en esta región"
        meta={
          "data" in events
            ? `${events.data.total} eventos · últimos ${events.data.events.length}`
            : "sin eventos"
        }
      >
        {"error" in events ? (
          <Notice tone="error">No se pudieron cargar los eventos: {events.error}</Notice>
        ) : (
          <Table
            caption="Eventos EONET asociados a la región"
            head={
              <>
                <Th>Inicio</Th>
                <Th>Fin</Th>
                <Th>Evento</Th>
                <Th>Categoría</Th>
                <Th>Geometrías</Th>
                <Th>
                  <span className="sr-only">Acciones</span>
                </Th>
              </>
            }
          >
            {events.data.events.length ? (
              events.data.events.map((event) => (
                <tr key={event.id}>
                  <Td>{event.first_date ?? "—"}</Td>
                  <Td>{event.last_date ?? "—"}</Td>
                  <Td>
                    <strong>{event.title}</strong>
                    <CellNote>{event.id}</CellNote>
                  </Td>
                  <Td>{event.category ?? "—"}</Td>
                  <Td>{formatNumber(event.n_geometries, 0)}</Td>
                  <Td>
                    <TextLink href={`/events/${encodeURIComponent(event.id)}`}>Contexto →</TextLink>
                  </Td>
                </tr>
              ))
            ) : (
              <EmptyRow columns={6}>Sin eventos asociados.</EmptyRow>
            )}
          </Table>
        )}
      </Panel>
    </>
  );
}
