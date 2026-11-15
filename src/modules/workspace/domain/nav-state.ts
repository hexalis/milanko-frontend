/*
 * The rail is open or collapsed, and only the reader changes it (POC Nav). The choice is stored;
 * a first visit on a tablet starts collapsed without storing that default.
 */

export const NAV_STORAGE_KEY = "etd-nav";

/** Widest viewport that starts with a collapsed rail. */
export const TABLET_MAX_WIDTH = 1199;

/**
 * Older POC saves used {pinned, collapsed}; an unpinned rail rested as icons, so it reads as
 * collapsed. Anything unreadable falls back to the viewport default.
 */
export function resolveNavCollapsed(saved: string | null, isTablet: boolean): boolean {
  if (saved) {
    try {
      const value: unknown = JSON.parse(saved);
      if (value && typeof value === "object") {
        const { collapsed, pinned } = value as { collapsed?: unknown; pinned?: unknown };
        return collapsed === true || pinned === false;
      }
    } catch {
      // A corrupt value is treated as no choice.
    }
  }
  return isTablet;
}
