import type { ReactNode } from "react";
import { tv, type VariantProps } from "tailwind-variants";
import { Icon } from "@/shared/ui/icon";
import { ExternalLink } from "@/shared/ui/text-link";

/* Pieces shared by the case files and the guided investigation (POC app.js: chartHead, sourcesList). */

/**
 * Explained chart header: what is measured, the unit and the period, then (when given) what the
 * chart is for.
 */
export function ChartHead({ subtitle, purpose }: { subtitle: string; purpose?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-body-m text-text-secondary">{subtitle}</p>
      {purpose ? (
        <p className="text-body-s text-text-secondary flex items-start gap-2">
          <span className="text-text-brand mt-0.5">
            <Icon name="info-on" />
          </span>
          <span>{purpose}</span>
        </p>
      ) : null}
    </div>
  );
}

export type SourceItem = { icon: string; name: string; url?: string | null; description: string };

export function SourcesList({ items, newTabHint }: { items: SourceItem[]; newTabHint: string }) {
  return (
    <ul className="flex flex-col gap-4">
      {items.map((item) => (
        <li key={item.name} className="flex items-start gap-3">
          <span className="text-text-brand mt-0.5">
            <Icon name={item.icon} />
          </span>
          <span className="flex flex-col gap-0.5">
            <strong className="text-body-m-strong text-text-primary">
              {item.url ? (
                <ExternalLink href={item.url} newTabHint={newTabHint}>
                  {item.name}
                </ExternalLink>
              ) : (
                item.name
              )}
            </strong>
            <span className="text-body-s text-text-secondary">{item.description}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** The caption under a chart: only what nothing else says (the source, or the run-up dates). */
export function ChartCaption({ children }: { children: ReactNode }) {
  return <p className="text-body-s text-text-secondary mt-3">{children}</p>;
}

const evidenceBlock = tv({
  base: "medium:rounded-shell medium:p-10 flex flex-col gap-4 rounded-card p-6 text-text-primary",
  variants: {
    // Evidence slabs in the theme's block tone with its hard lip (DESIGN.md · Elevation, slab lip).
    tone: {
      rose: "bg-surface-tone-1 shadow-card",
      tide: "bg-surface-tone-2 shadow-card",
      sage: "bg-surface-tone-3 shadow-card",
      ice: "bg-surface-tone-4 shadow-card",
      stone: "bg-surface-tone-5 shadow-card",
    },
  },
});

export type BlockTone = NonNullable<VariantProps<typeof evidenceBlock>["tone"]>;

/** Trend themes and event families to their slab tone (POC block--temperature, --water…). */
export const THEME_TONE: Record<string, BlockTone> = {
  temperature: "rose",
  water: "tide",
  vegetation: "sage",
};

export function EvidenceBlock({ tone, children }: { tone: BlockTone; children: ReactNode }) {
  return <div className={evidenceBlock({ tone })}>{children}</div>;
}
