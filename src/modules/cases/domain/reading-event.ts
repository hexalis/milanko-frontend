import { EVENT_UNITS, rankCount, type EventFile, type EventVariable } from "./case-file";
import { fileGlance } from "./case-glance";
import { nextFile } from "./case-links";
import {
  capFirst,
  caseFilePath,
  gibsImageUrl,
  type CaseReading,
  type ReadingContext,
} from "./case-reading";
import { eonetSourceName } from "./eonet-sources";
import { auditSentence } from "./audit-text";
import { auditFileId } from "./event-audit";
import { eventNoun, eventSaid } from "./event-wording";
import { fileTitle } from "./file-text";
import { formatCoordinates, formatDate, formatFigure } from "./format";
import { anomalyStrips, eventWindow, eventYear } from "./readout";

/* Anomaly files fill the seven sections (POC app.js cfEvent). */

const POWER_DAILY = "T2M_MAX, PRECTOTCORR, GWETROOT";
const EONET_EVENTS = "https://eonet.gsfc.nasa.gov/api/v3/events/";

type EventFacts = {
  file: EventFile;
  ctx: ReadingContext;
  days: number;
  window: { start: string; end: string };
  year: number;
  keys: EventVariable[];
  question: string;
  sentence: string;
  sourceName: string;
  tone: "no" | "anom";
};

const withUnit = (value: number, variable: EventVariable): string => {
  const { unit, digits } = EVENT_UNITS[variable];
  return `${formatFigure(value, digits)} ${unit}`.trim();
};

const variableName = (variable: EventVariable, ctx: ReadingContext) =>
  ctx.translator.t(`pt.recent.${variable}`);

function eventFacts(file: EventFile, ctx: ReadingContext): EventFacts {
  const { t } = ctx.translator;
  const days = ctx.catalog.eventWindowDays;
  const others = (Object.keys(file.vars) as EventVariable[]).filter((key) => key !== file.lead);
  return {
    file,
    ctx,
    days,
    window: eventWindow(file, days),
    year: eventYear(file),
    keys: [file.lead, ...others],
    question: t("ev.q", { days, event: eventNoun(file, ctx) }).replace(" de el ", " del "),
    sentence: t("cf.ev.s", { days, what: eventSaid(file.lead, file.lv, ctx.translator) }),
    sourceName: file.source ? eonetSourceName(file.source.id) : "—",
    tone: file.strength === "weak" ? "no" : "anom",
  };
}

function answer({
  file,
  ctx,
  days,
  window,
  year,
  sentence,
  tone,
}: EventFacts): CaseReading["answer"] {
  const { t } = ctx.translator;
  const reading = file.lv;
  return {
    tone,
    icon: tone === "no" ? "inconclusive" : "warning",
    word: t(`cf.word.ev.${file.strength}`),
    plain: sentence,
    fig: withUnit(reading.value, file.lead),
    figIcon: file.lead === "tmax" ? "heat" : file.lead,
    isSoft: false,
    figNote: t("ev.fig", {
      v: variableName(file.lead, ctx),
      days,
      usual: withUnit(reading.mean, file.lead),
    }),
    exact: [
      {
        label: t("cf.x.year"),
        value: `z = ${formatFigure(reading.z, 2, true)} · ${t("gloss.pct")} ${reading.percentile} · ${t("ev.rank", { r: reading.rank, n: reading.years })}`,
      },
      {
        label: t("cf.x.window"),
        value: `${window.start} → ${window.end} (${t("ev.window.days", { n: days })})`,
      },
      { label: t("cf.x.base"), value: `${reading.from}–${year - 1} · n = ${reading.years - 1}` },
    ],
  };
}

