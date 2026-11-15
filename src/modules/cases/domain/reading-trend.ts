import { period, relativeChange, trendDirection, type TrendCase } from "./case-file";
import { nextFile, pairFile } from "./case-links";
import {
  capFirst,
  caseFilePath,
  gibsImageUrl,
  orbitDate,
  type CaseReading,
  type ReadingContext,
} from "./case-reading";
import { fileName, rateLabel, trendText } from "./file-text";
import {
  formatCoordinates,
  formatDate,
  formatFigure,
  formatOdds,
  formatP,
  unitLabel,
  variableUnit,
} from "./format";

/* Trend files fill the seven sections (POC app.js cfTrend). */

/** The last year the satellite pictures look at (the POC capped "now" at 2025). */
const LAST_ORBIT_YEAR = 2025;
const FIRST_ORBIT_YEAR = 2001;

type TrendFacts = {
  file: TrendCase;
  ctx: ReadingContext;
  from: number;
  to: number;
  n: number;
  isConfirmed: boolean;
  isUp: boolean;
  unit: string;
  amount: string;
  rel: number | null;
  vThe: string;
  question: string;
  plain: string;
  dataset: string;
};

function trendFacts(file: TrendCase, ctx: ReadingContext): TrendFacts {
  const { t, locale } = ctx.translator;
  const { from, to } = period(file.series);
  const rel = relativeChange(file);
  const unit = unitLabel(file.unit, locale);
  const amount =
    rel === null
      ? `${formatFigure(Math.abs(file.t.total), file.digits)} ${unit}`.trim()
      : `${Math.abs(rel).toFixed(0)} %`;
  const isUp = file.t.total > 0;
  const isConfirmed = file.t.significant;
  const place = fileName(file, ctx);
  const vThe = t(`case.vthe.${file.variable}`);
  const verb = t(`case.verb.${isUp ? "up" : "down"}`);
  const plain = (
    isConfirmed
      ? t("case.a.yes", { V: capFirst(vThe), verb, amount, from, to })
      : t("case.a.no", { v: vThe, verb, verbpp: t(`case.verbpp.${isUp ? "up" : "down"}`) })
  ).replace(/<strong>.*?<\/strong>\s*/, "");
  const question = t("case.q", {
    v: vThe,
    place: place + (place.includes(",") ? "," : ""),
    from,
  });
  const dataset =
    file.source === "modis"
      ? "MODIS/Terra MOD13Q1 v061 (NDVI, 250 m) · ORNL DAAC"
      : `NASA POWER · ${file.variable} · MERRA-2`;
  return {
    file,
    ctx,
    from,
    to,
    n: file.series.length,
    isConfirmed,
    isUp,
    unit,
    amount,
    rel,
    vThe,
    question,
    plain,
    dataset,
  };
}

function answer(facts: TrendFacts): CaseReading["answer"] {
  const { file, ctx, n, isConfirmed, isUp, amount, rel, unit } = facts;
  const { t } = ctx.translator;
  const direction = isConfirmed ? trendDirection(file.t) : "flat";
  const digits = file.digits + 1;
  const note = t(rel === null ? "cf.fig.abs" : "cf.fig.rel", { n });
  const meanNote =
    rel === null
      ? ""
      : ` (${formatFigure(rel, 1, true)} % · ${t("cf.x.mean")} ${formatFigure(file.t.mean, digits)})`;
  return {
    tone: isConfirmed ? "yes" : "no",
    icon: isConfirmed ? "confirmed" : "inconclusive",
    word: t(isConfirmed ? "cf.word.yes" : "cf.word.no"),
    plain: facts.plain,
    fig: `${isUp ? "+" : "−"}${amount}`,
    figIcon: direction,
    figDirection: direction,
    isSoft: !isConfirmed,
    figNote: isConfirmed ? note : `${note} ${t("case.fig.unproven")}`,
    exact: [
      {
        label: t("cf.x.test"),
        value: `Mann-Kendall S = ${formatFigure(file.t.s, 0)} · Z = ${formatFigure(file.t.z, 2)} · τ = ${formatFigure(file.t.tau, 2)} · p ${formatP(file.t.p)} · n = ${n}`,
      },
      {
        label: t("cf.x.speed"),
        value: `Theil-Sen ${rateLabel(file, ctx)} ${t("unit.decade")} · ${t("cf.x.ci")} [${formatFigure(file.t.slopeLow * 10, digits, true)}, ${formatFigure(file.t.slopeHigh * 10, digits, true)}]`,
      },
      {
        label: t("cf.x.total"),
        value: `${formatFigure(file.t.total, digits, true)} ${unit}${meanNote}`,
      },
    ],
  };
}

