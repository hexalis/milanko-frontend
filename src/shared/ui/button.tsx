import { buttonRecipe, type ButtonIntent } from "@hexalis/components/themes";
import type { ComponentProps } from "react";
import { Button as HexalisButton } from "./hexalis";

type LinkIntent = Extract<ButtonIntent, "primary" | "secondary">;

/*
 * The DS recipe styles hover, press and focus through React Aria's data-* attributes. A native <a>
 * (a Next <Link> styled as a button) has none, so the same states are mapped to CSS pseudo-classes.
 */
const NATIVE_STATES: Record<LinkIntent, string> = {
  primary:
    "no-underline hover:bg-action-primary-hover hover:shadow-control-hover active:bg-action-primary-pressed active:shadow-control-pressed focus-visible:focus-ring focus-visible:outline-focus-ring aria-disabled:opacity-55",
  secondary:
    "no-underline hover:bg-action-secondary-hover hover:shadow-control-hover active:bg-action-secondary-pressed active:shadow-control-pressed focus-visible:focus-ring focus-visible:outline-focus-ring aria-disabled:opacity-55",
};

/** An inactive link ignores the pointer; a button that explains itself on press keeps it. */
const INERT_WHEN_DISABLED = "aria-disabled:pointer-events-none";

type ButtonLinkOptions = {
  intent?: LinkIntent;
  /** Keep pointer presses while aria-disabled (the control answers them, e.g. with a hint). */
  isPressableWhenDisabled?: boolean;
};

/** Classes for a link that looks like a DS button (navigation stays a link). */
export function buttonLink({
  intent = "primary",
  isPressableWhenDisabled = false,
}: ButtonLinkOptions = {}): string {
  const inert = isPressableWhenDisabled ? "" : ` ${INERT_WHEN_DISABLED}`;
  return `${buttonRecipe({ intent }).root()} ${NATIVE_STATES[intent]}${inert}`;
}

type ButtonProps = ComponentProps<typeof HexalisButton>;

/** DS button (React Aria). Use `type="submit"` inside forms; `onPress` for actions. */
export function Button(props: ButtonProps) {
  return <HexalisButton {...props} />;
}
