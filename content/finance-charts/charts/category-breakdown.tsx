"use client";

import { barY, defineChart, text } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react/core";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { ArrowUp, Settings } from "lucide-react";
import { useMemo } from "react";

import { Card, ChartSlot, Label, Num, renderer, useCycle } from "../lib/kit";
import { GREEN, INK, MUTED, THEME } from "../lib/tokens";

const CATEGORIES = [
  { color: "#a43ff2", label: "Rent & Utilities", pct: 32, ticks: 19 },
  { color: "#1f82ee", label: "Groceries", pct: 24, ticks: 14 },
  { color: "#f7802a", label: "Subscription", pct: 20, ticks: 12 },
  { color: "#1fae4f", label: "Saving account", pct: 24, ticks: 14 },
] as const;

/** Mixes a hex color toward white; `t` = 0 keeps it, 1 is white. */
const tint = (hex: string, t: number) => {
  const n = Number.parseInt(hex.slice(1), 16);
  const ch = [16, 8, 0].map((s) => Math.floor(n / 2 ** s) % 256);
  return `rgb(${ch.map((c) => Math.round(c + (255 - c) * t)).join(",")})`;
};

interface Slot {
  id: string;
  cat: number;
  marker: boolean;
  /** 0 light, 1 mid, 2 full: the three strengths each run steps through. */
  tier: number;
}

const SLOTS: Slot[] = CATEGORIES.flatMap((c, cat) => [
  { cat, id: `${cat}-m`, marker: true, tier: 0 },
  ...Array.from({ length: c.ticks }, (_, i) => ({
    cat,
    id: `${cat}-${i}`,
    marker: false,
    tier: Math.min(2, Math.floor((i / c.ticks) * 3)),
  })),
]);
const TIER_MIX = [0.68, 0.38, 0] as const;

const HEIGHT = 140;

const Stat = ({ label, value, change }: { label: string; value: number; change: number }) => (
  <div className="min-w-0">
    <Label>{label}</Label>
    <Num value={value} className="mt-0.5 block text-[22px] font-bold tracking-[-0.03em]" />
    <p className="mt-1.5 flex items-center gap-1.5 text-[12px]" style={{ color: MUTED }}>
      <span
        className="inline-flex items-center gap-1 rounded-full bg-[#e7f8ec] px-1.5 py-0.5 font-semibold"
        style={{ color: GREEN }}
      >
        <span
          className="inline-flex size-3 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: GREEN }}
        >
          <ArrowUp className="size-2" strokeWidth={3.5} />
        </span>
        <Num value={change} format={(n) => `$${Math.round(n).toLocaleString("en-US")}`} />
      </span>
      This month
    </p>
  </div>
);

export const CategoryBreakdown = () => {
  const [active, pin] = useCycle(CATEGORIES.length, 2200, 0);

  const definition = useMemo(() => {
    const color = (d: Slot) => {
      const base = CATEGORIES[d.cat]?.color ?? INK;
      if (d.marker) {
        return tint(base, 0.7);
      }
      const mix = TIER_MIX[d.tier] ?? 0;
      // Categories not in focus wash out toward their lightest tier.
      return tint(base, d.cat === active ? mix : 0.55 + mix * 0.45);
    };
    const labels = CATEGORIES.map((c, cat) => ({ ...c, cat, slot: `${cat}-m` }));
    return defineChart({
      focusRing: false,
      guides: false,
      margin: 0,
      marks: [
        barY(SLOTS, {
          fill: color,
          key: "id",
          radius: 2,
          x: "id",
          y1: 0,
          y2: (d) => {
            if (d.marker) {
              return 1;
            }
            return d.cat === active ? 0.64 : 0.56;
          },
        }),
        text(labels, {
          anchor: "start",
          dx: 6,
          fill: MUTED,
          fontSize: 10.5,
          key: (d) => `${d.cat}-label`,
          text: "label",
          x: "slot",
          y: () => 0.9,
        }),
        text(labels, {
          anchor: "start",
          dx: 6,
          fill: (d) => (d.cat === active ? INK : "#6b6b73"),
          fontSize: 13,
          fontWeight: 500,
          key: (d) => `${d.cat}-pct`,
          text: (d) => `${d.pct}%`,
          x: "slot",
          y: () => 0.76,
        }),
      ],
      scales: {
        x: {
          scale: scaleBand<string>()
            .domain(SLOTS.map((s) => s.id))
            .paddingInner(0.42)
            .paddingOuter(0),
        },
        y: { scale: scaleLinear().domain([0, 1]) },
      },
      theme: THEME,
    });
  }, [active]);

  return (
    <Card>
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Total revenue" value={18_645.16} change={1637} />
        <Stat label="Monthly expenses" value={6364.81} change={343} />
      </div>
      <div className="mt-4 border-t border-black/[0.06] pt-4">
        <ChartSlot height={HEIGHT}>
          <div onMouseLeave={() => pin(null)}>
            <Chart
              definition={definition}
              renderer={renderer}
              height={HEIGHT}
              ariaLabel="Monthly spending split by category"
              onFocusChange={(p) => {
                if (p) {
                  pin(Number(String(p.xValue).split("-")[0]));
                }
              }}
            />
          </div>
        </ChartSlot>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-black/[0.08] px-3.5 text-[13px] font-medium text-[#3a3a42]"
        >
          <Settings className="size-4 text-[#8a8a93]" />
          Manage balance
        </button>
      </div>
    </Card>
  );
};
