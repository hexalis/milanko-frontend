"use client";

import Link from "next/link";
import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";

/*
 * The link of a case folder. A plain click opens the folder on the way to the file
 * (folder-open.css): a copy of its pages (PaperSheet) rises from behind a copy of its cover and
 * flies, in a layer above the page, to the middle of the screen, while the page fades behind it. The file is requested during the
 * flight, so its wait hides behind the animation; once it is on screen the layer fades and the
 * file deals the same sheets onto its first screen.
 * The flight lives outside React (on <body>) because the shelf unmounts under it. It moves only
 * transform and opacity, so it stays smooth while the next page renders.
 * A click with a modifier (new tab, new window) or a reader with reduced motion gets the ordinary
 * link at once.
 */

/* The page is covered and the pages are out of the folder by then; the file loads behind them. */
const NAVIGATE_MS = 240;
/* If the file has not replaced the shelf by then, the folder is put back. */
const RESET_MS = 4000;

type FolderLinkProps = { href: string; className: string; children: ReactNode };

export function FolderLink({ href, className, children }: FolderLinkProps) {
  const opened = useRef<HTMLElement | null>(null);
  const isPassing = useRef(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const pending = timers.current;
    // The shelf may be kept (hidden) for the back button: leave every folder closed.
    return () => {
      pending.forEach((timer) => window.clearTimeout(timer));
      close(opened.current);
      opened.current = null;
    };
  }, []);

  function open(event: MouseEvent<HTMLAnchorElement>) {
    if (isPassing.current) {
      isPassing.current = false;
      return;
    }
    const isPlainClick =
      event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
    if (!isPlainClick || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const link = event.currentTarget;
    const folder = link.closest<HTMLElement>("[data-folder]");
    const stack = folder?.querySelector<HTMLElement>("[data-sheets]");
    if (!folder || !stack) return;
    event.preventDefault();
    if (opened.current) return;
    fly(folder, stack, href);
    folder.dataset.opening = "";
    opened.current = folder;
    timers.current.push(
      window.setTimeout(() => {
        isPassing.current = true;
        link.click();
      }, NAVIGATE_MS),
      window.setTimeout(() => {
        close(opened.current);
        opened.current = null;
      }, RESET_MS),
    );
  }

  return (
    <Link href={href} className={className} onClick={open}>
      {children}
    </Link>
  );
}

function close(folder: HTMLElement | null) {
  if (folder) delete folder.dataset.opening;
}

/* The flight: the sheets' travel (folder-open.css), and how long the layer takes to fade. */
const FLIGHT_MS = 720;
const LEAVE_MS = 280;
/* The flight gives up waiting for a file that never arrives. */
const GIVE_UP_MS = 4000;
const CHECK_MS = 50;
/* Holds the file's own opening (case-glance.css) until the flight has left. */
const FLIGHT = "folderFlight";

/*
 * Where the pages land (folder-open.css): side by side, a gap apart, when all of them fit at a
 * readable size; otherwise stacked, each a little up and to the right of the one in front.
 */
const GAP = 28;
const MAX_ZOOM = 1.3;
const MIN_SPREAD = 0.86;

function landing(stack: HTMLElement) {
  const box = stack.getBoundingClientRect();
  const sheets = stack.querySelectorAll<HTMLElement>("[data-sheet]");
  const count = Math.max(1, sheets.length);
  const width = sheets[0]?.offsetWidth || box.width;
  const height = sheets[0]?.offsetHeight || box.height;
  const fit = (share: number) => (window.innerHeight * share) / height;
  const spread = Math.min(
    MAX_ZOOM,
    (window.innerWidth * 0.92) / (count * width + (count - 1) * GAP),
    fit(0.78),
  );
  const isSpread = spread >= MIN_SPREAD;
  return {
    box,
    height,
    zoom: isSpread ? spread : Math.min(MAX_ZOOM, (window.innerWidth * 0.9 - 36) / width, fit(0.72)),
    step: isSpread ? `calc(100% + ${GAP}px)` : "6%",
    rise: isSpread ? "0px" : "-14px",
    turn: isSpread ? "1.5deg" : "3deg",
  };
}

/**
 * Copies the folder's pages into a layer over the page, with a copy of its cover in front so they
 * rise from behind it, and sends them to the middle of the screen.
 */
function fly(folder: HTMLElement, stack: HTMLElement, href: string) {
  const { box, height, zoom, step, rise, turn } = landing(stack);

  const layer = document.createElement("div");
  layer.dataset.flight = "";
  layer.setAttribute("aria-hidden", "true");
  layer.inert = true;
  const vars = {
    "--fo-x": `${window.innerWidth / 2 - (box.left + box.width / 2)}px`,
    "--fo-y": `${window.innerHeight / 2 - (box.top + height / 2)}px`,
    "--fo-s": zoom.toFixed(3),
    "--fo-step": step,
    "--fo-rise": rise,
    "--fo-turn": turn,
    // The folder's bottom edge, which hides the foot of the pages until they have risen.
    "--fo-clip": `${box.height}px`,
  };
  for (const [name, value] of Object.entries(vars)) layer.style.setProperty(name, value);

  const scrim = document.createElement("div");
  scrim.dataset.flightScrim = "";

  const hand = stack.cloneNode(true) as HTMLElement;
  delete hand.dataset.sheets;
  hand.className = "";
  hand.dataset.flightHand = "";
  place(hand, box.left, box.top, box.width, height);
  renameIds(hand);

  layer.append(scrim, hand);
  const cover = folder.querySelector<HTMLElement>("[data-folder-cover]");
  if (cover) {
    const front = cover.cloneNode(true) as HTMLElement;
    const at = cover.getBoundingClientRect();
    front.dataset.flightCover = "";
    delete front.dataset.folderCover;
    place(front, at.left, at.top, at.width, at.height);
    renameIds(front);
    layer.append(front);
  }
  document.body.append(layer);
  document.documentElement.dataset[FLIGHT] = "";

  const started = performance.now();
  const check = window.setInterval(() => {
    const elapsed = performance.now() - started;
    if ((elapsed >= FLIGHT_MS && hasArrived(href)) || elapsed >= GIVE_UP_MS) {
      window.clearInterval(check);
      land(layer);
    }
  }, CHECK_MS);
}

function place(element: HTMLElement, left: number, top: number, width: number, height: number) {
  Object.assign(element.style, {
    position: "absolute",
    margin: "0",
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
  });
}

/** The file is on screen (a file seen before may still be kept, hidden, for the back button). */
function hasArrived(href: string) {
  if (window.location.pathname !== href) return false;
  return Array.from(document.querySelectorAll<HTMLElement>(".cg")).some(
    (glance) => glance.offsetParent !== null,
  );
}

/** The layer fades, and the file deals its sheets where the flight leaves them. */
function land(layer: HTMLElement) {
  delete document.documentElement.dataset[FLIGHT];
  layer.dataset.leaving = "";
  window.setTimeout(() => layer.remove(), LEAVE_MS);
}

/* The copied sparkline must not point at the gradients of the original, kept hidden on the shelf. */
function renameIds(root: HTMLElement) {
  for (const element of root.querySelectorAll("[id]")) {
    const id = element.id;
    element.id = `${id}-flight`;
    for (const user of root.querySelectorAll("*")) {
      for (const attribute of Array.from(user.attributes)) {
        if (attribute.value.includes(`url(#${id})`)) {
          user.setAttribute(
            attribute.name,
            attribute.value.replaceAll(`url(#${id})`, `url(#${id}-flight)`),
          );
        }
      }
    }
  }
}
