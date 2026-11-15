import type {
  EventContext,
  EventContextVariable,
  EventRegion,
} from "@/modules/events/domain/event-context";
import type { EventFilters, EventPage, EventStats } from "@/modules/events/domain/event";
import { createMilankoClient, isRecord, MilankoApiError, unwrap } from "./client";

function toQuery({ category, status, start, end }: EventFilters) {
  return { category: category || undefined, status, start, end };
}

export async function getPersistedEvents(
  filters: EventFilters,
  { limit, offset }: { limit: number; offset: number },
): Promise<EventPage> {
  const data = await unwrap(
    createMilankoClient().GET("/events/persisted", {
      params: { query: { ...toQuery(filters), limit, offset } },
    }),
  );
  return {
    events: data.events.map((event) => ({
      id: event.id,
      title: event.title,
      link: event.link,
      categories: event.categories.map((category) =>
        typeof category === "string" ? category : String(category),
      ),
      first_date: event.first_date,
      last_date: event.last_date,
      n_geometries: event.n_geometries,
    })),
    total: data.total ?? data.count,
    offset,
  };
}

export async function getEventStats(filters: EventFilters): Promise<EventStats> {
  const data = await unwrap(
    createMilankoClient().GET("/events/stats", { params: { query: toQuery(filters) } }),
  );
  return {
    total: data.total,
    statuses: Object.fromEntries(
      Object.entries(data.statuses).flatMap(([status, count]) =>
        typeof count === "number" ? [[status, count]] : [],
      ),
    ),
    categories: data.categories,
    years: data.years,
  };
}

/* The context endpoint is untyped in the OpenAPI document; narrow it at the edge. */

const optionalString = (value: unknown) => (typeof value === "string" ? value : null);
const optionalNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

function toRegion(value: unknown): EventRegion | null {
  if (!isRecord(value) || typeof value.code !== "number") return null;
  return {
    code: value.code,
    name: optionalString(value.name) ?? `Región ${value.code}`,
    n_geometries: optionalNumber(value.n_geometries) ?? 0,
    is_primary: value.is_primary === true,
    lat: optionalNumber(value.lat),
    lon: optionalNumber(value.lon),
  };
}

function toVariable(value: unknown): EventContextVariable | null {
  if (!isRecord(value) || typeof value.variable !== "string") return null;
  return {
    variable: value.variable,
    name: optionalString(value.name),
    unit: optionalString(value.unit),
    month: optionalString(value.month),
    value: optionalNumber(value.value),
    baseline: optionalNumber(value.baseline),
    anomaly: optionalNumber(value.anomaly),
    z: optionalNumber(value.z),
  };
}

/** Returns null when the API does not know the event. */
export async function getEventContext(id: string): Promise<EventContext | null> {
  let data: Record<string, unknown>;
  try {
    data = await unwrap(
      createMilankoClient().GET("/events/{event_id}/context", {
        params: { path: { event_id: id } },
      }),
    );
  } catch (error) {
    if (error instanceof MilankoApiError && error.status === 404) return null;
    throw error;
  }
  const event = isRecord(data.event) ? data.event : {};
  return {
    event: {
      id: optionalString(event.id) ?? id,
      title: optionalString(event.title) ?? id,
      description: optionalString(event.description),
      link: optionalString(event.link),
      category: optionalString(event.category),
      status: optionalString(event.status),
      first_date: optionalString(event.first_date),
      last_date: optionalString(event.last_date),
    },
    region: toRegion(data.region),
    regions: (Array.isArray(data.regions) ? data.regions : []).flatMap((row) => {
      const region = toRegion(row);
      return region ? [region] : [];
    }),
    hasPeriod: isRecord(data.period),
    variables: (Array.isArray(data.variables) ? data.variables : []).flatMap((row) => {
      const variable = toVariable(row);
      return variable ? [variable] : [];
    }),
  };
}
