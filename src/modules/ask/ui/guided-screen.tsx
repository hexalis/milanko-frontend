import type { ReactNode } from "react";
import type { CaseCatalog } from "@/modules/cases";
import type { Translator } from "@/shared/lib/i18n";
import { askHref, screenNeighbours } from "../domain/ask-state";
import {
  guideHint,
  guideQuestion,
  hunchSheet,
  questionTitle,
  readingSheet,
  type GuidedView,
  type Sheet,
} from "../domain/guided";
import type { Rules } from "../domain/rules";
import { GuideAside, LessonTop } from "./guided-header";
import { LessonDock } from "./guided-dock";
import type { StepProps } from "./guided-parts";
import { ScreenCheck } from "./screen-check";
import { ScreenDone } from "./screen-done";
import { ScreenGuess } from "./screen-guess";
import { ScreenLook } from "./screen-look";
import { ScreenVerdict } from "./screen-verdict";

/*
 * The guided investigation as a short lesson (POC ask.js renderAsk): exit and progress on top, one
 * task in the middle, one button below. Four screens and a close, after the question at /ask.
 */

type GuidedScreenProps = {
  view: GuidedView;
  translator: Translator;
  catalog: CaseCatalog;
  rules: Rules;
};

function screenTitle({ view, translator, catalog }: StepProps): string {
  const { t } = translator;
  switch (view.screen) {
    case "look":
      return t("ask.look.title");
    case "guess":
      return t("ask.hyp.title");
    case "check":
      return t("ask.chk.q");
    case "verdict":
      return questionTitle(view.question, { translator, catalog });
    default:
      return t("ask.done.title");
  }
}

function ScreenBody({ rules, ...props }: GuidedScreenProps): ReactNode {
  switch (props.view.screen) {
    case "look":
      return <ScreenLook {...props} />;
    case "guess":
      return <ScreenGuess {...props} />;
    case "check":
      return <ScreenCheck {...props} />;
    case "verdict":
      return <ScreenVerdict {...props} />;
    default:
      return <ScreenDone {...props} rules={rules} />;
  }
}

/** The answer sheet of a quiz screen once its answer is in the URL. */
function quizSheet({ view, translator, catalog }: StepProps): Sheet | undefined {
  const { screen, hunch, reading, file, direction } = view;
  if (screen === "guess" && hunch) {
    return hunchSheet(hunch, file, direction, { translator, catalog });
  }
  if (screen === "check" && reading) return readingSheet(reading, file, translator);
  return undefined;
}

function Dock(props: GuidedScreenProps) {
  const { view, translator } = props;
  const { t } = translator;
  const { question, screen, depth, hunch, reading } = view;
  const state = { depth, hunch, reading };
  const { prev, next } = screenNeighbours(screen);
  const isQuiz = screen === "guess" ? !hunch : screen === "check" ? !reading : false;
  const nextHref = next ? askHref(question.id, { ...state, screen: next }) : "/ask";
  return (
    <LessonDock
      label={t("ask.steps.aria")}
      sheet={quizSheet(props)}
      whyLabel={t("ask.sheet.why")}
      back={{
        href: prev ? askHref(question.id, { ...state, screen: prev }) : "/ask",
        label: t("ask.back"),
      }}
      quiz={
        isQuiz
          ? { check: t("ask.check"), skip: { href: nextHref, label: t("ask.skip") } }
          : undefined
      }
      next={{ href: nextHref, label: t(next ? "ask.continue" : "ask.deep.again") }}
    />
  );
}

export function GuidedScreen({ tour, ...props }: GuidedScreenProps & { tour?: ReactNode }) {
  const { view, translator } = props;
  const { t } = translator;
  const { question, file, screen, depth, hunch, reading } = view;
  return (
    <main
      data-lesson=""
      // The lesson fills the window: no data footer under its bar (WorkspaceFooter).
      data-fills-window=""
      className="group/lesson medium:px-6 expanded:px-12 mx-auto flex min-h-[calc(100dvh-var(--shell-top)-var(--shell-bottom))] w-full max-w-[980px] flex-col gap-7 overflow-x-clip px-4"
    >
      <LessonTop
        id={question.id}
        screen={screen}
        depth={depth}
        hunch={hunch}
        reading={reading}
        translator={translator}
      />
      <article
        // A new screen mounts a new article, so it slides in instead of swapping in place.
        key={screen}
        aria-labelledby="ask-title"
        className="flex flex-1 flex-col gap-[18px] motion-safe:transition-[opacity,translate] motion-safe:duration-300 motion-safe:starting:translate-x-4 motion-safe:starting:opacity-0"
      >
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <p className="text-text-brand text-[14px] font-semibold">{t(`ask.flow.${screen}`)}</p>
          {tour}
        </div>
        <h1
          id="ask-title"
          className="font-display text-text-primary text-[clamp(28px,3.4vw,44px)] leading-[1.08] font-semibold tracking-[-0.025em] text-balance"
        >
          {screenTitle(props)}
        </h1>
        {depth === "guided" ? (
          <GuideAside
            question={guideQuestion(screen, translator)}
            hint={guideHint(screen, file, translator)}
            translator={translator}
          />
        ) : null}
        <ScreenBody {...props} />
      </article>
      <Dock {...props} />
    </main>
  );
}
