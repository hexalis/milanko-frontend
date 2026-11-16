import { tableRecipe } from "@hexalis/components/themes";
import { useId, type ComponentProps, type ReactNode } from "react";
import { ScrollRegion } from "./scroll-region";

/*
 * Native table with the DS table recipe. The DS Table is a React Aria collection; these tables are
 * read-only server-rendered records, so they keep native markup and map row hover to :hover.
 */
const recipe = tableRecipe();
const CONTAINER = recipe.container();
const TABLE = `${recipe.table()} text-left`;
const COLUMN = recipe.column();
const ROW = "group/row";
const CELL = `${recipe.cell()} align-top group-hover/row:bg-bg-hover`;

type TableProps = {
  /** Accessible name of the table. */
  caption: string;
  head: ReactNode;
  children: ReactNode;
};

/** A wide table scrolls in its container, which then takes focus and the caption as its name. */
export function Table({ caption, head, children }: TableProps) {
  const captionId = useId();
  return (
    <ScrollRegion className={CONTAINER} labelledBy={captionId}>
      <table data-tour="data-table" className={TABLE}>
        <caption id={captionId} className="sr-only">
          {caption}
        </caption>
        <thead>
          <tr>{head}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </ScrollRegion>
  );
}

export function Tr({ children, ...props }: ComponentProps<"tr">) {
  return (
    <tr className={ROW} {...props}>
      {children}
    </tr>
  );
}

export function Th({ children, ...props }: ComponentProps<"th">) {
  return (
    <th scope="col" className={COLUMN} {...props}>
      {children}
    </th>
  );
}

export function Td({ children, ...props }: ComponentProps<"td">) {
  return (
    <td className={CELL} {...props}>
      {children}
    </td>
  );
}

type EmptyRowProps = { columns: number; children: ReactNode };

export function EmptyRow({ columns, children }: EmptyRowProps) {
  return (
    <tr>
      <td colSpan={columns} className="text-body-s text-text-tertiary px-4 py-4">
        {children}
      </td>
    </tr>
  );
}

/** Secondary line inside a cell (ids, full names). */
export function CellNote({ children }: { children: ReactNode }) {
  return <span className="text-caption text-text-tertiary block">{children}</span>;
}
