import Link from "next/link";
import { buttonLink } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import type { Sheet } from "../domain/guided";
import { QUIZ_FORM_ID } from "./guided-quiz";

/*
 * Bottom of the lesson (POC ask.js .lesson-dock): the answer sheet once a quiz is checked, then
 * back, skip and the one button that moves on. On a quiz not yet answered, that button submits the
 * quiz ("Check") and stays faint until a tile is chosen.
 */

const SHEET: Record<Sheet["kind"], string> = {
  match: "bg-surface-tone-3",
  other: "bg-surface-tone-4",
};

const SHEET_ICON: Record<Sheet["kind"], string> = { match: "check", other: "info-on" };

/** The sheet's live region always exists, so a fresh answer is announced when it fills. */
function LessonSheet({ sheet }: { sheet?: Sheet }) {
  return (
    <div aria-live="polite">
      {sheet ? (
        <div
          className={`${SHEET[sheet.kind]} text-text-primary shadow-raised medium:grid-cols-[2.25rem_minmax(0,1fr)] medium:gap-3.5 medium:px-6 medium:py-[18px] ease-standard grid grid-cols-[1.75rem_minmax(0,1fr)] items-center gap-2.5 rounded-[18px] border border-[color-mix(in_srgb,currentColor_10%,transparent)] px-4 py-3.5 motion-safe:transition-[opacity,translate] motion-safe:duration-[240ms] motion-safe:starting:translate-y-4 motion-safe:starting:opacity-0`}
        >
          <span className="bg-action-primary text-text-on-primary medium:size-9 grid size-7 place-items-center rounded-full text-[18px]">
            <Icon name={SHEET_ICON[sheet.kind]} />
          </span>
          <div>
            <p className="font-display medium:text-[18px] mb-1 text-[17px] leading-tight font-semibold">
              {sheet.title}
            </p>
            <p className="text-body-s medium:text-body-m max-w-[70ch]">{sheet.text}</p>
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

const GO = "min-h-14 flex-1 justify-center text-[17px] medium:min-w-[200px] medium:flex-none";

function LessonBar({ label, back, quiz, next }: LessonBarProps) {
  return (
    <nav
      aria-label={label}
      className="border-border-subtle flex items-center gap-3 border-t pt-3.5 pb-[calc(0.875rem+env(safe-area-inset-bottom,0px))]"
    >
      <Link
        href={back.href}
        aria-label={back.label}
        title={back.label}
        className="bg-bg-surface text-text-primary shadow-card hover:bg-bg-hover focus-visible:focus-ring focus-visible:outline-focus-ring grid size-[52px] flex-none place-items-center rounded-2xl text-[22px] active:scale-[0.97] motion-reduce:active:scale-100"
      >
        <Icon name="arrow-left" />
      </Link>
      <span className="medium:block hidden flex-1" />
      {quiz ? (
        <>
          <Link
            href={quiz.skip.href}
            className={`${buttonLink({ intent: "secondary" })} min-h-[52px]`}
          >
            {quiz.skip.label}
          </Link>
          <button
            type="submit"
            form={QUIZ_FORM_ID}
            className={`${buttonLink()} ${GO} opacity-55 group-has-[input:checked]/lesson:opacity-100`}
          >
            {quiz.check}
            <Icon name="arrow-right" />
          </button>
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

export function LessonDock({ sheet, ...bar }: LessonBarProps & { sheet?: Sheet }) {
  return (
    <div className="bg-bg-canvas sticky bottom-(--shell-bottom) z-[6] mt-auto flex flex-col gap-2.5 pt-2.5">
      <LessonSheet sheet={sheet} />
      <LessonBar {...bar} />
    </div>
  );
}
