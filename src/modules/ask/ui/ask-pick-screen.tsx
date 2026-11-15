import Link from "next/link";
import type { ReactNode } from "react";
import type { CaseCatalog } from "@/modules/cases";
import type { Translator } from "@/shared/lib/i18n";
import type { SearchParams } from "@/shared/lib/search-params";
import { Icon } from "@/shared/ui/icon";
import { ASK_STEPS } from "../domain/ask-state";
import { BuilderDoor } from "./builder-door";

/*
 * Step 1 of the investigation (POC ask.js renderAskPick): build the question from its three steps,
 * or start from an example. The builder takes the page width so the tiles have room.
 */

type AskPickScreenProps = {
  params: SearchParams;
  translator: Translator;
  catalog: CaseCatalog;
  /** The page's tour button, beside the breadcrumb. */
  tour?: ReactNode;
};

export function AskPickScreen({ params, translator, catalog, tour }: AskPickScreenProps) {
  const { t } = translator;
  return (
    <main className="max-w-content-max medium:px-6 expanded:px-12 mx-auto w-full px-4 pb-12">
      <div className="medium:pt-8 flex max-w-[1180px] flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-6 pb-4">
        <Crumbs t={t} />
        {tour}
      </div>
      <article className="flex max-w-[1180px] flex-col gap-4">
        <header className="flex flex-col gap-1">
          <p className="text-label-m text-text-secondary m-0 font-semibold">
            {t("ask.stepOf", { n: 1, total: ASK_STEPS })} · {t("ask.step.1")}
          </p>
          <h1 className="text-display-s font-display text-text-primary m-0 text-balance">
            {t("ask.pick.title")}
          </h1>
        </header>
        <BuilderDoor params={params} path="/ask" translator={translator} catalog={catalog} />
      </article>
    </main>
  );
}

function Crumbs({ t }: Pick<Translator, "t">) {
  return (
    <nav aria-label={t("nav.breadcrumb")} className="text-label-m">
      <ol className="text-text-secondary m-0 flex list-none flex-wrap items-center gap-1.5 p-0">
        <li>
          <Link
            href="/"
            className="hover:text-text-primary focus-visible:focus-ring focus-visible:outline-focus-ring relative underline-offset-2 after:absolute after:inset-x-0 after:-inset-y-[13px] after:content-[''] hover:underline"
          >
            {t("nav.home")}
          </Link>
        </li>
        <li aria-hidden="true">
          <Icon name="caret-right" size="sm" />
        </li>
        <li className="text-text-primary" aria-current="page">
          {t("nav.ask")}
        </li>
      </ol>
    </nav>
  );
}
