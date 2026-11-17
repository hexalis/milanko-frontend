/** The browser always reaches the API on the same origin; nginx (or the dev rewrite) routes it. */
const API_DOCS_PATH = "/api/v1/docs";

/*
 * Under every page but the globe: there the world fills the window, so a footer would only make the
 * page scroll under it (the globe names its sources in its own "Details").
 */
export function WorkspaceFooter() {
  return (
    <footer className="text-text-tertiary mx-auto flex w-full max-w-[1360px] flex-wrap justify-between gap-4 px-4 pt-2 pb-8 text-[13px] font-semibold in-[body:has([data-fills-window])]:hidden sm:px-8 lg:px-12">
      <p>Datos de NASA POWER, MODIS (GIBS) y EONET, persistidos por la API de Milanko.</p>
      <p>
        API:{" "}
        <a
          className="text-text-link relative font-semibold underline underline-offset-2 after:absolute after:inset-x-0 after:-inset-y-[14px] after:content-['']"
          href={API_DOCS_PATH}
        >
          {API_DOCS_PATH}
        </a>
      </p>
    </footer>
  );
}
