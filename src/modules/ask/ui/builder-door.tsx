import type { CaseCatalog } from "@/modules/cases";
import type { Translator } from "@/shared/lib/i18n";
import type { SearchParams } from "@/shared/lib/search-params";
import factsData from "../data/facts.json";
import { builderExamples, builderState } from "../domain/builder";
import { getRules } from "../domain/engine";
import type { Facts } from "../domain/rules";
import { QuestionBuilder } from "./builder-panel";

/* The question door (POC .door--ask): white clay holding the builder, read from the URL. */

type BuilderDoorProps = {
  params: SearchParams;
  path: string;
  translator: Translator;
  catalog: CaseCatalog;
  /** Heading for screen readers, when the page heading does not already name the door. */
  srTitle?: string;
};

// JSON imports widen literal unions (question types); facts.json follows the Facts shape.
const EXAMPLES = (factsData as unknown as Facts).examples;

export function BuilderDoor({ params, path, translator, catalog, srTitle }: BuilderDoorProps) {
  const rules = getRules();
  const state = builderState(params, rules, catalog);
  const examples = builderExamples(EXAMPLES, { state, rules, cases: catalog, path });
  return (
    <section
      aria-labelledby={srTitle ? "builder-door-title" : undefined}
      className="rounded-shell bg-bg-surface shadow-raised medium:px-6 medium:py-5.5 p-4"
    >
      {srTitle ? (
        <h2 id="builder-door-title" className="sr-only">
          {srTitle}
        </h2>
      ) : null}
      <QuestionBuilder
        state={state}
        examples={examples}
        path={path}
        context={{ translator, catalog }}
      />
    </section>
  );
}
