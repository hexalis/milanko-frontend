import type { Translator } from "@/shared/lib/i18n";

/*
 * "Three words to read everything" (POC ask.js renderHome .hm-key): trend, anomaly and event, each
 * a card in its own tone with a drawn glyph (HOME_GLYPH) that shows what to look at, and the kind
 * of question it answers. The glyphs draw themselves as they scroll into view (globals.css "Home
 * sky"); they are not data.
 */

type KeyWord = "trend" | "anom" | "event";

const WORDS: readonly { key: KeyWord; tone: string; tint: string }[] = [
  { key: "trend", tone: "text-feedback-success-fg", tint: "bg-surface-tone-3" },
  { key: "anom", tone: "text-feedback-warning-fg", tint: "bg-feedback-warning-bg" },
  { key: "event", tone: "text-feedback-ai-fg", tint: "bg-surface-tone-5" },
];

const LINE =
  "draw-on-view fill-none stroke-current stroke-[2.5] [stroke-linecap:round] [stroke-linejoin:round]";
const BASE = "stroke-current opacity-30";

function Label({ text }: { text: string }) {
  return (
    <text
      x="220"
      y="112"
      textAnchor="end"
      className="fill-current font-sans text-[12px] font-semibold"
    >
      {text}
    </text>
  );
}

function Glyph({ word, label }: { word: KeyWord; label: string }) {
  return (
    <svg viewBox="0 0 240 120" aria-hidden="true" focusable="false" className="block h-auto w-full">
      {word === "trend" ? (
        <>
          <line x1="20" x2="220" y1="96" y2="96" className={BASE} />
          <polyline
            pathLength={1}
            className={LINE}
            points="24,84 50,80 76,86 102,72 128,74 154,58 180,54 206,34"
          />
          <circle cx="206" cy="34" r="5" className="pop-on-view fill-current" />
        </>
      ) : null}
      {word === "anom" ? (
        <>
          <rect
            x="20"
            y="52"
            width="200"
            height="30"
            rx="4"
            className="fill-bg-surface opacity-75"
          />
          <polyline
            points="24,70 54,62 84,72 114,64 140,68"
            className="stroke-text-secondary fill-none stroke-2 opacity-45 [stroke-linecap:round] [stroke-linejoin:round]"
          />
          <polyline pathLength={1} className={LINE} points="140,68 160,66 176,20 192,66 216,68" />
          <circle cx="176" cy="20" r="5" className="pop-on-view fill-current" />
        </>
      ) : null}
      {word === "event" ? (
        <>
          <line x1="20" x2="220" y1="96" y2="96" className={BASE} />
          <ellipse cx="120" cy="90" rx="16" ry="4" className="fill-current opacity-20" />
          <g className="pop-on-view">
            <path
              d="M120 18c-15 0-26 11-26 25 0 19 26 43 26 43s26-24 26-43c0-14-11-25-26-25z"
              className="fill-current"
            />
            <circle cx="120" cy="43" r="9" className="fill-bg-surface" />
          </g>
        </>
      ) : null}
      <Label text={label} />
    </svg>
  );
}

export function HomeKey({ translator }: { translator: Translator }) {
  const { t } = translator;
  return (
    <section
      aria-labelledby="home-key-title"
      data-tour="home-key"
      className="py-14 @2xl/home:py-20"
    >
      <div className="grid gap-x-10 gap-y-2 @3xl/home:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] @3xl/home:items-end">
        <h2
          id="home-key-title"
          className="m-0 text-[clamp(30px,3.4vw,42px)] leading-[1.06] font-bold tracking-[-0.025em] text-balance"
        >
          {t("home2.key.t")}
        </h2>
        <p className="font-reading text-text-secondary m-0 max-w-[46ch] text-[18px] leading-[1.55] text-pretty @3xl/home:justify-self-end @3xl/home:text-end">
          {t("home2.key.d")}
        </p>
      </div>
      <dl className="m-0 mt-8 grid grid-cols-1 gap-5 @3xl/home:grid-cols-3">
        {WORDS.map(({ key, tone, tint }) => (
          <div
            key={key}
            className={`bg-bg-surface shadow-card outline-border-subtle relative grid grid-cols-[112px_1fr] content-start gap-x-4 gap-y-1 overflow-hidden rounded-[20px] p-1.5 pe-4 outline-1 -outline-offset-1 before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-current @2xl/home:grid-cols-[200px_1fr] @2xl/home:gap-x-6 @3xl/home:grid-cols-1 @3xl/home:gap-0 @3xl/home:pe-1.5 ${tone}`}
          >
            {/* A <dl> group holds only <dt> and <dd>: the glyph sits in the term, which lays out as
                two grid items (display: contents) so the card keeps its shape. */}
            <dt className="contents">
              <span
                className={`row-span-2 mt-1.5 block self-start overflow-hidden rounded-[14px] @3xl/home:row-span-1 ${tint}`}
              >
                <Glyph word={key} label={t(`home2.key.${key}.x`)} />
              </span>
              <span className="mt-4 flex items-center gap-2 text-[22px] font-semibold tracking-[-0.015em] @2xl/home:text-[24px] @3xl/home:px-3.5 @3xl/home:pt-1">
                {t(`home2.key.${key}`)}
              </span>
            </dt>
            <dd className="text-text-secondary m-0 pb-4 @3xl/home:px-3.5 @3xl/home:pb-5">
              {t(`home2.key.${key}.d`)}
              <span className="font-reading text-text-primary mt-3 block border-s-2 border-current/40 ps-3 text-[17px] leading-normal text-pretty italic">
                {t(`home2.key.${key}.q`)}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
