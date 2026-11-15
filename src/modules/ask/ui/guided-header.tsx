import Link from "next/link";
import { tv } from "tailwind-variants";
import type { Translator } from "@/shared/lib/i18n";
import { Icon } from "@/shared/ui/icon";
import { chooseDepth } from "../actions";
import { askHref, DEPTHS, LAST_STEP, type Depth, type Hunch } from "../domain/ask-state";

/* Header of a guided step (POC ask.js stepsBar, depthSeg and the guided-depth aside). */

const stepPill = tv({
  slots: {
    root: "text-label-m inline-flex min-h-10 items-center gap-2 rounded-full py-1 pr-3.5 pl-1 font-bold no-underline",
    number:
      "font-display grid size-[30px] place-items-center rounded-full text-[15px] font-extrabold",
  },
  variants: {
    state: {
      done: {
        root: "bg-bg-surface text-text-secondary hover:text-text-primary hover:shadow-card focus-visible:focus-ring focus-visible:outline-focus-ring",
        number: "bg-surface-tone-3 text-text-primary",
      },
      todo: {
        root: "bg-bg-surface text-text-secondary hover:text-text-primary hover:shadow-card focus-visible:focus-ring focus-visible:outline-focus-ring",
        number: "bg-bg-surface-sunken text-text-primary",
      },
      current: {
        root: "bg-bg-inverse text-text-inverse",
        number: "bg-bg-surface text-text-primary",
      },
    },
  },
});

type GuidedLocation = { id: string; step: number; depth: Depth; hunch?: Hunch };

function StepsBar({
  id,
  step,
  depth,
  hunch,
  translator,
}: GuidedLocation & { translator: Translator }) {
  const { t } = translator;
  return (
    <ol aria-label={t("ask.steps.aria")} className="flex flex-wrap gap-1.5">
      {Array.from({ length: LAST_STEP }, (_, index) => {
        const n = index + 1;
        const state = n === step ? "current" : n < step ? "done" : "todo";
        const styles = stepPill({ state });
        const content = (
          <>
            <span className={styles.number()}>{n}</span>
            <span>{t(`ask.step.${n}`)}</span>
          </>
        );
        return (
          <li key={n}>
            {n === step ? (
              <span aria-current="step" className={styles.root()}>
                {content}
              </span>
            ) : (
              <Link
                href={n === 1 ? "/ask" : askHref(id, { step: n, depth, hunch })}
                className={styles.root()}
              >
                {content}
              </Link>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Same page, same figures, another depth. A form posting to a Server Action, so the choice is
 * remembered in a cookie and still works before any script runs.
 */
function DepthSwitch({
  id,
  step,
  depth,
  hunch,
  translator,
}: GuidedLocation & { translator: Translator }) {
  const { t } = translator;
  return (
    <form action={chooseDepth}>
      <input type="hidden" name="qid" value={id} />
      <input type="hidden" name="step" value={step} />
      {hunch ? <input type="hidden" name="h" value={hunch} /> : null}
      <fieldset className="rounded-control bg-bg-surface-sunken inline-flex flex-wrap items-center gap-1 border-0 p-1">
        <legend className="sr-only">{t("ask.depth.aria")}</legend>
        <span className="text-label-s text-text-secondary px-2.5" aria-hidden="true">
          {t("ask.depth.label")}
        </span>
        {DEPTHS.map((option) => (
          <button
            key={option}
            type="submit"
            name="depth"
            value={option}
            aria-pressed={option === depth}
            className="text-label-s text-text-secondary hover:bg-bg-hover focus-visible:focus-ring focus-visible:outline-focus-ring aria-pressed:bg-bg-inverse aria-pressed:text-text-inverse min-h-8 rounded-xs px-3 font-bold"
          >
            {t(`ask.depth.${option}`)}
          </button>
        ))}
      </fieldset>
    </form>
  );
}

export function GuidedHeader(props: GuidedLocation & { translator: Translator }) {
  return (
    <header className="flex flex-col gap-3 pb-6">
      <StepsBar {...props} />
      <div>
        <DepthSwitch {...props} />
      </div>
    </header>
  );
}

/**
 * Guided depth: one observation question per step. Where the data can answer it, the answer waits
 * behind a native disclosure.
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
      className="bg-surface-tone-5 rounded-card grid max-w-[760px] grid-cols-[1.625rem_minmax(0,1fr)] gap-3 px-[18px] py-4 shadow-[0_5px_0_var(--color-surface-tone-5-edge)]"
    >
      <span className="text-text-primary mt-0.5 text-[24px]">
        <Icon name="sparkle" />
      </span>
      <div className="flex flex-col gap-2">
        <p className="text-body-l text-text-primary font-bold">{question}</p>
        {hint ? (
          <details className="group">
            <summary className="text-label-m text-text-link focus-visible:focus-ring focus-visible:outline-focus-ring inline-flex cursor-pointer list-none items-center gap-1.5 font-bold [&::-webkit-details-marker]:hidden">
              {t("ask.guide.reveal")}
              <span className="transition-transform group-open:rotate-180">
                <Icon name="caret-down" />
              </span>
            </summary>
            <p className="text-body-m text-text-primary mt-2">{hint}</p>
          </details>
        ) : null}
      </div>
    </aside>
  );
}
