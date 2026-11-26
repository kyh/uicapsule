import { ArrowDown, ArrowUp } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";

import { Icon } from "./icon";

export interface Column<T> {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  sort?: (row: T) => number | string;
  num?: boolean;
  sans?: boolean;
  dim?: boolean;
  optional?: boolean;
}

interface TableProps<T> {
  label: string;
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  selected?: string | null;
  onSelect?: (key: string) => void;
  tone?: (row: T) => "fail" | undefined;
  initialSort?: { key: string; desc: boolean };
  empty?: ReactNode;
}

const collator = new Intl.Collator("en", { numeric: true });

const compare = (a: number | string, b: number | string) => collator.compare(String(a), String(b));

/** A sortable table over typed columns; the picked row is washed, and optional columns fold away on a phone. */
export const Table = <T,>({
  label,
  rows,
  columns,
  rowKey,
  selected,
  onSelect,
  tone,
  initialSort,
  empty,
}: TableProps<T>) => {
  const [sort, setSort] = useState(initialSort ?? null);
  const column = columns.find((item) => item.key === sort?.key);

  const sorted =
    column?.sort && sort
      ? rows.toSorted((a, b) => {
          const order = compare(column.sort?.(a) ?? 0, column.sort?.(b) ?? 0);

          return sort.desc ? -order : order;
        })
      : rows;

  return (
    <div className="hx-table-wrap">
      <table aria-label={label} className="hx-table">
        <thead>
          <tr>
            {columns.map((item) => {
              const active = sort?.key === item.key;
              const direction = sort?.desc === true ? "descending" : "ascending";

              return (
                <th
                  aria-sort={active ? direction : undefined}
                  data-num={item.num === true || undefined}
                  data-optional={item.optional === true || undefined}
                  key={item.key}
                  scope="col"
                >
                  {item.sort ? (
                    <button
                      className="hx-sort"
                      onClick={() => {
                        setSort({ desc: active ? !sort?.desc : true, key: item.key });
                      }}
                      type="button"
                    >
                      {item.label}
                      {active ? <Icon icon={sort?.desc ? ArrowDown : ArrowUp} size={14} /> : null}
                    </button>
                  ) : (
                    item.label
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 && empty ? (
            <tr data-empty>
              <td colSpan={columns.length}>{empty}</td>
            </tr>
          ) : null}
          {sorted.map((row) => {
            const key = rowKey(row);

            return (
              <tr
                data-selected={onSelect && key === selected ? true : undefined}
                data-clickable={onSelect ? true : undefined}
                data-tone={tone?.(row)}
                key={key}
                onClick={() => onSelect?.(key)}
              >
                {columns.map((item, index) => (
                  <td
                    data-dim={item.dim === true || undefined}
                    data-num={item.num === true || undefined}
                    data-optional={item.optional === true || undefined}
                    data-sans={item.sans === true || undefined}
                    key={item.key}
                  >
                    {index === 0 && onSelect ? (
                      <button
                        aria-label={`Select ${key}`}
                        aria-pressed={key === selected}
                        className="hx-sort"
                        onClick={(event) => {
                          event.stopPropagation();
                          onSelect(key);
                        }}
                        type="button"
                      >
                        {item.render(row)}
                      </button>
                    ) : (
                      item.render(row)
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
