import Link from "next/link";
import type { ReactNode } from "react";
import { PageShell } from "@/shared/ui/page-shell";
import { WORKSPACE_SECTIONS } from "../domain/sections";

type HomeScreenProps = {
  /** API status card; streamed in by the route. */
  apiStatus: ReactNode;
};

export function HomeScreen({ apiStatus }: HomeScreenProps) {
  return (
    <PageShell
      kicker="Earth Trend Detective · datos persistidos"
      title="¿Qué está cambiando en la Tierra, dónde y cuánto?"
      lead="Explora las series de NASA guardadas por región, compara las 162 regiones del planeta y revisa los eventos de EONET con su contexto ambiental."
    >
      {apiStatus}
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {WORKSPACE_SECTIONS.map((section) => (
          <li key={section.href}>
            <Link
              href={section.href}
              className="group rounded-card bg-surface shadow-clay hover:shadow-clay-raised block h-full p-5 no-underline transition-[transform,box-shadow] hover:-translate-y-0.5 sm:p-6"
            >
              <span className="flex items-baseline justify-between gap-3">
                <span className="font-display text-[26px] font-extrabold">{section.label}</span>
                <span
                  aria-hidden="true"
                  className="text-accent font-extrabold group-hover:translate-x-0.5"
                >
                  →
                </span>
              </span>
              <span className="text-ink-soft mt-1 block">{section.summary}</span>
            </Link>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
