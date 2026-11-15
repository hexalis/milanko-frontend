import Link from "next/link";
import type { Translator } from "@/shared/lib/i18n";
import { Icon } from "@/shared/ui/icon";
import { chooseDepth } from "../actions";
import { ASK_FLOW, DEPTHS, type GuidedState, type Screen } from "../domain/ask-state";

/*
 * Top of the lesson (POC ask.js .lesson-top): leave, how far along, and the reading level behind
 * "Aa". The level is a setting, not a step, so it waits in a disclosure.
 */

type LessonTopProps = GuidedState & { id: string; translator: Translator };

const ROUND_CONTROL =
  "grid size-11 cursor-pointer place-items-center rounded-[14px] text-text-secondary transition-colors duration-fast ease-standard hover:bg-bg-surface hover:text-text-primary focus-visible:focus-ring focus-visible:outline-focus-ring";

const SEGMENT: Record<"done" | "todo", string> = {
  done: "flex-1 bg-action-primary shadow-[inset_0_-3px_0_rgb(0_0_0/0.12)] first:rounded-s-full last:rounded-e-full",
  todo: "flex-1",
};

/** The five screens as one bar that fills up to the current one. */
function ProgressSteps({ screen, translator }: { screen: Screen; translator: Translator }) {
  const { t } = translator;
  const current = ASK_FLOW.indexOf(screen);
  return (
    <ol
      aria-label={t("ask.progress")}
      className="bg-bg-surface flex h-3.5 overflow-hidden rounded-full shadow-[inset_0_0_0_1px_var(--color-border-subtle)]"
    >
      {ASK_FLOW.map((name, index) => (
        <li
          key={name}
          aria-current={index === current ? "step" : undefined}
          className={SEGMENT[index <= current ? "done" : "todo"]}
        >
          <span className="sr-only">
            {index + 1} / {ASK_FLOW.length} · {t(`ask.flow.${name}`)}
          </span>
        </li>
      ))}
    </ol>
  );
}

/**
 * Same page, same figures, another depth. A form posting to a Server Action, so the choice is
 * remembered in a cookie and still works before any script runs.
 */
function DepthMenu({ id, screen, depth, hunch, reading, translator }: LessonTopProps) {
  const { t } = translator;
  return (
    <details className="group/aa relative">
      <summary
        aria-label={t("ask.depth.aria")}
        title={t("ask.depth.label")}
        className={`${ROUND_CONTROL} group-open/aa:bg-bg-surface group-open/aa:text-text-primary group-open/aa:shadow-card list-none text-[18px] font-semibold tracking-tight [&::-webkit-details-marker]:hidden`}
      >
        <span aria-hidden="true">Aa</span>
      </summary>
      <form
        action={chooseDepth}
        className="bg-bg-surface shadow-raised absolute end-0 top-[calc(100%+0.5rem)] z-[7] flex w-[min(320px,86vw)] flex-col gap-1 rounded-[18px] p-2.5"
      >
        <input type="hidden" name="qid" value={id} />
        <input type="hidden" name="s" value={screen} />
        {hunch ? <input type="hidden" name="h" value={hunch} /> : null}
        {reading ? <input type="hidden" name="r" value={reading} /> : null}
        <fieldset className="m-0 flex min-w-0 flex-col gap-1 border-0 p-0">
          <legend className="text-label-s text-text-secondary mx-2 mt-1 mb-1.5 font-semibold">
            {t("ask.depth.label")}
          </legend>
          {DEPTHS.map((option) => (
            <button
              key={option}
              type="submit"
              name="depth"
              value={option}
              aria-pressed={option === depth}
              className="group/opt text-text-primary hover:bg-bg-hover focus-visible:focus-ring focus-visible:outline-focus-ring aria-pressed:bg-bg-surface-sunken grid cursor-pointer grid-cols-[minmax(0,1fr)_1.25rem] items-center gap-x-2.5 gap-y-0.5 rounded-xl px-3 py-2.5 text-start"
            >
              <strong className="text-body-m">{t(`ask.depth.${option}`)}</strong>
              <span className="text-action-primary invisible row-span-2 group-aria-pressed/opt:visible">
                <Icon name="check" />
              </span>
              <span className="text-body-s text-text-secondary">{t(`ask.depth.${option}.d`)}</span>
            </button>
          ))}
        </fieldset>
      </form>
    </details>
  );
}

export function LessonTop(props: LessonTopProps) {
  const { t } = props.translator;
  return (
    <header className="bg-bg-canvas sticky top-(--shell-top) z-[6] grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 py-3.5">
      <Link href="/ask" aria-label={t("ask.exit")} title={t("ask.exit")} className={ROUND_CONTROL}>
        <Icon name="x" size="lg" />
      </Link>
      <ProgressSteps screen={props.screen} translator={props.translator} />
      <DepthMenu {...props} />
    </header>
  );
}

/**
 * Guided depth: one observation question per screen. Where the data can answer it, the answer
 * waits behind a native disclosure.
 */
export function GuideAside({
  question,
  hint,
  translator,
}: {
  question: string;
  hint?: string;
  translator: Translator;
}) {
  const { t } = translator;
  return (
    <aside
      aria-label={t("ask.guide.aria")}
      className="bg-surface-tone-5 rounded-card shadow-card grid max-w-[760px] grid-cols-[1.625rem_minmax(0,1fr)] gap-3 px-[18px] py-4"
    >
      <span className="text-text-primary mt-0.5 text-[24px]">
        <Icon name="sparkle" />
      </span>
      <div className="flex flex-col gap-2">
        <p className="text-body-l text-text-primary font-semibold">{question}</p>
        {hint ? (
          <details className="group">
            <summary className="text-label-m text-text-link focus-visible:focus-ring focus-visible:outline-focus-ring inline-flex min-h-9 cursor-pointer list-none items-center gap-1.5 font-semibold [&::-webkit-details-marker]:hidden">
              {t("ask.guide.reveal")}
              <span className="transition-transform group-open:rotate-180 motion-reduce:transition-none">
                <Icon name="caret-down" />
              </span>
            </summary>
            <p className="text-body-l text-text-secondary mt-1">{hint}</p>
          </details>
        ) : null}
      </div>
    </aside>
  );
}
