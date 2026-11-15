import type { Metadata } from "next";
import { Baloo_2, JetBrains_Mono, Nunito_Sans } from "next/font/google";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { EnvironmentBadge } from "@/modules/workspace/ui/environment-badge";
import { WorkspaceFooter } from "@/modules/workspace/ui/workspace-footer";
import { WorkspaceHeader } from "@/modules/workspace/ui/workspace-header";
import { getServerEnv } from "@/server/env";
import "./globals.css";

const baloo = Baloo_2({ variable: "--font-baloo", subsets: ["latin"], weight: ["700", "800"] });

const nunito = Nunito_Sans({ variable: "--font-nunito", subsets: ["latin"] });

const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Milanko · Earth Trend Detective", template: "%s · Milanko" },
  description:
    "Explora datos persistidos de NASA POWER, MODIS y EONET por región: series, tendencias, anomalías y eventos.",
};

/** Read at request time so one build can be deployed to develop, QA and production. */
async function CurrentEnvironment() {
  await connection();
  return <EnvironmentBadge environment={getServerEnv().appEnvironment} />;
}

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es" className={`${baloo.variable} ${nunito.variable} ${jetbrains.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <WorkspaceHeader
          environment={
            <Suspense fallback={null}>
              <CurrentEnvironment />
            </Suspense>
          }
        />
        <div className="flex-1">{children}</div>
        <WorkspaceFooter />
      </body>
    </html>
  );
}
