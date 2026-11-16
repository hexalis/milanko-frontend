import Link from "next/link";
import type { CSSProperties } from "react";
import { tv } from "tailwind-variants";
import type { Translator } from "@/shared/lib/i18n";
import { Icon } from "@/shared/ui/icon";
import {
  fileDirection,
  fileSeries,
  fileStrength,
  fileTheme,
  isEvent,
  period,
  verdictOf,
  type CaseFile,
  type Direction,
  type EventFamily,
} from "../domain/case-file";
import type { CaseCatalog } from "../domain/catalog";
import type { Strength } from "../domain/trend-stats";
import {
  changeLabel,
  eventShort,
  eventTail,
  fileName,
  fileTitle,
  strengthWord,
  themeLabel,
  verdictLabel,
} from "../domain/file-text";
import { formatDate, formatFigure, formatP } from "../domain/format";
import { EvidenceMeter } from "./evidence-meter";
import { Sparkline } from "./sparkline";
import { VerdictStamp } from "./verdict-stamp";

/*
 * A case file drawn as a folder (POC app.js folder(), DESIGN.md "case-folder"): a tab with the
 * catalog number cut from the back panel, sheets of paper behind a front cover in the theme's tone.
 * On hover or focus the cover tips forward and the sheets rise out of the folder, one per level of
 * evidence: 01 the series (with its chart), 02 the test, 03 the source. Touch screens have no
 * hover, so there the sheets stay out; under reduced motion they snap instead of rising.
 */

type FolderTone = "rose" | "tide" | "sage" | "ice" | "stone";

const TREND_TONE: Record<string, FolderTone> = {
  temperature: "rose",
  water: "tide",
  vegetation: "sage",
};

const FAMILY_TONE: Record<EventFamily, FolderTone> = {
  fire: "rose",
  storm: "ice",
  water: "tide",
  ice: "ice",
  earth: "stone",
};

function folderTone(file: CaseFile): FolderTone {
  return isEvent(file) ? FAMILY_TONE[file.family] : (TREND_TONE[file.theme] ?? "tide");
}

const folder = tv({
  slots: {
    root: "group/folder relative isolate flex h-full flex-col pt-7",
    tab: "absolute top-0 left-0 h-7 rounded-t-[14px] px-4 font-mono text-[13px] leading-7 font-semibold text-text-primary",
    back: "flex flex-1 flex-col rounded-tr-[22px] rounded-b-[22px] px-1.5 pt-2.5 pb-2",
    cover: [
      // The cover stays put while the sheets rise: sliding it down pushed its edge out past the
      // folder's back, which read as a thick seam along the bottom.
      "relative z-[2] flex flex-1 flex-col gap-3 rounded-[22px] p-5 text-text-primary",
    ].join(" "),
  },
  variants: {
    tone: {
      rose: {
        tab: "bg-surface-tone-1-edge",
        back: "bg-surface-tone-1-edge",
        cover:
          "bg-surface-tone-1 shadow-[inset_0_3px_0_rgb(255_255_255/0.7),0_6px_0_var(--color-surface-tone-1-edge)]",
      },
      tide: {
        tab: "bg-surface-tone-2-edge",
        back: "bg-surface-tone-2-edge",
        cover:
          "bg-surface-tone-2 shadow-[inset_0_3px_0_rgb(255_255_255/0.7),0_6px_0_var(--color-surface-tone-2-edge)]",
      },
      sage: {
        tab: "bg-surface-tone-3-edge",
        back: "bg-surface-tone-3-edge",
        cover:
          "bg-surface-tone-3 shadow-[inset_0_3px_0_rgb(255_255_255/0.7),0_6px_0_var(--color-surface-tone-3-edge)]",
      },
      ice: {
        tab: "bg-surface-tone-4-edge",
        back: "bg-surface-tone-4-edge",
        cover:
          "bg-surface-tone-4 shadow-[inset_0_3px_0_rgb(255_255_255/0.7),0_6px_0_var(--color-surface-tone-4-edge)]",
      },
      stone: {
        tab: "bg-surface-tone-5-edge",
        back: "bg-surface-tone-5-edge",
        cover:
          "bg-surface-tone-5 shadow-[inset_0_3px_0_rgb(255_255_255/0.7),0_6px_0_var(--color-surface-tone-5-edge)]",
      },
    },
  },
});

/* One sheet per level of evidence (POC sheetsFor): weaker evidence carries fewer pages. */
const SHEETS: Record<Strength, number> = { strong: 3, moderate: 2, weak: 1 };

/*
 * A sheet rests just above the cover's edge. Opening: a 60ms beat (a cursor crossing the shelf
 * does not open every folder), then each sheet rises in turn, 24px apart so every header shows.
 * Closing: the back sheets drop first, quicker, easing in.
 */
