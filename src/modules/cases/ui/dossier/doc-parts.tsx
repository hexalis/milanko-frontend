import type { ReactNode } from "react";
import { tv, type VariantProps } from "tailwind-variants";
import { Icon } from "@/shared/ui/icon";
import { ExternalLink } from "@/shared/ui/text-link";
import { TabsList, TabsPanel, TabsRoot, TabsTab } from "./hexalis-dossier";

/* Pieces shared by the trend and anomaly dossiers (POC app.js: props, chartHead, evidenceTabs, sourcesList). */

export type PropRow = { icon: string; label: ReactNode; value: ReactNode };

/** Page properties under a file's title: label on the left, value on the right, one fact per row. */
export function PropsList({ rows }: { rows: PropRow[] }) {
  return (
    <dl className="border-border-subtle border-t">
      {rows.map((row) => (
        <div
          key={row.icon}
          className="border-border-subtle medium:grid-cols-[11rem_minmax(0,1fr)] grid gap-x-4 gap-y-1 border-b py-3"
        >
          <dt className="text-label-m text-text-secondary flex items-center gap-2">
            <Icon name={row.icon} />
            {row.label}
          </dt>
          <dd className="text-body-m text-text-primary flex flex-wrap items-center gap-x-4 gap-y-2">
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

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

type EvidenceTabsProps = {
  labels: { aria: string; chart: string; table: string; sources: string };
  chart: ReactNode;
  table: ReactNode;
  sources: ReactNode;
};

const TAB_ICONS = { chart: "graph", table: "table", sources: "info" } as const;

/**
 * Chart · Table · Sources: the same evidence three ways. Every panel is rendered on the server
 * (force-mounted, hidden until chosen), so the exact values are in the page without the chart.
 */
export function EvidenceTabs({ labels, chart, table, sources }: EvidenceTabsProps) {
  const panels = { chart, table, sources };
  const keys = ["chart", "table", "sources"] as const;
  return (
    <div className="rounded-card bg-bg-surface shadow-card medium:p-5 p-3">
      <TabsRoot variant="pill" defaultSelectedKey="chart">
        <TabsList aria-label={labels.aria}>
          {keys.map((key) => (
            <TabsTab key={key} id={key}>
              <span className="inline-flex items-center gap-1.5">
                <Icon name={TAB_ICONS[key]} />
                {labels[key]}
              </span>
            </TabsTab>
          ))}
        </TabsList>
        {keys.map((key) => (
          <TabsPanel
            key={key}
            id={key}
            shouldForceMount
            className="max-h-[32rem] overflow-auto pt-4"
          >
            {panels[key]}
          </TabsPanel>
        ))}
      </TabsRoot>
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

export const FAMILY_TONE: Record<string, BlockTone> = {
  fire: "rose",
  storm: "ice",
  water: "tide",
  ice: "ice",
  earth: "stone",
};

export function EvidenceBlock({ tone, children }: { tone: BlockTone; children: ReactNode }) {
  return <div className={evidenceBlock({ tone })}>{children}</div>;
}

/** Plain paragraph of a document, at the lead size. */
export function Lead({ children }: { children: ReactNode }) {
  return <p className="text-body-l font-reading text-text-secondary max-w-[68ch]">{children}</p>;
}
