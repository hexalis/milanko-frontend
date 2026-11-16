import Link from "next/link";
import {
  EvidenceMeter,
  formatDate,
  strengthWord,
  verdictLabel,
  verdictOf,
  VerdictStamp,
} from "@/modules/cases";
import { withBasePath } from "@/shared/lib/base-path";
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

const ACTION =
  "group/act rounded-card bg-bg-surface shadow-card text-text-primary duration-fast hover:shadow-raised focus-visible:focus-ring focus-visible:outline-focus-ring flex flex-1 items-start gap-3.5 p-4 no-underline transition-[translate,box-shadow] hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0";

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
    <div
      data-tour="done-card"
      className="rounded-card bg-bg-surface shadow-card medium:grid-cols-[3.5rem_minmax(0,1fr)] grid grid-cols-1 items-start gap-[18px] p-6"
    >
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

/** One way to go deeper: an icon, what it is, and one line on what you get there. */
function ActionBody({ icon, title, note }: { icon: string; title: string; note: string }) {
  return (
    <>
      <span className="bg-surface-tone-3 text-text-brand grid size-11 flex-none place-items-center rounded-xl text-[22px]">
        <Icon name={icon} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-body-m-strong text-text-primary">{title}</span>
        <span className="text-body-s text-text-secondary">{note}</span>
      </span>
      <span className="text-text-tertiary duration-fast group-hover/act:text-text-brand mt-2.5 flex transition-[translate,color] group-hover/act:translate-x-0.5 motion-reduce:transition-none">
        <Icon name="arrow-right" />
      </span>
    </>
  );
}

function DeeperActions({ view, translator }: Omit<StepProps, "catalog">) {
  const { t } = translator;
  const { file } = view;
  return (
    <ul
      data-tour="done-deeper"
      className="medium:grid-cols-2 m-0 grid list-none grid-cols-1 gap-3 p-0"
    >
      <li className="flex">
        <a href={withBasePath(`/cases/${file.id}/data`)} download className={ACTION}>
          <ActionBody icon="csv" title={t("case.download")} note={t("ask.deep.csv.d")} />
        </a>
      </li>
      <li className="flex">
        <Link href={`/cases/${file.id}`} className={ACTION}>
          <ActionBody icon="cases" title={t("ask.deep.case")} note={t("ask.deep.case.d")} />
        </Link>
      </li>
      <li className="flex">
        <Link href={`/explore?case=${encodeURIComponent(file.id)}`} className={ACTION}>
          <ActionBody icon="explore" title={t("case.globe")} note={t("ask.deep.globe.d")} />
        </Link>
      </li>
      <li className="flex">
        <Link href="/method" className={ACTION}>
          <ActionBody icon="method" title={t("ask.deep.method")} note={t("ask.deep.method.d")} />
        </Link>
      </li>
    </ul>
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
      {/* Where to go next is the close's main act, so it gets a section and a heading of its own. */}
      <section
        aria-labelledby="ask-next"
        className="bg-bg-surface-sunken medium:p-6 -mx-1 mt-3 flex flex-col gap-4 rounded-[28px] p-4"
      >
        <header className="flex flex-col gap-1">
          <h2
            id="ask-next"
            className="font-display text-text-primary text-[clamp(24px,2.6vw,30px)] leading-tight font-semibold"
          >
            {t("ask.done.next")}
          </h2>
          <p className="text-body-m text-text-secondary">{t("ask.next.lead")}</p>
        </header>
        <div data-tour="done-next" className="empty:hidden">
          <NextLinks {...props} />
        </div>
        <DeeperActions view={props.view} translator={props.translator} />
      </section>
      <div data-tour="done-check">
        <CheckYourself {...props} />
      </div>
    </>
  );
}
