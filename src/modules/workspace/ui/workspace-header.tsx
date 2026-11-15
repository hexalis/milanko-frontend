import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { getTranslator } from "@/modules/copy";
import type { Locale } from "@/shared/lib/i18n";
import { LanguageSwitch } from "@/shared/ui/language-switch";
import { MilankoMark, MilankoWordmark } from "@/shared/ui/milanko-logo";
import { setLocale } from "../actions";
import { WORKSPACE_SECTIONS, type SectionLabels } from "../domain/sections";
import { WorkspaceNav } from "./workspace-nav";
import { WorkspaceNavLinks } from "./workspace-nav-links";

type WorkspaceHeaderProps = {
  locale: Locale;
  /** The environment badge, read at request time. */
  environment: ReactNode;
};

/** Top bar: brand, translated menu, language switch and environment. Rendered at request time. */
export function WorkspaceHeader({ locale, environment }: WorkspaceHeaderProps) {
  const { t } = getTranslator(locale);
  const labels = Object.fromEntries(
    WORKSPACE_SECTIONS.map((section) => [section.href, t(section.labelKey)]),
  ) as SectionLabels;
  const menuLabel = t("nav.menu");

  return (
    <header className="max-w-content-max medium:px-6 expanded:px-12 mx-auto w-full px-4 pt-3">
      <div className="rounded-shell border-border-subtle bg-bg-surface shadow-raised flex flex-wrap items-center gap-x-6 gap-y-3 border px-4 py-3">
        <Link href="/" className="flex items-baseline gap-2 no-underline">
          <span className="text-text-primary flex items-center gap-2 text-[1.35rem]">
            <MilankoMark size={28} />
            <MilankoWordmark />
            <span className="sr-only">Milanko</span>
          </span>
          <span className="text-label-s text-text-tertiary medium:inline hidden">
            Earth Trend Detective
          </span>
        </Link>
        <Suspense fallback={<WorkspaceNavLinks labels={labels} menuLabel={menuLabel} />}>
          <WorkspaceNav labels={labels} menuLabel={menuLabel} />
        </Suspense>
        <div className="ml-auto flex items-center gap-3">
          <LanguageSwitch current={locale} label={t("lang.label")} onSelect={setLocale} />
          {environment}
        </div>
      </div>
    </header>
  );
}

/** Static stand-in while the request-time header streams in. */
export function WorkspaceHeaderFallback() {
  return (
    <header className="max-w-content-max medium:px-6 expanded:px-12 mx-auto w-full px-4 pt-3">
      <div className="rounded-shell border-border-subtle bg-bg-surface shadow-raised flex min-h-16 items-center border px-4 py-3">
        <span className="text-text-primary flex items-center gap-2 text-[1.35rem]">
          <MilankoMark size={28} />
          <MilankoWordmark />
          <span className="sr-only">Milanko</span>
        </span>
      </div>
    </header>
  );
}
