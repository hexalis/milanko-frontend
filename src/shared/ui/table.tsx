import type { ComponentProps, ReactNode } from "react";

type TableProps = {
  /** Accessible name of the table. */
  caption: string;
  head: ReactNode;
  children: ReactNode;
};

/** Horizontally scrollable data table with tabular figures. */
export function Table({ caption, head, children }: TableProps) {
  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <table className="w-full border-collapse text-left text-sm tabular-nums">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>{head}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Th({ children, ...props }: ComponentProps<"th">) {
  return (
    <th
      scope="col"
      className="border-hairline text-ink-muted border-b px-2.5 py-2 text-[11px] font-extrabold tracking-[0.08em] whitespace-nowrap uppercase"
      {...props}
    >
      {children}
    </th>
  );
}

export function Td({ children, ...props }: ComponentProps<"td">) {
  return (
    <td className="border-hairline border-t px-2.5 py-2 align-top" {...props}>
      {children}
    </td>
  );
}

type EmptyRowProps = { columns: number; children: ReactNode };

export function EmptyRow({ columns, children }: EmptyRowProps) {
  return (
    <tr>
      <td colSpan={columns} className="text-ink-muted px-2.5 py-4">
        {children}
      </td>
    </tr>
  );
}

/** Secondary line inside a cell (ids, full names). */
export function CellNote({ children }: { children: ReactNode }) {
  return <span className="text-ink-muted block text-[13px]">{children}</span>;
}
