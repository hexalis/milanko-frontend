import Form from "next/form";
import type { VariableCoverage } from "@/modules/coverage";
import { formatNumber, formatSigned, withUnit } from "@/shared/lib/format";
import { toQueryString } from "@/shared/lib/search-params";
import { AutoSubmitSelect } from "@/shared/ui/auto-submit-select";
import { Button } from "@/shared/ui/button";
import { Field, FilterBar, TextInput } from "@/shared/ui/field";
import { Panel } from "@/shared/ui/panel";
import { StatCard, StatGrid } from "@/shared/ui/stat-card";
import { EmptyRow, Table, Td, Th } from "@/shared/ui/table";
import { TextLink } from "@/shared/ui/text-link";
import {
  metricUnit,
  metricValue,
  RANKING_LIMITS,
  RANKING_METRIC_LABELS,
  RANKING_METRICS,
  RANKING_ORDER_LABELS,
  RANKING_ORDERS,
  type Ranking,
  type RankingQuery,
} from "../domain/ranking";
import { regionLabel } from "../domain/region";
import { RankingBars } from "./ranking-bars";

type RankingsScreenProps = {
  variables: readonly VariableCoverage[];
  query: RankingQuery;
  ranking: Ranking;
};

const COLUMNS = 8;

export function RankingsScreen({ variables, query, ranking }: RankingsScreenProps) {
  const { metric } = query;
  const label = RANKING_METRIC_LABELS[metric];
  const unit = metricUnit(metric, ranking.unit);
  const leader = ranking.regions[0];
  const asOf = metric === "anomaly" && leader?.date ? leader.date : ranking.date;
  const orderText = query.order === "desc" ? "mayor" : "menor";
  const regionHref = (code: number) =>
    `/regions${toQueryString({ region: code, variable: ranking.variable })}`;

  return (
    <>
      <Form action="/rankings">
        <FilterBar>
          <Field label="Variable">
            <AutoSubmitSelect name="variable" urlValue={query.variable}>
              {variables.map((row) => (
                <option key={row.variable} value={row.variable}>
                  {row.variable} · {row.source}
                </option>
              ))}
            </AutoSubmitSelect>
          </Field>
          <Field label="Métrica">
            <AutoSubmitSelect name="metric" urlValue={metric}>
              {RANKING_METRICS.map((option) => (
                <option key={option} value={option}>
                  {RANKING_METRIC_LABELS[option]}
                </option>
              ))}
            </AutoSubmitSelect>
          </Field>
          <Field label="Orden">
            <AutoSubmitSelect name="order" urlValue={query.order}>
              {RANKING_ORDERS.map((option) => (
                <option key={option} value={option}>
                  {RANKING_ORDER_LABELS[option]}
                </option>
              ))}
            </AutoSubmitSelect>
          </Field>
          {metric === "trend" ? null : (
            <Field label="Fecha">
              <TextInput name="date" type="date" defaultValue={query.date} />
            </Field>
          )}
          <Field label="Mostrar">
            <AutoSubmitSelect name="limit" urlValue={query.limit}>
              {RANKING_LIMITS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </AutoSubmitSelect>
          </Field>
          <Button type="submit">Actualizar</Button>
        </FilterBar>
      </Form>

      <StatGrid>
        <StatCard
          label="Líder"
          value={leader ? regionLabel(leader) : "—"}
          meta={leader ? withUnit(formatSigned(metricValue(leader, metric)), unit) : "—"}
        />
        <StatCard label="Variable" value={ranking.variable} meta={ranking.source} />
        <StatCard
          label="Regiones con dato"
          value={formatNumber(ranking.total, 0)}
          meta={`${ranking.count} mostradas · ${label}`}
        />
        <StatCard
          label="Lectura"
          value={label}
          meta={asOf ? `${asOf} · orden ${orderText}` : `desde 2006 · orden ${orderText}`}
        />
      </StatGrid>

      <Panel title="Top regiones" meta={`${ranking.regions.length} regiones · ${label}`}>
        <RankingBars
          rows={ranking.regions}
          metric={metric}
          variable={ranking.variable}
          unit={unit}
        />
      </Panel>

      <Panel title="Tabla completa" meta={`${ranking.count} de ${ranking.total} regiones`}>
        <Table
          caption={`Ranking de regiones por ${label.toLowerCase()}`}
          head={
            <>
              <Th>#</Th>
              <Th>Región</Th>
              <Th>Valor</Th>
              <Th>Anomalía</Th>
              <Th>Tendencia</Th>
              <Th>R²</Th>
              <Th>Meses</Th>
              <Th>Fecha</Th>
            </>
          }
        >
          {ranking.regions.length ? (
            ranking.regions.map((row, index) => (
              <tr key={row.code}>
                <Td>{index + 1}</Td>
                <Td>
                  <TextLink href={regionHref(row.code)}>{regionLabel(row)}</TextLink>
                </Td>
                <Td>{withUnit(formatNumber(row.value), ranking.unit)}</Td>
                <Td>{withUnit(formatSigned(row.anomaly), ranking.unit)}</Td>
                <Td>
                  {withUnit(formatSigned(row.slope_per_year, 4), metricUnit("trend", ranking.unit))}
                </Td>
                <Td>{formatNumber(row.r2, 3)}</Td>
                <Td>{formatNumber(row.n_months, 0)}</Td>
                <Td>{row.date ?? "—"}</Td>
              </tr>
            ))
          ) : (
            <EmptyRow columns={COLUMNS}>Sin datos.</EmptyRow>
          )}
        </Table>
      </Panel>
    </>
  );
}
