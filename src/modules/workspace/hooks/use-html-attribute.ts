"use client";

import { useSyncExternalStore } from "react";

/*
 * The shell keeps its state on <html> (data-theme, data-nav), where the pre-paint script put it.
 * Controls read it from there: `null` on the server and during hydration, the real value once
 * mounted, so the markup always matches what the server sent.
 */

function subscribeTo(name: string) {
  return (onChange: () => void) => {
    const observer = new MutationObserver(onChange);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: [name] });
    return () => observer.disconnect();
  };
}

const serverSnapshot = () => null;

function createAttributeHook(name: string) {
  const subscribe = subscribeTo(name);
  const read = () => document.documentElement.getAttribute(name);
  return () => useSyncExternalStore(subscribe, read, serverSnapshot);
}

export const useThemeAttribute = createAttributeHook("data-theme");
export const useNavAttribute = createAttributeHook("data-nav");