function chart({ file, ctx, days, year, keys }: EventFacts): CaseReading["chart"] {
  const { t } = ctx.translator;
  const byKey = new Map(anomalyStrips(file).map((strip) => [strip.variable, strip]));
  const strips = keys.flatMap((key) => {
    const strip = byKey.get(key);
    return strip
      ? [
          {
            ...strip,
            name: variableName(key, ctx),
            said: eventSaid(key, strip.reading, ctx.translator),
          },
        ]
      : [];
  });
  return {
    plain: t("cf.chart.ev"),
    visual: { kind: "strips", year, strips },
    exact: [
      { label: t("cf.x.plot"), value: t("cf.plot.ev", { days }) },
      { label: t("cf.x.source"), value: `NASA POWER ${t("src.daily")} · ${POWER_DAILY}` },
    ],
    table: {
      head: [
        t("tbl.year"),
        ...keys.map((key) => {
          const unit = EVENT_UNITS[key].unit;
          return `${variableName(key, ctx)}${unit ? ` (${unit})` : ""}`;
        }),
      ],
      rows: file.lv.series.map(([seriesYear]) => [
        String(seriesYear),
        ...keys.map((key) => {
          const point = file.vars[key]?.series.find(([y]) => y === seriesYear);
          return point ? formatFigure(point[1], EVENT_UNITS[key].digits) : "—";
        }),
      ]),
    },
    csvHref: `${caseFilePath(file.id)}/data`,
  };
}

function sure({ file, ctx, tone }: EventFacts): CaseReading["sure"] {
  const { t } = ctx.translator;
  const count = rankCount(file.lv);
  const beyond = count.isHigh ? file.lv.rank - 1 : file.lv.years - file.lv.rank;
  const isRecord = count.isTop || count.isBottom;
  return {
    level: file.strength,
    tone,
    word: t(`unusual.${file.strength}`),
    plain: isRecord
      ? t("cf.sure.ev.rec", { n: count.n, from: file.lv.from })
      : t(beyond === 1 ? "cf.sure.ev.one" : "cf.sure.ev.many", { m: beyond, n: count.n }),
    exact: [
      { label: t("cf.x.rule"), value: t("cf.rule.ev") },
      { label: t("cf.x.note"), value: t("cf.note.ev") },
    ],
  };
}

const magnitudeUnit = (unit: string, { t, has }: ReadingContext["translator"]) =>
  has(`evunit.${unit}`) ? t(`evunit.${unit}`) : unit;

function data({ file, ctx, window, sourceName }: EventFacts): CaseReading["data"] {
  const { t, locale } = ctx.translator;
  const coords = formatCoordinates(file.lat, file.lon);
  const magnitude =
    file.magnitude === null || file.magnitude === undefined
      ? []
      : [
          {
            label: t("ev.peak"),
            value:
              `${file.magnitude.toLocaleString(locale)} ${magnitudeUnit(file.unit ?? "", ctx.translator)}`.trim(),
          },
        ];
  return {
    plain: t("cf.data.ev", { src: sourceName }),
    rows: [
      {
        label: t("cf.d.event"),
        value: `${file.eonet} · ${file.title}`,
        href: file.link ?? `${EONET_EVENTS}${file.eonet}`,
      },
      { label: t("cf.d.reported"), value: sourceName, href: file.source?.url || undefined },
      { label: t("case.d.point"), value: coords },
      { label: t("cf.x.window"), value: `${window.start} → ${window.end}` },
      {
        label: t("ev.closed"),
        value: file.closed ? formatDate(file.closed.slice(0, 10), locale) : t("ev.open"),
      },
      ...magnitude,
      {
        label: t("cf.d.weather"),
        value: `NASA POWER ${t("src.daily")} · ${POWER_DAILY} · ${t("case.d.res.power")}`,
      },
      { label: t("case.d.version"), value: `event-files.json · ${ctx.catalog.eventsGenerated}` },
      { label: t("cf.d.code"), value: "portal/scripts/build_event_files.py" },
    ],
    orbit: [
      {
        date: file.date,
        src: gibsImageUrl(file.lat, file.lon, file.date),
        alt: t("pt.orbit.alt", { coords, date: formatDate(file.date, locale) }),
      },
    ],
  };
}

