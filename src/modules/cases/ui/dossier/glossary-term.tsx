import type { Translator } from "@/shared/lib/i18n";
import { ToggletipContent, ToggletipRoot, ToggletipTrigger } from "./hexalis-dossier";

type GlossaryTermProps = {
  /** Glossary key: reads `gloss.<term>` and `gloss.<term>.d`. */
  term: string;
  /** Visible text; defaults to the glossary name. */
  label?: string;
  translator: Translator;
};

/**
 * A technical term with its plain definition one press away (POC `term`): the (i) toggletip stays
 * glued to the last word so it never wraps alone. Only definitions live there, never a conclusion.
 */
export function GlossaryTerm({ term, label, translator }: GlossaryTermProps) {
  const { t } = translator;
  const text = label ?? t(`gloss.${term}`);
  const cut = text.lastIndexOf(" ");
  const head = cut > 0 ? text.slice(0, cut + 1) : "";
  const tail = cut > 0 ? text.slice(cut + 1) : text;
  return (
    <span>
      {head}
      <span className="inline-flex items-center gap-1 whitespace-nowrap">
        {tail}
        <ToggletipRoot>
          <ToggletipTrigger label={t("term.what", { term: text })} />
          <ToggletipContent>
            <strong className="block">{t(`gloss.${term}`)}</strong>
            <span>{t(`gloss.${term}.d`)}</span>
          </ToggletipContent>
        </ToggletipRoot>
      </span>
    </span>
  );
}
