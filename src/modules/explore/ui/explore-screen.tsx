"use client";

import { usePathname } from "next/navigation";
import {
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
  type RefObject,
} from "react";
import type { CaseSummary } from "@/modules/cases";
import { withBasePath } from "@/shared/lib/base-path";
import type { Locale } from "@/shared/lib/i18n";
import { eventPointsUrl, findEventPoint } from "../domain/event-points";
import { exploreTranslator, type ExploreMessages } from "../domain/explore-copy";
import {
  flyCommand,
  selectionQuery,
  toSelection,
  type ExploreQuery,
  type ExploreSelection,
} from "../domain/explore-state";
import {
  GLOBE_CHROME,
  type GlobeChrome,
  type GlobeMessage,
  type GlobeTile,
} from "../domain/globe-messages";
import { isSectorId, kmBetween, sectorOf, type SectorId } from "../domain/sectors";
import { useGlobeCommands, useGlobeMessages } from "../hooks/use-globe-bridge";
import { CasePanel } from "./case-panel";
import { EventPanel } from "./event-panel";
import { ExploreDrawer } from "./explore-drawer";
import { GlobeLoading } from "./globe-loading";
import { PointPanel } from "./point-panel";
import { RegionPanel } from "./region-panel";
import { SatellitePanel } from "./satellite-panel";
import { SkyPanel } from "./sky-panel";
import { SectorPanel } from "./sector-panel";

type ExploreScreenProps = {
  locale: Locale;
  /** The embedded POC globe: /globe/world3d/index.html?embed=1&lang=… (Next serves no directory index). */
  frameSrc: string;
  frameTitle: string;
  heading: string;
  viewerLabel: string;
  files: CaseSummary[];
  messages: ExploreMessages;
  /** EONET source names by id. */
  sources: Readonly<Record<string, string>>;
  windowDays: number;
  query: ExploreQuery;
  /** The EONET year the events layer shows unless a link asks for another. */
  defaultYear: number;
  /** What the link opened, rendered open on the server. */
  initial: ExploreSelection | null;
  /** The page's tour button, floating on the globe. */
  tour?: ReactNode;
};

const subscribeNothing = () => () => {};

/** How long, once the frame has loaded, a linked panel waits for the globe before it shows anyway. */
const GLOBE_WAIT_MS = 20_000;
/** Room between the globe's zoom and the tour button under it (the globe's own gap between controls). */
const TOUR_GAP_PX = 12;

/**
 * The frame's place: under the shell on phones and beside the floating rail on wide screens; in
 * contemplation it covers the whole window, rail and bars included, so only the planet shows.
 */
const STAGE = {
  shell:
    "shell:fixed shell:inset-0 shell:z-10 shell:h-auto relative h-[calc(100dvh-var(--shell-top)-var(--shell-bottom))] min-h-[30rem]",
  immersive: "fixed inset-0 z-50 h-dvh",
} as const;

/** Where the floating rail ends on the left, in px (0 on phones, where there is none). */
function railRight(): number {
  const rail = document.getElementById("rail");
  if (!rail) return 0;
  const box = rail.getBoundingClientRect();
  return box.width ? Math.round(box.right) : 0;
}

const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));

/**
 * The globe explorer (the POC's renderExplore): the 3D world in a frame, and a drawer for whatever
 * the reader picks in it, docked on the side on wide screens and as a bottom sheet on phones. The
 * selection lives in the URL (region, case, ev, year, lat/lon), so a view can be shared.
 */
