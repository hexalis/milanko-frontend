import { linkRecipe } from "@hexalis/components/themes";
import Link from "next/link";
import type { ComponentProps } from "react";

/* DS inline link; hover and focus mapped from React Aria's data-* states to pseudo-classes. */
const TEXT_LINK = `${linkRecipe({ variant: "inline" }).root()} font-semibold hover:text-text-brand hover:decoration-2 focus-visible:focus-ring focus-visible:outline-focus-ring`;

/** In-app link styled as text (keeps Next's prefetch and client navigation). */
export function TextLink(props: ComponentProps<typeof Link>) {
  return <Link className={TEXT_LINK} {...props} />;
}

type ExternalLinkProps = Omit<ComponentProps<"a">, "target" | "rel"> & {
  /** Read to screen readers after the text, in the page's language. */
  newTabHint?: string;
};

/** Link to another site; opens in a new tab. */
export function ExternalLink({
  children,
  newTabHint = "(abre en otra pestaña)",
  ...props
}: ExternalLinkProps) {
  return (
    <a className={TEXT_LINK} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
      <span aria-hidden="true">↗</span>
      <span className="sr-only"> {newTabHint}</span>
    </a>
  );
}
