import type { ReactNode } from "react";
import { buttonLink } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { AccordionItem, AccordionPanel, AccordionRoot, AccordionTrigger } from "./hexalis-dossier";

type ExactNumbersProps = {
  title: string;
  rows: { term: ReactNode; value: ReactNode; key: string }[];
  csv: { href: string; label: string };
};

/**
 * The appendix fold ("Exact numbers and CSV"): folded by default, but its content stays in the
 * page (hidden until found), so find-in-page and the CSV link still reach it.
 */
export function ExactNumbers({ title, rows, csv }: ExactNumbersProps) {
  return (
    <AccordionRoot headingLevel={3}>
      <AccordionItem id="exact-numbers">
        <AccordionTrigger>{title}</AccordionTrigger>
        <AccordionPanel>
          <dl className="medium:grid-cols-2 grid gap-x-6 gap-y-4 py-2">
            {rows.map((row) => (
              <div key={row.key} className="flex min-w-0 flex-col gap-1">
                <dt className="text-label-m text-text-secondary">{row.term}</dt>
                <dd className="text-body-m text-text-primary break-words">{row.value}</dd>
              </div>
            ))}
          </dl>
          <a href={csv.href} download className={`${buttonLink({ intent: "secondary" })} mt-4`}>
            <Icon name="csv" />
            {csv.label}
          </a>
        </AccordionPanel>
      </AccordionItem>
    </AccordionRoot>
  );
}

/** A figure in the fold: monospaced, like the POC's appendix values. */
export function Mono({ children }: { children: ReactNode }) {
  return <span className="font-mono text-[14px]">{children}</span>;
}
