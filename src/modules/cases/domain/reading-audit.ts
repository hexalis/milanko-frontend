import { auditQuestion, auditSentence, breakText } from "./audit-text";
import { chanceNote, missingNote, pChecks } from "./case-glance";
import {
  caseFilePath,
  exactRows,
  SHEET_COUNT,
  type CaseReading,
  type ReadingContext,
  type ReadingTone,
} from "./case-reading";
import { auditFileId, lastAuditYear, type AuditCategory } from "./event-audit";
import { formatFigure, formatOdds, formatP } from "./format";

/* Catalog-audit categories fill the seven sections (POC app.js cfAudit). */

/** The archive's view of the whole audit (POC #/cases?kind=audit). */
export const AUDIT_ARCHIVE_HREF = "/cases?kind=audit";

const TONES: Record<AuditCategory["verdict"], ReadingTone> = {
  artifact: "art",
  "no-trend": "no",
  trend: "yes",
  insufficient: "no",
};

const TOP_SOURCES = 4;

type AuditFacts = {
  category: AuditCategory;
  ctx: ReadingContext;
  last: number;
  tone: ReadingTone;
  question: string;
  sentence: string;
  isFactor: boolean;
};

function auditFacts(category: AuditCategory, ctx: ReadingContext): AuditFacts {
  return {
    category,
    ctx,
    last: lastAuditYear(category),
    tone: TONES[category.verdict],
    question: auditQuestion(category, ctx.translator),
    sentence: auditSentence(category, ctx.audit, ctx.translator),
    isFactor: category.verdict === "artifact" && Boolean(category.naiveFactor),
  };
}

function figure({ category, ctx, isFactor }: AuditFacts): { fig: string; note: string } {
  const { t, locale } = ctx.translator;
  if (isFactor)
    return { fig: `×${formatFigure(category.naiveFactor, 1)}`, note: t("cf.audit.fig.x") };
  if (category.trend && category.span) {
    return {
      fig: formatFigure(category.trend.perDecade, 1, true),
      note: t("cf.audit.fig.rate", { from: category.span[0], to: category.span[1] }),
    };
  }
  return {
    fig: category.total.toLocaleString(locale),
    note: t("cf.audit.fig.total", { from: ctx.audit.firstYear }),
  };
}

function answer(facts: AuditFacts): CaseReading["answer"] {
  const { category, ctx, tone } = facts;
  const { t, locale } = ctx.translator;
  const { fig, note } = figure(facts);
  const { step, trend, span } = category;
  return {
    tone,
    icon: tone === "art" ? "audit" : tone === "yes" ? "confirmed" : "inconclusive",
    word: t(`cf.word.audit.${category.verdict}`),
    plain: facts.sentence,
    fig,
    isSoft: category.verdict === "insufficient",
    figNote: note,
    exact: exactRows([
      {
        label: t("cf.x.records"),
        value: t("cf.x.records.v", {
          n: category.total.toLocaleString(locale),
          from: ctx.audit.firstYear,
        }),
      },
      step && {
        label: t("cf.x.step"),
        value: `${step.year} · p ${formatP(step.p)}${step.atBreak ? ` · ${t("cf.x.step.all")}` : ""}`,
      },
      trend &&
        span && {
          label: t("cf.x.span"),
          value: `${span[0]}–${span[1]} · Mann-Kendall p ${formatP(trend.p)} · Theil-Sen ${formatFigure(trend.perDecade, 2, true)} ${t("unit.decade")}`,
        },
    ]),
  };
}

function chart({ category, ctx, last }: AuditFacts): CaseReading["chart"] {
  const { t, locale } = ctx.translator;
  const cat = t(`cat.${category.id}`);
  return {
    plain: category.span
      ? `${t("cf.chart.audit")} ${t("cf.chart.audit.span")}`
      : t("cf.chart.audit"),
    visual: {
      kind: "bars",
      category,
      partialFrom: ctx.audit.lastCompleteYear + 1,
      label: t("audit.chart.aria", { cat, from: ctx.audit.firstYear, to: last }),
    },
    exact: [
      { label: t("cf.x.plot"), value: t("cf.plot.audit") },
      { label: t("cf.x.breaksAll"), value: ctx.audit.catalogBreaks.join(" · ") || "—" },
    ],
    table: {
      head: [t("tbl.year"), t("cf.d.records")],
      rows: category.years.map(([year, count]) => [String(year), count.toLocaleString(locale)]),
    },
    csvHref: `${caseFilePath(auditFileId(category))}/data`,
  };
}

function sure({ category, ctx, tone }: AuditFacts): CaseReading["sure"] {
  const { t } = ctx.translator;
  if (category.verdict === "insufficient" || (category.verdict !== "artifact" && !category.trend)) {
    return {
      level: "weak",
      tone: "no",
      word: t("cf.sure.audit.few"),
      plain: t("cf.audit.sure.few"),
      exact: [{ label: t("cf.x.rule"), value: t("cf.rule.audit.few") }],
    };
  }
  const years = category.breaks.map((item) => item.year).join(", ");
  const plain =
    category.verdict === "artifact"
      ? t(category.breaks.length === 1 ? "cf.audit.sure.break" : "cf.audit.sure.breaks", {
          n: category.breaks.length,
          years,
        })
      : t("case.sure.odds", { odds: formatOdds(category.trend?.p ?? 1, ctx.translator) });
  return {
    level: category.verdict === "no-trend" ? "weak" : "strong",
    tone,
    word: t(`cf.sure.audit.${category.verdict}`),
    plain,
    exact: [{ label: t("cf.x.rule"), value: t("cf.rule.audit") }],
  };
}

