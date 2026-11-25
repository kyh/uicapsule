import type { ReactNode } from "react";

export interface DataItem {
  label: string;
  value: ReactNode;
}

/** A definition list of named facts, ruled between rows. */
export const DataList = ({ items }: { items: DataItem[] }) => (
  <dl className="hx-dl">
    {items.map((item) => (
      <div key={item.label}>
        <dt className="hx-label-sm">{item.label}</dt>
        <dd className="hx-code">{item.value}</dd>
      </div>
    ))}
  </dl>
);

/** A ruled grid of named facts that folds to two columns on narrow screens. */
export const Facts = ({ items }: { items: DataItem[] }) => (
  <dl className="hx-facts">
    {items.map((item) => (
      <div key={item.label}>
        <dt className="hx-label-sm hx-ink-3">{item.label}</dt>
        <dd className="hx-code">{item.value}</dd>
      </div>
    ))}
  </dl>
);
