import type { Translator } from "@/shared/lib/i18n";
import { Icon } from "@/shared/ui/icon";
import { TextLink } from "@/shared/ui/text-link";
import type { CaseReading } from "../../domain/case-reading";
import { Citation } from "./citation";
import { CopyTextButton } from "./copy-text-button";
import { ReadingSection } from "./reading-parts";

/* "Use it": a sentence to quote, the citation, three questions to think about (POC cfUse). */

const CITE_ID = "cf-cite";

type ThinkListProps = { items: CaseReading["use"]["think"]; answerLabel: string };

/** Three questions to think about, each answer folded (POC cf-think). */
function ThinkList({ items, answerLabel }: ThinkListProps) {
  return (
    <ol className="mt-2.5 grid list-decimal gap-2.5 ps-5">
      {items.map((item) => (
        <li key={item.q} className="text-body-m text-text-primary">
          <p>{item.q}</p>
          <details className="mt-0.5">
            <summary className="text-label-s text-text-link focus-visible:focus-ring focus-visible:outline-focus-ring relative cursor-pointer rounded-xs after:absolute after:inset-x-0 after:-inset-y-1 after:content-['']">
              {answerLabel}
            </summary>
            <p className="text-text-secondary mt-1">{item.a}</p>
          </details>
        </li>
      ))}
    </ol>
  );
}

export function UseSection({
  reading,
  translator,
}: {
  reading: CaseReading;
  translator: Translator;
}) {
  const { t } = translator;
  const { use } = reading;
  return (
    <ReadingSection id="cf-use" title={t("cf.s.use")}>
      <p className="text-body-s text-text-secondary">{t("cf.quote.lead")}</p>
      <blockquote className="bg-bg-surface-sunken rounded-field font-reading text-body-m text-text-primary mt-2 p-3.5">
        {use.quote}
      </blockquote>
      <div data-tour="cf-copy" className="mt-3.5 flex flex-wrap gap-2">
        <CopyTextButton
          intent="primary"
          text={use.quote}
          labels={{ idle: t("cf.copy.quote"), copied: t("case.copied") }}
        />
        <CopyTextButton
          sourceId={CITE_ID}
          labels={{ idle: t("case.cite.copy"), copied: t("case.copied") }}
        />
        {use.isShareable ? (
          <CopyTextButton labels={{ idle: t("share.copy"), copied: t("share.done") }} />
        ) : null}
      </div>
      <Citation id={CITE_ID} lines={use.cite} />
      <h3 className="text-body-l font-display text-text-primary mt-5 font-semibold">
        {t("case.think")}
      </h3>
      <ThinkList items={use.think} answerLabel={t("case.think.answer")} />
      <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
        {use.related.map((link) => (
          <li key={link.href} className="inline-flex items-center gap-1.5">
            <Icon name={link.icon} />
            <TextLink href={link.href}>{link.label}</TextLink>
          </li>
        ))}
      </ul>
    </ReadingSection>
  );
}