function chart(facts: TrendFacts): CaseReading["chart"] {
  const { file, ctx, unit } = facts;
  const { t, locale } = ctx.translator;
  const metric = trendText(file, "metric", ctx);
  const columnUnit = variableUnit(file.unit, locale);
  const digits = file.digits + 1;
  return {
    plain: facts.isConfirmed
      ? t("cf.chart.trend")
      : `${t("cf.chart.trend")} ${t("cf.chart.unproven")}`,
    visual: { kind: "series", file, direction: trendDirection(file.t), label: facts.plain },
    exact: [
      {
        label: t("cf.x.plot"),
        value: unit && !metric.includes(unit) ? `${metric} · ${unit}` : metric,
      },
      { label: t("cf.x.source"), value: facts.dataset },
    ],
    table: {
      head: [
        t("tbl.year"),
        `${t(`var.${file.variable}`)}${columnUnit ? ` (${columnUnit})` : ""}`,
        t("case.chart.inline.trend"),
      ],
      rows: file.series.map(([year, value]) => [
        String(year),
        formatFigure(value, digits),
        formatFigure(file.t.intercept + file.t.slope * year, digits),
      ]),
    },
    csvHref: `${caseFilePath(file.id)}/data`,
  };
}

function sure({ file, ctx, isConfirmed }: TrendFacts): CaseReading["sure"] {
  const { t } = ctx.translator;
  return {
    level: file.t.strength,
    tone: isConfirmed ? "yes" : "no",
    word: t(`case.sure.${file.t.strength}`),
    plain: t("case.sure.odds", { odds: formatOdds(file.t.p, ctx.translator) }),
    exact: [
      // The POC wrote this rule as HTML ("p &lt; 0.01"); here it is plain text.
      { label: t("cf.x.rule"), value: t("cf.rule.trend").replaceAll("&lt;", "<") },
      {
        label: t("cf.x.case"),
        value: `p ${formatP(file.t.p)} · ${t("cf.x.snr")} ${file.t.snr.toFixed(1)}×`,
      },
    ],
  };
}

function data(facts: TrendFacts): CaseReading["data"] {
  const { file, ctx, from, to, n } = facts;
  const { t, locale } = ctx.translator;
  const coords = formatCoordinates(file.lat, file.lon);
  const orbit = [orbitDate(file, FIRST_ORBIT_YEAR), orbitDate(file, Math.min(LAST_ORBIT_YEAR, to))];
  return {
    plain: `${t(`case.vdef.${file.variable}`)} ${t(`cf.data.by.${file.source}`)}`,
    rows: [
      { label: t("cf.d.dataset"), value: facts.dataset },
      { label: t("case.d.point"), value: `${coords} · ${t(`case.d.res.${file.source}`)}` },
      { label: t("cf.d.period"), value: `${from}–${to} (n = ${n})` },
      { label: t("case.d.version"), value: `cases.json · ${ctx.catalog.generated}` },
      { label: t("cf.d.code"), value: "portal/scripts/build_cases.py · portal/stats.js" },
    ],
    orbit: orbit.map((date) => ({
      date,
      src: gibsImageUrl(file.lat, file.lon, date),
      alt: t("pt.orbit.alt", { coords, date: formatDate(date, locale) }),
    })),
  };
}

