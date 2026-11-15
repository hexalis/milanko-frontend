import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { EVENT_STATUSES, EVENTS_PAGE_SIZE, type EventFilters } from "@/modules/events/domain/event";
import { EventsScreen } from "@/modules/events/ui/events-screen";
import { getEventStats, getPersistedEvents } from "@/server/integrations/milanko-api/events";
import {
  lastDaysRange,
  orderedRange,
  readIsoDate,
  readNonNegativeInt,
  readOption,
  readString,
  toQueryString,
  type SearchParams,
} from "@/shared/lib/search-params";
import { LoadingPanel } from "@/shared/ui/notice";
import { PageShell } from "@/shared/ui/page-shell";

export const metadata: Metadata = { title: "Archivo de eventos" };

const DAYS_IN_YEAR = 365;

type PageProps = { searchParams: Promise<SearchParams> };

async function EventsContent({ searchParams }: PageProps) {
  const params = await searchParams;
  await connection();
  const lastYear = lastDaysRange(DAYS_IN_YEAR);
  const filters: EventFilters = {
    category: readString(params, "category"),
    status: readOption(params, "status", EVENT_STATUSES, "all"),
    ...orderedRange(
      readIsoDate(params, "start") ?? lastYear.start,
      readIsoDate(params, "end") ?? lastYear.end,
    ),
  };
  const offset = readNonNegativeInt(params, "offset") ?? 0;
  const [page, stats] = await Promise.all([
    getPersistedEvents(filters, { limit: EVENTS_PAGE_SIZE, offset }),
    getEventStats(filters),
  ]);
  // A stale or hand-edited offset past the end: jump to the last page instead of an empty one.
  if (!page.events.length && offset > 0 && page.total > 0) {
    const lastOffset = Math.floor((page.total - 1) / EVENTS_PAGE_SIZE) * EVENTS_PAGE_SIZE;
    redirect(`/events${toQueryString({ ...filters, offset: lastOffset || undefined })}`);
  }
  return <EventsScreen filters={filters} lastYear={lastYear} page={page} stats={stats} />;
}

export default function EventsPage({ searchParams }: PageProps) {
  return (
    <PageShell kicker="Earth Trend Detective · EONET persistido" title="Archivo de eventos">
      <Suspense fallback={<LoadingPanel label="Consultando catálogo EONET…" />}>
        <EventsContent searchParams={searchParams} />
      </Suspense>
    </PageShell>
  );
}
