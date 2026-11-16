import Link from "next/link";
import type { Translator } from "@/shared/lib/i18n";
import { Icon } from "@/shared/ui/icon";
import { DOOR_ART } from "./home-door-art";

/*
 * "What do you want to do today?" (POC ask.js renderHome .hm-doors): the question is the main door,
 * a deep blue panel with the eight steps it walks; pointing at it runs a light along the steps,
 * one after the other, as the walk will. The map, the case files and the method are the other
 * three. Each door carries data-st so pointing at it lights its station on the cover's ring.
 */

const STEP_ICONS = [
  "ask",
  "map-pin",
  "satellite",
  "sparkle",
  "chart",
  "audit",
  "confirmed",
  "download",
];

const DOORS = [
  {
    key: "map",
    icon: "explore",
    href: "/explore",
    tint: "bg-surface-tone-2",
    tone: "text-feedback-info-fg",
  },
  {
    key: "cases",
    icon: "cases",
    href: "/cases",
    tint: "bg-surface-tone-3",
    tone: "text-feedback-success-fg",
  },
  {
    key: "method",
    icon: "method",
    href: "/method",
    tint: "bg-surface-tone-5",
    tone: "text-feedback-ai-fg",
  },
] as const;

// The ask panel: brand blue deepening to the bottom right, a light from the top corner and a fine
// grid of dots, like graph paper under the walk.
const ASK_LIGHT = {
  backgroundImage: [
    "radial-gradient(60% 90% at 100% 0%, rgba(255, 255, 255, 0.2), transparent 60%)",
    "radial-gradient(rgba(255, 255, 255, 0.16) 1px, transparent 1.5px)",
    "linear-gradient(135deg, var(--hexalis-brand-600), var(--hexalis-brand-700) 70%, #24397a)",
  ].join(", "),
  backgroundSize: "auto, 18px 18px, auto",
};

const ASK = [
  "group/ask relative isolate overflow-hidden @2xl/home:grid-cols-[minmax(0,1fr)_auto] @2xl/home:px-10 @2xl/home:pt-10 @2xl/home:pb-8 mt-8 grid grid-cols-1 items-end gap-x-12 gap-y-7 rounded-[24px] p-6",
  "text-white shadow-[0_24px_48px_-24px_rgba(36,57,122,0.75)] no-underline transition-[translate,box-shadow,scale] duration-[260ms] ease-enter",
  "hover:-translate-y-0.5 hover:shadow-[0_30px_60px_-24px_rgba(36,57,122,0.9)] active:scale-[0.99] motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100",
  "focus-visible:focus-ring focus-visible:outline-focus-ring",
].join(" ");

// The rail under the steps, and the light that runs along it while the door is pointed at.
const RAIL = [
  "relative -order-1 col-span-full m-0 grid list-none grid-cols-8 border-white/20 p-0 @2xl/home:order-none @2xl/home:border-t @2xl/home:pt-6",
  "before:absolute before:inset-x-[6.25%] before:top-[15px] before:h-0.5 before:rounded-full before:bg-white/25 @2xl/home:before:top-[44px]",
  "after:absolute after:inset-x-[6.25%] after:top-[15px] after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-white after:transition-transform after:duration-[700ms] after:ease-out @2xl/home:after:top-[44px]",
  "group-hover/ask:after:scale-x-100 group-focus-visible/ask:after:scale-x-100 motion-reduce:after:transition-none",
].join(" ");

const DOT = [
  "relative grid @2xl/home:size-10 size-[30px] place-items-center rounded-full border-2 border-white/45 bg-[#2f4a99]",
  "transition-[background-color,color,border-color,scale] duration-[220ms] group-hover/ask:border-white group-hover/ask:bg-white group-hover/ask:text-[var(--hexalis-brand-700)] group-focus-visible/ask:bg-white group-focus-visible/ask:text-[var(--hexalis-brand-700)]",
  "group-first/step:border-white group-first/step:bg-white group-first/step:text-[var(--hexalis-brand-700)] group-first/step:shadow-[0_0_0_6px_rgba(255,255,255,0.14)]",
].join(" ");

const DOOR = [
  "group/door @2xl/home:grid-cols-[220px_1fr] @2xl/home:items-center @3xl/home:grid-cols-1 @3xl/home:grid-rows-[auto_1fr] @3xl/home:items-stretch grid grid-cols-1 rounded-[20px] bg-bg-surface p-1.5",
  "text-text-primary no-underline shadow-card outline-1 -outline-offset-1 outline-border-subtle",
  "transition-[translate,box-shadow,scale] duration-[220ms] ease-enter hover:-translate-y-1 hover:shadow-raised active:scale-[0.98]",
  "motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100 focus-visible:focus-ring focus-visible:outline-focus-ring",
].join(" ");

