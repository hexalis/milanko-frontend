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
import { fileSheets } from "../domain/case-glance";
import type { CaseCatalog } from "../domain/catalog";
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
import { formatDate } from "../domain/format";
import { PaperSheet } from "./case-paper";
import { EvidenceMeter } from "./evidence-meter";
import { Sparkline } from "./sparkline";
import { FolderLink } from "./folder-link";
import { VerdictStamp } from "./verdict-stamp";

/*
 * A case file drawn as a folder (POC app.js folder(), DESIGN.md "case-folder"): a tab with the
 * catalog number cut from the back panel, sheets of paper behind a front cover in the theme's tone.
 * On hover or focus the sheets rise out of the folder, one page per level of evidence, each on its
 * own paper (PaperSheet): 01 the series on graph paper, 02 the test on a ruled pad, 03 the source
 * on an index card. Touch screens have no hover: there the folders stay shut (a shelf of open
 * folders was a long scroll of paper), and a tap lets the sheets out on the way to the file. Under
 * reduced motion they snap instead of rising.
 * Clicking it lets the sheets out and brings them to the middle of the screen on the way to the
 * file (FolderLink, folder-open.css).
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

/*
 * A sheet is a whole page (PaperSheet) standing in the folder behind the cover, so only its head
 * shows above the cover's edge. Opening: a 60ms beat (a cursor crossing the shelf does not open
 * every folder), then each page rises in turn, 24px apart so every folio shows. Closing: the back
 * pages drop first, quicker, easing in.
 */
const SHEET = [
  "pp-shadow absolute inset-x-0 top-0 mx-auto block aspect-[10/13] w-full max-w-[340px]",
  "translate-y-[calc(-2px-var(--i)*2px)]",
  "transition-[translate,rotate] duration-[180ms] ease-in delay-[calc((var(--n)-1-var(--i))*25ms)]",
  "group-hover/folder:translate-y-[calc(-50px-var(--i)*24px)] group-hover/folder:rotate-(--r)",
  "group-hover/folder:duration-[420ms] group-hover/folder:ease-[cubic-bezier(0.34,1.4,0.64,1)]",
  "group-hover/folder:delay-[calc(60ms+var(--i)*40ms)]",
  "group-focus-within/folder:translate-y-[calc(-50px-var(--i)*24px)] group-focus-within/folder:rotate-(--r)",
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
  const pages = fileSheets(file, translator, catalog);
  const isInconclusive = verdictOf(file) === "inconclusive";

  return (
    <article data-folder className={slots.root()}>
      <span className={slots.tab()}>{file.catalog}</span>
      <span
        aria-hidden="true"
        data-sheets
        className="pp-tray pointer-events-none absolute inset-x-3.5 top-[26px] bottom-2 z-[1]"
      >
        {pages.map((page, index) => (
          <span
            key={page.label}
            data-sheet
            className={SHEET}
            style={
              {
                "--i": index,
                "--n": pages.length,
                "--r": `${((index % 2 ? 1 : -1) * (0.3 + index * 0.25)).toFixed(2)}deg`,
                zIndex: pages.length - index,
              } as CSSProperties
            }
          >
            <PaperSheet
              sheet={page}
              index={index}
              count={pages.length}
              code={file.catalog}
              isInconclusive={isInconclusive}
              translator={translator}
              chart={
                index === 0 ? (
                  <Sparkline
                    id={`folder-${file.id}`}
                    series={series}
                    trend={isEvent(file) ? null : file.t}
                    direction={direction}
                    isLastMarked={isAnomaly}
                    isFilled
                  />
                ) : null
              }
            />
          </span>
        ))}
      </span>
      <div className={slots.back()}>
        <div data-folder-cover className={slots.cover()}>
          <p className="text-label-m text-text-secondary flex items-center gap-1.5">
            <Icon name={themeIcon} />
            {themeLabel(theme, context)}
          </p>
          <Heading className="text-heading-h4 font-display text-balance">
            <FolderLink
              href={`/cases/${file.id}`}
              className={TITLE_LINK}
              waitLabel={t("cf.opening")}
            >
              {fileTitle(file, context)}
            </FolderLink>
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
