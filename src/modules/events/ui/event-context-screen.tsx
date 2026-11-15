import Image from "next/image";
import { formatRegionCode } from "@/modules/regions";
import { formatNumber, formatSigned, withUnit } from "@/shared/lib/format";
import { toQueryString } from "@/shared/lib/search-params";
import { Panel } from "@/shared/ui/panel";
import { StatCard, StatGrid } from "@/shared/ui/stat-card";
import { EmptyRow, Table, Td, Th } from "@/shared/ui/table";
import { ExternalLink, TextLink } from "@/shared/ui/text-link";
import { categoryLabel } from "../domain/event";
import {
  formatPeriod,
  hasCoordinates,
  snapshotDate,
  type EventContext,
} from "../domain/event-context";

type EventContextScreenProps = {
  context: EventContext;
};

const SNAPSHOT_KM = 1200;
const SNAPSHOT_PX = 960;

function regionHref(code: number): string {
  return `/regions${toQueryString({ region: code, variable: "T2M" })}`;
}

export function EventContextScreen({ context }: EventContextScreenProps) {
  const { event, region, regions, variables } = context;
  const date = snapshotDate(event);

  return (
    <>
      <StatGrid>
        <StatCard
          label="Categoría / estado"
          value={categoryLabel(event.category)}
          meta={`${event.status ?? "—"} · ${event.id}`}
        />
        <StatCard
          label="Período"
          value={formatPeriod(event)}
          meta={context.hasPeriod ? "período EONET" : "sin período"}
        />
        <StatCard
          label="Región principal"
          value={region ? `${formatRegionCode(region.code)} · ${region.name}` : "—"}
          meta={
            region
              ? `${formatNumber(region.n_geometries, 0)} geometrías · principal`
              : "sin asignación"
          }
        />
        <StatCard
          label="Variables de contexto"
          value={formatNumber(variables.length, 0)}
          meta={
            variables.length
              ? variables.map((row) => row.variable).join(" · ")
              : "sin variables persistidas"
          }
        />
      </StatGrid>

      {hasCoordinates(region) ? (
        <figure className="rounded-card bg-bg-surface shadow-card overflow-hidden">
          <Image
            unoptimized
            className="bg-bg-surface-sunken block h-72 w-full object-cover"
            src={`/api/v1/world/snapshot${toQueryString({ lat: region.lat, lon: region.lon, date, km: SNAPSHOT_KM, px: SNAPSHOT_PX })}`}
            alt={`Imagen satelital de ${region.name}`}
            width={SNAPSHOT_PX}
            height={288}
            loading="lazy"
          />
          <figcaption className="text-text-tertiary px-4 py-2.5 text-[13px] font-semibold">
            {region.name} · {date ?? "sin fecha"} · NASA GIBS
          </figcaption>
        </figure>
      ) : null}

      <Panel title="Evento" meta={event.id}>
        <p className="text-text-secondary">{event.description || "Sin descripción."}</p>
        {event.link ? (
          <p className="mt-2">
            <ExternalLink href={event.link}>Abrir en EONET</ExternalLink>
          </p>
        ) : null}
      </Panel>

      <Panel
        title="Contexto ambiental"
        meta={
          region
            ? `Región ${formatRegionCode(region.code)} · ${variables.length} variables`
            : "sin región asignada"
        }
      >
        <Table
          caption="Variables mensuales del período del evento"
          head={
            <>
              <Th>Variable</Th>
              <Th>Nombre</Th>
              <Th>Mes</Th>
              <Th>Valor</Th>
              <Th>Climatología</Th>
              <Th>Anomalía</Th>
              <Th>z</Th>
            </>
          }
        >
          {variables.length ? (
            variables.map((row) => (
              <tr key={`${row.variable}:${row.month ?? ""}`}>
                <Td>
                  <strong>{row.variable}</strong>
                </Td>
                <Td>{row.name ?? ""}</Td>
                <Td>{row.month ?? "—"}</Td>
                <Td>{withUnit(formatNumber(row.value), row.unit)}</Td>
                <Td>{withUnit(formatNumber(row.baseline), row.unit)}</Td>
                <Td>{withUnit(formatSigned(row.anomaly), row.unit)}</Td>
                <Td>{formatNumber(row.z, 2)}</Td>
              </tr>
            ))
          ) : (
            <EmptyRow columns={7}>No hay variables mensuales para el período del evento.</EmptyRow>
          )}
        </Table>
      </Panel>

      <Panel title="Regiones asociadas" meta={`${regions.length} regiones`}>
        <Table
          caption="Regiones asociadas al evento"
          head={
            <>
              <Th>Región</Th>
              <Th>Nombre</Th>
              <Th>Geometrías</Th>
              <Th>Principal</Th>
              <Th>
                <span className="sr-only">Acciones</span>
              </Th>
            </>
          }
        >
          {regions.length ? (
            regions.map((row) => (
              <tr key={row.code}>
                <Td>{formatRegionCode(row.code)}</Td>
                <Td>{row.name}</Td>
                <Td>{formatNumber(row.n_geometries, 0)}</Td>
                <Td>{row.is_primary ? "sí" : "—"}</Td>
                <Td>
                  <TextLink href={regionHref(row.code)}>Abrir región →</TextLink>
                </Td>
              </tr>
            ))
          ) : (
            <EmptyRow columns={5}>Sin regiones asignadas.</EmptyRow>
          )}
        </Table>
      </Panel>
    </>
  );
}
