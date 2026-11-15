import type { ComponentProps } from "react";
import { tv, type VariantProps } from "tailwind-variants";

/** Clay button recipe; also styles links that act as buttons. */
export const button = tv({
  base: [
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-2.5",
    "text-[15px] font-extrabold whitespace-nowrap no-underline transition-[transform,box-shadow]",
    "active:translate-y-[3px] disabled:cursor-not-allowed disabled:opacity-55",
    "aria-disabled:pointer-events-none aria-disabled:opacity-55",
  ],
  variants: {
    intent: {
      primary: "bg-go text-white shadow-go hover:bg-go-hover active:shadow-none",
      secondary:
        "border border-hairline bg-surface text-ink shadow-clay hover:bg-surface-sky active:shadow-clay-pressed",
    },
  },
  defaultVariants: { intent: "primary" },
});

type ButtonProps = VariantProps<typeof button> & ComponentProps<"button">;

export function Button({ intent, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={button({ intent })} {...props} />;
}
