import type { ReactNode } from "react";
import {
  ARCHIVE_FOCUS_HREF,
  ARCHIVE_SEARCH_ID,
  getCaseCatalog,
  getCaseSummaries,
  getEventAudit,
} from "@/modules/cases";
import { getTranslator } from "@/modules/copy";
import { DEFAULT_LOCALE, type Locale } from "@/shared/lib/i18n";
import { LanguageSwitch } from "@/shared/ui/language-switch";
import { setLocale } from "../actions";
import { TABBAR } from "../domain/sections";
import { DocumentLang } from "./document-lang";
import { MobileBar } from "./mobile-bar";
import type { CaseKindLink } from "./rail-cases-item";
import { ShellShortcuts } from "./shell-shortcuts";
import { ThemeSwitch } from "./theme-switch";
import { WorkspaceRail, type RailCopy } from "./workspace-rail";
import { WorkspaceTabbar } from "./workspace-tabbar";

/** Where the skip link lands; the root layout puts the page content in this element. */
export const CONTENT_ID = "content";

const SKIP_LINK =
  "sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-50 focus:rounded-control focus:bg-bg-inverse focus:px-4 focus:py-2 focus:text-label-m focus:text-text-inverse focus:shadow-dropdown focus-visible:focus-ring focus-visible:outline-focus-ring";

function SkipLink({ label }: { label: string }) {
  return (
    <a href={`#${CONTENT_ID}`} className={SKIP_LINK}>
      {label}
    </a>
  );
}

type WorkspaceShellProps = {
  locale: Locale;
  /** The environment badge, read at request time. */
  environment: ReactNode;
};

/** Case file counts per archive kind, and the catalog audit, for the rail's sub-list. */
function caseKinds(t: (key: string) => string): CaseKindLink[] {
  const catalog = getCaseCatalog();
  const audits = getEventAudit().categories.filter(
    (category) => category.verdict !== "insufficient",
  );
  return [
    {
      href: "/cases?kind=trend",
      icon: "chart",
      label: t("arch.kind.trend"),
      count: catalog.trends.length,
    },
    {
      href: "/cases?kind=event",
      icon: "warning",
      label: t("arch.kind.event"),
      count: catalog.events.length,
    },
    // The audit tab of Case Files is not ported; the briefing's "false suspect" section shows it.
    {
      href: "/briefing#suspect-title",
      icon: "audit",
      label: t("arch.kind.audit"),
      count: audits.length,
    },
  ];
}

/**
 * The app shell (POC portal): skip link, the phone top bar, the side rail of wide screens and the
 * phone tabbar, plus the "/" and "[" keys. It reads the language at request time, so the root
 * layout renders it inside Suspense with `WorkspaceShellFallback`.
 */
export function WorkspaceShell({ locale, environment }: WorkspaceShellProps) {
  const translator = getTranslator(locale);
  const { t } = translator;
  const caseTitles = Object.fromEntries(
    getCaseSummaries(getCaseCatalog(), translator).map((file) => [file.id, file.title]),
  );
  const themes = { light: t("theme.light"), dark: t("theme.dark") };
  const copy: RailCopy = {
    label: t,
    menu: t("nav.menu"),
    brandSub: t("brand.sub"),
    collapse: t("nav.collapse"),
    expand: t("nav.expand"),
    kinds: t("nav.themes"),
    progressTemplate: t("rail.read.short"),
    dataGroup: t("nav.group.data"),
    recent: t("nav.group.recent"),
    search: t("nav.search"),
    themeGroup: t("theme.label"),
    themes,
  };
  const languageSwitch = (
    <LanguageSwitch current={locale} label={t("lang.label")} onSelect={setLocale} />
  );

  return (
    <>
      <DocumentLang locale={locale} />
      <SkipLink label={t("skip")} />
      <MobileBar>
        {languageSwitch}
        <ThemeSwitch label={copy.themeGroup} optionLabels={themes} placement="bar" />
      </MobileBar>
      <WorkspaceRail
        copy={copy}
        caseKinds={caseKinds(t)}
        caseTitles={caseTitles}
        search={{ inputId: ARCHIVE_SEARCH_ID, focusHref: ARCHIVE_FOCUS_HREF }}
        languageSwitch={languageSwitch}
        environment={environment}
      />
      <WorkspaceTabbar
        label={t("nav.tabbar")}
        labels={Object.fromEntries(
          TABBAR.map((section) => [section.labelKey, t(section.labelKey)]),
        )}
      />
      <ShellShortcuts searchInputId={ARCHIVE_SEARCH_ID} searchFocusHref={ARCHIVE_FOCUS_HREF} />
    </>
  );
}

/**
 * Static stand-in while the request-time shell streams in: the same frames (brand bar, rail,
 * tabbar) without their contents, so the page does not move when the shell arrives.
 */
export function WorkspaceShellFallback() {
  return (
    <>
      <SkipLink label={getTranslator(DEFAULT_LOCALE).t("skip")} />
      <MobileBar />
      <div
        aria-hidden="true"
        className="rounded-shell border-border-subtle bg-bg-surface shadow-card shell:block fixed inset-y-3 start-3 z-30 hidden w-(--rail-w) border"
      />
      <div
        aria-hidden="true"
        className="border-border-subtle bg-bg-surface shadow-dropdown shell:hidden fixed inset-x-2 bottom-[calc(0.5rem+env(safe-area-inset-bottom))] z-30 h-16 rounded-[1.75rem] border"
      />
    </>
  );
}
