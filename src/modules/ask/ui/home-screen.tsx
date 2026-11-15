import type { CaseCatalog } from "@/modules/cases";
import type { Translator } from "@/shared/lib/i18n";
import type { SearchParams } from "@/shared/lib/search-params";
import { BuilderDoor } from "./builder-door";
import { ExploreDoor } from "./explore-door";

/*
 * The two-door home (POC ask.js renderHome L66–85): a question to investigate, or a place to
 * wander. The builder submits to "/" so the question being built stays on the home.
 */

type HomeScreenProps = { params: SearchParams; translator: Translator; catalog: CaseCatalog };

export function HomeScreen({ params, translator, catalog }: HomeScreenProps) {
  const { t } = translator;
  return (
    <main className="max-w-content-max medium:px-6 expanded:px-12 mx-auto flex w-full flex-col gap-6 px-4 pb-12">
      <header className="medium:pt-8 flex flex-col gap-1.5 pt-6">
        <p className="text-body-l text-text-secondary m-0">{t("home.kicker")}</p>
        <h1 className="font-display text-text-primary m-0 text-[clamp(30px,3.6vw,46px)] leading-[1.05] text-balance">
          {t("home.title")}
        </h1>
      </header>
      <div className="grid max-w-[1040px] grid-cols-1 gap-6">
        <BuilderDoor
          params={params}
          path="/"
          translator={translator}
          catalog={catalog}
          srTitle={t("home.ask.t")}
        />
        <ExploreDoor translator={translator} fileCount={catalog.all.length} />
      </div>
      <p className="font-display text-text-primary m-0 text-[clamp(22px,2.6vw,30px)] leading-tight font-extrabold">
        {t("home.slogan")}
      </p>
      <p className="text-body-s text-text-secondary m-0 max-w-[72ch]">{t("home.note")}</p>
    </main>
  );
}