const SHEET = [
  "absolute inset-0 flex flex-col gap-1 rounded-[14px] px-2.5 pt-1.5 pb-2",
  "translate-y-[calc(-2px-var(--i)*2px)]",
  "transition-[translate,rotate] duration-[180ms] ease-in delay-[calc((var(--n)-1-var(--i))*25ms)]",
  "group-hover/folder:translate-y-[calc(-50px-var(--i)*24px)] group-hover/folder:rotate-(--r)",
  "group-hover/folder:duration-[420ms] group-hover/folder:ease-[cubic-bezier(0.34,1.4,0.64,1)]",
  "group-hover/folder:delay-[calc(60ms+var(--i)*40ms)]",
  "group-focus-within/folder:translate-y-[calc(-50px-var(--i)*24px)] group-focus-within/folder:rotate-(--r)",
  "[@media(hover:none)]:translate-y-[calc(-50px-var(--i)*24px)] [@media(hover:none)]:rotate-(--r)",
].join(" ");

/*
 * Three kinds of paper, told apart with one quiet cue each so the stack stays calm in both themes:
 *  01 the series on graph paper: a faint grid under the chart;
 *  02 the test on a warm ruled pad: a hint of amber and soft lines below the heading;
 *  03 the source on a cool index card: a hint of green, nothing else.
 * Every sheet shares the raised surface, a hairline edge and a soft shadow; the folio's colour
 * names the paper. Lines start under the header, so the folio and its figure stay clean.
 */
const PAPER_EDGE =
  "border border-border-subtle shadow-[0_-1px_0_rgb(255_255_255/0.04)_inset,0_2px_8px_rgb(0_0_0/0.16)]";
const PAPER = [
  [
    PAPER_EDGE,
    "bg-bg-surface-raised",
    "bg-[repeating-linear-gradient(color-mix(in_oklab,var(--color-border-subtle)_60%,transparent)_0_1px,transparent_1px_10px),repeating-linear-gradient(90deg,color-mix(in_oklab,var(--color-border-subtle)_60%,transparent)_0_1px,transparent_1px_10px)]",
    "bg-size-[100%_100%] bg-position-[0_26px] bg-no-repeat",
  ].join(" "),
  [
    PAPER_EDGE,
    "[background-color:color-mix(in_oklab,var(--color-feedback-warning-bg)_30%,var(--color-bg-surface-raised))]",
    "bg-[repeating-linear-gradient(transparent_0_11px,color-mix(in_oklab,var(--color-feedback-warning-border)_45%,transparent)_11px_12px)]",
    "bg-size-[100%_100%] bg-position-[0_26px] bg-no-repeat",
  ].join(" "),
  [
    PAPER_EDGE,
    "[background-color:color-mix(in_oklab,var(--color-feedback-success-bg)_30%,var(--color-bg-surface-raised))]",
  ].join(" "),
] as const;

/* The folio of each paper in its tone. */
const PAPER_FOLIO = [
  "text-feedback-info-fg",
  "text-feedback-warning-fg",
  "text-feedback-success-fg",
] as const;

/* A sheet that cannot confirm its finding is drawn with a dashed edge (POC folder--inconclusive). */
const SHEET_INCONCLUSIVE = "outline-dashed outline-[1.5px] -outline-offset-[1.5px] outline-border-strong";

/* The header and chart fade in once the sheet is out, and stay readable on touch screens. */
const SHEET_FACE = [
  "opacity-0 transition-opacity duration-fast",
  "group-hover/folder:opacity-100 group-hover/folder:delay-[calc(160ms+var(--i)*40ms)]",
  "group-focus-within/folder:opacity-100 [@media(hover:none)]:opacity-100",
].join(" ");

const TITLE_LINK = [
  "text-text-primary no-underline outline-none",
  "group-hover/folder:underline group-hover/folder:decoration-2 group-hover/folder:underline-offset-4",
  // The link stretches over the whole folder; its focus ring is drawn on that stretched layer.
  "after:absolute after:inset-0 after:z-10 after:rounded-[22px] after:content-['']",
  "focus-visible:after:focus-ring focus-visible:after:outline-focus-ring",
].join(" ");

/* The trend colours are fills; on the tinted covers the text takes their AA foreground pair. */
const DIRECTION_TEXT: Record<Direction, string> = {
  up: "text-feedback-danger-fg",
  down: "text-feedback-info-fg",
  flat: "text-trend-neutral",
};

const HEADINGS = { h2: "h2", h3: "h3", h4: "h4" } as const;

type CaseFolderProps = {
  file: CaseFile;
  translator: Translator;
  catalog: CaseCatalog;
  /** Heading level of the title within the page; defaults to h3. */
  headingLevel?: keyof typeof HEADINGS;
  /** Rounded distance to the place the archive is searching near, in km. */
  km?: number;
};

