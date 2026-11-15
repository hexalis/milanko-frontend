import Form from "next/form";
import Link from "next/link";
import type { ReactNode } from "react";
import { buttonLink } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { Icon } from "@/shared/ui/icon";
import type { BuilderExample, BuilderState } from "../domain/builder";
import {
  builderSentence,
  exampleText,
  placeName,
  variableName,
  whereLabel,
  type BuilderTextContext,
} from "../domain/builder-text";
import { BuilderSegmentSelect } from "./builder-segment-select";

/*
 * The question builder: theme · verb · place (POC ask.js askBuilder L491–580). One GET form,
 * rendered from the URL; each segment submits on change. The finished question is a link, and the
 * examples are links that fill the three pieces at once. The "my own place" forms are not ported:
 * free points are switched off in this deployment.
 */

type QuestionBuilderProps = {
  state: BuilderState;
  examples: BuilderExample[];
  /** Where the form submits ("/" on the home, "/ask" on step 1). */
  path: string;
  context: BuilderTextContext;
};

const CHIP = [
  "inline-flex min-h-touch-min items-center rounded-full border border-border-subtle bg-bg-surface px-4 py-2",
  "text-label-m font-bold text-text-primary no-underline transition-transform duration-fast",
  "hover:-translate-y-px hover:border-border-strong motion-reduce:hover:translate-y-0",
  "aria-[current=true]:border-bg-inverse aria-[current=true]:bg-bg-inverse aria-[current=true]:text-text-inverse",
  "focus-visible:focus-ring focus-visible:outline-focus-ring",
].join(" ");

const NOTE = "text-body-s text-text-secondary m-0";

function Segment({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <Field label={label}>{children}</Field>
    </div>
  );
}

function Sentence({ state, context }: Pick<QuestionBuilderProps, "state" | "context">) {
  const gap = context.translator.t("ask.build.gap");
  return (
    <p
      aria-live="polite"
      className="font-display text-text-primary m-0 min-h-[1.2em] flex-[1_1_320px] text-[clamp(22px,2.6vw,30px)] leading-tight font-extrabold text-balance"
    >
      {builderSentence(state, context).map((piece, index) =>
        piece.kind === "gap" ? (
          <span key={index} className="text-text-secondary font-normal">
            {gap}
          </span>
        ) : (
          <span key={index}>{piece.text}</span>
        ),
      )}
    </p>
  );
}

function Segments({ state, path, context }: Omit<QuestionBuilderProps, "examples">) {
  const { t } = context.translator;
  const choose = <option value="">{t("ask.build.choose")}</option>;
  const isComparison = state.type === "comparison";
  const spotOptions = state.spots.map((spot) => (
    <option key={spot} value={spot}>
      {placeName(spot, context)}
    </option>
  ));
  return (
    <Form action={path} scroll={false} className="grid gap-3">
      <input type="hidden" name="depth" value={state.depth} />
      <div className="medium:grid-cols-[repeat(auto-fit,minmax(190px,1fr))] grid grid-cols-1 gap-3">
        <Segment label={`1 · ${t("ask.build.theme")}`}>
          <BuilderSegmentSelect segment="theme" urlValue={state.theme ?? ""}>
            {choose}
            {state.themes.map((theme) => (
              <option key={theme} value={theme}>
                {t(`ask.theme.${theme}`)}
              </option>
            ))}
          </BuilderSegmentSelect>
        </Segment>
        <Segment label={`2 · ${t("ask.build.verb")}`}>
          <BuilderSegmentSelect segment="verb" urlValue={state.type ?? ""} disabled={!state.theme}>
            {choose}
            {state.types.map((type) => (
              <option key={type} value={type}>
                {t(`ask.verb.${type}`)}
              </option>
            ))}
          </BuilderSegmentSelect>
        </Segment>
        {isComparison ? (
          <>
            <Segment key="a" label={`3 · ${t("ask.build.placeA")}`}>
              <BuilderSegmentSelect segment="a" urlValue={state.a ?? ""}>
                {choose}
                {spotOptions}
              </BuilderSegmentSelect>
            </Segment>
            <Segment key="b" label={`4 · ${t("ask.build.placeB")}`}>
              <BuilderSegmentSelect segment="b" urlValue={state.b ?? ""}>
                {choose}
                {spotOptions}
              </BuilderSegmentSelect>
            </Segment>
          </>
        ) : (
          <Segment key="where" label={`3 · ${t("ask.build.where")}`}>
            <BuilderSegmentSelect
              segment="where"
              urlValue={state.where?.id ?? ""}
              disabled={!state.type}
            >
              {choose}
              {state.wheres.map((option) => (
                <option key={option.id} value={option.id}>
                  {whereLabel(option, context)}
                </option>
              ))}
            </BuilderSegmentSelect>
          </Segment>
        )}
      </div>
      <noscript>
        <button
          type="submit"
          className="text-label-m border-border-input bg-bg-surface rounded-field h-10 border px-4"
        >
          {t("f.apply")}
        </button>
      </noscript>
    </Form>
  );
}

function Examples({ examples, context }: Pick<QuestionBuilderProps, "examples" | "context">) {
  const { t } = context.translator;
  return (
    <div className="border-border-subtle flex flex-col gap-2.5 border-t pt-3.5">
      <p className="text-label-m text-text-secondary m-0 flex items-center gap-2 font-bold">
        <span className="text-text-brand">
          <Icon name="sparkle" />
        </span>
        {t("ask.build.examples")}
      </p>
      <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
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

export function QuestionBuilder({ state, examples, path, context }: QuestionBuilderProps) {
  const { t } = context.translator;
  const { go, variables } = state;
  return (
    <section
      aria-label={t("ask.build.title")}
      className="rounded-card bg-bg-surface-sunken medium:p-5 flex flex-col gap-3 p-4"
    >
      <Segments state={state} path={path} context={context} />
      <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2.5">
        <Sentence state={state} context={context} />
        {go ? (
          <Link href={go.href} className={`${buttonLink()} gap-2`}>
            {t("ask.q.go")}
            <Icon name="arrow-right" />
          </Link>
        ) : null}
      </div>
      {go ? <p className={NOTE}>{t(`ask.build.opens.${go.kind}`)}</p> : null}
      {variables.length > 1 ? (
        <p className="text-body-m text-text-secondary m-0 grid grid-cols-[22px_minmax(0,1fr)] items-start gap-2.5">
          <Icon name="info" size="lg" />
          <span>
            {t("ask.build.vars", {
              n: variables.length,
              list: variables.map((variable) => variableName(variable, context)).join(" · "),
            })}
          </span>
        </p>
      ) : null}
      {state.isSameTwice ? (
        <p role="alert" className="text-body-s text-text-primary m-0">
          {t("ask.build.cmp.same")}
        </p>
      ) : null}
      {state.hasNoFreePoint ? <p className={NOTE}>{t("ask.build.nofree")}</p> : null}
      {examples.length ? <Examples examples={examples} context={context} /> : null}
    </section>
  );
}
