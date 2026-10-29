"use client";

import { barY, defineChart } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react/core";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { Sparkles, TrendingUp } from "lucide-react";
import { useMemo } from "react";

import { rng } from "../lib/data";
import { Card, ChartSlot, MoreButton, Num, renderer, useCycle } from "../lib/kit";
import { GREEN, THEME } from "../lib/tokens";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const PER_DAY = 7;
const BARS = DAYS.length * PER_DAY;
const MID = [46, 60, 60, 41, 50] as const;
const PEAK = [48, 86, 104, 122, 86, 58, 104] as const;
const TIER_FILL = { dark: "#16a34a", light: "#b9ebc9", mid: "#5fc683" } as const;
type Tier = keyof typeof TIER_FILL;

/** One week of 49 four-hour buckets: a quiet floor, one mid-week swell and
 * one surge. Each week moves both, so bars spring between weeks. */
const week = (seed: number, midAt: number, peakAt: number) => {
  const r = rng(seed);
  return Array.from({ length: BARS }, (_, i) => {
    const m = MID[i - midAt];
    const p = PEAK[i - peakAt];
    let tier: Tier = "light";
    let v = 6 + r() * 17;
    if (p !== undefined) {
      tier = "dark";
      v = p;
    } else if (m !== undefined) {
      tier = "mid";
      v = m;
    }
    return { i, tier, v };
  });
};

const WEEKS = [
  { delta: 15.3, rows: week(41, 18, 31), total: 2350 },
  { delta: 9.8, rows: week(42, 8, 22), total: 2085 },
  { delta: 21.6, rows: week(43, 26, 38), total: 2712 },
] as const;

const HEIGHT = 150;
const MARGIN = { bottom: 26, left: 0, right: 0, top: 4 };

const InvestmentGrowthBody = () => {
  const [w, pin] = useCycle(WEEKS.length, 3200);
  const current = WEEKS[w] ?? WEEKS[0];

  const definition = useMemo(
    () =>
      defineChart({
        margin: MARGIN,
        marks: [
          barY(current.rows, {
            fill: (d) => TIER_FILL[d.tier],
            key: "i",
            radius: [2.5, 2.5, 0, 0],
            x: "i",
            y: "v",
          }),
        ],
        scales: {
          x: {
            axis: {
              line: false,
              tickLabels: { fontSize: 12 },
              ticks: {
                format: (v: number) => DAYS[Math.floor(v / PER_DAY)] ?? "",
                size: 0,
                values: DAYS.map((_, d) => d * PER_DAY + 3),
              },
            },
            scale: scaleBand<number>()
              .domain(Array.from({ length: BARS }, (_, i) => i))
              .paddingInner(0.32)
              .paddingOuter(0),
          },
          y: { axis: false, scale: scaleLinear().domain([0, 126]) },
        },
        theme: THEME,
      }),
    [current],
  );

  return (
    <>
      <div className="flex items-start justify-between">
        <h3 className="pt-1 text-[16px] font-semibold tracking-[-0.01em]">Investment Growth</h3>
        <MoreButton />
      </div>
      <p className="mt-3 text-[13px]" style={{ color: "#52525b" }}>
        Total invested this week
      </p>
      <Num
        value={current.total}
        format={(n) => `$${Math.round(n).toLocaleString("en-US")}`}
        className="block text-[28px] font-bold tracking-[-0.03em]"
      />
      <p className="mt-0.5 inline-flex items-center gap-1 text-[12px]">
        <TrendingUp className="size-3.5" style={{ color: GREEN }} strokeWidth={2.4} />
        <Num
          value={current.delta}
          format={(n) => `${n.toFixed(1)}%`}
          className="font-medium"
          style={{ color: GREEN }}
        />
        <span style={{ color: "#52525b" }}>Last Week</span>
      </p>
      <ChartSlot height={HEIGHT} className="mt-4">
        <div onMouseEnter={() => pin(w)} onMouseLeave={() => pin(null)}>
          <Chart
            definition={definition}
            renderer={renderer}
            height={HEIGHT}
            ariaLabel="Amount invested through the week"
          />
        </div>
      </ChartSlot>
      <div className="mt-3 flex items-center gap-2 rounded-xl border border-black/[0.07] bg-[#fafafa] px-3 py-2.5 text-[12px]">
        <Sparkles className="size-4 shrink-0 fill-[#f97316] text-[#f97316]" />
        <p className="leading-snug">
          <span className="font-semibold">Insights:</span>{" "}
          <span className="text-[#52525b]">Portfolio grew steadily towards the weekend</span>
        </p>
      </div>
    </>
  );
};

/** Card is the activation provider, so the cycling body must render inside it. */
export const InvestmentGrowth = () => (
  <Card>
    <InvestmentGrowthBody />
  </Card>
);
