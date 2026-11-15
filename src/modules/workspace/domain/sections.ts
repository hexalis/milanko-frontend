export type WorkspaceSection = {
  href: "/regions" | "/rankings" | "/events" | "/coverage";
  label: string;
  summary: string;
};

/** The persisted-data views migrated from the POC (regions, rankings, events, coverage). */
export const WORKSPACE_SECTIONS: readonly WorkspaceSection[] = [
  {
    href: "/regions",
    label: "Regiones",
    summary: "Serie, tendencia, anomalías y eventos de una de las 162 regiones.",
  },
  {
    href: "/rankings",
    label: "Planet Pulse",
    summary: "Ranking global de regiones por valor, anomalía o tendencia.",
  },
  {
    href: "/events",
    label: "Eventos",
    summary: "Catálogo EONET persistido, con filtros por categoría, estado y fecha.",
  },
  {
    href: "/coverage",
    label: "Inventario",
    summary: "Variables, fuentes, filas y rango histórico de los datos guardados.",
  },
];

export function isSectionActive(pathname: string, href: WorkspaceSection["href"]): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
