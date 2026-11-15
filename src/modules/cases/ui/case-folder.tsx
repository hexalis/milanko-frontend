import Link from "next/link";
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
import { EvidenceMeter } from "./evidence-meter";
import { Sparkline } from "./sparkline";
import { VerdictStamp } from "./verdict-stamp";

/*
 * A case file drawn as a folder (POC app.js folder(), DESIGN.md "case-folder"): a tab with the
 * catalog number cut from the back panel, and a front cover in the theme's tone. The POC's sheets
 * of paper rising on hover are left out; the folder only lifts, and not under reduced motion.
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
    root: [
      "group/folder relative isolate flex h-full flex-col pt-7",
      "transition-transform duration-fast ease-standard",
      "hover:-translate-y-1 focus-within:-translate-y-1",
      "motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:focus-within:translate-y-0",
    ].join(" "),
    tab: "absolute top-0 left-0 h-7 rounded-t-[14px] px-4 font-mono text-[13px] leading-7 font-semibold text-text-primary",
    back: "flex flex-1 flex-col rounded-tr-[22px] rounded-b-[22px] px-1.5 pt-2.5 pb-2",
    cover: [
      "flex flex-1 flex-col gap-3 rounded-[22px] p-5 text-text-primary",
      "transition-shadow duration-fast ease-standard group-hover/folder:shadow-raised group-focus-within/folder:shadow-raised",
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

const TITLE_LINK = [
  "text-text-primary no-underline outline-none",
  "group-hover/folder:underline group-hover/folder:decoration-2 group-hover/folder:underline-offset-4",
  // The link stretches over the whole folder; its focus ring is drawn on that stretched layer.
  "after:absolute after:inset-0 after:z-10 after:rounded-[22px] after:content-['']",
  "focus-visible:after:focus-ring focus-visible:after:outline-focus-ring",
].join(" ");

const DIRECTION_TEXT: Record<Direction, string> = {
  up: "text-trend-up",
  down: "text-trend-down",
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

  return (
    <article className={slots.root()}>
      <span className={slots.tab()}>{file.catalog}</span>
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
          <Sparkline
            id={`folder-${file.id}`}
            series={series}
            trend={isEvent(file) ? null : file.t}
            direction={direction}
            isLastMarked={isAnomaly}
          />
        </div>
      </div>
    </article>
  );
}