/** A case file as a folder linking to its dossier at /cases/{id}. */
export function CaseFolder({
  file,
  translator,
  catalog,
  headingLevel = "h3",
  km,
}: CaseFolderProps) {
  const context = { translator, catalog };
  const { t } = translator;
  const isAnomaly = isEvent(file);
  const direction = fileDirection(file);
  const series = fileSeries(file);
  const { from, to } = period(series);
  const theme = fileTheme(file);
  const themeIcon = isEvent(file) ? `ev-${file.family}` : theme;
  const slots = folder({ tone: folderTone(file) });
  const Heading = HEADINGS[headingLevel];
  const count = SHEETS[fileStrength(file)];
  const sheetClass = verdictOf(file) === "inconclusive" ? `${SHEET} ${SHEET_INCONCLUSIVE}` : SHEET;
  const pages = [
    {
      label: isEvent(file) ? (
        <>
          <span className="@max-[280px]:hidden">
            {t("sheet.runup", { days: catalog.eventWindowDays })}
          </span>
          <span className="hidden @max-[280px]:inline">{t("sheet.runup.short")}</span>
        </>
      ) : (
        t("sheet.series")
      ),
      value: isEvent(file) ? eventShort(file.lv, context) : changeLabel(file, context),
    },
    {
      label: t("sheet.test"),
      value: isEvent(file)
        ? t("sheet.test.ev", { z: formatFigure(file.lv.z, 1, true), n: file.lv.years - 1 })
        : `p ${formatP(file.t.p)}`,
    },
    {
      label: t("sheet.source"),
      value: isEvent(file)
        ? "EONET · POWER"
        : file.source === "modis"
          ? "MODIS/Terra"
          : "NASA POWER",
    },
  ].slice(0, count);

  return (
    <article className={slots.root()}>
      <span className={slots.tab()}>{file.catalog}</span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-3.5 top-[26px] z-[1] h-24"
      >
        {pages.map((page, index) => (
          <span
            key={index}
            className={`${sheetClass} ${PAPER[index] ?? PAPER[0]}`}
            style={
              {
                "--i": index,
                "--n": count,
                "--r": `${((index % 2 ? 1 : -1) * (0.3 + index * 0.25)).toFixed(2)}deg`,
                zIndex: count - index,
              } as CSSProperties
            }
          >
            <span
              className={`${SHEET_FACE} border-border-subtle @container flex h-[22px] min-w-0 items-center gap-1.5 border-b pb-0.5`}
            >
              <b className={`text-label-s truncate ${PAPER_FOLIO[index] ?? PAPER_FOLIO[0]}`}>
                0{index + 1} · {page.label}
              </b>
              <span className="text-label-s text-text-primary ms-auto whitespace-nowrap tabular-nums">
                {page.value}
              </span>
              <span className="text-label-s text-text-tertiary border-border-subtle border-s ps-1.5 tabular-nums">
                {index + 1}/{count}
              </span>
            </span>
            {index === 0 ? (
              <span className={`${SHEET_FACE} block h-[34px]`}>
                <Sparkline
                  id={`folder-${file.id}`}
                  series={series}
                  trend={isEvent(file) ? null : file.t}
                  direction={direction}
                  isLastMarked={isAnomaly}
                  isFilled
                />
              </span>
            ) : null}
          </span>
        ))}
      </span>
      <div className={slots.back()}>
        <div className={slots.cover()}>
          <p className="text-label-m text-text-secondary flex items-center gap-1.5">
            <Icon name={themeIcon} />
            {themeLabel(theme, context)}
          </p>
          <Heading className="text-heading-h4 font-display text-balance">
            <Link href={`/cases/${file.id}`} className={TITLE_LINK}>
              {fileTitle(file, context)}
            </Link>
          </Heading>
          <p className="text-body-s text-text-secondary flex items-center gap-1.5">
            <Icon name="map-pin" />
            {isEvent(file)
              ? `${t(`reg.${file.region}`)} · ${formatDate(file.date, translator.locale)}`
              : `${fileName(file, context)} · ${t(`reg.${file.region}`)}`}
            {km === undefined ? null : (
              <span className="text-text-primary ms-auto ps-2 font-semibold whitespace-nowrap">
                {t("near.km", { km: km.toLocaleString(translator.locale) })}
              </span>
            )}
          </p>
          <dl className="border-border-subtle mt-auto grid grid-cols-2 gap-x-4 gap-y-2 border-t border-dashed pt-3">
            <div className="min-w-0">
              <dt className="text-overline text-text-tertiary truncate">
                {t(isAnomaly ? "ev.runup" : "arch.change")}
              </dt>
              <dd
                className={`text-label-l flex items-center gap-1 tabular-nums ${DIRECTION_TEXT[direction]}`}
              >
                <Icon name={direction} />
                {isEvent(file) ? eventShort(file.lv, context) : changeLabel(file, context)}
              </dd>
              <dd className="text-body-s text-text-secondary mt-0.5">
                {isEvent(file) ? eventTail(file, context) : t(`var.${file.variable}`)}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-overline text-text-tertiary truncate">
                {t(isAnomaly ? "arch.unusual" : "arch.evidence")}
              </dt>
              <dd className="mt-1">
                <EvidenceMeter strength={fileStrength(file)} word={strengthWord(file, context)} />
              </dd>
            </div>
          </dl>
          <div className="text-body-s text-text-secondary flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <span className="whitespace-nowrap">
              {t("arch.sheets", { n: series.length, from, to })}
            </span>
            <span className="ms-auto">
              <VerdictStamp verdict={verdictOf(file)} label={verdictLabel(file, context)} />
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
