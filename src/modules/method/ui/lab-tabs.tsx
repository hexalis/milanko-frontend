"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Icon } from "@/shared/ui/icon";

/*
 * The playground's experiments behind one set of tabs, drawn as cards that say what each one lets
 * the reader do: one experiment on screen at a time. Every panel stays mounted, so a reader who
 * switches back finds their sliders where they left them.
 * Arrow keys, Home and End move between tabs (WAI-ARIA tabs, automatic activation).
 */

export type LabTab = {
  id: string;
  icon: string;
  label: string;
  /** One line on the card: what the reader can do there. */
  note: string;
  lead: string;
  panel: ReactNode;
};

const TAB =
  "rounded-card border-border-subtle bg-bg-surface text-text-secondary duration-fast hover:border-border-strong focus-visible:focus-ring focus-visible:outline-focus-ring aria-selected:border-border-selected aria-selected:ring-border-selected aria-selected:shadow-card group grid cursor-pointer grid-cols-[auto_minmax(0,1fr)] content-start items-start gap-x-3 gap-y-0.5 border p-4 text-start transition-colors aria-selected:ring-1 aria-selected:ring-inset";

const TAB_ICON =
  "bg-bg-surface-sunken text-text-secondary group-aria-selected:bg-action-primary group-aria-selected:text-text-on-primary row-span-2 grid size-10 place-items-center rounded-full transition-colors";

export function LabTabs({ tabs, label }: { tabs: LabTab[]; label: string }) {
  const base = useId();
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function select(index: number) {
    const next = (index + tabs.length) % tabs.length;
    setActive(next);
    refs.current[next]?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const moves: Record<string, number> = {
      ArrowRight: active + 1,
      ArrowLeft: active - 1,
      Home: 0,
      End: tabs.length - 1,
    };
    const target = moves[event.key];
    if (target === undefined) return;
    event.preventDefault();
    select(target);
  }

  return (
    <div className="grid gap-5">
      <div role="tablist" aria-label={label} className="medium:grid-cols-3 grid gap-3">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="tab"
            id={`${base}-tab-${tab.id}`}
            aria-selected={index === active}
            aria-controls={`${base}-panel-${tab.id}`}
            tabIndex={index === active ? 0 : -1}
            onClick={() => setActive(index)}
            onKeyDown={onKeyDown}
            className={TAB}
          >
            <span className={TAB_ICON}>
              <Icon name={tab.icon} />
            </span>
            <span className="text-label-l text-text-primary font-semibold">{tab.label}</span>
            <span className="text-body-s">{tab.note}</span>
          </button>
        ))}
      </div>
      {tabs.map((tab, index) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${base}-panel-${tab.id}`}
          aria-labelledby={`${base}-tab-${tab.id}`}
          hidden={index !== active}
          className="animate-enter grid gap-4"
        >
          <p className="text-body-m text-text-secondary max-w-[65ch]">{tab.lead}</p>
          {tab.panel}
        </div>
      ))}
    </div>
  );
}
