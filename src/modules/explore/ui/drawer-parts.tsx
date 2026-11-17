import Link from "next/link";
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

/**
 * The kind of thing open, then its name as the drawer's heading (focused when the drawer opens).
 * It stays at the top while the panel scrolls, under the drawer's close button, like Actions at
 * the bottom (-top-5 and the negative margins cancel the drawer's padding).
 */
export function PanelHead({ icon, kind, title, titleRef }: PanelHeadProps) {
  return (
    <header className="border-border-subtle bg-bg-surface sticky -top-5 z-[2] -mx-5 -mt-5 flex flex-col gap-1.5 border-b px-5 pe-15 pt-5 pb-3">
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

/**
 * The panel's footer: its actions, pinned to the bottom of the drawer and kept in view while the
 * panel scrolls (-bottom-5 cancels the drawer's padding, which sticky offsets count from). The
 * first one is the main action and takes the room left; the rest stay compact.
 * It is the panel's last child: the drawer lets the panel fill its height, so mt-auto sets it down.
 */
export function Actions({ children }: { children: ReactNode }) {
  return (
    <div className="border-border-subtle bg-bg-surface sticky -bottom-5 z-[1] -mx-5 mt-auto -mb-5 flex flex-wrap gap-2 border-t px-5 pt-4 pb-5 [&>:first-child]:flex-1 [&>:first-child]:justify-center">
      {children}
    </div>
  );
}

/**
 * The way into a case file, as the panel's main action. Its icon is a small folder like the case
 * files' own: on hover or focus its sheet rises out and the cover dips, as when the folder opens.
 */
export function CaseFileLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={`${PRIMARY_LINK} group/file`}>
      <FileGlyph />
      {children}
      <span className="group-hover/file:translate-x-0.5 group-focus-visible/file:translate-x-0.5 motion-safe:transition-transform motion-safe:duration-200">
        <Icon name="arrow-right" />
      </span>
    </Link>
  );
}

const FILE_MOTION =
  "[transform-box:fill-box] motion-safe:transition-[translate,scale] motion-safe:duration-300 motion-safe:ease-out";

function FileGlyph() {
  return (
    <svg
      viewBox="0 0 24 20"
      className="size-[1.5em] shrink-0 overflow-visible"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M2 4a2 2 0 0 1 2-2h5l2 2h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2Z"
        className="fill-current opacity-40"
      />
      <rect
        x="7"
        y="4.5"
        width="12"
        height="10"
        rx="1"
        className={`${FILE_MOTION} fill-white opacity-70 group-hover/file:-translate-y-0.5 group-focus-visible/file:-translate-y-0.5`}
      />
      <g
        className={`${FILE_MOTION} group-hover/file:-translate-y-1.5 group-focus-visible/file:-translate-y-1.5`}
      >
        <rect x="4.5" y="6" width="13" height="10" rx="1" className="fill-white" />
        <path
          d="M7 9h8M7 11.5h5"
          className="stroke-action-primary"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </g>
      <path
        d="M2 10.5h20V16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2Z"
        className={`${FILE_MOTION} origin-bottom fill-current group-hover/file:scale-y-75 group-focus-visible/file:scale-y-75`}
      />
    </svg>
  );
}
