import type { CSSProperties, ReactNode } from "react";
import type { Translator } from "@/shared/lib/i18n";
import { Icon } from "@/shared/ui/icon";
import { HEXALIS_CELL, HexalisMark } from "./hexalis-mark";

/*
 * The team page as one Hexalis stage: the organization's night (its brand-950 sky, the same in
 * both themes), its mark and honeycomb, and inside it the team itself. It reads top to bottom:
 * whose project this is, the people, what the portal does, and the way out to Hexalis.
 */

const HEXALIS_URL = "https://hexalis.org";

/* One cell of the comb is the free seat (dashed), one is lit, as in the mark. */
const FREE_SEAT = 13;
const LIT = 21;

/*
 * A point-up honeycomb in the identity's cell. Every cell waits by its distance from the lit
 * cell, so the comb assembles outward from it and the light ripples out from it (globals.css,
 * "Hexalis honeycomb").
 */
const cellAt = (index: number) => {
  const col = index % 8;
  const row = Math.floor(index / 8);
  return { x: col * 40 + (row % 2 ? 20 : 0), y: row * 35 };
};
const LIT_AT = cellAt(LIT);
const COMB = Array.from({ length: 8 * 5 }, (_, index) => {
  const { x, y } = cellAt(index);
  const steps = Math.hypot(x - LIT_AT.x, y - LIT_AT.y) / 40;
  const kind = index === LIT ? "hx-lit" : index === FREE_SEAT ? "hx-seat" : "hx-cell";
  return { key: index, x, y, kind, delay: `${Math.round(steps * 120)}ms` };
});

type HexalisStageProps = {
  translator: Translator;
  titleId: string;
  /** How many people are on the team. */
  count: number;
  /** The team list. */
  children: ReactNode;
};

export function HexalisStage({ translator: { t }, titleId, count, children }: HexalisStageProps) {
  return (
    <section
      aria-labelledby={titleId}
      className="group/hx shadow-raised medium:mt-8 medium:p-8 expanded:p-10 relative isolate mt-6 grid gap-8 overflow-hidden rounded-[28px] bg-[radial-gradient(110%_70%_at_0%_0%,#1A2B66,transparent_60%),linear-gradient(160deg,#0B1941,#06080F_75%)] p-5 text-white"
    >
      {/* The honeycomb fades in from the right, so the words sit on clear night. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 340 180"
        className="hx-comb pointer-events-none absolute -end-10 -top-6 -z-10 w-[min(640px,90%)] [mask-image:linear-gradient(90deg,transparent,#000_40%)] opacity-75 transition-[translate,opacity] duration-1000 ease-out group-hover/hx:-translate-x-3 group-hover/hx:opacity-100 motion-reduce:transition-none"
      >
        {COMB.map((cell) => (
          <g key={cell.key} transform={`translate(${cell.x} ${cell.y})`}>
            <g className={cell.kind} style={{ "--d": cell.delay } as CSSProperties}>
              <path d={HEXALIS_CELL} transform="scale(0.34)" />
            </g>
          </g>
        ))}
      </svg>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -start-24 -top-28 -z-10 size-96 rounded-full bg-[radial-gradient(circle,rgb(122_159_235/0.28),transparent_70%)] blur-2xl"
      />

      <header className="grid max-w-[40ch] gap-3">
        <p className="text-overline flex items-center gap-2.5 text-[#A6AEC4]">
          <HexalisMark gradientId="hexalis-kicker" className="size-7 shrink-0" />
          {t("team.hexalis.kicker")}
        </p>
        <h1 id={titleId} className="text-display-s font-display text-balance">
          {t("team.hexalis.title")}
        </h1>
      </header>

      <div className="grid gap-4">
        <h2 id="team-members" className="flex items-center gap-3">
          <span className="text-heading-h4">{t("team.title")}</span>
          <span className="text-label-s rounded-full bg-white/10 px-2.5 py-0.5 font-mono text-[#C9D3F2]">
            {count === 1 ? t("team.count1") : t("team.count", { n: count })}
          </span>
        </h2>
        {children}
      </div>

      <footer className="medium:flex-row medium:items-end medium:justify-between flex flex-col gap-6 border-t border-white/10 pt-6">
        <p className="text-body-l font-reading max-w-[58ch] text-white/80">{t("team.lead2")}</p>
        <div className="medium:justify-items-end grid shrink-0 justify-items-start gap-2">
          <a
            href={HEXALIS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group/cta text-label-l focus-visible:focus-ring focus-visible:outline-focus-ring inline-flex min-h-12 items-center gap-2.5 rounded-full bg-white py-1.5 ps-1.5 pe-5 font-semibold text-[#0B1941] no-underline shadow-[0_8px_24px_rgb(64_100_198/0.35)] transition-[box-shadow,gap] duration-200 hover:gap-3.5 hover:shadow-[0_10px_32px_rgb(122_159_235/0.5)] motion-reduce:transition-none"
          >
            <span className="grid size-9 place-items-center rounded-full bg-[#0B1941]">
              <HexalisMark gradientId="hexalis-cta" className="size-6" />
            </span>
            {t("team.hexalis.cta")}
            <span className="flex transition-[translate] duration-200 group-hover/cta:translate-x-0.5">
              <Icon name="arrow-right" />
            </span>
            <span className="sr-only"> {t("link.newTab")}</span>
          </a>
          <span className="text-label-s font-mono text-white/55">
            hexalis.org · {t("team.hexalis.d")}
          </span>
        </div>
      </footer>
    </section>
  );
}
