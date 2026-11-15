/*
 * Where keyboard focus goes after a builder choice reloads the page (POC askBindBuilder). A tap
 * folds the step into the one choice made, and focus lands on its "Change" summary. Arrow keys
 * walk the options, so the list stays open for them and focus stays on the chosen tile.
 * A choice and the fold that follows it live in the same tab, so a module variable is enough.
 */

type PendingFocus = { segment: string; isKeyboard: boolean };

let pending: PendingFocus | undefined;
let isWalkingByKeys = false;

/** Arrow keys on a tile: the next change came from the keyboard. */
export function noteArrowKeys(isArrow: boolean) {
  isWalkingByKeys = isArrow;
}

/** A tile of `segment` was chosen; its fold will take focus when it mounts. */
export function requestFocus(segment: string) {
  pending = { segment, isKeyboard: isWalkingByKeys };
  isWalkingByKeys = false;
}

/** The pending focus for `segment`, consumed once. */
export function takeFocus(segment: string): PendingFocus | undefined {
  if (pending?.segment !== segment) return undefined;
  const taken = pending;
  pending = undefined;
  return taken;
}
