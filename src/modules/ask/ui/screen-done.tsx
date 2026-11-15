import Link from "next/link";
import {
  EvidenceMeter,
  formatDate,
  strengthWord,
  verdictLabel,
  verdictOf,
  VerdictStamp,
} from "@/modules/cases";
import { buttonLink } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { askHref } from "../domain/ask-state";
import { compareHref } from "../domain/compare";
import { compareTarget, compareTitle, questionTitle } from "../domain/guided";
import type { Rules } from "../domain/rules";
import {
  GuidedSources,
  LessonMore,
  NextQuestionLink,
  ScienceList,
  type StepProps,
} from "./guided-parts";
import { testRows } from "./test-rows";

/*
 * Screen "done" · the close: what the reader thought, what the test found, and where to go next
 * (POC ask.js renderAsk, the last screen).
 */

type DoneProps = StepProps & { rules: Rules };

const ACTION = `${buttonLink({ intent: "secondary" })} gap-2`;

function DoneCard({ view, translator, catalog }: StepProps) {
  const { t } = translator;
  const { file, hunch, reading } = view;
  const context = { translator, catalog };
  const rows = [
    {
      key: "yours",
      label: t("ask.done.yours"),
      value: t(hunch ? `ask.hyp.${hunch}` : "ask.done.none"),
    },
    {
      key: "chance",
      label: t("ask.done.chance"),
      value: t(reading ? `ask.chk.${reading}` : "ask.done.none"),
    },
  ];
  return (
    <div className="rounded-card bg-bg-surface shadow-card medium:grid-cols-[3.5rem_minmax(0,1fr)] grid grid-cols-1 items-start gap-[18px] p-6">
      <span className="bg-surface-tone-3 text-action-primary grid size-14 place-items-center rounded-full text-[30px]">
        <Icon name="confirmed" />
      </span>
      <dl className="grid gap-3">
        {rows.map((row) => (
          <div
            key={row.key}
            className="medium:grid-cols-[minmax(150px,220px)_minmax(0,1fr)] grid items-center gap-x-4 gap-y-1"
          >
            <dt className="text-body-s text-text-secondary">{row.label}</dt>
            <dd className="text-body-m text-text-primary font-semibold">{row.value}</dd>
          </div>
        ))}
        <div className="medium:grid-cols-[minmax(150px,220px)_minmax(0,1fr)] grid items-center gap-x-4 gap-y-1">
          <dt className="text-body-s text-text-secondary">{t("ask.done.test")}</dt>
          <dd className="flex flex-wrap items-center gap-2">
            <VerdictStamp verdict={verdictOf(file)} label={verdictLabel(file, context)} />
            <EvidenceMeter strength={file.t.strength} word={strengthWord(file, context)} />
          </dd>
        </div>
      </dl>
    </div>
  );
}

/** The companion question, or (Rule 3) the same analysis in a second place. */
function NextLinks({ view, translator, catalog, rules }: DoneProps) {
  const { t } = translator;
  const { question, depth } = view;
  const context = { translator, catalog };
  const target = compareTarget(rules, catalog, question);
  if (target?.kind === "question") {
    return (
      <NextQuestionLink
        href={askHref(target.question.id, { screen: "verdict", depth })}
        label={t("ask.v.compare")}
        title={questionTitle(target.question, context)}
      />
    );
  }
  if (target?.kind === "pair") {
    return (
      <NextQuestionLink
        href={compareHref({ ...target, depth })}
        label={t("ask.v.follow")}
        title={compareTitle(target.theme, target.a, target.b, context)}
      />
    );
  }
  return null;
}

function DeeperActions({ view, translator }: Omit<StepProps, "catalog">) {
  const { t } = translator;
  const { file } = view;
  return (
    <div className="flex flex-wrap gap-3">
      <a href={`/cases/${file.id}/data`} download className={ACTION}>
        <Icon name="csv" />
        {t("case.download")}
      </a>
      <Link href={`/cases/${file.id}`} className={ACTION}>
        <Icon name="cases" />
        {t("ask.deep.case")}
      </Link>
      <Link href={`/explore?case=${encodeURIComponent(file.id)}`} className={ACTION}>
        <Icon name="explore" />
        {t("case.globe")}
      </Link>
      <Link href="/method" className={ACTION}>
        <Icon name="method" />
        {t("ask.deep.method")}
      </Link>
    </div>
  );
}

function CheckYourself({ view, translator, catalog }: StepProps) {
  const { t, locale } = translator;
  const { file, depth } = view;
  return (
    <LessonMore summary={t("ask.deep.title")}>
      <p className="text-body-m text-text-primary">{t("ask.deep.lead")}</p>
      <GuidedSources variable={file.variable} translator={translator} />
      <p className="text-body-s text-text-secondary flex items-start gap-2">
        <span className="text-action-primary mt-0.5">
          <Icon name="check" />
        </span>
        {t("ask.deep.demo", {
          date: catalog.generated ? formatDate(catalog.generated, locale) : "—",
        })}
      </p>
      {depth === "science" ? <ScienceList rows={testRows(file, translator)} /> : null}
    </LessonMore>
  );
}

export function ScreenDone(props: DoneProps) {
  const { t } = props.translator;
  return (
    <>
      <DoneCard {...props} />
      <h2 className="font-display text-text-primary mt-2 text-[20px] font-semibold">
        {t("ask.done.next")}
      </h2>
      <NextLinks {...props} />
      <DeeperActions view={props.view} translator={props.translator} />
      <CheckYourself {...props} />
    </>
  );
}
