"use client";

import { useCallback } from "react";
import { NAV_STORAGE_KEY } from "../domain/nav-state";
import { useNavAttribute } from "./use-html-attribute";

/** html class that lets the rail and the page offset animate, only while the reader toggles. */
const ANIMATING_CLASS = "nav-anim";
const ANIMATION_MS = 400;

let animationTimer: ReturnType<typeof setTimeout> | undefined;

function setCollapsed(isCollapsed: boolean) {
  const root = document.documentElement;
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    clearTimeout(animationTimer);
    root.classList.add(ANIMATING_CLASS);
    animationTimer = setTimeout(() => root.classList.remove(ANIMATING_CLASS), ANIMATION_MS);
  }
  root.setAttribute("data-nav", isCollapsed ? "collapsed" : "open");
  try {
    // Saved only when the reader changes it, so the tablet default never sticks as a choice.
    localStorage.setItem(NAV_STORAGE_KEY, JSON.stringify({ collapsed: isCollapsed }));
  } catch {
    // Storage is blocked: the choice lasts this visit.
  }
}

/** Whether the rail is collapsed (`null` until mounted) and a toggle that stores the choice. */
export function useNavCollapse(): { isCollapsed: boolean | null; toggle: () => void } {
  const attribute = useNavAttribute();
  const toggle = useCallback(() => {
    setCollapsed(document.documentElement.getAttribute("data-nav") !== "collapsed");
  }, []);
  return { isCollapsed: attribute === null ? null : attribute === "collapsed", toggle };
}