export function ExploreScreen(props: ExploreScreenProps) {
  const { files, messages, query, defaultYear, locale } = props;
  const pathname = usePathname();
  const t = useMemo(() => exploreTranslator(messages), [messages]);
  const byId = useMemo(() => new Map(files.map((file) => [file.id, file])), [files]);

  const frameRef = useRef<HTMLIFrameElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const shouldFocusTitle = useRef(false);
  // Once the reader picks or closes something, a late deep-link result must not replace it.
  const hasReaderActed = useRef(false);

  const [selection, setSelection] = useState<ExploreSelection | null>(props.initial);
  // Contemplation: the interface hides and the globe takes the whole window (H, or the eye button).
  const [isImmersive, setImmersive] = useState(false);
  const immersiveRef = useRef(false);
  const [tile, setTile] = useState<GlobeTile | null>(null);
  // Where the globe's own controls sit, as it reports them: the tour's anchors over the frame.
  const [chrome, setChrome] = useState<GlobeChrome>({});
  // A link to an event waits for its year's snapshot; the drawer opens once it is found.
  const [status, setStatus] = useState<string | null>(() =>
    query.open.type === "event" ? t("exp.events.loading") : null,
  );
  // The frame loads only once this page listens, so its "ready" cannot arrive before the listener.
  const isHydrated = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );
  // The rail's right edge when the frame starts, in its address: its loader centres beside the rail
  // from its first paint, where the portal's still (GlobeLoading) stands. Read once, so the address
  // never changes (a new one would reload the globe); later changes reach it as "rail" messages.
  const [railAtStart] = useState(() => (typeof document === "undefined" ? 0 : railRight()));
  // The frame has loaded, its own loader painted under the still, which then fades out.
  const [isFrameLoaded, setFrameLoaded] = useState(false);

  // Whatever a link opened (its panel, the tour button, a status line) waits for the world to
  // appear, so nothing floats over the loader. If the globe never answers once its frame has loaded
  // (a failed load), the panel shows anyway.
  const [isGlobeReady, setGlobeReady] = useState(false);
  useEffect(() => {
    if (!isFrameLoaded) return;
    const fallback = window.setTimeout(() => setGlobeReady(true), GLOBE_WAIT_MS);
    return () => window.clearTimeout(fallback);
  }, [isFrameLoaded]);

  const caseRegion = (id: string): SectorId | undefined => {
    const region = byId.get(id)?.region;
    return isSectorId(region) ? region : undefined;
  };
  const caseAt = (id: string): readonly [number, number] | undefined => {
    const file = byId.get(id);
    return file ? [file.lat, file.lon] : undefined;
  };

  const queue = useGlobeCommands();
  const { send } = queue;

  function writeUrl(next: ExploreSelection | null) {
    const search = selectionQuery(next, {
      caseRegion,
      events: query.events,
      year: query.year,
      defaultYear,
    });
    // replaceState, not router.replace: the server page would re-render and re-send every case
    // summary for a URL the client already shows. Next keeps usePathname/useSearchParams in sync.
    window.history.replaceState(null, "", `${withBasePath(pathname)}${search}`);
  }

  function select(next: ExploreSelection, { isFocusMoved = true } = {}) {
    const active = document.activeElement;
    if (active instanceof HTMLElement && active !== document.body) {
      if (!drawerRef.current?.contains(active)) openerRef.current = active;
    }
    if (isFocusMoved) hasReaderActed.current = true;
    shouldFocusTitle.current = isFocusMoved;
    setSelection(next);
    setTile(null);
    setStatus(null);
    writeUrl(next);
    const fly = flyCommand(next, caseAt);
    if (fly) send(fly);
  }

  function close() {
    hasReaderActed.current = true;
    const hadFocus = drawerRef.current?.contains(document.activeElement) ?? false;
    setSelection(null);
    setTile(null);
    writeUrl(null);
    send({ type: "closed" });
    if (!hadFocus) return;
    const opener = openerRef.current;
    if (opener?.isConnected) {
      opener.focus({ preventScroll: true });
      return;
    }
    // Back to the globe itself, or to the control the reader last used inside it.
    frameRef.current?.focus({ preventScroll: true });
    send({ type: "focus" });
  }

  function applyImmersive(on: boolean, { fromGlobe = false } = {}) {
    if (immersiveRef.current === on) return;
    immersiveRef.current = on;
    setImmersive(on);
    if (on && selection) close();
    if (!fromGlobe) send({ type: "immersive", on });
    // Without the rail over its left edge, the globe centres on the whole window.
    send({ type: "rail", px: on ? 0 : railRight() });
    if (on && !fromGlobe) frameRef.current?.focus({ preventScroll: true });
  }

  function showData(variable: string) {
    close();
    send({ type: "layer", layer: "data", variable });
  }

  function handleMessage(message: GlobeMessage) {
    if (message.type === "immersive") {
      applyImmersive(message.on, { fromGlobe: true });
    } else if (message.type === "shown") {
      setGlobeReady(true);
    } else if (message.type === "select") {
      if (message.sel.type === "case" && !byId.has(message.sel.id)) return;
      select(toSelection(message.sel));
    } else if (message.type === "chrome") {
      setChrome(message.rects);
    } else if (message.type === "escape") {
      if (selection) close();
    } else if (message.type === "tile") {
      // The lifted tile belongs to the open point only if that point is inside it.
      if (
        selection?.type === "point" &&
        kmBetween(selection.lat, selection.lon, message.lat, message.lon) <= message.km
      ) {
        setTile(message);
      }
    }
  }

  useGlobeMessages(frameRef, queue, handleMessage);

  // Deep links: fly to what the server opened, reopen an event from its year's snapshot, show a layer.
  const openFromLink = useEffectEvent((signal: AbortSignal) => {
    const { open } = query;
    const initialFly = props.initial ? flyCommand(props.initial, caseAt) : null;
    if (initialFly) send(initialFly);
    if (open.type === "near") send({ type: "fly", kind: "point", lat: open.lat, lon: open.lon });
    if (query.events) {
      const cat = query.events === "all" ? "" : query.events;
      send({ type: "layer", layer: "events", cat, year: query.year });
    }
    if (open.type !== "event") return;
    const missing = t("exp.event.missing", { y: query.year });
    fetch(eventPointsUrl(query.year), { signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((file: unknown) => {
        if (hasReaderActed.current) return;
        const ev = findEventPoint(file, open.id);
        if (!ev) {
          setStatus(missing);
          return;
        }
        select(
          { type: "event", ev, sector: sectorOf(ev.lat, ev.lon, true) },
          { isFocusMoved: false },
        );
      })
      .catch(() => {
        // Offline or a broken snapshot: say the event could not be found (an abort says nothing).
        if (!signal.aborted && !hasReaderActed.current) setStatus(missing);
      });
  });

  useEffect(() => {
    const controller = new AbortController();
    openFromLink(controller.signal);
    return () => controller.abort();
  }, []);

  // The drawer takes the focus when the reader opens something (its heading, as the POC did).
  useEffect(() => {
    if (!selection || !shouldFocusTitle.current) return;
    shouldFocusTitle.current = false;
    titleRef.current?.focus({ preventScroll: true });
  }, [selection]);

  const onKey = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === "Escape") {
      if (immersiveRef.current) applyImmersive(false);
      else if (selection) close();
      return;
    }
    const isH = event.key === "h" || event.key === "H";
    if (!isH || event.ctrlKey || event.metaKey || event.altKey || isTypingTarget(event.target))
      return;
    event.preventDefault();
    applyImmersive(!immersiveRef.current);
  });
  useEffect(() => {
    const listen = (event: KeyboardEvent) => onKey(event);
    document.addEventListener("keydown", listen, true);
    return () => document.removeEventListener("keydown", listen, true);
  }, []);

  // On wide screens the globe runs under the floating rail; the frame keeps its picture and
  // controls clear of it, so it hears the rail's right edge whenever the rail changes width.
  useEffect(() => {
    const rail = document.getElementById("rail");
    if (!rail) return;
    const tell = () => send({ type: "rail", px: immersiveRef.current ? 0 : railRight() });
    tell();
    const observer = new ResizeObserver(tell);
    observer.observe(rail);
    // The globe's loader listens before the world is built, so it can centre beside the rail at
    // once; the queue above only opens once the world says "ready".
    const frame = frameRef.current;
    const early = () => {
      const box = rail.getBoundingClientRect();
      const px = box.width ? Math.round(box.right) : 0;
      frame?.contentWindow?.postMessage({ etd: 1, type: "rail", px }, "*");
    };
    frame?.addEventListener("load", early);
    return () => {
      observer.disconnect();
      frame?.removeEventListener("load", early);
    };
  }, [send]);

  return (
    <section
      aria-label={props.viewerLabel}
      data-tour="exp-globe"
      data-fills-window=""
      className={`bg-space w-full overflow-hidden ${isImmersive ? STAGE.immersive : STAGE.shell}`}
    >
      <h1 className="sr-only">{props.heading}</h1>
      <iframe
        ref={frameRef}
        src={isHydrated ? `${props.frameSrc}#rail=${railAtStart}` : undefined}
        onLoad={() => setFrameLoaded(true)}
        title={props.frameTitle}
        // Scripts run with an opaque origin: the POC page cannot reach this page's DOM or cookies.
        // Its fetches are cross-origin, so next.config.mjs sends CORS headers for /globe/*.
        // Its links open in this tab (_top, on a click) or in a new one.
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
        className="absolute inset-0 size-full border-0"
      />
      {isGlobeReady ? null : (
        <GlobeLoading
          className={`absolute inset-0 z-[1] transition-opacity duration-500 ease-out motion-reduce:transition-none ${isFrameLoaded ? "pointer-events-none opacity-0" : ""}`}
        />
      )}
      {/*
       * The frame is sandboxed, so the tour cannot reach the globe's controls: these empty boxes
       * sit exactly over them (the globe reports where), for the tour to point at.
       */}
      {GLOBE_CHROME.map((part) => {
        const box = chrome[part];
        return box ? (
          <div
            key={part}
            aria-hidden="true"
            data-tour={"exp-" + part}
            className="pointer-events-none absolute"
            style={{ left: box.left, top: box.top, width: box.width, height: box.height }}
          />
        ) : null;
      })}
      {/*
       * The tour button sits under the globe's zoom, with its other controls: right-aligned with
       * the zoom, TOUR_GAP_PX below it, wherever the globe reports it (the zoom grows when the globe
       * adds a control). Until then, at the globe's own offsets (24px wide, 12px on phones). It
       * shows only its icon; the label unfolds on hover. While a panel is open it steps back, with the
       * globe's search, regions and layers: the panel and its main action lead.
       */}
      {props.tour && isGlobeReady && !isImmersive && !selection ? (
        <div
          className={`bg-bg-surface shadow-raised absolute z-[5] rounded-full ${chrome.zoom ? "" : "shell:end-6 shell:top-[12.25rem] end-3 top-[18.75rem]"}`}
          style={
            chrome.zoom
              ? {
                  left: chrome.zoom.left + chrome.zoom.width,
                  top: chrome.zoom.top + chrome.zoom.height + TOUR_GAP_PX,
                  translate: "-100% 0",
                }
              : undefined
          }
        >
          {props.tour}
        </div>
      ) : null}
      {status && isGlobeReady ? (
        <output className="rounded-chip bg-bg-surface text-body-s text-text-primary shadow-raised absolute bottom-3 left-3 z-10 max-w-[min(24rem,calc(100%-1.5rem))] px-3 py-2">
          {status}
        </output>
      ) : null}
      {selection ? (
        <ExploreDrawer
          drawerRef={drawerRef}
          closeLabel={t("drawer.close")}
          onClose={close}
          onInset={(side, px) => send({ type: "inset", side, px })}
          isHeld={!isGlobeReady}
        >
          <SelectionPanel
            selection={selection}
            tile={tile}
            files={files}
            sources={props.sources}
            windowDays={props.windowDays}
            locale={locale}
            t={t}
            titleRef={titleRef}
            onSelect={select}
            onShowData={showData}
          />
        </ExploreDrawer>
      ) : null}
    </section>
  );
}

