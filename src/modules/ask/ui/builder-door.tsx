import { getEventAudit, type CaseCatalog } from "@/modules/cases";
import type { Translator } from "@/shared/lib/i18n";
import type { SearchParams } from "@/shared/lib/search-params";
import factsData from "../data/facts.json";
import { builderExamples, builderState } from "../domain/builder";
import { previewLines } from "../domain/builder-view";
import { getRules } from "../domain/engine";
import type { Facts } from "../domain/rules";
import { QuestionBuilder } from "./builder-panel";

/* The question door (POC .door--ask): a white card holding the builder, read from the URL. */

type BuilderDoorProps = {
  params: SearchParams;
  path: string;
  translator: Translator;
  catalog: CaseCatalog;
};

// JSON imports widen literal unions (question types); facts.json follows the Facts shape.
const FACTS = factsData as unknown as Facts;

export function BuilderDoor({ params, path, translator, catalog }: BuilderDoorProps) {
  const rules = getRules();
  const state = builderState(params, rules, catalog);
  const examples = builderExamples(FACTS.examples, { state, rules, cases: catalog, path });
  const preview = previewLines(state, { ...catalog, audit: getEventAudit() });
  return (
    <div className="bg-bg-surface shadow-raised medium:p-7 rounded-[24px] px-4 py-5">
      <QuestionBuilder
        state={state}
        examples={examples}
        path={path}
        context={{ translator, catalog }}
        themes={FACTS.themes}
        preview={preview}
      />
    </div>
  );
}
