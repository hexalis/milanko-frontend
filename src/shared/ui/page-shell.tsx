import type { ReactNode } from "react";

type PageShellProps = {
  kicker: string;
  title: string;
  /** Optional lead line under the title. */
  lead?: string;
  children: ReactNode;
};

/** Page frame: desk gutters, max content width and the page heading. */
export function PageShell({ kicker, title, lead, children }: PageShellProps) {
  return (
    <main className="mx-auto w-full max-w-[1360px] px-4 pb-12 sm:px-8 lg:px-12">
      <header className="pt-6 pb-5 sm:pt-8">
        <p className="text-ink-muted text-xs font-extrabold tracking-[0.12em] uppercase">
          {kicker}
        </p>
        <h1 className="mt-1 text-[clamp(2rem,4vw,2.875rem)] text-balance">{title}</h1>
        {lead ? <p className="text-ink-soft mt-2 max-w-[65ch] text-[17px]">{lead}</p> : null}
      </header>
      <div className="grid gap-4">{children}</div>
    </main>
  );
}
