"use client";

import { usePathname } from "next/navigation";
import {
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type RefObject,
} from "react";
import type { CaseSummary } from "@/modules/cases";
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
import type { GlobeMessage, GlobeTile } from "../domain/globe-messages";
import { isSectorId, kmBetween, sectorOf, type SectorId } from "../domain/sectors";
import { useGlobeCommands, useGlobeMessages } from "../hooks/use-globe-bridge";
import { CasePanel } from "./case-panel";
import { EventPanel } from "./event-panel";
import { ExploreDrawer } from "./explore-drawer";
import { PointPanel } from "./point-panel";
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
};

const subscribeNothing = () => () => {};

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
  const [tile, setTile] = useState<GlobeTile | null>(null);
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
    window.history.replaceState(null, "", `${pathname}${search}`);
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

  function handleMessage(message: GlobeMessage) {
    if (message.type === "select") {
      if (message.sel.type === "case" && !byId.has(message.sel.id)) return;
      select(toSelection(message.sel));
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

  const onEscape = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === "Escape" && selection) close();
  });
  useEffect(() => {
    const listen = (event: KeyboardEvent) => onEscape(event);
    document.addEventListener("keydown", listen, true);
    return () => document.removeEventListener("keydown", listen, true);
  }, []);

  return (
    <section
      aria-label={props.viewerLabel}
      className="bg-bg-inverse relative h-[calc(100dvh-6.5rem)] min-h-[30rem] w-full overflow-hidden"
    >
      <h1 className="sr-only">{props.heading}</h1>
      <iframe
        ref={frameRef}
        src={isHydrated ? props.frameSrc : undefined}
        title={props.frameTitle}
        // Scripts run with an opaque origin: the POC page cannot reach this page's DOM or cookies.
        // Its fetches are cross-origin, so next.config.mjs sends CORS headers for /globe/*.
        // Its links open in this tab (_top, on a click) or in a new one.
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
        className="absolute inset-0 size-full border-0"
      />
      {status ? (
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
};

function SelectionPanel({ selection, files, onSelect, ...rest }: SelectionPanelProps) {
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
  }
}
