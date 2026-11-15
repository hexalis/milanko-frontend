import Form from "next/form";
import { formatNumber } from "@/shared/lib/format";
import { toQueryString } from "@/shared/lib/search-params";
import { AutoSubmitSelect } from "@/shared/ui/auto-submit-select";
import { Button } from "@/shared/ui/button";
import { Field, FilterBar, TextInput } from "@/shared/ui/field";
import { Panel } from "@/shared/ui/panel";
import { StatCard, StatGrid } from "@/shared/ui/stat-card";
import { EmptyRow, Table, Td, Th } from "@/shared/ui/table";
import { TextLink } from "@/shared/ui/text-link";
import {
  filterCoverage,
  listSources,
  summarizeCoverage,
  type CoverageFilters,
  type VariableCoverage,
} from "../domain/coverage";

type CoverageScreenProps = {
  rows: readonly VariableCoverage[];
  filters: CoverageFilters;
};

const COLUMNS = 7;

export function CoverageScreen({ rows, filters }: CoverageScreenProps) {
  const summary = summarizeCoverage(rows);
  const visible = filterCoverage(rows, filters);
  const hasDates = summary.firstDate && summary.lastDate;

  return (
    <>
      <Form action="/coverage">
        <FilterBar>
          <Field label="Fuente">
            <AutoSubmitSelect name="source" defaultValue={filters.source ?? ""}>
              <option value="">Todas</option>
              {listSources(rows).map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </AutoSubmitSelect>
          </Field>
          <Field label="Buscar">
            <TextInput
              name="q"
              type="search"
              defaultValue={filters.query ?? ""}
              placeholder="variable, nombre, unidad…"
            />
          </Field>
          <Field label="Orden">
            <AutoSubmitSelect name="sort" defaultValue={filters.isSortedByCount ? "rows" : ""}>
              <option value="">Fuente y variable</option>
              <option value="rows">Mayor cobertura</option>
            </AutoSubmitSelect>
          </Field>
          <Button type="submit">Filtrar</Button>
        </FilterBar>
      </Form>

      <StatGrid>
        <StatCard
          label="Variables"
          value={formatNumber(summary.variableCount, 0)}
          meta={
            summary.sources.map(({ source, variableCount }) => `${variableCount} ${source}`).join(" · ") ||
            "sin datos"
          }
        />
        <StatCard label="Observaciones" value={formatNumber(summary.observationCount, 0)} meta="filas persistidas" />
        <StatCard
          label="Fuentes"
          value={formatNumber(summary.sources.length, 0)}
          meta={summary.sources.map(({ source }) => source).join(" · ") || "sin fuentes"}
        />
        <StatCard
          label="Rango histórico"
          value={hasDates ? `${summary.firstDate?.slice(0, 4)} → ${summary.lastDate?.slice(0, 4)}` : "—"}
          meta={hasDates ? `${summary.firstDate} → ${summary.lastDate}` : "sin fechas"}
        />
      </StatGrid>

      <Panel
        title="Inventario"
        meta={`${visible.length} de ${rows.length} variables${filters.isSortedByCount ? " · por filas" : ""}`}
      >
        <Table
          caption="Variables persistidas"
          head={
            <>
              <Th>Variable</Th>
              <Th>Fuente</Th>
              <Th>Nombre</Th>
              <Th>Unidad</Th>
              <Th>Filas</Th>
              <Th>Desde</Th>
              <Th>Hasta</Th>
            </>
          }
        >
          {visible.length ? (
            visible.map((row) => (
              <tr key={`${row.source}:${row.variable}`}>
                <Td>
                  <TextLink href={`/regions${toQueryString({ variable: row.variable })}`}>{row.variable}</TextLink>
                </Td>
                <Td>{row.source}</Td>
                <Td>{row.name}</Td>
                <Td>{row.unit ?? ""}</Td>
                <Td>{formatNumber(row.count, 0)}</Td>
                <Td>{row.start ?? "—"}</Td>
                <Td>{row.end ?? "—"}</Td>
              </tr>
            ))
          ) : (
            <EmptyRow columns={COLUMNS}>No hay variables para el filtro.</EmptyRow>
          )}
        </Table>
      </Panel>
    </>
  );
}
