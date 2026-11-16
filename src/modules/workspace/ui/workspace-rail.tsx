import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/shared/ui/icon";
import { MilankoMark, MilankoWordmark } from "@/shared/ui/milanko-logo";
import {
  ASK,
  EXPLORE,
  RAIL_DATA,
  SHOW_DATA_IN_RAIL,
  RAIL_LEARN,
  RAIL_START,
  type NavSection,
} from "../domain/sections";
import type { Theme } from "../domain/theme";
import { NavIcon, RAIL_ITEM, RAIL_LABEL, RailTip } from "./rail-parts";
import { RailCasesItem, type CaseKindLink } from "./rail-cases-item";
import { RailCollapseButton } from "./rail-collapse-button";
import { RailRecent } from "./rail-recent";
import { RailSearchButton } from "./rail-search-button";
import { ShellNavLink } from "./shell-nav-link";
import { ThemeSwitch } from "./theme-switch";

const RAIL_ID = "rail";

export type RailCopy = {
  /** Section labels by copy key. */
  label: (key: string) => string;
  menu: string;
  brandSub: string;
  collapse: string;
  expand: string;
  kinds: string;
  progressTemplate: string;
  dataGroup: string;
  recent: string;
  search: string;
  themeGroup: string;
  themes: Readonly<Record<Theme, string>>;
};

type WorkspaceRailProps = {
  copy: RailCopy;
  caseKinds: readonly CaseKindLink[];
  caseTitles: Readonly<Record<string, string>>;
  search: { inputId: string; focusHref: string };
  languageSwitch: ReactNode;
  environment: ReactNode;
};

/*
 * The question is the rail's way in, so it reads as an invitation rather than one more slab of
 * colour or a grey field that looks disabled: a brand-tinted pill with a hairline brand edge, the
 * question mark in a filled disc with a soft halo, and an arrow. On hover a light sweeps across,
 * the halo widens and the arrow leans in. Collapsed, only the disc stays.
 */
const ASK_CTA =
  "group/item relative mb-2 flex min-h-13 items-center gap-3 overflow-hidden rounded-full border border-border-selected bg-[linear-gradient(100deg,var(--color-action-selected),var(--color-bg-surface)_85%)] ps-1.5 pe-4 text-label-l font-semibold text-text-primary no-underline shadow-card transition-[border-color,box-shadow] duration-base motion-reduce:transition-none hover:border-action-primary hover:shadow-raised focus-visible:focus-ring focus-visible:outline-focus-ring aria-[current=page]:border-action-primary before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full before:bg-[linear-gradient(110deg,transparent_35%,rgb(255_255_255/0.28)_50%,transparent_65%)] before:transition-transform before:duration-700 hover:before:translate-x-full motion-reduce:before:hidden nav-collapsed:mx-auto nav-collapsed:size-12 nav-collapsed:min-h-12 nav-collapsed:justify-center nav-collapsed:overflow-visible nav-collapsed:border-0 nav-collapsed:bg-none nav-collapsed:p-0 nav-collapsed:shadow-none nav-collapsed:before:hidden";

const ASK_DISC =
  "relative grid size-10 shrink-0 place-items-center rounded-full bg-action-primary text-xl text-text-on-primary shadow-card ring-4 ring-action-primary/15 transition-[box-shadow,background-color,scale] duration-base group-hover/item:scale-105 group-hover/item:bg-action-primary-hover group-hover/item:ring-6 group-hover/item:ring-action-primary/20 motion-reduce:transition-none";

const ASK_ARROW =
  "relative flex text-icon-brand transition-[translate] duration-fast group-hover/item:translate-x-1 motion-reduce:transition-none nav-collapsed:hidden";

function RailLink({ section, label }: { section: NavSection; label: string }) {
  return (
    <ShellNavLink href={section.href} className={RAIL_ITEM}>
      <NavIcon icon={section.icon} hasActiveIcon={section.hasActiveIcon} />
      <span className={RAIL_LABEL}>{label}</span>
      <RailTip label={label} />
    </ShellNavLink>
  );
}

/**
 * The floating side rail of wide screens (POC aside.rail): brand and collapse, the question CTA,
 * the destinations, the open-data pages, Recent, and a foot with search, language, theme and the
 * environment. Open or collapsed comes from html[data-nav], set before first paint.
 */
