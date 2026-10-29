"use client";

// Shared chrome for the twin "Total Sales" / "Customer rate" cards: a headline
// with a pill delta, three channel rows, an hourly 6 PM → 2 AM plot and a
// square-swatch legend.

import { Info } from "lucide-react";
import type { ReactNode } from "react";

import { Delta, Num } from "../lib/kit";
import { FAINT, GRID, MUTED } from "../lib/tokens";

export const HOURS = [18, 20, 22, 24, 26] as const;
export const X_DOMAIN = [17.35, 26.6] as const;

export const hourLabel = (h: number) => {
  const hour = Math.round(h) % 24;
  const twelve = hour % 12 === 0 ? 12 : hour % 12;
  return `${twelve} ${hour >= 12 ? "PM" : "AM"}`;
};

/** Precise clock label for fractional hours, e.g. 20.5 → 8:30 PM. */
export const clockLabel = (h: number) => {
  const minutes = Math.round((h % 1) * 60);
  const hour = Math.floor(h) % 24;
  const twelve = hour % 12 === 0 ? 12 : hour % 12;
  return `${twelve}:${String(minutes).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
};

/** Linear interpolation of a polyline at `x`. */
export const valueAt = (points: readonly (readonly [number, number])[], x: number) => {
  for (let k = 1; k < points.length; k += 1) {
    const a = points[k - 1];
    const b = points[k];
    if (a && b && x <= b[0]) {
      const t = (x - a[0]) / (b[0] - a[0] || 1);
      return a[1] + (b[1] - a[1]) * Math.max(0, Math.min(1, t));
    }
  }
  return points.at(-1)?.[1] ?? 0;
};

/** Axes for the hourly plot: dashed hour verticals, solid value rules. */
export const hourlyAxes = (ticks: readonly number[], format: (v: number) => string) => ({
  x: {
    axis: {
      line: false,
      tickLabels: { fontSize: 11.5 },
      ticks: { format: hourLabel, size: 0, values: [...HOURS] },
    },
    grid: { stroke: FAINT, strokeDasharray: "4 4", strokeOpacity: 0.7 },
  },
  y: {
    axis: {
      line: false,
      tickLabels: { fontSize: 11.5 },
      ticks: { format, padding: 14, size: 0, values: [...ticks] },
    },
    grid: { stroke: GRID, strokeOpacity: 1 },
  },
});

export const SalesHeader = ({
  label,
  value,
  format,
  change,
}: {
  label: string;
  value: number;
  format: (n: number) => string;
  change: number;
}) => (
  <div className="flex items-start justify-between gap-3">
    <div>
      <p className="inline-flex items-center gap-1.5 text-[13px]" style={{ color: MUTED }}>
        {label} <Info className="size-3.5" />
      </p>
      <div className="mt-1 flex items-center gap-2">
        <Num value={value} format={format} className="text-[28px] font-bold tracking-[-0.03em]" />
        <span className="rounded-full bg-[#dcfce7] px-2 py-0.5 text-[11px] font-medium text-[#16a34a]">
          +{change.toFixed(2)}%
        </span>
      </div>
    </div>
    <button
      type="button"
      className="mt-1 h-9 shrink-0 rounded-full border border-black/[0.08] px-3.5 text-[12.5px] font-medium text-[#3a3a42] shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
    >
      View Report
    </button>
  </div>
);

export const ChannelRows = ({
  rows,
  format,
}: {
  rows: readonly { name: string; value: number; change: number }[];
  format: (n: number) => string;
}) => (
  <div className="mt-4 space-y-3">
    {rows.map((r) => (
      <div key={r.name} className="flex items-center text-[13px]">
        <span className="flex-1 font-medium">{r.name}</span>
        <Num
          value={r.value}
          format={format}
          className="w-[86px] font-semibold"
          style={{ color: "#55555e" }}
        />
        <span className="w-[72px] text-right text-[12.5px]">
          <Delta value={r.change} variant="circle" />
        </span>
      </div>
    ))}
  </div>
);

export const SquareLegend = ({ items }: { items: readonly { label: string; color: string }[] }) => (
  <div
    className="mt-2 flex items-center justify-center gap-5 text-[12.5px]"
    style={{ color: "#55555e" }}
  >
    {items.map((it) => (
      <span key={it.label} className="inline-flex items-center gap-1.5">
        <span
          className="size-3.5 rounded-[4px] ring-1 ring-black/10"
          style={{ backgroundColor: it.color }}
        />
        {it.label}
      </span>
    ))}
  </div>
);

export const Readout = ({ children }: { children: ReactNode }) => (
  <span className="flex items-center gap-1.5 whitespace-nowrap">{children}</span>
);
