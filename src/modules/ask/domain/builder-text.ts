import { fileName, formatDate, type CaseCatalog } from "@/modules/cases";
import type { Translator } from "@/shared/lib/i18n";
import type { BuilderState, Subject, WhereOption } from "./builder";
import { PLANET, type QuestionType } from "./rules";

/*
 * The builder's words in the reader's language (POC askIn, askWheres labels and sentences, the
 * live question of askBuilder). Every name comes from the case files; nothing is written by hand.
 */

export type BuilderTextContext = { translator: Translator; catalog: CaseCatalog };

/** A piece of the live question: words, or a gap the reader has not filled yet. */
export type SentencePiece = { kind: "text"; text: string } | { kind: "gap" };

type Slots = Partial<Record<"place" | "a" | "b" | "event" | "cat", string>>;

const findFile = (catalog: CaseCatalog, id: string) => catalog.all.find((file) => file.id === id);

/** A place as a list shows it: the case name, or "The planet". */
export function placeName(place: string, context: BuilderTextContext): string {
  if (place === PLANET) return context.translator.t("ask.planet");
  const file = findFile(context.catalog, place);
  return file ? fileName(file, context) : place;
}

/** A place as a question says it: "in Svalbard", "across the planet". */
export function placeIn(place: string, context: BuilderTextContext): string {
  const { t } = context.translator;
  if (place === PLANET) return t("ask.in.planet");
  return t("ask.in", { place: placeName(place, context) });
}

function eventName(id: string, context: BuilderTextContext): string {
  const file = findFile(context.catalog, id);
  return file ? fileName(file, context) : id;
}

const categoryName = (category: string, { translator }: BuilderTextContext) =>
  translator.t(`cat.${category}`);

/** Label of a place option in its select. */
export function whereLabel(option: WhereOption, context: BuilderTextContext): string {
  const { subject } = option;
  switch (subject.type) {
    case "trend":
      return placeName(subject.place, context);
    case "comparison":
      return [subject.a, subject.b].map((place) => placeName(place, context)).join(" · ");
    case "anomaly": {
      const file = findFile(context.catalog, subject.event);
      const date = file?.kind === "event" ? formatDate(file.date, context.translator.locale) : "";
      return [eventName(subject.event, context), date].filter(Boolean).join(" · ");
    }
    case "catalog":
      return categoryName(subject.category, context);
    case "point":
      return context.translator.t("ask.build.mine");
  }
}

/** The reader's own place as a question says it: "in Matagalpa", or "in your place" until found. */
function pointIn(name: string | undefined, { translator }: BuilderTextContext): string {
  return name ? translator.t("ask.in", { place: name }) : translator.t("ask.build.mine.gap");
}

/** What a chosen place puts into the question's pattern. */
function subjectSlots(subject: Subject, context: BuilderTextContext): Slots {
  switch (subject.type) {
    case "trend":
      return { place: placeIn(subject.place, context) };
    case "comparison":
      return { a: placeIn(subject.a, context), b: placeIn(subject.b, context) };
    case "anomaly":
      return { event: eventName(subject.event, context) };
    case "catalog":
      return {
        cat: categoryName(subject.category, context).toLocaleLowerCase(context.translator.locale),
      };
    case "point":
      return { place: pointIn(subject.name, context) };
  }
}

/** Splits a filled pattern into words and the placeholders still open. */
export function sentencePieces(text: string): SentencePiece[] {
  return text
    .split(/(\{\w+\})/)
    .filter(Boolean)
    .map((part) => (/^\{\w+\}$/.test(part) ? { kind: "gap" } : { kind: "text", text: part }));
}

function pattern(
  type: QuestionType,
  theme: string,
  slots: Slots,
  { translator }: BuilderTextContext,
) {
  return translator.t(`ask.pat.${type}`, { theme: translator.t(`ask.theme.${theme}`), ...slots });
}

/** The question as built so far; unfilled pieces stay gaps. */
export function builderSentence(state: BuilderState, context: BuilderTextContext): SentencePiece[] {
  if (!state.theme) return [{ kind: "text", text: context.translator.t("ask.build.empty") }];
  const type = state.type ?? "trend";
  const slots: Slots =
    type === "comparison"
      ? {
          a: state.a ? placeIn(state.a, context) : undefined,
          b: state.b ? placeIn(state.b, context) : undefined,
        }
      : state.where
        ? subjectSlots(state.where.subject, context)
        : {};
  return sentencePieces(pattern(type, state.theme, slots, context));
}

/** An example chip's whole question. */
export function exampleText(
  example: { theme: string; type: QuestionType; subject: Subject },
  context: BuilderTextContext,
): string {
  return pattern(example.type, example.theme, subjectSlots(example.subject, context), context);
}

/** A NASA variable in words, or its code when the copy has no name for it. */
export function variableName(variable: string, { translator }: BuilderTextContext): string {
  const key = `var.${variable}`;
  return translator.has(key) ? translator.t(key) : variable;
}
