import Link from "next/link";
import type { CaseCatalog } from "@/modules/cases";
import type { Translator } from "@/shared/lib/i18n";
import type { SearchParams } from "@/shared/lib/search-params";
import { Icon } from "@/shared/ui/icon";
import { LAST_STEP } from "../domain/ask-state";
import { BuilderDoor } from "./builder-door";
import { ExploreDoor } from "./explore-door";

/*
 * Step 1 of the investigation (POC ask.js renderAskPick L384–398): build the question from its
 * segments, or start from an example, with the explore door below.
 */

type AskPickScreenProps = { params: SearchParams; translator: Translator; catalog: CaseCatalog };

export function AskPickScreen({ params, translator, catalog }: AskPickScreenProps) {
  const { t } = translator;
  const stepName = t("ask.step.1");
  return (
    <main className="max-w-content-max medium:px-6 expanded:px-12 mx-auto w-full px-4 pb-12">
      <nav aria-label={t("nav.breadcrumb")} className="text-label-m medium:pt-8 pt-6 pb-4">
        <ol className="text-text-secondary m-0 flex list-none flex-wrap items-center gap-1.5 p-0">
          <li>
            <Link
              href="/"
              className="hover:text-text-primary focus-visible:focus-ring focus-visible:outline-focus-ring underline-offset-2 hover:underline"
            >
              {t("nav.ask")}
            </Link>
          </li>
          <li aria-hidden="true">
            <Icon name="caret-right" size="sm" />
          </li>
          <li className="text-text-primary" aria-current="page">
            {stepName}
          </li>
        </ol>
      </nav>
      <article className="flex max-w-[860px] flex-col gap-6">
        <header className="flex flex-col gap-1">
          <p className="text-label-m text-text-secondary m-0">
            {t("ask.stepOf", { n: 1, total: LAST_STEP })} · {stepName}
          </p>
          <h1 className="text-display-s font-display text-text-primary m-0 text-balance">
            {t("ask.pick.title")}
          </h1>
        </header>
        <BuilderDoor params={params} path="/ask" translator={translator} catalog={catalog} />
        <ExploreDoor translator={translator} fileCount={catalog.all.length} />
      </article>
    </main>
  );
}