function why({ category, ctx }: AuditFacts): CaseReading["why"] {
  const { t } = ctx.translator;
  const hasBreaks = category.breaks.length > 0;
  return {
    title: t("cf.why.audit.title"),
    tag: t("cf.why.audit.tag"),
    plain: t(hasBreaks ? "cf.why.audit.plain" : "cf.why.audit.none"),
    breaks: category.breaks.map((item) => ({
      year: item.year,
      text: breakText(item, ctx.audit.sources, ctx.translator, "cf.entering"),
    })),
  };
}

function data({ category, ctx }: AuditFacts): CaseReading["data"] {
  const { t, locale } = ctx.translator;
  const sources = category.sources
    .slice(0, TOP_SOURCES)
    .map(([source, count]) => `${source} ${count.toLocaleString(locale)}`)
    .join(" · ");
  return {
    plain: t("cf.data.audit"),
    rows: [
      { label: t("cf.d.dataset"), value: t("cf.d.eonet", { from: ctx.audit.firstYear }) },
      { label: t("cf.d.sources"), value: sources },
      { label: t("case.d.version"), value: `events.json · ${ctx.audit.generated}` },
      { label: t("cf.d.code"), value: "portal/scripts/build_events.py" },
    ],
    orbit: [],
  };
}

/* An audit is about the catalog, not a place: the whole planet, and its yearly counts for a chart. */
function glance(facts: AuditFacts, level: CaseReading["sure"]["level"]): CaseReading["glance"] {
  const { category, ctx, last } = facts;
  const { translator } = ctx;
  const { t, locale } = translator;
  const from = ctx.audit.firstYear;
  const isArtifact = category.verdict === "artifact";
  const p = category.trend?.p;
  const test = {
    label: t("sheet.test"),
    value: isArtifact
      ? t("cf.glance.breaks", { n: category.breaks.length })
      : p === undefined
        ? t("verdict.insufficient")
        : `p ${formatP(p)}`,
    note: isArtifact
      ? t("cf.sheet.test.audit.note", {
          years: category.breaks.map((item) => item.year).join(", "),
        })
      : p === undefined
        ? t("cf.sheet.test.audit.none")
        : chanceNote(translator, p),
    ...(isArtifact || p === undefined ? {} : { checks: pChecks(translator, p) }),
  };
  const sheets = [
    {
      label: t("sheet.series"),
      value: t("cf.glance.records", { n: category.total.toLocaleString(locale) }),
      note: t("cf.sheet.series.audit.note", { from, to: last }),
    },
    test,
    { label: t("sheet.source"), value: "NASA EONET", note: t("cf.sheet.source.audit", { from }) },
  ];
  return {
    place: null,
    globe: { href: `/explore?events=${category.id}`, icon: "explore", label: t("audit.globe") },
    sheets: sheets.slice(0, SHEET_COUNT[level]),
    missing: missingNote(translator, level, "audit"),
    spark: { series: category.years, trend: null, direction: "flat", isLastMarked: false },
    verdict: level === "strong" ? "confirmed" : "inconclusive",
    verdictLabel: t(`verdict.${category.verdict}`),
    impact: t("cf.impact.audit"),
  };
}

function use({ category, ctx, last, question, sentence }: AuditFacts): CaseReading["use"] {
  const { t } = ctx.translator;
  const from = ctx.audit.firstYear;
  const years = category.breaks.map((item) => item.year).join(", ");
  return {
    quote: `${sentence} ${t("cf.quote.src.audit", { from, to: last })}`,
    cite: [
      t("cf.cite.audit", { q: question }),
      t("cf.cite.audit.data", { from, to: last }),
      t("case.cite.version", { file: "events.json", date: ctx.audit.generated }),
      caseFilePath(auditFileId(category)),
    ],
    think: [
      { q: t("cf.tq.audit1"), a: years ? t("cf.tq.audit1.yes", { years }) : t("cf.tq.audit1.no") },
      { q: t("cf.tq.audit2"), a: t("cf.tq.audit2.a") },
      { q: t("cf.tq.audit3"), a: t("cf.tq.audit3.a") },
    ],
    related: [
      { href: AUDIT_ARCHIVE_HREF, icon: "audit", label: t("cf.audit.all") },
      { href: `/explore?events=${category.id}`, icon: "explore", label: t("audit.globe") },
    ],
    isShareable: false,
  };
}

export function auditReading(category: AuditCategory, ctx: ReadingContext): CaseReading {
  const { t } = ctx.translator;
  const facts = auditFacts(category, ctx);
  const certainty = sure(facts);
  const categories = ctx.audit.categories;
  const next = categories[(categories.indexOf(category) + 1) % categories.length] ?? category;
  return {
    kind: "audit",
    path: caseFilePath(auditFileId(category)),
    crumb: {
      href: AUDIT_ARCHIVE_HREF,
      label: t("arch.kind.audit"),
      code: `EONET · ${category.id}`,
    },
    question: facts.question,
    chips: [
      { icon: "map-pin", text: t("cf.chip.planet") },
      { icon: "calendar", text: t("cf.chip.audit", { from: ctx.audit.firstYear, to: facts.last }) },
      { icon: "satellite", text: "NASA EONET" },
    ],
    glance: glance(facts, certainty.level),
    answer: answer(facts),
    chart: chart(facts),
    sure: certainty,
    notSay: [t("cf.audit.not.1"), t("cf.audit.not.2"), t("cf.audit.not.3")],
    why: why(facts),
    data: data(facts),
    use: use(facts),
    next: {
      href: caseFilePath(auditFileId(next)),
      title: auditQuestion(next, ctx.translator),
      meta: `EONET · ${t(`cat.${next.id}`)}`,
    },
  };
}
