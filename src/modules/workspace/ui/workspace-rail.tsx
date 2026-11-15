import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/shared/ui/icon";
import { MilankoMark, MilankoWordmark } from "@/shared/ui/milanko-logo";
import {
  ASK,
  EXPLORE,
  RAIL_DATA,
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

const ASK_CTA =
  "group/item relative mb-2 flex min-h-13 items-center justify-center gap-2.5 rounded-xl bg-action-primary px-4 text-label-l text-text-on-primary no-underline shadow-control transition-colors duration-fast motion-reduce:transition-none hover:bg-action-primary-hover hover:shadow-control-hover active:bg-action-primary-pressed focus-visible:focus-ring focus-visible:outline-focus-ring aria-[current=page]:ring-2 aria-[current=page]:ring-action-primary aria-[current=page]:ring-offset-2 aria-[current=page]:ring-offset-bg-surface nav-collapsed:mx-auto nav-collapsed:size-12 nav-collapsed:min-h-12 nav-collapsed:px-0";

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
      className="rounded-shell border-border-subtle bg-bg-surface shadow-card shell:flex in-[.nav-anim]:duration-base in-[.nav-anim]:ease-standard fixed inset-y-3 start-3 z-30 hidden w-(--rail-w) flex-col border px-3 pt-4 pb-3 in-[.nav-anim]:transition-[width] motion-reduce:transition-none"
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

      <nav
        aria-label={copy.menu}
        className="nav-collapsed:overflow-visible -mx-1 flex min-h-0 flex-1 [scrollbar-width:thin] flex-col gap-1 overflow-y-auto overscroll-contain px-1 pt-0.5"
      >
        <ShellNavLink href={ASK.href} className={ASK_CTA}>
          <span className="flex text-xl">
            <Icon name={ASK.icon} />
          </span>
          <span className="nav-collapsed:sr-only truncate">{copy.label(ASK.labelKey)}</span>
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

        <hr className="border-border-subtle nav-collapsed:mx-3.5 mx-3 my-2" />
        {RAIL_LEARN.map((section) => (
          <RailLink key={section.href} section={section} label={copy.label(section.labelKey)} />
        ))}

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

        <RailRecent heading={copy.recent} titles={caseTitles} />
      </nav>

      <div className="border-border-subtle mt-2 flex flex-col gap-2.5 border-t pt-3">
        <RailSearchButton
          label={copy.search}
          inputId={search.inputId}
          focusHref={search.focusHref}
        />
        <div className="nav-collapsed:flex-col flex items-center justify-between gap-2">
          <div className="nav-collapsed:[&_fieldset]:flex-col">{languageSwitch}</div>
          <ThemeSwitch label={copy.themeGroup} optionLabels={copy.themes} placement="rail" />
        </div>
        <div className="nav-collapsed:hidden flex">{environment}</div>
      </div>
    </header>
  );
}
