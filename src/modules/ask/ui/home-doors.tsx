import Link from "next/link";
import type { Translator } from "@/shared/lib/i18n";
import { Icon } from "@/shared/ui/icon";
import { DOOR_ART } from "./home-door-art";

/*
 * "What do you want to do today?" (POC ask.js renderHome .hm-doors): the question is the main door,
 * a blue panel with the eight steps it walks; the map, the case files and the method are the other
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

const ASK = [
  "group/ask @2xl/home:grid-cols-[minmax(0,1fr)_auto] @2xl/home:px-10 @2xl/home:pt-10 @2xl/home:pb-8 mt-7 grid grid-cols-1 items-end gap-x-12 gap-y-7 rounded-[20px] p-6",
  "bg-[var(--hexalis-brand-600)] text-white shadow-raised no-underline transition-[background-color,scale] duration-fast",
  "hover:bg-[var(--hexalis-brand-700)] active:scale-[0.99] motion-reduce:active:scale-100 focus-visible:focus-ring focus-visible:outline-focus-ring",
].join(" ");

const DOT = [
  "relative grid @2xl/home:size-10 size-[30px] place-items-center rounded-full border-2 border-current/45 bg-[var(--hexalis-brand-600)]",
  "transition-colors duration-[220ms] group-hover/ask:bg-white group-hover/ask:text-[var(--hexalis-brand-700)] group-focus-visible/ask:bg-white group-focus-visible/ask:text-[var(--hexalis-brand-700)]",
  "group-first/step:bg-white group-first/step:text-[var(--hexalis-brand-700)]",
].join(" ");

const DOOR = [
  "group/door @2xl/home:grid-cols-[200px_1fr] @2xl/home:items-center @3xl/home:grid-cols-1 @3xl/home:grid-rows-[auto_1fr] @3xl/home:items-stretch grid grid-cols-1 rounded-[16px] bg-bg-surface p-1.5",
  "text-text-primary no-underline shadow-card outline-1 -outline-offset-1 outline-border-subtle",
  "transition-[translate,box-shadow,scale] duration-[220ms] ease-enter hover:-translate-y-[3px] hover:shadow-raised active:scale-[0.98]",
  "motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100 focus-visible:focus-ring focus-visible:outline-focus-ring",
].join(" ");

function AskDoor({ t }: Pick<Translator, "t">) {
  return (
    <Link href="/ask" data-st="ask" className={ASK}>
      <div>
        <h3 className="m-0 text-[26px] leading-[1.1] font-bold tracking-[-0.02em] text-current @2xl/home:text-[32px]">
          {t("nav.ask")}
        </h3>
        <p className="font-reading m-0 mt-2.5 max-w-[46ch] text-[18px] leading-normal text-pretty opacity-90">
          {t("home2.ask.d")}
        </p>
      </div>
      <span className="inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-[10px] bg-white px-5.5 font-semibold whitespace-nowrap text-[var(--hexalis-brand-700)] shadow-sm group-hover/ask:bg-[var(--hexalis-brand-50)]">
        <Icon name="ask" />
        {t("home.path.go")}
      </span>
      <ol
        aria-label={t("home2.steps")}
        className="relative -order-1 col-span-full m-0 grid list-none grid-cols-8 border-current/20 p-0 before:absolute before:inset-x-[6.25%] before:top-[15px] before:h-0.5 before:bg-current/30 @2xl/home:order-none @2xl/home:border-t @2xl/home:pt-5 @2xl/home:before:top-10"
      >
        {STEP_ICONS.map((icon, index) => (
          <li key={icon} className="group/step relative grid justify-items-center gap-2">
            <span className={DOT} style={{ transitionDelay: `${index * 35}ms` }}>
              <Icon name={icon} size="sm" />
            </span>
            <span className="hidden text-center text-[12px] leading-tight font-semibold opacity-85 group-first/step:opacity-100 @3xl/home:block">
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
    <section aria-labelledby="home-doors-title" className="pt-12 @2xl/home:pt-18">
      <h2
        id="home-doors-title"
        className="m-0 text-[clamp(28px,3vw,36px)] leading-[1.1] font-bold text-balance"
      >
        {t("home2.doors.t")}
      </h2>
      <p className="font-reading text-text-secondary m-0 mt-2 max-w-[52ch] text-[18px] leading-[1.55] text-pretty">
        {t("home2.doors.d")}
      </p>
      <AskDoor t={t} />
      <ul className="m-0 mt-5 grid list-none grid-cols-1 gap-5 p-0 @3xl/home:grid-cols-3">
        {DOORS.map((door) => {
          const Art = DOOR_ART[door.key];
          return (
            <li key={door.key} className="grid">
              <Link href={door.href} data-st={door.key} className={`${DOOR} ${door.tone}`}>
                <span className={`block overflow-hidden rounded-[10px] ${door.tint}`}>
                  <Art />
                </span>
                <div className="grid gap-1.5 px-3.5 pt-4 pb-3.5">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`grid size-8 flex-none place-items-center rounded-full ${door.tint}`}
                    >
                      <Icon name={door.icon} />
                    </span>
                    <h3 className="text-text-primary m-0 text-[19px] font-semibold tracking-[-0.01em] underline decoration-transparent decoration-2 underline-offset-[5px] transition-[text-decoration-color] group-hover/door:decoration-current group-focus-visible/door:decoration-current">
                      {t(`home2.${door.key}.t`)}
                    </h3>
                  </div>
                  <p className="text-body-m text-text-secondary m-0">{t(`home2.${door.key}.d`)}</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
