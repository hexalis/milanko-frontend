"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { interpolate } from "@/shared/lib/i18n";
import { Icon } from "@/shared/ui/icon";
import { countOpened } from "../domain/case-progress";
import { CASES } from "../domain/sections";
import { useCaseProgress } from "../hooks/use-case-progress";
import { NavIcon, RAIL_GROUP_ITEM, RailTip } from "./rail-parts";
import { ShellNavLink } from "./shell-nav-link";

export type CaseKindLink = { href: string; icon: string; label: string; count: number };

type RailCasesItemProps = {
  label: string;
  /** "{n} of {total} opened", filled here once the reader's progress is known. */
  progressTemplate: string;
  kindsLabel: string;
  kinds: readonly CaseKindLink[];
  /** Title of every case file by id; its size is the archive total. */
  titles: Readonly<Record<string, string>>;
};

const SUB_LINK =
  "flex min-h-9 items-center gap-2.5 rounded-md px-3 text-label-s text-text-secondary no-underline hover:bg-bg-hover hover:text-text-primary focus-visible:focus-ring focus-visible:outline-focus-ring";

/**
 * Case files, with the reader's "n of 38 opened" line and a caret that lists the archive's kinds
 * with their counts (POC nav__item). The progress renders only once mounted: it lives in storage.
 */
export function RailCasesItem({
  label,
  progressTemplate,
  kindsLabel,
  kinds,
  titles,
}: RailCasesItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const listId = useId();
  const progress = useCaseProgress();
  const total = Object.keys(titles).length;
  const opened = progress ? countOpened(progress.read, titles) : 0;

  return (
    <>
      <div
        data-tour="shell-cases"
        className="rounded-control has-[>a:hover,>button:hover]:bg-bg-hover has-[>a[aria-current=page]]:bg-action-selected flex items-center gap-0.5"
      >
        <ShellNavLink
          href={CASES.href}
          className={`${RAIL_GROUP_ITEM} min-h-14 flex-1 after:hidden aria-[current=page]:bg-transparent`}
        >
          <NavIcon icon={CASES.icon} hasActiveIcon={CASES.hasActiveIcon} />
          <span className="nav-collapsed:sr-only flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate">{label}</span>
            {progress ? (
              <>
                <span className="text-label-xs text-text-tertiary truncate font-normal">
                  {interpolate(progressTemplate, { n: opened, total })}
                </span>
                <span
                  aria-hidden="true"
                  className="bg-bg-surface-sunken mt-0.5 block h-1.5 w-full overflow-hidden rounded-full"
                >
                  <span
                    className="bg-progress-fill block h-full origin-left rounded-full"
                    style={{ transform: `scaleX(${Math.max(0.04, total ? opened / total : 0)})` }}
                  />
                </span>
              </>
            ) : null}
          </span>
          <RailTip label={label} />
        </ShellNavLink>
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={listId}
          aria-label={kindsLabel}
          onClick={() => setIsOpen((open) => !open)}
          className="group/caret text-icon-secondary hover:text-icon-primary focus-visible:focus-ring focus-visible:outline-focus-ring nav-collapsed:hidden grid size-9 shrink-0 cursor-pointer place-items-center rounded-sm"
        >
          <span className="duration-fast flex transition-transform group-aria-expanded/caret:rotate-180 motion-reduce:transition-none">
            <Icon name="caret-down" />
          </span>
        </button>
      </div>
      <ul
        id={listId}
        hidden={!isOpen}
        className="border-border-subtle nav-collapsed:hidden ms-6 flex flex-col gap-0.5 border-s ps-2"
      >
        {kinds.map((kind) => (
          <li key={kind.href}>
            <Link href={kind.href} className={SUB_LINK}>
              <Icon name={kind.icon} />
              <span className="min-w-0 flex-1 truncate">{kind.label}</span>
              <span className="text-text-tertiary font-mono text-xs">{kind.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
