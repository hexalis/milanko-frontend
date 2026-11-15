import type { Translator } from "@/shared/lib/i18n";

/*
 * "Three words to read everything" (POC ask.js renderHome .hm-key): trend, anomaly and event, each
 * with a drawn glyph (HOME_GLYPH) that shows what to look at. The glyphs are not data.
 */

type KeyWord = "trend" | "anom" | "event";

const WORDS: readonly { key: KeyWord; tone: string; tint: string }[] = [
  { key: "trend", tone: "text-feedback-success-fg", tint: "bg-surface-tone-3" },
  { key: "anom", tone: "text-feedback-warning-fg", tint: "bg-feedback-warning-bg" },
  { key: "event", tone: "text-feedback-ai-fg", tint: "bg-surface-tone-5" },
];

const LINE = "fill-none stroke-current stroke-[2.5] [stroke-linecap:round] [stroke-linejoin:round]";
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
            className={LINE}
            points="24,84 50,80 76,86 102,72 128,74 154,58 180,54 206,34"
          />
          <circle cx="206" cy="34" r="5" className="fill-current" />
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
          <polyline className={LINE} points="140,68 160,66 176,20 192,66 216,68" />
          <circle cx="176" cy="20" r="5" className="fill-current" />
        </>
      ) : null}
      {word === "event" ? (
        <>
          <line x1="20" x2="220" y1="96" y2="96" className={BASE} />
          <ellipse cx="120" cy="90" rx="16" ry="4" className="fill-current opacity-20" />
          <path
            d="M120 18c-15 0-26 11-26 25 0 19 26 43 26 43s26-24 26-43c0-14-11-25-26-25z"
            className="fill-current"
          />
          <circle cx="120" cy="43" r="9" className="fill-bg-surface" />
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
      className="py-12 @2xl/home:py-18"
    >
      <h2
        id="home-key-title"
        className="m-0 text-[clamp(28px,3vw,36px)] leading-[1.1] font-bold text-balance"
      >
        {t("home2.key.t")}
      </h2>
      <p className="font-reading text-text-secondary m-0 mt-2 max-w-[52ch] text-[18px] leading-[1.55] text-pretty">
        {t("home2.key.d")}
      </p>
      <dl className="m-0 mt-7 grid grid-cols-1 gap-7 @3xl/home:grid-cols-3 @3xl/home:gap-8">
        {WORDS.map(({ key, tone, tint }) => (
          <div
            key={key}
            className={`grid grid-cols-[112px_1fr] content-start gap-x-4 gap-y-1 @2xl/home:grid-cols-[180px_1fr] @2xl/home:gap-x-5 @3xl/home:grid-cols-1 @3xl/home:gap-3 ${tone}`}
          >
            {/* A <dl> group holds only <dt> and <dd>: the glyph sits in the term, which lays out as
                two grid items (display: contents) so the card keeps its shape. */}
            <dt className="contents">
              <span className="bg-bg-surface shadow-card row-span-2 block max-w-[300px] self-start rounded-[16px] p-1.5 @3xl/home:row-span-1">
                <span className={`block overflow-hidden rounded-[10px] ${tint}`}>
                  <Glyph word={key} label={t(`home2.key.${key}.x`)} />
                </span>
              </span>
              <span className="text-[20px] font-semibold tracking-[-0.01em] @2xl/home:text-[22px] @3xl/home:mt-1.5">
                {t(`home2.key.${key}`)}
              </span>
            </dt>
            <dd className="text-text-secondary m-0 max-w-[34ch]">
              {t(`home2.key.${key}.d`)}
              <span className="font-reading text-text-primary mt-1.5 block text-[17px] leading-normal">
                {t(`home2.key.${key}.q`)}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
