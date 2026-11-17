import Form from "next/form";
import Link from "next/link";
import { Icon } from "@/shared/ui/icon";
import { MINE, type BuilderExample, type BuilderState } from "../domain/builder";
import { spotChoices, themeChoices, verbChoices, whereChoices } from "../domain/builder-choices";
import { exampleText, type BuilderTextContext } from "../domain/builder-text";
import { builderSteps, type PreviewLine } from "../domain/builder-view";
import { BuilderAside } from "./builder-aside";
import { BuilderStep } from "./builder-step";
import { BuilderChoices } from "./builder-tiles";
import { PlaceSearch } from "./place-search";

/*
 * The question builder: theme · verb · place (POC ask.js askBuilder, the "qb" layout of d2de23a).
 * One GET form, rendered from the URL: each step is a fieldset of tiles (or a list when long) and
 * every choice submits, so the question being built lives in the address. Beside the steps,
 * "Your question" holds the live sentence and the button; examples below fill all three at once.
 * "My own place" adds a search under the places; comparing with one's own place is not ported.
 */

type QuestionBuilderProps = {
  state: BuilderState;
  examples: BuilderExample[];
  /** Where the form submits ("/ask"). */
  path: string;
  context: BuilderTextContext;
  /** Theme families of the fact base, which colour the theme tiles. */
  themes: readonly { id: string; family: string }[];
  preview: PreviewLine[];
};

const CHIP = [
  "inline-flex min-h-touch-min items-center rounded-full border border-border-subtle bg-bg-surface px-4 py-2",
  "text-label-m font-semibold text-text-primary no-underline transition-transform duration-fast",
  "hover:-translate-y-px hover:border-border-strong motion-reduce:hover:translate-y-0",
  "aria-[current=true]:border-bg-inverse aria-[current=true]:bg-bg-inverse aria-[current=true]:text-text-inverse",
  "focus-visible:focus-ring focus-visible:outline-focus-ring",
].join(" ");

function PlaceStep({ state, context }: Pick<QuestionBuilderProps, "state" | "context">) {
  const { t } = context.translator;
  if (state.type !== "comparison") {
    const label = t("ask.build.where");
    const choices = whereChoices(state, context);
    return (
      <div className="flex flex-col gap-4">
        <BuilderChoices segment="where" label={label} choices={choices} t={t} />
        {state.where?.id === MINE ? (
          <PlaceSearch
            // A new place in the URL starts the field over from its name.
            key={state.point ? `${state.point.lat},${state.point.lon}` : "none"}
            point={state.point}
            labels={{
              label: t("ask.build.mine.label"),
              placeholder: t("ask.build.mine.ph"),
              searching: t("ask.build.mine.searching"),
              notFound: t("ask.build.mine.notfound"),
              note: t("ask.build.mine.note"),
            }}
          />
        ) : null}
      </div>
    );
  }
  const sides = [
    { segment: "a", label: t("ask.build.placeA"), chosen: state.a },
    { segment: "b", label: t("ask.build.placeB"), chosen: state.b },
  ] as const;
  return (
    <div className="flex flex-col gap-4">
      {sides.map(({ segment, label, chosen }) => (
        <fieldset key={segment} className="m-0 min-w-0 border-0 p-0">
          <legend className="text-label-l text-text-secondary m-0 mb-2 p-0 font-semibold">
            {label}
          </legend>
          <BuilderChoices
            segment={segment}
            label={label}
            choices={spotChoices(state, chosen, context)}
            t={t}
          />
        </fieldset>
      ))}
    </div>
  );
}

type StepsProps = Pick<QuestionBuilderProps, "state" | "context" | "themes">;

function Steps({ state, context, themes }: StepsProps) {
  const { t } = context.translator;
  const status = builderSteps(state);
  const isComparison = state.type === "comparison";
  return (
    <div className="flex min-w-0 flex-col gap-6.5">
      <BuilderStep n={1} label={t("ask.build.theme")} status={status.theme} tour="ask-theme">
        <BuilderChoices
          segment="theme"
          label={t("ask.build.theme")}
          choices={themeChoices(state, themes, context)}
          t={t}
        />
      </BuilderStep>
      <BuilderStep
        n={2}
        label={t("ask.build.verb")}
        status={status.verb}
        lockText={t("ask.build.lock.verb")}
        tour="ask-verb"
      >
        <BuilderChoices
          segment="verb"
          label={t("ask.build.verb")}
          choices={verbChoices(state, context)}
          t={t}
        />
      </BuilderStep>
      <BuilderStep
        n={3}
        label={t(isComparison ? "ask.build.places" : "ask.build.where")}
        status={status.place}
        lockText={t("ask.build.lock.where")}
        tour="ask-place"
      >
        <PlaceStep state={state} context={context} />
      </BuilderStep>
    </div>
  );
}

function Examples({ examples, context }: Pick<QuestionBuilderProps, "examples" | "context">) {
  const { t } = context.translator;
  return (
    <div
      data-tour="ask-examples"
      className="border-border-subtle flex flex-col items-center gap-2.5 border-t pt-4"
    >
      <p className="text-label-l text-text-secondary m-0 flex items-center gap-2 font-semibold">
        <span className="text-text-brand">
          <Icon name="sparkle" />
        </span>
        {t("ask.build.examples")}
      </p>
      <ul className="m-0 flex w-full list-none flex-wrap gap-2 p-0">
        {examples.map((example) => (
          <li key={`${example.theme}|${example.type}|${example.where}`}>
            <Link
              href={example.href}
              scroll={false}
              aria-current={example.isActive ? "true" : undefined}
              className={CHIP}
            >
              {exampleText(example, context)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function QuestionBuilder(props: QuestionBuilderProps) {
  const { state, examples, path, context, themes, preview } = props;
  const { t } = context.translator;
  return (
    <section aria-label={t("ask.build.title")} className="flex flex-col gap-6">
      <Form
        action={path}
        scroll={false}
        className="expanded:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] grid grid-cols-1 items-start gap-7"
      >
        <input type="hidden" name="depth" value={state.depth} />
        <Steps state={state} context={context} themes={themes} />
        <BuilderAside state={state} preview={preview} context={context} />
        <noscript>
          <button
            type="submit"
            className="text-label-m border-border-input bg-bg-surface rounded-field h-10 border px-4"
          >
            {t("f.apply")}
          </button>
        </noscript>
      </Form>
      {examples.length ? <Examples examples={examples} context={context} /> : null}
    </section>
  );
}
