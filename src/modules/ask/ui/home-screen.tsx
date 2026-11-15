import Link from "next/link";
import type { ReactNode } from "react";
import type { Translator } from "@/shared/lib/i18n";
import { HomeClose } from "./home-close";
import { HomeDoors } from "./home-doors";
import { HomeHero } from "./home-hero";
import { HomeKey } from "./home-key";

/*
 * The home as a welcome, not a dashboard (POC ask.js renderHome, d2de23a): the real Earth on the
 * cover, four doors, the three kinds of clue and the motto. It shows no data: every figure lives
 * in its module. The root is the `home` container and group: its sections adapt to the width the
 * shell leaves them, and pointing at a door lights its station on the cover's ring.
 */

type HomeScreenProps = {
  translator: Translator;
  /** The page's tour button, above the cover. */
  tour?: ReactNode;
};

export function HomeScreen({ translator, tour }: HomeScreenProps) {
  const { t } = translator;
  return (
    <main className="group/home max-w-content-max medium:px-6 medium:pt-6 expanded:px-12 @container/home mx-auto flex w-full flex-col px-4 pb-12">
      {tour ? <div className="flex justify-end pt-2 pb-3">{tour}</div> : null}
      <HomeHero translator={translator} />
      <HomeDoors translator={translator} />
      <HomeKey translator={translator} />
      <HomeClose translator={translator} />
      <p className="text-body-s text-text-secondary m-0 mt-6 max-w-[72ch]">
        {t("home.note")}{" "}
        <Link
          href="/team"
          className="text-text-link focus-visible:focus-ring focus-visible:outline-focus-ring underline underline-offset-2"
        >
          {t("home.team")}
        </Link>
      </p>
    </main>
  );
}