export function WorkspaceRail({
  copy,
  caseKinds,
  caseTitles,
  search,
  languageSwitch,
  environment,
}: WorkspaceRailProps) {
  return (
    <header
      id={RAIL_ID}
      className="bg-bg-surface shadow-dropdown shell:flex in-[.nav-anim]:duration-base in-[.nav-anim]:ease-standard fixed inset-y-3 start-3 z-30 hidden w-(--rail-w) flex-col rounded-lg px-3 pt-4.5 pb-3.5 in-[.nav-anim]:transition-[width] motion-reduce:transition-none"
    >
      <div className="nav-collapsed:flex-col nav-collapsed:gap-2 flex items-center justify-between gap-1.5 ps-1.5 pb-3">
        <Link
          href="/"
          className="text-text-primary focus-visible:focus-ring focus-visible:outline-focus-ring nav-collapsed:flex-none flex min-w-0 flex-1 items-center gap-2.5 rounded-md no-underline"
        >
          <MilankoMark size={32} />
          <span className="nav-collapsed:hidden flex min-w-0 flex-col gap-1">
            <span className="flex text-[1.15rem]">
              <MilankoWordmark />
            </span>
            <span className="text-label-xs text-text-tertiary truncate">{copy.brandSub}</span>
          </span>
          <span className="sr-only">Milanko</span>
        </Link>
        <RailCollapseButton
          railId={RAIL_ID}
          collapseLabel={copy.collapse}
          expandLabel={copy.expand}
        />
      </div>

      {/*
       * The list scrolls, so it clips whatever is drawn outside it. The focus ring and the current
       * page's ring reach 4px past an item (2px offset + 2px ring): the 8px inner padding keeps
       * them whole, and the negative margins keep the items where they were.
       */}
      <nav
        aria-label={copy.menu}
        data-tour="shell-nav"
        className="nav-collapsed:overflow-visible -mx-2 -mt-1.5 -mb-1 flex min-h-0 flex-1 [scrollbar-width:thin] flex-col gap-1 overflow-y-auto overscroll-contain px-2 pt-2 pb-1"
      >
        <ShellNavLink href={ASK.href} className={ASK_CTA}>
          <span className={ASK_DISC}>
            <Icon name={ASK.icon} />
          </span>
          <span className="nav-collapsed:sr-only relative min-w-0 flex-1 truncate">
            {copy.label(ASK.labelKey)}
          </span>
          <span className={ASK_ARROW}>
            <Icon name="arrow-right" />
          </span>
          <RailTip label={copy.label(ASK.labelKey)} />
        </ShellNavLink>
        {RAIL_START.map((section) => (
          <RailLink key={section.href} section={section} label={copy.label(section.labelKey)} />
        ))}
        <RailCasesItem
          label={copy.label("nav.cases.all")}
          progressTemplate={copy.progressTemplate}
          kindsLabel={copy.kinds}
          kinds={caseKinds}
          titles={caseTitles}
        />
        <RailLink section={EXPLORE} label={copy.label(EXPLORE.labelKey)} />

        <hr className="border-border-default nav-collapsed:mx-3.5 mx-3 my-2" />
        {RAIL_LEARN.map((section) => (
          <RailLink key={section.href} section={section} label={copy.label(section.labelKey)} />
        ))}

        {SHOW_DATA_IN_RAIL ? (
          <>
            <p
              id="rail-data-title"
              className="text-overline text-text-tertiary nav-collapsed:sr-only px-3 pt-3 pb-1"
            >
              {copy.dataGroup}
            </p>
            <ul aria-labelledby="rail-data-title" className="flex flex-col gap-0.5">
              {RAIL_DATA.map((section) => (
                <li key={section.href}>
                  <RailLink section={section} label={copy.label(section.labelKey)} />
                </li>
              ))}
            </ul>
          </>
        ) : null}

        <RailRecent heading={copy.recent} titles={caseTitles} />
      </nav>

      <div className="border-border-subtle mt-2 flex flex-col gap-2.5 border-t pt-3">
        <RailSearchButton
          label={copy.search}
          inputId={search.inputId}
          focusHref={search.focusHref}
        />
        <div
          data-tour="shell-prefs"
          className="nav-collapsed:flex-col flex items-center justify-between gap-2"
        >
          <div className="nav-collapsed:[&_fieldset]:flex-col">{languageSwitch}</div>
          <ThemeSwitch label={copy.themeGroup} optionLabels={copy.themes} placement="rail" />
        </div>
        {environment ? <div className="nav-collapsed:hidden flex">{environment}</div> : null}
      </div>
    </header>
  );
}
