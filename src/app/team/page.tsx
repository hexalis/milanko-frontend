import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslator } from "@/modules/copy";
import { TeamScreen } from "@/modules/team/ui/team-screen";
import { getLocale } from "@/server/locale";
import { DEFAULT_LOCALE } from "@/shared/lib/i18n";
import { LoadingPanel } from "@/shared/ui/notice";

export const metadata: Metadata = { title: getTranslator(DEFAULT_LOCALE).t("team.title") };

/** Reads the language cookie, so it renders inside Suspense. */
async function TeamContent() {
  const locale = await getLocale();
  return (
    <div lang={locale}>
      <TeamScreen translator={getTranslator(locale)} />
    </div>
  );
}

export default function TeamPage() {
  return (
    <Suspense
      fallback={
        <main className="max-w-content-max medium:px-6 expanded:px-12 mx-auto w-full px-4 py-8">
          <LoadingPanel label={getTranslator(DEFAULT_LOCALE).t("pt.loading")} />
        </main>
      }
    >
      <TeamContent />
    </Suspense>
  );
}
