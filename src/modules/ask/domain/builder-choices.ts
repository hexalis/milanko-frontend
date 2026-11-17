import { formatDate } from "@/modules/cases";
import type { BuilderState } from "./builder";
import { placeName, whereLabel, type BuilderTextContext } from "./builder-text";
import { spotIcon, themeFamily, themeIcon, verbIcon, whereIcon, type Family } from "./builder-view";

/*
 * The options of each builder step, in the reader's language (POC askBuilder themeItems, verbItems,
 * whereItems, spotItems). A label can carry a second, quieter line: what stands in brackets, or the
 * date of an event.
 */

export type BuilderChoice = {
  id: string;
  label: string;
  hint?: string;
  /** A name of a word or two for the phone's tiles ("Lluvia" for "la lluvia"). */
  short?: string;
  icon: string;
  /** Theme tiles take their family's colour; the others stay plain. */
  family?: Family;
  isChosen: boolean;
};

/** "natural disasters (fires, storms…)" → label "natural disasters", hint "fires, storms…". */
export function splitHint(text: string): { label: string; hint?: string } {
  const match = /^(.*?)\s*\((.+)\)\s*$/.exec(text);
  return match?.[1] && match[2] ? { label: match[1], hint: match[2] } : { label: text };
}

export function themeChoices(
  state: BuilderState,
  themes: readonly { id: string; family: string }[],
  { translator }: BuilderTextContext,
): BuilderChoice[] {
  return state.themes.map((theme) => ({
    id: theme,
    ...splitHint(translator.t(`ask.theme.${theme}`)),
    short: translator.t(`ask.tile.${theme}`),
    icon: themeIcon(theme),
    family: themeFamily(themes, theme),
    isChosen: theme === state.theme,
  }));
}

export function verbChoices(state: BuilderState, { translator }: BuilderTextContext) {
  return state.types.map((type): BuilderChoice => ({
    id: type,
    label: translator.t(`ask.verb.${type}`),
    short: translator.t(`ask.tile.verb.${type}`),
    icon: verbIcon(type),
    isChosen: type === state.type,
  }));
}

function eventDate(id: string, context: BuilderTextContext): string | undefined {
  const file = context.catalog.all.find((candidate) => candidate.id === id);
  return file?.kind === "event" ? formatDate(file.date, context.translator.locale) : undefined;
}

export function whereChoices(state: BuilderState, context: BuilderTextContext) {
  return state.wheres.map((option): BuilderChoice => {
    const { subject } = option;
    // An event reads "name · date": the date goes on the quieter line; a found place, its name.
    const text =
      subject.type === "anomaly"
        ? { label: placeName(subject.event, context), hint: eventDate(subject.event, context) }
        : subject.type === "point"
          ? { label: whereLabel(option, context), hint: subject.name }
          : splitHint(whereLabel(option, context));
    return {
      id: option.id,
      ...text,
      icon: whereIcon(option),
      isChosen: option.id === state.where?.id,
    };
  });
}

/** The places one side of a comparison can take. */
export function spotChoices(
  state: BuilderState,
  chosen: string | undefined,
  context: BuilderTextContext,
): BuilderChoice[] {
  return state.spots.map((spot) => ({
    id: spot,
    ...splitHint(placeName(spot, context)),
    icon: spotIcon(spot),
    isChosen: spot === chosen,
  }));
}
