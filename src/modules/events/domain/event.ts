/** EONET category ids the archive filters by, with their Spanish labels. */
export const EVENT_CATEGORIES = [
  { id: "wildfires", label: "Incendios" },
  { id: "severeStorms", label: "Tormentas severas" },
  { id: "floods", label: "Inundaciones" },
  { id: "volcanoes", label: "Volcanes" },
  { id: "seaLakeIce", label: "Hielo marino o lacustre" },
  { id: "snow", label: "Nieve" },
  { id: "dustHaze", label: "Polvo y bruma" },
  { id: "earthquakes", label: "Sismos" },
] as const;

export const EVENT_STATUSES = ["all", "open", "closed"] as const;

export type EventStatus = (typeof EVENT_STATUSES)[number];

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  all: "Todos",
  open: "Abiertos",
  closed: "Cerrados",
};

export const EVENTS_PAGE_SIZE = 100;

export type EventFilters = {
  category?: string;
  status: EventStatus;
  start: string;
  end: string;
};

/** A row of GET /events/persisted. */
type PersistedEvent = {
  id: string;
  title: string;
  link?: string | null;
  categories: string[];
  first_date?: string | null;
  last_date?: string | null;
  n_geometries?: number | null;
};

export type EventPage = {
  events: PersistedEvent[];
  total: number;
  offset: number;
};

/** GET /events/stats. */
export type EventStats = {
  total: number;
  statuses: Record<string, number>;
  categories: { category?: string | null; count: number }[];
  years: { year: number; count: number }[];
};

export function categoryLabel(id: string | null | undefined): string {
  if (!id) return "—";
  return EVENT_CATEGORIES.find((category) => category.id === id)?.label ?? id;
}

export function busiestYear(stats: EventStats): EventStats["years"][number] | undefined {
  return stats.years.toSorted((a, b) => b.count - a.count)[0];
}

export type PageWindow = {
  first: number;
  last: number;
  page: number;
  pageCount: number;
  hasPrevious: boolean;
  hasNext: boolean;
  previousOffset: number;
  nextOffset: number;
};

export function pageWindow({ events, total, offset }: EventPage, pageSize: number): PageWindow {
  const last = offset + events.length;
  return {
    first: events.length ? offset + 1 : 0,
    last,
    page: Math.floor(offset / pageSize) + 1,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    hasPrevious: offset > 0,
    hasNext: last < total,
    previousOffset: Math.max(0, offset - pageSize),
    nextOffset: offset + pageSize,
  };
}
