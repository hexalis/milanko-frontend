export type WorkspaceSection = {
  href:
    | "/ask"
    | "/briefing"
    | "/cases"
    | "/explore"
    | "/method"
    | "/regions"
    | "/rankings"
    | "/events"
    | "/coverage";
  /** Copy key (POC i18n) for the menu label. */
  labelKey: string;
  /** Spanish summary for the home cards (the persisted-data pages are Spanish only for now). */
  summary: string;
};

export const WORKSPACE_SECTIONS: readonly WorkspaceSection[] = [
  {
    href: "/ask",
    labelKey: "nav.ask",
    summary: "Arma una pregunta sobre la Tierra y sigue la investigación paso a paso.",
  },
  {
    href: "/briefing",
    labelKey: "nav.briefing",
    summary:
      "Lo que muestran los datos de NASA hoy: hallazgos, pares opuestos y el falso sospechoso.",
  },
  {
    href: "/cases",
    labelKey: "nav.cases",
    summary: "Expedientes de tendencias y anomalías con datos de NASA, en inglés o español.",
  },
  {
    href: "/explore",
    labelKey: "nav.explore",
    summary: "Globo 3D con los expedientes y los eventos de NASA EONET de cada región.",
  },
  {
    href: "/method",
    labelKey: "nav.method",
    summary: "Cómo sabemos si un cambio es real o ruido, con un laboratorio para probarlo.",
  },
  {
    href: "/regions",
    labelKey: "nav.regions",
    summary: "Serie, tendencia, anomalías y eventos de una de las 162 regiones.",
  },
  {
    href: "/rankings",
    labelKey: "nav.rankings",
    summary: "Ranking global de regiones por valor, anomalía o tendencia.",
  },
  {
    href: "/events",
    labelKey: "nav.events-db",
    summary: "Catálogo EONET persistido, con filtros por categoría, estado y fecha.",
  },
  {
    href: "/coverage",
    labelKey: "nav.coverage",
    summary: "Variables, fuentes, filas y rango histórico de los datos guardados.",
  },
];

export type SectionLabels = Record<WorkspaceSection["href"], string>;

export function isSectionActive(pathname: string, href: WorkspaceSection["href"]): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
