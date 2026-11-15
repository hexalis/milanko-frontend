import type { ReactNode } from "react";
import {
  changeLabel,
  EvidenceBlock,
  EvidenceMeter,
  fileName,
  formatOdds,
  formatP,
  rateLabel,
  strengthWord,
  THEME_TONE,
  trendText,
  verdictLabel,
  verdictOf,
  VerdictStamp,
} from "@/modules/cases";
import { Icon } from "@/shared/ui/icon";
import { askHref } from "../domain/ask-state";
import { compareHref } from "../domain/compare";
import {
  answerSentence,
  compareTarget,
  compareTitle,
  hunchFeedback,
  questionTitle,
} from "../domain/guided";
import type { Rules } from "../domain/rules";
import { GuidedCallout, NextQuestionLink, StepLead, type StepProps } from "./guided-parts";
import { GuidedCopyAnswer } from "./guided-copy-answer";

/* Step 7 · The verdict (POC ask.js L279–322). */

const ANSWER_ID = "ask-answer";

function VerdictRow({
  icon,
  label,
  children,
}: {
  icon: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="border-border-subtle medium:grid-cols-[minmax(150px,220px)_minmax(0,1fr)] grid gap-x-6 gap-y-1.5 border-b py-3.5 last:border-b-0">
      <dt className="text-body-m-strong text-text-primary flex items-start gap-2">
        <span className="text-text-brand mt-0.5">
          <Icon name={icon} />
        </span>
        {label}
      </dt>
      <dd className="text-body-l text-text-secondary tabular-nums">{children}</dd>
    </div>
  );
}

export function StepVerdict({ view, translator, catalog, rules }: StepProps & { rules: Rules }) {
  const { t } = translator;
  const { question, file, direction, depth, hunch } = view;
  const context = { translator, catalog };
  const stats = file.t;
  const from = file.series[0]?.[0];
  const answer = answerSentence(question, file, direction, context);
  const feedback = hunchFeedback(hunch, stats, direction);
  const target = compareTarget(rules, catalog, question);
  const chance = t("case.chance", { odds: formatOdds(stats.p, translator) });

  return (
    <>
      <p className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
        <VerdictStamp verdict={verdictOf(file)} label={verdictLabel(file, context)} />
        <EvidenceMeter strength={stats.strength} word={strengthWord(file, context)} />
      </p>
      <div className="rounded-card bg-bg-surface shadow-raised flex flex-col items-start gap-2.5 p-5">
        <p
          id={ANSWER_ID}
          className="font-display text-text-primary text-[clamp(22px,2.6vw,30px)] leading-tight font-extrabold"
        >
          {answer.text}
        </p>
        <p className="text-body-m text-text-secondary">{answer.source}</p>
        <GuidedCopyAnswer
          text={`${answer.text} ${answer.source}`}
          targetId={ANSWER_ID}
          labels={{ copy: t("ask.ans.copy"), copied: t("ask.ans.copied") }}
        />
      </div>
      <StepLead>{trendText(file, "summary", context)}</StepLead>
      <dl className="rounded-card bg-bg-surface shadow-raised flex flex-col px-5 py-1.5">
        <VerdictRow icon={question.theme} label={t("ask.v.what")}>
          {t(`ask.v.what.${direction}`, { v: t(`var.${file.variable}`) })}
        </VerdictRow>
        <VerdictRow icon="map-pin" label={t("ask.v.where")}>
          {fileName(file, context)} · {trendText(file, "region", context)}{" "}
          <span className="text-text-tertiary">({t("ask.v.cell")})</span>
        </VerdictRow>
        <VerdictRow icon="chart" label={t("ask.v.howmuch")}>
          {t(stats.significant ? "ask.v.much" : "ask.v.much.flat", {
            rate: rateLabel(file, context),
            total: changeLabel(file, context),
            from,
          })}
        </VerdictRow>
        <VerdictRow icon="decide" label={t("ask.v.evidence")}>
          <strong className="text-text-primary">{t(`strength.${stats.strength}`)}.</strong> {chance}
          {depth === "science" ? (
            <span className="font-mono text-[14px]">
              {" "}
              (p {formatP(stats.p)}, n = {stats.n})
            </span>
          ) : null}
        </VerdictRow>
        <VerdictRow icon="warning" label={t("ask.v.cannot")}>
          {trendText(file, "limits", context)} {t("ask.v.cause")}
        </VerdictRow>
      </dl>
      {feedback && hunch ? (
        <GuidedCallout icon="sparkle" title={`${t("ask.hyp.yours")}: ${t(`ask.hyp.${hunch}`)}.`}>
          {t(`ask.hunch.${feedback}`)}
        </GuidedCallout>
      ) : null}
      <EvidenceBlock tone={THEME_TONE[file.theme] ?? "stone"}>
        <h2 className="text-heading-h2 font-display text-text-primary">{t("case.why")}</h2>
        <p className="text-label-m text-text-secondary flex items-center gap-2">
          <Icon name="info" />
          {t("case.why.tag")}
        </p>
        <p className="text-body-l text-text-primary max-w-[68ch]">
          {trendText(file, "why", context)}
        </p>
      </EvidenceBlock>
      {target?.kind === "question" ? (
        <NextQuestionLink
          href={askHref(target.question.id, { step: 7, depth })}
          label={t("ask.v.compare")}
          title={questionTitle(target.question, context)}
        />
      ) : null}
      {target?.kind === "pair" ? (
        <NextQuestionLink
          href={compareHref({ ...target, depth })}
          label={t("ask.v.follow")}
          title={compareTitle(target.theme, target.a, target.b, context)}
        />
      ) : null}
    </>
  );
}
