import Link from "next/link";
import { buttonLink } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import type { Sheet } from "../domain/guided";
import { QUIZ_FORM_ID } from "./guided-quiz";
import { QuizCheckButton } from "./quiz-check-button";

/*
 * Bottom of the lesson (POC ask.js .lesson-dock): the answer sheet once a quiz is checked, then
 * back, skip and the one button that moves on. On a quiz not yet answered, that button submits the
 * quiz ("Check") and stays inactive until a tile is chosen.
 */

const SHEET: Record<Sheet["kind"], string> = {
  match: "bg-surface-tone-3",
  other: "bg-surface-tone-4",
};

const SHEET_ICON: Record<Sheet["kind"], string> = { match: "check", other: "info-on" };

/*
 * The sheet's live region always exists, so a fresh answer is announced when it fills. On a phone
 * it says only its verdict, so the screen keeps the room; "Why?" opens the explanation.
 */
function LessonSheet({ sheet, whyLabel }: { sheet?: Sheet; whyLabel: string }) {
  return (
    <div aria-live="polite">
      {sheet ? (
        <div
          className={`${SHEET[sheet.kind]} text-text-primary shadow-raised medium:grid-cols-[2.25rem_minmax(0,1fr)] medium:gap-3.5 medium:px-6 medium:py-[18px] ease-standard grid grid-cols-[1.75rem_minmax(0,1fr)] items-center gap-2.5 rounded-[18px] border border-[color-mix(in_srgb,currentColor_10%,transparent)] px-4 py-2.5 motion-safe:transition-[opacity,translate] motion-safe:duration-[240ms] motion-safe:starting:translate-y-4 motion-safe:starting:opacity-0`}
        >
          <span className="bg-action-primary text-text-on-primary medium:size-9 grid size-7 place-items-center rounded-full text-[18px]">
            <Icon name={SHEET_ICON[sheet.kind]} />
          </span>
          <div>
            <p className="font-display medium:text-[18px] medium:mb-1 text-[16px] leading-tight font-semibold">
              {sheet.title}
            </p>
            <p className="text-body-s medium:text-body-m max-medium:hidden max-w-[70ch]">
              {sheet.text}
            </p>
            <details className="group/why medium:hidden">
              <summary className="text-label-s mt-0.5 inline-flex min-h-8 cursor-pointer list-none items-center gap-1 underline underline-offset-2 [&::-webkit-details-marker]:hidden">
                {whyLabel}
                <span className="duration-fast transition-transform group-open/why:rotate-180">
                  <Icon name="caret-down" size="sm" />
                </span>
              </summary>
              <p className="text-body-s mt-1">{sheet.text}</p>
            </details>
          </div>
        </div>
      ) : null}
    </div>
  );
}

type LessonBarProps = {
  label: string;
  back: { href: string; label: string };
  /** A quiz still waiting for its answer: "Check" submits it and "Skip" moves on without one. */
  quiz?: { check: string; skip: { href: string; label: string } };
  next: { href: string; label: string };
};

/*
 * On a phone the bar takes two rows: the button that moves on, full width, and under it "← Back"
 * and "Skip" as quieter buttons at either end. On wider screens, one row: back, then skip and go.
 */
const GO =
  "min-h-14 flex-1 justify-center text-[17px] max-medium:order-1 max-medium:basis-full medium:min-w-[200px] medium:flex-none";

const BACK = [
  "bg-bg-surface text-text-primary shadow-card hover:bg-bg-hover focus-visible:focus-ring focus-visible:outline-focus-ring",
  "inline-flex h-11 items-center gap-1.5 rounded-xl px-4 text-label-m font-semibold max-medium:order-2",
  "medium:grid medium:size-[52px] medium:flex-none medium:place-items-center medium:gap-0 medium:rounded-2xl medium:px-0 medium:text-[22px]",
  "active:scale-[0.97] motion-reduce:active:scale-100",
].join(" ");

function LessonBar({ label, back, quiz, next }: LessonBarProps) {
  return (
    <nav
      aria-label={label}
      data-tour="lesson-dock"
      className="border-border-subtle medium:flex-nowrap medium:gap-3 flex flex-wrap items-center gap-x-3 gap-y-2.5 border-t pt-3.5 pb-[calc(0.875rem+env(safe-area-inset-bottom,0px))]"
    >
      <Link href={back.href} aria-label={back.label} title={back.label} className={BACK}>
        <Icon name="arrow-left" />
        <span className="medium:sr-only">{back.label}</span>
      </Link>
      <span className="medium:block hidden flex-1" />
      {quiz ? (
        <>
          <Link
            href={quiz.skip.href}
            className={`${buttonLink({ intent: "secondary" })} medium:min-h-[52px] max-medium:order-3 max-medium:ms-auto min-h-11`}
          >
            {quiz.skip.label}
          </Link>
          <QuizCheckButton
            formId={QUIZ_FORM_ID}
            className={`${buttonLink({ isPressableWhenDisabled: true })} ${GO}`}
          >
            {quiz.check}
            <Icon name="arrow-right" />
          </QuizCheckButton>
        </>
      ) : (
        <Link href={next.href} className={`${buttonLink()} ${GO}`}>
          {next.label}
          <Icon name="arrow-right" />
        </Link>
      )}
    </nav>
  );
}

export function LessonDock({
  sheet,
  whyLabel,
  ...bar
}: LessonBarProps & { sheet?: Sheet; whyLabel: string }) {
  return (
    <div className="bg-bg-canvas sticky bottom-(--shell-bottom) z-[6] mt-auto flex flex-col gap-2.5 pt-2.5">
      <LessonSheet sheet={sheet} whyLabel={whyLabel} />
      <LessonBar {...bar} />
    </div>
  );
}
