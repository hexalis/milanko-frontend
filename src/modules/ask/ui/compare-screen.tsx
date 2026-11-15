import Link from "next/link";
import type { ReactNode } from "react";
import {
  changeLabel,
  EvidenceMeter,
  fileName,
  formatFigure,
  formatP,
  rateLabel,
  strengthWord,
  trendText,
  verdictLabel,
  verdictOf,
  VerdictStamp,
  type CaseCatalog,
} from "@/modules/cases";
import type { Translator } from "@/shared/lib/i18n";
import { toQueryString } from "@/shared/lib/search-params";
import { buttonLink } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import type { Depth } from "../domain/ask-state";
import { compareJoin, sideHref, type CompareQuery, type CompareSide } from "../domain/compare";
import { compareTitle } from "../domain/guided";
import type { Rules } from "../domain/rules";
import { GuidedCallout, GuidedCrumbs, GuidedNav, RateFigure, StepLead } from "./guided-parts";

/*
 * Comparison: the same variable in two places, side by side (POC ask.js renderAskCompare,
 * L594–685). Both sides are reviewed, so they render on the server; the live NASA POWER side for
 * a free point is not ported.
 */

type CompareScreenProps = {
  query: CompareQuery;
  sides: [CompareSide, CompareSide];
  depth: Depth;
  rules: Rules;
  translator: Translator;
  catalog: CaseCatalog;
  /** The page's tour button, beside the kicker. */
  tour?: ReactNode;
};

/** The planet-wide sample is T2M, in °C (as the POC wrote it). */
const PLANET_UNIT = "°C";
const PLANET_DIGITS = 2;

function SideCard({
  side,
  href,
  translator,
  catalog,
}: {
  side: CompareSide;
  href: string;
  translator: Translator;
  catalog: CaseCatalog;
}) {
  const { t } = translator;
  const context = { translator, catalog };
  const isPlanet = side.kind === "planet";
  const rate = isPlanet
    ? `${formatFigure(side.perDecade, PLANET_DIGITS, true)} ${PLANET_UNIT}`
    : rateLabel(side.file, context);
  const total = isPlanet
    ? `${formatFigure(side.total, PLANET_DIGITS, true)} ${PLANET_UNIT}`
    : changeLabel(side.file, context);
  const headingId = `cmp-${side.id}`;
  return (
    <section
      aria-labelledby={headingId}
      className="rounded-card bg-bg-surface shadow-card flex flex-col gap-2.5 p-5"
    >
      <h2 id={headingId} className="text-heading-h3 font-display text-text-primary">
        {isPlanet ? t("ask.planet") : fileName(side.file, context)}
      </h2>
      <p className="text-body-s text-text-secondary">
        {isPlanet
          ? t("ask.cmp.planet", { points: side.points })
          : `${t("ask.cmp.reviewed")} · ${trendText(side.file, "region", context)}`}
      </p>
      <p data-tour="cmp-verdict" className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
        {isPlanet ? (
          <VerdictStamp
            verdict={side.isSignificant ? "confirmed" : "inconclusive"}
            label={t(`verdict.${side.isSignificant ? "confirmed" : "inconclusive"}`)}
          />
        ) : (
          <>
            <VerdictStamp verdict={verdictOf(side.file)} label={verdictLabel(side.file, context)} />
            <EvidenceMeter
              strength={side.file.t.strength}
              word={strengthWord(side.file, context)}
            />
          </>
        )}
      </p>
      <RateFigure direction={side.direction} rate={rate} perDecade={t("perDecade")} />
      <p className="text-body-m text-text-primary tabular-nums">
        {t(side.isSignificant ? "ask.v.much" : "ask.v.much.flat", { rate, total, from: side.from })}
      </p>
      <p className="text-text-secondary font-mono text-[13px]">
        {side.from}–{side.to} · n = {side.n} · p {formatP(side.p)}
      </p>
      <p className="mt-auto pt-1">
        <Link href={href} className={buttonLink({ intent: "secondary" })}>
          {isPlanet ? t("ask.deep.method") : t("ask.cmp.open")}
          <Icon name="arrow-right" />
        </Link>
      </p>
    </section>
  );
}

export function CompareScreen({
  query,
  sides,
  depth,
  rules,
  translator,
  catalog,
  tour,
}: CompareScreenProps) {
  const { t } = translator;
  const context = { translator, catalog };
  const title = compareTitle(query.theme, query.a, query.b, context);
  const [a, b] = sides;
  return (
    <main className="max-w-content-max medium:px-6 expanded:px-12 mx-auto w-full px-4 pb-16">
      <GuidedCrumbs
        navLabel={t("nav.breadcrumb")}
        links={[
          { href: "/", label: t("nav.ask") },
          { href: "/ask", label: t("ask.step.1") },
        ]}
        current={title}
      />
      <article aria-labelledby="ask-title" className="flex max-w-[980px] flex-col gap-5 pb-8">
        <div className="-mb-2.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <p className="text-label-m text-text-tertiary font-semibold">
            {t("ask.verb.comparison")}
          </p>
          {tour}
        </div>
        <h1
          id="ask-title"
          className="font-display text-text-primary text-[clamp(30px,4vw,54px)] leading-[1.02] text-balance"
        >
          {title}
        </h1>
        <StepLead>{t("ask.cmp.lead")}</StepLead>
        <div data-tour="cmp-sides" className="medium:grid-cols-2 grid gap-4">
          {sides.map((side) => (
            <SideCard
              key={side.id}
              side={side}
              href={sideHref(rules, catalog, query.theme, side, depth)}
              translator={translator}
              catalog={catalog}
            />
          ))}
        </div>
        <GuidedCallout icon="decide" title={t("ask.cmp.joined")} tour="cmp-joined">
          {t(`ask.cmp.${compareJoin(a, b)}`)}
        </GuidedCallout>
        <GuidedCallout icon="warning" title={t("ask.v.cannot")} tour="cmp-cannot">
          {t("ask.cmp.cannot")}
        </GuidedCallout>
      </article>
      <GuidedNav
        label={t("ask.steps.aria")}
        tour="cmp-nav"
        back={{
          href: `/ask${toQueryString({ theme: query.theme, verb: "comparison" })}`,
          label: t("ask.back"),
        }}
        next={{ href: "/ask", label: t("ask.deep.again") }}
      />
    </main>
  );
}
