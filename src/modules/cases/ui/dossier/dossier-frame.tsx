import Link from "next/link";
import type { ReactNode } from "react";
import { tv, type VariantProps } from "tailwind-variants";
import { Icon } from "@/shared/ui/icon";

/*
 * The case file reads as five numbered documents on a sticky spine (DESIGN.md · Page rhythm).
 * The spine is a plain list of anchors: no scroll-spy, so it works before any script runs.
 */

export type DocId = "cover" | "evidence" | "why" | "context" | "limits" | "appendix";

const docAnchor = (id: DocId) => `doc-${id}`;

type DossierFrameProps = {
  crumbs: { href: string; label: string; current: string; navLabel: string };
  spine: { label: string; docs: { id: DocId; label: string }[] };
  children: ReactNode;
};

const SPINE_LINK =
  "flex min-h-10 shrink-0 items-center gap-3 rounded-full px-3 py-2 text-label-m text-text-secondary no-underline transition-colors duration-fast hover:bg-bg-hover hover:text-text-primary focus-visible:focus-ring focus-visible:outline-focus-ring";

export function DossierFrame({ crumbs, spine, children }: DossierFrameProps) {
  return (
    <main className="max-w-content-max medium:px-6 expanded:px-12 mx-auto w-full px-4 pb-16">
      <nav aria-label={crumbs.navLabel} className="text-label-m medium:pt-8 pt-6 pb-4">
        <ol className="text-text-secondary flex flex-wrap items-center gap-1.5">
          <li>
            <Link
              href={crumbs.href}
              className="hover:text-text-primary focus-visible:focus-ring focus-visible:outline-focus-ring underline-offset-2 hover:underline"
            >
              {crumbs.label}
            </Link>
          </li>
          <li aria-hidden="true">
            <Icon name="caret-right" size="sm" />
          </li>
          <li className="text-text-primary font-mono" aria-current="page">
            {crumbs.current}
          </li>
        </ol>
      </nav>

      <div className="expanded:grid expanded:grid-cols-[150px_minmax(0,1fr)] expanded:items-start expanded:gap-12">
        <nav
          aria-label={spine.label}
          className="bg-bg-canvas expanded:top-8 expanded:mx-0 expanded:px-0 sticky top-0 z-10 -mx-4 mb-6 px-4 py-2"
        >
          <ol className="expanded:flex-col expanded:overflow-visible flex gap-0.5 overflow-x-auto">
            {spine.docs.map((doc, index) => (
              <li key={doc.id}>
                <a href={`#${docAnchor(doc.id)}`} className={SPINE_LINK}>
                  <span className="text-text-secondary font-mono text-[12px]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>{doc.label}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <div className="flex min-w-0 flex-col gap-20">{children}</div>
      </div>
    </main>
  );
}

const docSection = tv({
  base: "flex scroll-mt-20 flex-col gap-4 expanded:scroll-mt-8",
  variants: {
    width: { text: "max-w-[72ch]", full: "max-w-none" },
  },
  defaultVariants: { width: "text" },
});

type DocSectionProps = VariantProps<typeof docSection> & {
  id: DocId;
  /** The section's heading id, or a plain label when the section has no h2 (the finding). */
  labelledBy?: string;
  label?: string;
  children: ReactNode;
};

export function DocSection({ id, labelledBy, label, width, children }: DocSectionProps) {
  return (
    <section
      id={docAnchor(id)}
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : label}
      className={docSection({ width })}
    >
      {children}
    </section>
  );
}

/** A document's h2, at the size the POC gave every numbered document. */
export function DocHeading({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="text-heading-h2 font-display text-text-primary text-balance">
      {children}
    </h2>
  );
}
