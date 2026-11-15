import type { ReactNode } from "react";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardHeadings,
  CardRoot,
  CardTitle,
} from "./hexalis";

type PanelProps = {
  /** Panel heading; rendered as an h2. */
  title?: string;
  /** Muted line under the heading (counts, units, period). */
  meta?: ReactNode;
  children: ReactNode;
};

/** DS elevated card holding a record: a table, a chart or a form. */
export function Panel({ title, meta, children }: PanelProps) {
  return (
    <CardRoot variant="elevated" className="min-w-0">
      {title ? (
        <CardHeader>
          <CardHeadings>
            <CardTitle className="text-heading-h3 font-display">{title}</CardTitle>
            {meta ? <CardDescription>{meta}</CardDescription> : null}
          </CardHeadings>
        </CardHeader>
      ) : null}
      <CardContent>{children}</CardContent>
    </CardRoot>
  );
}
