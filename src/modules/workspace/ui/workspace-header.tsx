import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { WorkspaceNav } from "./workspace-nav";
import { WorkspaceNavLinks } from "./workspace-nav-links";

type WorkspaceHeaderProps = {
  /** The environment badge; streamed because it is read at request time. */
  environment: ReactNode;
};

export function WorkspaceHeader({ environment }: WorkspaceHeaderProps) {
  return (
    <header className="mx-auto w-full max-w-[1360px] px-4 pt-3 sm:px-8 lg:px-12">
      <div className="rounded-slab bg-surface shadow-clay-raised flex flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-5">
        <Link href="/" className="flex items-baseline gap-2 no-underline">
          <span className="font-display text-2xl font-extrabold">Milanko</span>
          <span className="text-ink-muted hidden text-[13px] font-semibold sm:inline">
            Earth Trend Detective
          </span>
        </Link>
        <Suspense fallback={<WorkspaceNavLinks />}>
          <WorkspaceNav />
        </Suspense>
        <div className="ml-auto">{environment}</div>
      </div>
    </header>
  );
}
