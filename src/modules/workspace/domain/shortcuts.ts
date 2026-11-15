/*
 * Shell keys (POC Nav): "/" searches the case files and "[" collapses the rail. Both are ignored
 * while the reader types in a field and when a modifier is held, so browser shortcuts still work.
 */

export type ShellShortcut = "search" | "collapse";

type KeyInput = {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  repeat?: boolean;
  target: EventTarget | null;
};

const TYPING_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

function isTyping(target: EventTarget | null): boolean {
  if (!target || typeof target !== "object" || !("tagName" in target)) return false;
  const element = target as HTMLElement;
  return TYPING_TAGS.has(element.tagName) || element.isContentEditable === true;
}

export function shortcutFor(event: KeyInput): ShellShortcut | null {
  if (event.repeat || event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) {
    return null;
  }
  if (event.key === "/") return "search";
  if (event.key === "[") return "collapse";
  return null;
}
