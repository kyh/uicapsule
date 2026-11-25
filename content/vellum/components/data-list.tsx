import type { ReactNode } from "react";

/** Label and value pairs, one per 36px row. */
export const DataList = ({ items }: { items: readonly { label: string; value: ReactNode }[] }) => (
  <dl className="v-dl">
    {items.map((item) => (
      <div key={item.label}>
        <dt>{item.label}</dt>
        <dd>{item.value}</dd>
      </div>
    ))}
  </dl>
);
