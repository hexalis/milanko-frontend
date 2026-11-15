import Link from "next/link";
import type { ComponentProps } from "react";

const TEXT_LINK =
  "font-bold text-accent underline decoration-accent/30 underline-offset-2 hover:decoration-accent";

/** In-app link styled as text. */
export function TextLink(props: ComponentProps<typeof Link>) {
  return <Link className={TEXT_LINK} {...props} />;
}

type ExternalLinkProps = Omit<ComponentProps<"a">, "target" | "rel">;

/** Link to another site; opens in a new tab. */
export function ExternalLink({ children, ...props }: ExternalLinkProps) {
  return (
    <a className={TEXT_LINK} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
      <span aria-hidden="true"> ↗</span>
      <span className="sr-only"> (abre en otra pestaña)</span>
    </a>
  );
}
