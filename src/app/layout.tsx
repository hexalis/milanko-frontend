import type { Metadata } from "next";
import { Baloo_2, JetBrains_Mono, Nunito_Sans } from "next/font/google";
import { Suspense, type ReactNode } from "react";
import { EnvironmentBadge } from "@/modules/workspace/ui/environment-badge";
import { WorkspaceFooter } from "@/modules/workspace/ui/workspace-footer";
import { WorkspaceHeader, WorkspaceHeaderFallback } from "@/modules/workspace/ui/workspace-header";
import { getServerEnv } from "@/server/env";
import { getLocale } from "@/server/locale";
import "./globals.css";

const baloo = Baloo_2({ variable: "--font-baloo", subsets: ["latin"], weight: ["700", "800"] });

const nunito = Nunito_Sans({ variable: "--font-nunito", subsets: ["latin"] });

const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Milanko · Earth Trend Detective", template: "%s · Milanko" },
  description:
    "Earth Trend Detective: what is changing on Earth, where, how much, and whether it is real. Public NASA data.",
};

/**
 * Language (cookie) and environment (APP_ENV) are read per request, so one build serves
 * develop, QA and production in both languages.
 */
async function CurrentHeader() {
  const locale = await getLocale();
  return (
    <WorkspaceHeader
      locale={locale}
      environment={<EnvironmentBadge environment={getServerEnv().appEnvironment} />}
    />
  );
}

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      data-theme="light"
      data-palette="arcilla"
      data-style="arcilla"
      className={`${baloo.variable} ${nunito.variable} ${jetbrains.variable}`}
    >
      <body className="flex min-h-dvh flex-col">
        <Suspense fallback={<WorkspaceHeaderFallback />}>
          <CurrentHeader />
        </Suspense>
        <div className="flex-1">{children}</div>
        <WorkspaceFooter />
      </body>
    </html>
  );
}
