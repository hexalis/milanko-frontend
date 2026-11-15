import type { ReactNode } from "react";
import type { CaseCatalog } from "@/modules/cases";
import { changeLabel, fileName } from "@/modules/cases";
import type { Translator } from "@/shared/lib/i18n";
import { askHref, LAST_STEP } from "../domain/ask-state";
import { guideHint, questionTitle, type GuidedView } from "../domain/guided";
import type { Rules } from "../domain/rules";
import { GuideAside, GuidedHeader } from "./guided-header";
import { GuidedCrumbs, GuidedNav, type StepProps } from "./guided-parts";
import { StepCheck } from "./step-check";
import { StepClues } from "./step-clues";
import { StepDeeper } from "./step-deeper";
import { StepHypothesis } from "./step-hypothesis";
import { StepPlace } from "./step-place";
import { StepReconstruction } from "./step-reconstruction";
import { StepVerdict } from "./step-verdict";

/* The guided investigation, steps 2–8 (POC ask.js renderAsk, L108–381). */

type GuidedScreenProps = {
  view: GuidedView;
  translator: Translator;
  catalog: CaseCatalog;
  rules: Rules;
};

function stepTitle({ view, translator, catalog }: StepProps): string {
  const { t } = translator;
  const { file, question, step } = view;
  const context = { translator, catalog };
  switch (step) {
    case 2:
      return t("ask.place.title", { place: fileName(file, context) });
    case 3:
      return t("ask.clues.title");
    case 4:
      return t("ask.hyp.title");
    case 5:
      return t(file.t.significant ? "case.claim" : "case.claim.flat", {
        v: t(`var.${file.variable}`),
        place: fileName(file, context),
        total: changeLabel(file, context),
        from: file.series[0]?.[0],
      });
    case 6:
      return t("ask.check.title");
    case 7:
      return questionTitle(question, context);
    default:
      return t("ask.deep.title");
  }
}

function StepBody({ rules, ...props }: GuidedScreenProps): ReactNode {
  switch (props.view.step) {
    case 2:
      return <StepPlace {...props} />;
    case 3:
      return <StepClues {...props} />;
    case 4:
      return <StepHypothesis {...props} />;
    case 5:
      return <StepReconstruction {...props} />;
    case 6:
      return <StepCheck {...props} />;
    case 7:
      return <StepVerdict {...props} rules={rules} />;
    default:
      return <StepDeeper {...props} />;
  }
}

export function GuidedScreen(props: GuidedScreenProps) {
  const { view, translator, catalog } = props;
  const { t } = translator;
  const { question, file, step, depth, hunch } = view;
  const title = questionTitle(question, { translator, catalog });
  const location = { id: question.id, step, depth, hunch };
  const back = step === 2 ? "/ask" : askHref(question.id, { ...location, step: step - 1 });
  const next =
    step < LAST_STEP
      ? {
          href: askHref(question.id, { ...location, step: step + 1 }),
          label: `${t("ask.next")}: ${t(`ask.step.${step + 1}`)}`,
        }
      : { href: "/ask", label: t("ask.deep.again") };

  return (
    <main className="max-w-content-max medium:px-6 expanded:px-12 mx-auto w-full px-4 pb-16">
      <GuidedCrumbs
        navLabel={t("nav.breadcrumb")}
        links={[{ href: "/", label: t("nav.ask") }]}
        current={title}
      />
      <GuidedHeader {...location} translator={translator} />
      <article aria-labelledby="ask-title" className="flex max-w-[980px] flex-col gap-5 pb-8">
        <p className="text-label-m text-text-tertiary -mb-2.5 font-semibold">
          {t("ask.stepOf", { n: step, total: LAST_STEP })} · {t(`ask.step.${step}`)}
        </p>
        <h1
          id="ask-title"
          className="font-display text-text-primary text-[clamp(30px,4vw,54px)] leading-[1.02] text-balance"
        >
          {stepTitle(props)}
        </h1>
        {depth === "guided" ? (
          <GuideAside
            question={t(`ask.guide.${step}`)}
            hint={guideHint(step, file, translator)}
            translator={translator}
          />
        ) : null}
        <StepBody {...props} />
      </article>
      <GuidedNav
        label={t("ask.steps.aria")}
        back={{ href: back, label: t("ask.back") }}
        next={next}
      />
    </main>
  );
}