// The round arrow at a door's corner: it fills with the door's tone and slides when pointed at.
const DOOR_ARROW = [
  "ms-auto grid size-9 flex-none place-items-center rounded-full border border-current/25 text-current",
  "transition-[background-color,border-color,translate] duration-[220ms] ease-enter group-hover/door:translate-x-0.5 group-hover/door:border-transparent group-hover/door:bg-current/12",
  "motion-reduce:group-hover/door:translate-x-0",
].join(" ");

function AskDoor({ t }: Pick<Translator, "t">) {
  return (
    <Link href="/ask" data-st="ask" data-tour="home-door-ask" className={ASK} style={ASK_LIGHT}>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-10 -right-8 -z-10 size-[220px] text-white opacity-[0.07] transition-[rotate,scale] duration-[600ms] ease-out group-hover/ask:scale-105 group-hover/ask:-rotate-6 motion-reduce:transition-none [&>svg]:size-full"
      >
        <Icon name="ask" />
      </span>
      <div>
        <h3 className="m-0 text-[28px] leading-[1.08] font-bold tracking-[-0.025em] text-current @2xl/home:text-[36px]">
          {t("nav.ask")}
        </h3>
        <p className="font-reading m-0 mt-3 max-w-[46ch] text-[18px] leading-normal text-pretty text-white/90">
          {t("home2.ask.d")}
        </p>
      </div>
      <span className="inline-flex min-h-[54px] items-center justify-center gap-2.5 rounded-[12px] bg-white px-5.5 font-semibold whitespace-nowrap text-[var(--hexalis-brand-700)] shadow-[0_8px_20px_-8px_rgba(0,0,0,0.45)] transition-colors group-hover/ask:bg-[var(--hexalis-brand-50)]">
        <Icon name="ask" />
        {t("home.path.go")}
        <span className="ease-enter inline-flex transition-transform duration-[220ms] group-hover/ask:translate-x-1 motion-reduce:transition-none">
          <Icon name="arrow-right" size="sm" />
        </span>
      </span>
      <ol aria-label={t("home2.steps")} className={RAIL}>
        {STEP_ICONS.map((icon, index) => (
          <li key={icon} className="group/step relative z-[1] grid justify-items-center gap-2.5">
            <span className={DOT} style={{ transitionDelay: `${index * 85}ms` }}>
              <Icon name={icon} size="sm" />
            </span>
            <span className="hidden text-center text-[12px] leading-tight font-semibold text-white/80 group-first/step:text-white @3xl/home:block">
              {t(`ask.step.${index + 1}`)}
            </span>
          </li>
        ))}
      </ol>
    </Link>
  );
}

export function HomeDoors({ translator }: { translator: Translator }) {
  const { t } = translator;
  return (
    <section aria-labelledby="home-doors-title" className="pt-14 @2xl/home:pt-20">
      <div className="grid gap-x-10 gap-y-2 @3xl/home:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] @3xl/home:items-end">
        <h2
          id="home-doors-title"
          className="m-0 text-[clamp(30px,3.4vw,42px)] leading-[1.06] font-bold tracking-[-0.025em] text-balance"
        >
          {t("home2.doors.t")}
        </h2>
        <p className="font-reading text-text-secondary m-0 max-w-[46ch] text-[18px] leading-[1.55] text-pretty @3xl/home:justify-self-end @3xl/home:text-end">
          {t("home2.doors.d")}
        </p>
      </div>
      <AskDoor t={t} />
      <ul
        data-tour="home-doors"
        className="m-0 mt-5 grid list-none grid-cols-1 gap-5 p-0 @3xl/home:grid-cols-3"
      >
        {DOORS.map((door) => {
          const Art = DOOR_ART[door.key];
          return (
            <li key={door.key} className="grid">
              <Link href={door.href} data-st={door.key} className={`${DOOR} ${door.tone}`}>
                <span className={`block overflow-hidden rounded-[14px] ${door.tint}`}>
                  <span className="ease-enter block transition-transform duration-[400ms] group-hover/door:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover/door:scale-100">
                    <Art />
                  </span>
                </span>
                <div className="grid content-start gap-2 px-4 pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`grid size-9 flex-none place-items-center rounded-full ${door.tint}`}
                    >
                      <Icon name={door.icon} />
                    </span>
                    <h3 className="text-text-primary m-0 text-[20px] font-semibold tracking-[-0.015em]">
                      {t(`home2.${door.key}.t`)}
                    </h3>
                    <span aria-hidden="true" className={DOOR_ARROW}>
                      <Icon name="arrow-right" size="sm" />
                    </span>
                  </div>
                  <p className="text-body-m text-text-secondary m-0 text-pretty">
                    {t(`home2.${door.key}.d`)}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
