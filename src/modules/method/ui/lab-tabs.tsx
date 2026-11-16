"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Icon } from "@/shared/ui/icon";

/*
 * The two labs behind one set of tabs (POC .lab__tabs): one experiment on screen at a time. Both
 * panels stay mounted, so a reader who switches back finds their sliders where they left them.
 * Arrow keys, Home and End move between tabs (WAI-ARIA tabs, automatic activation).
 */

export type LabTab = { id: string; icon: string; label: string; lead: string; panel: ReactNode };

const TAB =
  "inline-flex min-h-touch-min cursor-pointer items-center gap-2 rounded-sm px-4 text-label-m font-semibold text-text-secondary transition-colors duration-fast hover:text-text-primary focus-visible:focus-ring focus-visible:outline-focus-ring aria-selected:bg-bg-surface aria-selected:text-text-primary aria-selected:shadow-card";

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
      <div
        role="tablist"
        aria-label={label}
        className="bg-bg-canvas inline-flex w-fit max-w-full gap-1 overflow-x-auto rounded-md p-1"
      >
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
            <Icon name={tab.icon} />
            {tab.label}
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
