"use client";

import { defineChart, rect } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react/core";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { Download, PieChart, Share } from "lucide-react";
import { useMemo } from "react";

import { rng, usd, WEEKDAYS } from "../lib/data";
import { CardHeader, Card, ChartSlot, MoreButton, Num, renderer, useCycle } from "../lib/kit";
import { MUTED, THEME, VIOLET } from "../lib/tokens";

const TIER_FILL = { dark: "#c470fb", light: "#e4c2fc", mid: "#d59cf9" } as const;
type Tier = keyof typeof TIER_FILL;

// Spending sessions through the week (in days): start, length, intensity.
const BASE: readonly (readonly [number, number, Tier])[] = [
  [2.31, 0.12, "light"],
  [2.82, 0.13, "mid"],
  [3.13, 0.36, "light"],
  [3.49, 0.1, "dark"],
  [3.9, 0.86, "light"],
  [5, 0.38, "dark"],
  [5.56, 0.56, "light"],
  [6.42, 0.2, "dark"],
  [6.66, 0.07, "dark"],
];

interface Session {
  id: number;
  tier: Tier;
  x1: number;
  x2: number;
}

/** Re-deal the same sessions (same order, same intensity) across another
 * week, so each one slides and stretches into place. */
const deal = (seed: number): Session[] => {
  const r = rng(seed);
  let cursor = 0.4 + r() * 1.4;
  const raw = BASE.map(([, len, tier], id) => {
    const x1 = cursor + 0.06 + r() * 0.4;
    const x2 = x1 + len * (0.6 + r() * 0.9);
    cursor = x2;
    return { id, tier, x1, x2 };
  });
  const end = raw.at(-1)?.x2 ?? 7;
  const fit = end > 6.9 ? 6.9 / end : 1;
  return raw.map((s) => ({ ...s, x1: s.x1 * fit, x2: s.x2 * fit }));
};

const WEEKS = [
  {
    avg: 124.99,
    budget: 64,
    sessions: BASE.map(([x1, len, tier], id) => ({ id, tier, x1, x2: x1 + len })),
    total: 874.92,
  },
  { avg: 108.91, budget: 56, sessions: deal(7), total: 762.37 },
  { avg: 135.9, budget: 70, sessions: deal(19), total: 951.3 },
] as const;

const TIERS: Tier[] = ["light", "mid", "dark"];
const HEIGHT = 150;
const MARGIN = { bottom: 26, left: 0, right: 0, top: 0 };

export const FinanceOverviewTimeline = () => {
  const [w, pin] = useCycle(WEEKS.length, 3000);
  const week = WEEKS[w] ?? WEEKS[0];

  const definition = useMemo(
    () =>
      defineChart({
        margin: MARGIN,
        marks: [
          rect([{ id: "base" }], {
            fill: "#f5e9fe",
            inset: 0,
            key: "id",
            x1: () => 0,
            x2: () => WEEKDAYS.length,
            y1: () => 0,
            y2: () => 0.75,
          }),
          ...TIERS.map((tier) =>
            rect(
              week.sessions.filter((s) => s.tier === tier),
              {
                fill: TIER_FILL[tier],
                id: `fot-${tier}`,
                inset: 0,
                key: "id",
                x: (d) => (d.x1 + d.x2) / 2,
                x1: "x1",
                x2: "x2",
                y1: () => 0,
                y2: () => 1,
              },
            ),
          ),
        ],
        scales: {
          x: {
            axis: {
              line: false,
              tickLabels: { fontSize: 12 },
              ticks: {
                format: (v: number) => WEEKDAYS[Math.floor(v)] ?? "",
                size: 0,
                values: WEEKDAYS.map((_, i) => i + 0.5),
              },
            },
            scale: scaleLinear().domain([0, WEEKDAYS.length]),
          },
          y: { axis: false, scale: scaleLinear().domain([0, 1.04]) },
        },
        theme: THEME,
      }),
    [week],
  );

  const stats = [
    { format: (n: number) => usd(n), label: "Total spending", value: week.total },
    { format: (n: number) => usd(n), label: "Avg daily spending", value: week.avg },
    { format: (n: number) => `${Math.round(n)}%`, label: "Budget status", value: week.budget },
  ];

  return (
    <Card>
      <CardHeader
        icon={PieChart}
        color={VIOLET}
        title="Finance overview"
        subtitle="Track your income and expenses."
        actions={<MoreButton />}
      />
      <div className="mt-5 grid grid-cols-3 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="min-w-0">
            <p className="truncate text-[11px]" style={{ color: MUTED }}>
              {s.label}
            </p>
            <Num
              value={s.value}
              format={s.format}
              className="mt-0.5 block text-[19px] font-bold tracking-[-0.03em]"
            />
          </div>
        ))}
      </div>
      <ChartSlot height={HEIGHT} className="mt-4">
        <div onMouseEnter={() => pin(w)} onMouseLeave={() => pin(null)}>
          <Chart
            definition={definition}
            renderer={renderer}
            height={HEIGHT}
            ariaLabel="Spending sessions across the week"
          />
        </div>
      </ChartSlot>
      <div className="mt-4 flex items-center justify-between gap-2">
        <button
          type="button"
          className="inline-flex h-8 items-center gap-1.5 rounded-full border border-black/[0.08] px-3 text-[12px] font-medium text-[#3a3a42]"
        >
          <Download className="size-3.5" style={{ color: MUTED }} />
          Export report
        </button>
        <button
          type="button"
          className="inline-flex h-8 items-center gap-1.5 rounded-full border border-black/[0.08] px-3 text-[12px] font-medium text-[#3a3a42]"
        >
          <Share className="size-3.5" style={{ color: MUTED }} />
          Share with friends
        </button>
      </div>
    </Card>
  );
};
