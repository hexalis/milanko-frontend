import type { ReactNode } from "react";

type PageShellProps = {
  /** Language of a page whose copy is not translated yet; otherwise <html lang> applies. */
  lang?: "en" | "es";
  kicker: string;
  title: string;
  /** Optional lead line under the title. */
  lead?: string;
  children: ReactNode;
};

/** Page frame: DS content width and gutters, and the page heading. */
export function PageShell({ lang, kicker, title, lead, children }: PageShellProps) {
  return (
    <main
      lang={lang}
      className="max-w-content-max medium:px-6 expanded:px-12 mx-auto w-full px-4 pb-12"
    >
      <header className="medium:pt-8 pt-6 pb-5">
        <p className="text-overline text-text-tertiary">{kicker}</p>
        <h1 className="text-display-s font-display text-text-primary mt-1 text-balance">{title}</h1>
        {lead ? (
          <p className="text-body-l font-reading text-text-secondary mt-2 max-w-[60ch]">{lead}</p>
        ) : null}
      </header>
      <div className="grid gap-4">{children}</div>
    </main>
  );
}
