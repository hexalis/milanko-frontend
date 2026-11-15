import Form from "next/form";
import Link from "next/link";
import { formatNumber } from "@/shared/lib/format";
import { toQueryString } from "@/shared/lib/search-params";
import { AutoSubmitSelect } from "@/shared/ui/auto-submit-select";
import { Button, button } from "@/shared/ui/button";
import { Field, FilterBar, TextInput } from "@/shared/ui/field";
import { Panel } from "@/shared/ui/panel";
import { StatCard, StatGrid } from "@/shared/ui/stat-card";
import { CellNote, EmptyRow, Table, Td, Th } from "@/shared/ui/table";
import { ExternalLink, TextLink } from "@/shared/ui/text-link";
import {
  busiestYear,
  categoryLabel,
  EVENT_CATEGORIES,
  EVENT_STATUS_LABELS,
  EVENT_STATUSES,
  EVENTS_PAGE_SIZE,
  pageWindow,
  type EventFilters,
  type EventPage,
  type EventStats,
} from "../domain/event";

type EventsScreenProps = {
  filters: EventFilters;
  /** Filters for the "last year" shortcut. */
  lastYear: { start: string; end: string };
  page: EventPage;
  stats: EventStats;
};

const COLUMNS = 6;

export function EventsScreen({ filters, lastYear, page, stats }: EventsScreenProps) {
  const pager = pageWindow(page, EVENTS_PAGE_SIZE);
  const topCategory = stats.categories[0];
  const topYear = busiestYear(stats);
  const pageHref = (offset: number) =>
    `/events${toQueryString({ ...filters, offset: offset || undefined })}`;

  return (
    <>
      <Form action="/events">
        <FilterBar>
          <Field label="Categoría">
            <AutoSubmitSelect name="category" defaultValue={filters.category ?? ""}>
              <option value="">Todas</option>
              {EVENT_CATEGORIES.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </AutoSubmitSelect>
          </Field>
          <Field label="Estado">
            <AutoSubmitSelect name="status" defaultValue={filters.status}>
              {EVENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {EVENT_STATUS_LABELS[status]}
                </option>
              ))}
            </AutoSubmitSelect>
          </Field>
          <Field label="Desde">
            <TextInput name="start" type="date" defaultValue={filters.start} />
          </Field>
          <Field label="Hasta">
            <TextInput name="end" type="date" defaultValue={filters.end} />
          </Field>
          <Button type="submit">Buscar</Button>
          <Link
            className={button({ intent: "secondary" })}
            href={`/events${toQueryString({ ...filters, ...lastYear })}`}
          >
            Último año
          </Link>
        </FilterBar>
      </Form>

      <StatGrid columns={3}>
        <StatCard
          label="Total filtrado"
          value={formatNumber(stats.total, 0)}
          meta={`${formatNumber(stats.statuses.open ?? 0, 0)} abiertos · ${formatNumber(stats.statuses.closed ?? 0, 0)} cerrados`}
        />
        <StatCard
          label="Categoría principal"
          value={topCategory ? categoryLabel(topCategory.category) : "—"}
          meta={topCategory ? `${formatNumber(topCategory.count, 0)} eventos` : "sin datos"}
        />
        <StatCard
          label="Año con más eventos"
          value={topYear ? String(topYear.year) : "—"}
          meta={topYear ? `${formatNumber(topYear.count, 0)} eventos iniciados` : "sin datos"}
        />
      </StatGrid>

      <Panel
        title="Eventos"
        meta={`${formatNumber(pager.first, 0)}–${formatNumber(pager.last, 0)} de ${formatNumber(page.total, 0)} eventos`}
      >
        <Table
          caption="Eventos EONET persistidos"
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
          {page.events.length ? (
            page.events.map((event) => (
              <tr key={event.id}>
                <Td>{event.first_date ?? "—"}</Td>
                <Td>{event.last_date ?? "—"}</Td>
                <Td>
                  <strong>{event.title}</strong>
                  <CellNote>{event.id}</CellNote>
                </Td>
                <Td>{event.categories.map(categoryLabel).join(", ") || "—"}</Td>
                <Td>{formatNumber(event.n_geometries, 0)}</Td>
                <Td>
                  <span className="flex flex-wrap gap-x-3 whitespace-nowrap">
                    <TextLink href={`/events/${encodeURIComponent(event.id)}`}>Contexto →</TextLink>
                    {event.link ? <ExternalLink href={event.link}>EONET</ExternalLink> : null}
                  </span>
                </Td>
              </tr>
            ))
          ) : (
            <EmptyRow columns={COLUMNS}>No hay eventos para los filtros.</EmptyRow>
          )}
        </Table>
      </Panel>

      <nav
        aria-label="Paginación"
        className="rounded-card bg-surface shadow-clay flex flex-wrap items-center justify-between gap-3 p-3"
      >
        <Link
          className={button({ intent: "secondary" })}
          href={pageHref(pager.previousOffset)}
          aria-disabled={!pager.hasPrevious}
          tabIndex={pager.hasPrevious ? undefined : -1}
        >
          ← Anterior
        </Link>
        <span className="text-ink-muted text-sm font-semibold">
          Página {pager.page} de {pager.pageCount}
        </span>
        <Link
          className={button({ intent: "secondary" })}
          href={pageHref(pager.nextOffset)}
          aria-disabled={!pager.hasNext}
          tabIndex={pager.hasNext ? undefined : -1}
        >
          Siguiente →
        </Link>
      </nav>
    </>
  );
}
