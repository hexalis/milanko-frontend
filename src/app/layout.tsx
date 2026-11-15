import type { Metadata } from "next";
import { IBM_Plex_Sans, JetBrains_Mono, Source_Serif_4 } from "next/font/google";
import { Suspense, type ReactNode } from "react";
import { SHELL_PREPAINT_SCRIPT } from "@/modules/workspace/domain/shell-script";
import { EnvironmentBadge } from "@/modules/workspace/ui/environment-badge";
import { WorkspaceFooter } from "@/modules/workspace/ui/workspace-footer";
import {
  CONTENT_ID,
  WorkspaceShell,
  WorkspaceShellFallback,
} from "@/modules/workspace/ui/workspace-shell";
import { getServerEnv } from "@/server/env";
import { getLocale } from "@/server/locale";
import "./globals.css";

const plex = IBM_Plex_Sans({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const sourceSerif = Source_Serif_4({ variable: "--font-source-serif", subsets: ["latin"] });

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
async function CurrentShell() {
  const locale = await getLocale();
  return (
    <WorkspaceShell
      locale={locale}
      environment={<EnvironmentBadge environment={getServerEnv().appEnvironment} />}
    />
  );
}

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

/*
 * The theme and the rail state are the reader's (localStorage), so the server renders the light
 * theme and an inline script corrects <html> before first paint; suppressHydrationWarning lets
 * React keep what the script set.
 */
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${plex.variable} ${sourceSerif.variable} ${jetbrains.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: SHELL_PREPAINT_SCRIPT }} />
      </head>
      <body className="min-h-dvh">
        <Suspense fallback={<WorkspaceShellFallback />}>
          <CurrentShell />
        </Suspense>
        <div
          id={CONTENT_ID}
          tabIndex={-1}
          className="shell:ps-[calc(var(--rail-w)+1.5rem)] in-[.nav-anim]:duration-base in-[.nav-anim]:ease-standard flex min-h-[calc(100dvh-var(--shell-top))] flex-col pb-(--shell-bottom) outline-none in-[.nav-anim]:transition-[padding] motion-reduce:transition-none"
        >
          <div className="flex-1">{children}</div>
          <WorkspaceFooter />
        </div>
      </body>
    </html>
  );
}