function use(facts: EventFacts): CaseReading["use"] {
  const { file, ctx, days, window, keys, sentence, sourceName } = facts;
  const { t } = ctx.translator;
  const region = t(`reg.${file.region}`);
  return {
    quote: `${sentence} ${t("ev.quote.src", { cat: file.catalog })}`,
    cite: [
      t("case.cite.line1", { q: facts.question, cat: file.catalog }),
      t("ev.cite.event", { id: file.eonet, src: sourceName, date: file.date }),
      t("ev.cite.data", {
        days,
        start: window.start,
        end: window.end,
        coords: formatCoordinates(file.lat, file.lon),
      }),
      t("case.cite.version", { file: "event-files.json", date: ctx.catalog.eventsGenerated }),
      caseFilePath(file.id),
    ],
    think: [
      { q: t("cf.tq.ev1"), a: `${capFirst(eventSaid(file.lead, file.lv, ctx.translator))}.` },
      {
        q: t("ev.tq2"),
        a: keys
          .slice(1)
          .flatMap((key) => {
            const reading = file.vars[key];
            return reading
              ? [`${variableName(key, ctx)}: ${eventSaid(key, reading, ctx.translator)}.`]
              : [];
          })
          .join(" "),
      },
      { q: t("ev.tq3"), a: t("ev.tq3.a") },
    ],
    related: [
      globeLink(file, ctx),
      { href: `/cases?region=${file.region}`, icon: "cases", label: t("case.sector", { region }) },
    ],
    isShareable: true,
  };
}

function globeLink(file: EventFile, ctx: ReadingContext): CaseReading["glance"]["globe"] {
  return {
    href: `/explore?case=${file.id}&region=${file.region}&events=${file.category}&year=${eventYear(file)}`,
    icon: "explore",
    label: ctx.translator.t("case.globe"),
  };
}

function why({ file, ctx }: EventFacts): CaseReading["why"] {
  const { t } = ctx.translator;
  const category = ctx.audit.categories.find((candidate) => candidate.id === file.category);
  if (!category) return null;
  return {
    title: t("ev.audit.h"),
    tag: t("cf.why.ev.tag"),
    plain: auditSentence(category, ctx.audit, ctx.translator),
    link: {
      href: caseFilePath(auditFileId(category)),
      label: t("cf.audit.open", { cat: t(`cat.${category.id}`).toLowerCase() }),
    },
  };
}

export function eventReading(file: EventFile, ctx: ReadingContext): CaseReading {
  const { t, locale } = ctx.translator;
  const facts = eventFacts(file, ctx);
  const next = nextFile(file, ctx.catalog);
  const nextMeta = next.kind === "event" ? `${t(`cat.${next.category}`)} · ` : "";
  return {
    kind: "event",
    path: caseFilePath(file.id),
    crumb: { href: "/cases?topic=disasters", label: t("arch.kind.event"), code: file.catalog },
    question: facts.question,
    chips: [
      {
        icon: "map-pin",
        text: `${t(`reg.${file.region}`)} · ${formatCoordinates(file.lat, file.lon)}`,
      },
      { icon: "calendar", text: t("cf.chip.first", { date: formatDate(file.date, locale) }) },
      { icon: "satellite", text: "NASA EONET · NASA POWER" },
    ],
    glance: fileGlance(file, ctx, globeLink(file, ctx)),
    answer: answer(facts),
    chart: chart(facts),
    sure: sure(facts),
    notSay: [t("ev.not.cause"), t("ev.not.trend"), t("ev.chance")],
    why: why(facts),
    data: data(facts),
    use: use(facts),
    next: {
      href: caseFilePath(next.id),
      title: fileTitle(next, ctx),
      meta: `${next.catalog} · ${nextMeta}${t(`reg.${next.region}`)}`,
    },
  };
}
