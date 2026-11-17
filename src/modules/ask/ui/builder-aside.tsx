import Link from "next/link";
import { buttonLink } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import type { BuilderState } from "../domain/builder";
import { builderSentence, variableName, type BuilderTextContext } from "../domain/builder-text";
import type { PreviewLine } from "../domain/builder-view";

/*
 * "Your question" (POC .qb__out): the live sentence, the button that opens it or what is still
 * missing, what the reader is about to see, and the notes. A night panel in both themes. On a
 * phone it stays in view above the tab bar while the steps scroll, with only the essentials.
 */

type BuilderAsideProps = {
  state: BuilderState;
  preview: PreviewLine[];
  context: BuilderTextContext;
};

const NOTE = "max-medium:hidden m-0 text-body-s text-text-inverse/75";

function Sentence({ state, context }: Omit<BuilderAsideProps, "preview">) {
  const gap = context.translator.t("ask.build.gap");
  return (
    <p
      aria-live="polite"
      className="font-display medium:text-[clamp(24px,2.4vw,30px)] m-0 min-h-[1.2em] text-[19px] leading-[1.3] font-semibold text-balance"
    >
      {builderSentence(state, context).map((piece, index) =>
        piece.kind === "gap" ? (
          <span key={index} className="text-text-inverse/60 font-normal">
            {gap}
          </span>
        ) : (
          <span key={index}>{piece.text}</span>
        ),
      )}
    </p>
  );
}

function Preview({ lines, context }: { lines: PreviewLine[]; context: BuilderTextContext }) {
  const { t } = context.translator;
  return (
    <ul
      aria-label={t("ask.prev.t")}
      className="text-body-s max-medium:hidden m-0 grid list-none gap-2 p-0"
    >
      {lines.map((line) => (
        <li
          key={"key" in line ? line.key : line.text}
          className="grid grid-cols-[20px_minmax(0,1fr)] items-start gap-2.5"
        >
          <span className="text-feedback-success-fg">
            <Icon name={line.icon} />
          </span>
          <span>{"key" in line ? t(line.key, line.values) : line.text}</span>
        </li>
      ))}
    </ul>
  );
}

export function BuilderAside({ state, preview, context }: BuilderAsideProps) {
  const { t } = context.translator;
  const { go, variables } = state;
  return (
    <aside
      aria-labelledby="builder-yours"
      data-tour="ask-go"
      // A night panel in both themes: its light-theme tokens make bg-inverse the night sky.
      data-theme="light"
      className="bg-bg-inverse text-text-inverse shadow-raised expanded:top-6 max-expanded:bottom-[calc(var(--shell-bottom)+0.75rem)] medium:gap-3.5 medium:rounded-[24px] medium:p-6 sticky z-[5] flex flex-col gap-2.5 rounded-[20px] p-4"
    >
      <h2 id="builder-yours" className="text-label-l text-text-inverse/75 max-medium:sr-only m-0">
        {t("ask.build.yours")}
      </h2>
      <Sentence state={state} context={context} />
      {go ? (
        <Link
          href={go.href}
          className={`${buttonLink()} medium:min-h-14 min-h-12 justify-center gap-2 text-[17px]`}
        >
          {t("ask.q.go")}
          <Icon name="arrow-right" />
        </Link>
      ) : (
        // On a phone the sentence's gaps already say what is missing: the note would only cover the steps.
        <p className="text-body-s medium:text-body-m max-medium:hidden m-0 rounded-[14px] bg-white/[0.07] px-3.5 py-3">
          {t("ask.build.todo")}
        </p>
      )}
      {preview.length ? <Preview lines={preview} context={context} /> : null}
      {go ? <p className={NOTE}>{t(`ask.build.opens.${go.kind}`)}</p> : null}
      {variables.length > 1 ? (
        <p className={`${NOTE} grid grid-cols-[20px_minmax(0,1fr)] items-start gap-2.5`}>
          <Icon name="info" />
          <span>
            {t("ask.build.vars", {
              n: variables.length,
              list: variables.map((variable) => variableName(variable, context)).join(" · "),
            })}
          </span>
        </p>
      ) : null}
      {state.isSameTwice ? (
        <p role="alert" className="text-body-s m-0">
          {t("ask.build.cmp.same")}
        </p>
      ) : null}
      {state.hasNoFreePoint ? <p className={NOTE}>{t("ask.build.nofree")}</p> : null}
    </aside>
  );
}
