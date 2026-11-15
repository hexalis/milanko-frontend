import Link from "next/link";
import { getTranslator } from "@/modules/copy";
import type { ReactNode } from "react";
import { PageShell } from "@/shared/ui/page-shell";
import { WORKSPACE_SECTIONS } from "../domain/sections";

/* The home page is Spanish only for now, like the persisted-data pages it links to. */
const { t } = getTranslator("es");

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
              className="group rounded-card bg-bg-surface shadow-card hover:shadow-raised block h-full p-5 no-underline transition-[transform,box-shadow] hover:-translate-y-0.5 sm:p-6"
            >
              <span className="flex items-baseline justify-between gap-3">
                <span className="font-display text-heading-h2">{t(section.labelKey)}</span>
                <span
                  aria-hidden="true"
                  className="text-text-link font-extrabold group-hover:translate-x-0.5"
                >
                  →
                </span>
              </span>
              <span className="text-text-secondary mt-1 block">{section.summary}</span>
            </Link>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
