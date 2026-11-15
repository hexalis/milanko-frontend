/** GET /events/{id}/context, narrowed to what the context page shows. */
export type EventContext = {
  event: {
    id: string;
    title: string;
    description?: string | null;
    link?: string | null;
    category?: string | null;
    status?: string | null;
    first_date?: string | null;
    last_date?: string | null;
  };
  region: EventRegion | null;
  regions: EventRegion[];
  hasPeriod: boolean;
  variables: EventContextVariable[];
};

export type EventRegion = {
  code: number;
  name: string;
  n_geometries: number;
  is_primary: boolean;
  lat?: number | null;
  lon?: number | null;
};

export type EventContextVariable = {
  variable: string;
  name?: string | null;
  unit?: string | null;
  month?: string | null;
  value?: number | null;
  baseline?: number | null;
  anomaly?: number | null;
  z?: number | null;
};

export function formatPeriod(event: EventContext["event"]): string {
  if (event.first_date && event.last_date) return `${event.first_date} → ${event.last_date}`;
  return event.first_date ?? "—";
}

/** The date the satellite snapshot should show: the end of the event, else its start. */
export function snapshotDate(event: EventContext["event"]): string | undefined {
  return event.last_date ?? event.first_date ?? undefined;
}

export function hasCoordinates(
  region: EventRegion | null,
): region is EventRegion & { lat: number; lon: number } {
  return typeof region?.lat === "number" && typeof region.lon === "number";
}
