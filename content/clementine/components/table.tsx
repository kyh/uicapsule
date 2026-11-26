import type { ReactNode } from "react";

import "./table.css";

export interface TableColumn<T> {
  key: string;
  header: ReactNode;
  label?: string;
  numeric?: boolean;
  render: (row: T) => ReactNode;
}

interface TableProps<T> {
  caption: string;
  columns: readonly TableColumn<T>[];
  rows: readonly T[];
  rowKey: (row: T) => string;
  rowTone?: (row: T) => "danger" | undefined;
}

/** A data table. Below 600px each row stacks into label and value pairs, so nothing scrolls sideways. */
export const Table = <T,>({ caption, columns, rows, rowKey, rowTone }: TableProps<T>) => (
  <div className="cl-table-wrap">
    <table className="cl-table">
      <caption className="cl-sr">{caption}</caption>
      <thead>
        <tr>
          {columns.map((column) => (
            <th data-num={column.numeric === true || undefined} key={column.key} scope="col">
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr data-tone={rowTone?.(row)} key={rowKey(row)}>
            {columns.map((column) => (
              <td
                data-label={column.label}
                data-num={column.numeric === true || undefined}
                key={column.key}
              >
                {column.render(row)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
