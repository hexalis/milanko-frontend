import { getCaseCatalog, getEventAudit } from "@/modules/cases";
import factsData from "../data/facts.json";
import { reviewedFrom } from "./reviewed";
import { createRules, type Facts, type Rules } from "./rules";

/**
 * The facts as this deployment can serve them. Live computation for a free point (NASA POWER at
 * any coordinate, geocoding) is not ported yet, so Rule 4 is switched off: the builder offers
 * reviewed places only, and comparisons need two reviewed places.
 */
export function servableFacts(facts: Facts): Facts {
  return { ...facts, live: {} };
}

let engine: Rules | undefined;

/** Built once per server process from the static facts and data files. */
export function getRules(): Rules {
  if (engine) return engine;
  const catalog = getCaseCatalog();
  // JSON imports widen literal unions (types, roles); facts.json follows the Facts shape.
  const facts = servableFacts(factsData as unknown as Facts);
  engine = createRules(
    facts,
    reviewedFrom({
      trends: catalog.trends,
      global: { variable: catalog.global.variable, hasTrend: true },
      events: catalog.events,
      auditCategories: getEventAudit().categories,
    }),
  );
  return engine;
}
