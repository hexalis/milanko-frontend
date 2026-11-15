"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  parseIdList,
  READ_STORAGE_KEY,
  RECENT_STORAGE_KEY,
  withRead,
  withRecent,
} from "../domain/case-progress";

/** Same-tab writes do not fire "storage", so the recorder announces them with this event. */
const PROGRESS_EVENT = "etd-progress";

function readItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeItem(key: string, value: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage is blocked or full: the rail simply shows no trail.
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(PROGRESS_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(PROGRESS_EVENT, onChange);
  };
}

// A string snapshot is stable between reads, as useSyncExternalStore requires.
const snapshot = () => `${readItem(RECENT_STORAGE_KEY) ?? ""}\n${readItem(READ_STORAGE_KEY) ?? ""}`;
const serverSnapshot = () => null;

export type CaseProgress = { recent: string[]; read: string[] };

/** The reader's recent and opened files; `null` on the server and until mounted. */
export function useCaseProgress(): CaseProgress | null {
  const raw = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  return useMemo(() => {
    if (raw === null) return null;
    const [recent = "", read = ""] = raw.split("\n");
    return { recent: parseIdList(recent), read: parseIdList(read) };
  }, [raw]);
}

/** Stores that the reader opened a case file (POC markRead). */
export function recordCaseOpened(id: string) {
  writeItem(RECENT_STORAGE_KEY, withRecent(parseIdList(readItem(RECENT_STORAGE_KEY)), id));
  writeItem(READ_STORAGE_KEY, withRead(parseIdList(readItem(READ_STORAGE_KEY)), id));
  window.dispatchEvent(new Event(PROGRESS_EVENT));
}
