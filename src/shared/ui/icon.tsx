import { tv, type VariantProps } from "tailwind-variants";
import { withBasePath } from "@/shared/lib/base-path";

/** Phosphor icons from the POC sprite (public/icons/sprite.svg); ids are written without the "i-" prefix. */
const SPRITE = withBasePath("/icons/sprite.svg");

const icon = tv({
  base: "inline-block shrink-0 fill-current align-[-0.15em]",
  variants: {
    size: { sm: "size-3.5", md: "size-[1.15em]", lg: "size-6" },
  },
  defaultVariants: { size: "md" },
});

type IconProps = VariantProps<typeof icon> & { name: string };

/** Decorative icon; the text beside it always carries the meaning. */
export function Icon({ name, size }: IconProps) {
  return (
    <svg className={icon({ size })} aria-hidden="true" focusable="false">
      <use href={`${SPRITE}#i-${name}`} />
    </svg>
  );
}
