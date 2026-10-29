"use client";

import { defineChart, hexagon } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react/core";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { Car, House, ShoppingBag, Utensils } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { rng } from "../lib/data";
import { Card, ChartSlot, MoreButton, Num, renderer, useCycle } from "../lib/kit";
import { BLUE, GRID, INK, MUTED, ORANGE, PURPLE } from "../lib/tokens";

const COLS = 13;
const ROWS = 14;
const HEIGHT = 300;
const SQRT3 = Math.sqrt(3);

type Kind = 0 | 1 | 2;

interface Cell {
  id: string;
  col: number;
  row: number;
  kind: Kind;
  color: string;
}

const SHADES: Record<Kind, readonly string[]> = {
  0: ["#fb8c3c", "#fdbe8e", "#fca765"],
  1: ["#b862f5", "#d49bf8", "#c47ff6"],
  2: ["#3b8ff0", "#8cbff5", "#b2d4f8", "#d6e8fb", "#e6f1fc"],
};

const LEGEND = [
  { color: ORANGE, label: "Spent", value: 10 },
  { color: PURPLE, label: "Remaining", value: 15 },
  { color: "#5aa3f5", label: "Saved", value: 75 },
] as const;

const CATEGORIES: { icon: LucideIcon; label: string; tint: string; value: number }[] = [
  { icon: ShoppingBag, label: "Shopping", tint: ORANGE, value: 2100 },
  { icon: Utensils, label: "Dining", tint: PURPLE, value: 1250 },
  { icon: Car, label: "Transport", tint: BLUE, value: 550 },
  { icon: House, label: "Bills & Utilities", tint: BLUE, value: 550 },
];

// A blob of hexes: orange core, purple ring, blues fading out to a ragged edge.
const CELLS: Cell[] = (() => {
  const r = rng(8080);
  const out: Cell[] = [];
  const cx = (COLS - 1) / 2;
  const cy = (ROWS - 1) / 2;
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const x = col + (row % 2 === 1 ? 0.5 : 0);
      const d = Math.hypot(x - cx - 0.25, ((row - cy) * 1.5) / SQRT3) + (r() - 0.5) * 1.1;
      const keep = d < 4.6 || r() > (d - 4.6) / 2.2;
      if (keep) {
        let kind: Kind = 2;
        if (d < 2) {
          kind = 0;
        } else if (d < 3.4) {
          kind = 1;
        }
        const shades = SHADES[kind];
        let shade = Math.floor(r() * Math.min(shades.length, 3));
        if (kind === 2) {
          // Blues lighten with distance from the core.
          shade = Math.min(shades.length - 1, Math.max(0, Math.floor(d - 3.6 + r() * 1.8)));
        }
        out.push({ col, color: shades[shade] ?? INK, id: `${row}-${col}`, kind, row });
      }
    }
  }
  return out;
})();

/** Mixes a hex color toward white; `t` = 0 keeps it, 1 is white. */
const fade = (hex: string, t: number) => {
  const n = Number.parseInt(hex.slice(1), 16);
  const ch = [16, 8, 0].map((s) => Math.floor(n / 2 ** s) % 256);
  return `rgb(${ch.map((c) => Math.round(c + (255 - c) * t)).join(",")})`;
};

/** Container width, so hexes can tile exactly at any column width. */
const useWidth = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    const ro = new ResizeObserver(([entry]) => setWidth(entry?.contentRect.width ?? 0));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
};

export const BudgetOverview = () => {
  const [active, pin] = useCycle(3, 2400, 0);
  const [ref, width] = useWidth();

  const definition = useMemo(() => {
    const w = Math.max(1, width);
    // Circumradius that fits the grid in both directions; pointy-top hexes
    // step sqrt(3)·R across and 1.5·R down.
    const radius = Math.min(w / ((COLS + 0.5) * SQRT3), HEIGHT / ((ROWS - 1) * 1.5 + 2));
    const gridW = (COLS + 0.5) * SQRT3 * radius;
    const gridH = ((ROWS - 1) * 1.5 + 2) * radius;
    const ox = (w - gridW) / 2 + (SQRT3 * radius) / 2;
    const oy = (HEIGHT - gridH) / 2 + radius;
    const rows = CELLS.map((c) => ({
      ...c,
      px: ox + (c.col + (c.row % 2 === 1 ? 0.5 : 0)) * SQRT3 * radius,
      py: oy + c.row * 1.5 * radius,
    }));
    return defineChart({
      focusRing: false,
      guides: false,
      margin: 0,
      marks: [
        hexagon(rows, {
          fill: (d) => (d.kind === active ? d.color : fade(d.color, 0.5)),
          key: "id",
          r: radius,
          stroke: "#ffffff",
          strokeWidth: 2,
          x: "px",
          y: "py",
        }),
      ],
      scales: {
        x: { scale: scaleLinear().domain([0, w]) },
        y: { reverse: true, scale: scaleLinear().domain([0, HEIGHT]) },
      },
    });
  }, [active, width]);

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-[17px] font-semibold tracking-[-0.01em]">Budget overview</h3>
          <p className="mt-0.5 flex items-center gap-2 text-[12px]">
            <span style={{ color: MUTED }}>All accounts</span>
            <span className="h-3 w-px" style={{ backgroundColor: GRID }} />
            <span className="font-medium">From last 7 days</span>
          </p>
        </div>
        <MoreButton />
      </div>
      <div ref={ref} className="mt-4">
        <ChartSlot height={HEIGHT}>
          {width > 0 ? (
            <Chart
              definition={definition}
              renderer={renderer}
              height={HEIGHT}
              ariaLabel="Budget split into spent, remaining and saved, as a hexagon field"
              onFocusChange={(p) => {
                const kind = CELLS.find((c) => `${c.row}-${c.col}` === p?.datum.id)?.kind;
                pin(kind ?? null);
              }}
            />
          ) : null}
        </ChartSlot>
      </div>
      <div className="mt-4 grid grid-cols-3">
        {LEGEND.map((l, i) => (
          <button
            key={l.label}
            type="button"
            onMouseEnter={() => pin(i)}
            onMouseLeave={() => pin(null)}
            className="flex flex-col items-center border-black/[0.06] transition-opacity [&:not(:first-child)]:border-l"
            style={{ opacity: i === active ? 1 : 0.55 }}
          >
            <span className="inline-flex items-center gap-1.5 text-[13px]" style={{ color: MUTED }}>
              <span className="h-1 w-3 rounded-full" style={{ backgroundColor: l.color }} />
              {l.label}
            </span>
            <Num
              value={l.value}
              format={(n) => `${Math.round(n)}%`}
              className="mt-1 text-[20px] font-semibold"
            />
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-col gap-2">
        {CATEGORIES.map(({ icon: Icon, label, tint, value }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-2xl bg-[#f6f6f7] px-3 py-2.5 ring-1 ring-black/[0.04]"
          >
            <span
              className="inline-flex size-8 items-center justify-center rounded-full"
              style={{
                backgroundColor: fade(tint, 0.88),
                boxShadow: `inset 0 0 0 1px ${fade(tint, 0.7)}`,
                color: tint,
              }}
            >
              <Icon className="size-4" strokeWidth={2.4} />
            </span>
            <span className="flex-1 text-[13px]" style={{ color: "#4a4a52" }}>
              {label}
            </span>
            <Num
              value={value}
              format={(n) => `$${Math.round(n).toLocaleString("en-US")}`}
              className="text-[13px] font-medium"
            />
          </div>
        ))}
      </div>
    </Card>
  );
};
