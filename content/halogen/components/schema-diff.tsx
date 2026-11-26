import { ArrowRight } from "lucide-react";

import { Icon } from "./icon";
import { Select } from "./select";
import type { SelectOption } from "./select";
import { Tag } from "./tag";
import type { TagTone } from "./tag";

export type DriftKind = "renamed" | "retyped" | "added" | "dropped";

export interface DriftColumn {
  name: string;
  type: string;
}

export interface DriftRow<T extends string> {
  id: string;
  kind: DriftKind;
  before?: DriftColumn;
  after?: DriftColumn;
  options: SelectOption<T>[];
}

const TONE = {
  added: "ok",
  dropped: "fail",
  renamed: "warn",
  retyped: "warn",
} as const satisfies Record<DriftKind, TagTone>;

const Side = ({ column }: { column?: DriftColumn }) =>
  column ? (
    <span className="hx-diff-col">
      <span className="hx-code">{column.name}</span>
      <span className="hx-code-sm hx-ink-3">{column.type}</span>
    </span>
  ) : (
    <span className="hx-code-sm hx-ink-3">absent</span>
  );

interface SchemaDiffProps<T extends string> {
  label: string;
  from: string;
  to: string;
  rows: DriftRow<T>[];
  choices: Record<string, T>;
  onChoose: (id: string, value: T) => void;
  locked?: boolean;
}

/** Two versions of a table's columns side by side, one row per change, each with its own resolution. */
export const SchemaDiff = <T extends string>({
  label,
  from,
  to,
  rows,
  choices,
  onChoose,
  locked,
}: SchemaDiffProps<T>) => (
  <div className="hx-table-wrap">
    <table aria-label={label} className="hx-table hx-diff">
      <thead>
        <tr>
          <th scope="col">Change</th>
          <th scope="col">{from}</th>
          <th aria-hidden scope="col" />
          <th scope="col">{to}</th>
          <th scope="col">Resolve as</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr data-kind={row.kind} key={row.id}>
            <td>
              <Tag tone={TONE[row.kind]}>{row.kind}</Tag>
            </td>
            <td>
              <Side column={row.before} />
            </td>
            <td aria-hidden className="hx-diff-arrow">
              <Icon icon={ArrowRight} size={14} />
            </td>
            <td>
              <Side column={row.after} />
            </td>
            <td className="hx-diff-pick">
              {locked === true ? (
                <span className="hx-code-sm">
                  {row.options.find((option) => option.value === choices[row.id])?.label}
                </span>
              ) : (
                <Select
                  hideLabel
                  label={`Resolve ${row.after?.name ?? row.before?.name ?? row.id}`}
                  onValueChange={(value) => {
                    onChoose(row.id, value);
                  }}
                  options={row.options}
                  size="sm"
                  value={choices[row.id] ?? row.options[0]?.value ?? ("" as T)}
                />
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