type SelectionPanelProps = {
  selection: ExploreSelection;
  tile: GlobeTile | null;
  files: CaseSummary[];
  sources: Readonly<Record<string, string>>;
  windowDays: number;
  locale: Locale;
  t: ReturnType<typeof exploreTranslator>;
  titleRef: RefObject<HTMLHeadingElement | null>;
  onSelect: (next: ExploreSelection) => void;
  /** Closes the drawer and shows one variable on the globe's data layer. */
  onShowData: (variable: string) => void;
};

function SelectionPanel({ selection, files, onSelect, onShowData, ...rest }: SelectionPanelProps) {
  const { t, titleRef, locale } = rest;
  const onSector = (id: string) => {
    if (isSectorId(id)) onSelect({ type: "sector", id });
  };
  switch (selection.type) {
    case "sector":
      return (
        <SectorPanel
          key={selection.id}
          id={selection.id}
          files={files}
          windowDays={rest.windowDays}
          t={t}
          titleRef={titleRef}
          onCase={(id) => onSelect({ type: "case", id })}
        />
      );
    case "case": {
      const file = files.find((candidate) => candidate.id === selection.id);
      return file ? <CasePanel file={file} t={t} titleRef={titleRef} onSector={onSector} /> : null;
    }
    case "event":
      return (
        <EventPanel
          ev={selection.ev}
          sources={rest.sources}
          locale={locale}
          t={t}
          titleRef={titleRef}
          onInvestigate={() =>
            onSelect({
              type: "point",
              lat: selection.ev.lat,
              lon: selection.ev.lon,
              sector: selection.sector,
            })
          }
        />
      );
    case "point":
      return (
        <PointPanel
          lat={selection.lat}
          lon={selection.lon}
          sector={selection.sector}
          sectorFileCount={
            selection.sector ? files.filter((file) => file.region === selection.sector).length : 0
          }
          tile={rest.tile}
          locale={locale}
          t={t}
          titleRef={titleRef}
          onSector={onSector}
        />
      );
    case "satellite":
      return (
        <SatellitePanel t={t} titleRef={titleRef} onShowGreenness={() => onShowData("NDVI")} />
      );
    case "sky":
      return (
        <SkyPanel
          key={selection.id}
          id={selection.id}
          apollo={selection.apollo}
          t={t}
          titleRef={titleRef}
        />
      );
    case "region":
      return (
        <RegionPanel
          key={`${selection.code}-${selection.reading.variable}-${selection.reading.date}`}
          code={selection.code}
          place={selection.place}
          reading={selection.reading}
          locale={locale}
          t={t}
          titleRef={titleRef}
        />
      );
  }
}
