import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EventContextScreen } from "@/modules/events/ui/event-context-screen";
import { getEventContext } from "@/server/integrations/milanko-api/events";
import { LoadingPanel } from "@/shared/ui/notice";
import { PageShell } from "@/shared/ui/page-shell";
import { TextLink } from "@/shared/ui/text-link";

type PageProps = { params: Promise<{ id: string }> };

/** Route params may still be percent-encoded; a malformed sequence is treated as an unknown id. */
function decodeEventId(id: string): string | null {
  try {
    return decodeURIComponent(id);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Evento ${decodeEventId(id) ?? id}` };
}

async function EventContent({ params }: PageProps) {
  const { id } = await params;
  const eventId = decodeEventId(id);
  if (!eventId) notFound();
  const context = await getEventContext(eventId);
  if (!context) notFound();
  return (
    <>
      <h2 className="text-[clamp(1.5rem,3vw,2rem)] text-balance">{context.event.title}</h2>
      <EventContextScreen context={context} />
    </>
  );
}

export default function EventPage({ params }: PageProps) {
  return (
    <PageShell
      lang="es"
      kicker="Earth Trend Detective · evento + ambiente"
      title="Contexto del evento"
    >
      <p>
        <TextLink href="/events">← Volver a eventos</TextLink>
      </p>
      <Suspense fallback={<LoadingPanel label="Cargando contexto del evento…" />}>
        <EventContent params={params} />
      </Suspense>
    </PageShell>
  );
}
