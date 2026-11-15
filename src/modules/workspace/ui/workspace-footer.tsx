/** The browser always reaches the API on the same origin; nginx (or the dev rewrite) routes it. */
const API_DOCS_PATH = "/api/v1/docs";

export function WorkspaceFooter() {
  return (
    <footer className="text-text-tertiary mx-auto flex w-full max-w-[1360px] flex-wrap justify-between gap-4 px-4 pt-2 pb-8 text-[13px] font-semibold sm:px-8 lg:px-12">
      <p>Datos de NASA POWER, MODIS (GIBS) y EONET, persistidos por la API de Milanko.</p>
      <p>
        API:{" "}
        <a className="text-text-link font-bold underline underline-offset-2" href={API_DOCS_PATH}>
          {API_DOCS_PATH}
        </a>
      </p>
    </footer>
  );
}