function think({ file, ctx, isUp, unit }: TrendFacts): CaseReading["use"]["think"] {
  const { t } = ctx.translator;
  const peak = file.series.reduce((best, point) =>
    (isUp ? point[1] > best[1] : point[1] < best[1]) ? point : best,
  );
  return [
    {
      q: t(`case.tq1.${isUp ? "up" : "down"}`),
      a: `${`${peak[0]}: ${formatFigure(peak[1], file.digits + 1)} ${unit}`.trim()}.`,
    },
    {
      q: t("case.tq2"),
      a: t(file.t.snr >= 1 ? "case.tq2.yes" : "case.tq2.no", { x: file.t.snr.toFixed(1) }),
    },
    { q: t("case.tq3"), a: t("case.tq3.a") },
  ];
}

function related({ file, ctx }: TrendFacts): CaseReading["use"]["related"] {
  const { t } = ctx.translator;
  const pair = pairFile(file, ctx.catalog);
  const region = t(`reg.${file.region}`);
  return [
    {
      href: `/explore?case=${file.id}&region=${file.region}`,
      icon: "explore",
      label: t("case.globe"),
    },
    ...(pair
      ? [
          {
            href: caseFilePath(pair.id),
            icon: "flat",
            label: `${t("case.pair")}: ${fileName(pair, ctx)}`,
          },
        ]
      : []),
    { href: `/cases?region=${file.region}`, icon: "cases", label: t("case.sector", { region }) },
  ];
}

function use(facts: TrendFacts): CaseReading["use"] {
  const { file, ctx, from, to } = facts;
  const { t } = ctx.translator;
  const said = facts.isConfirmed ? facts.plain : t("case.quote.no", { v: facts.vThe, from, to });
  return {
    quote: `${said} ${t(`case.quote.src.${file.source}`, { from, to, cat: file.catalog })}`,
    cite: [
      t("case.cite.line1", { q: facts.question, cat: file.catalog }),
      t("case.cite.data", {
        ds: facts.dataset,
        from,
        to,
        coords: formatCoordinates(file.lat, file.lon),
      }),
      t("case.cite.version", { file: "cases.json", date: ctx.catalog.generated }),
      caseFilePath(file.id),
    ],
    think: think(facts),
    related: related(facts),
    isShareable: true,
  };
}

export function trendReading(file: TrendCase, ctx: ReadingContext): CaseReading {
  const { t } = ctx.translator;
  const facts = trendFacts(file, ctx);
  const next = nextFile(file, ctx.catalog);
  const region = t(`reg.${file.region}`);
  return {
    kind: "trend",
    path: caseFilePath(file.id),
    crumb: { href: "/cases?kind=trend", label: t("arch.kind.trend"), code: file.catalog },
    question: facts.question,
    chips: [
      { icon: "map-pin", text: `${fileName(file, ctx)} · ${region}` },
      {
        icon: "calendar",
        text: t("cf.chip.years", { from: facts.from, to: facts.to, n: facts.n }),
      },
      { icon: "satellite", text: t(`cf.chip.src.${file.source}`) },
    ],
    answer: answer(facts),
    chart: chart(facts),
    sure: sure(facts),
    notSay: [
      ...(facts.isConfirmed ? [] : [t("case.not.nochange")]),
      t("case.not.why"),
      t("case.not.future"),
      t("case.not.place"),
    ],
    why: {
      title: t("case.why2"),
      tag: t("case.why.tag"),
      plain: trendText(file, "why", ctx),
      more: trendText(file, "limits", ctx),
      theme: file.theme,
    },
    data: data(facts),
    use: use(facts),
    next: {
      href: caseFilePath(next.id),
      title: next.kind === "trend" ? trendText(next, "title", ctx) : next.title,
      meta: `${next.catalog} · ${fileName(next, ctx)}`,
    },
  };
}
