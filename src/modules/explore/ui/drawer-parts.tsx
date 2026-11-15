import type { ReactNode, Ref } from "react";
import type { CaseSummary } from "@/modules/cases";
import { buttonLink } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";

/* Small pieces shared by the drawer's panels (the POC's gx-drawer__kind, title, gx-facts…). */

export const DRAWER_TITLE_ID = "explore-drawer-title";

export const SECONDARY_BUTTON = `${buttonLink({ intent: "secondary" })} gap-1.5`;
export const PRIMARY_LINK = `${buttonLink({ intent: "primary" })} gap-1.5`;

export const DIRECTION_TEXT: Record<CaseSummary["direction"], string> = {
  up: "text-trend-up",
  down: "text-trend-down",
  flat: "text-trend-neutral",
};

type PanelHeadProps = {
  icon: string;
  kind: ReactNode;
  title: string;
  titleRef?: Ref<HTMLHeadingElement>;
};

/** The kind of thing open, then its name as the drawer's heading (focused when the drawer opens). */
export function PanelHead({ icon, kind, title, titleRef }: PanelHeadProps) {
  return (
    <header className="flex flex-col gap-1.5 pe-10">
      <p className="text-label-m text-text-secondary flex items-center gap-1.5">
        <Icon name={icon} />
        {kind}
      </p>
      <h2
        id={DRAWER_TITLE_ID}
        ref={titleRef}
        tabIndex={-1}
        className="text-heading-h3 font-display text-text-primary text-balance outline-none"
      >
        {title}
      </h2>
    </header>
  );
}

type Fact = { label: string; value: ReactNode };

export function Facts({ facts }: { facts: readonly Fact[] }) {
  return (
    <dl className="border-border-subtle grid grid-cols-2 gap-x-4 gap-y-3 border-y border-dashed py-3">
      {facts.map((fact) => (
        <div key={fact.label} className="min-w-0">
          <dt className="text-overline text-text-tertiary">{fact.label}</dt>
          <dd className="text-label-l text-text-primary mt-0.5 break-words tabular-nums">
            {fact.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function Actions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-2 pt-1">{children}</div>;
}
