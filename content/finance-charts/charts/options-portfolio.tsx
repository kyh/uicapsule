"use client";

import { barY, defineChart, text } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react/core";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { Activity, ChartColumnBig, ChartLine, ChartPie, Coins } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { useId, useMemo } from "react";

import { usd, walk } from "../lib/data";
import { Card, ChartSlot, IconTile, Num, muted, renderer, useCycle } from "../lib/kit";
import { BLUE, GREEN, INK, MUTED, PURPLE, SPRING } from "../lib/tokens";

const BARS = 48;
const HEIGHT = 200;
const REST = 0.72;

const GROUPS = [
  { fill: "#e7f1fd", label: "Cash & equivalents", share: 42, stroke: "#b9d7f8" },
  { fill: "#7db6f6", label: "Equities", share: 31, stroke: "#5c9fef" },
  { fill: "#2f88f1", label: "Fixed income", share: 27, stroke: "#196ed9" },
] as const;

// Bar index where each allocation starts.
const STARTS = (() => {
  const out: number[] = [];
  let acc = 0;
  for (const g of GROUPS) {
    out.push(Math.round((acc / 100) * BARS));
    acc += g.share;
  }
  return out;
})();

const groupOf = (i: number) => {
  let g = 0;
  for (const [k, s] of STARTS.entries()) {
    if (i >= s) {
      g = k;
    }
  }
  return g;
};

const TREND = walk(BARS, 9, { drift: 0.004, max: 0.74, min: 0.3, start: 0.45, vol: 0.06 });
const bars = Array.from({ length: BARS }, (_, i) => i);

const STATS: {
  label: string;
  value: number;
  format: (n: number) => string;
  icon: LucideIcon;
  color: string;
}[] = [
  { color: PURPLE, format: (n) => usd(n), icon: Coins, label: "Cash balance", value: 10_472.95 },
  {
    color: BLUE,
    format: (n) => `${n.toFixed(2)}%`,
    icon: Activity,
    label: "Total return",
    value: 5.86,
  },
  { color: GREEN, format: (n) => `${Math.round(n)}`, icon: ChartPie, label: "Assets", value: 16 },
];

const MODES: LucideIcon[] = [ChartColumnBig, ChartLine];

export const OptionsPortfolio = () => {
  const [mode, pin] = useCycle(MODES.length, 3400);
  const id = useId();

  const definition = useMemo(() => {
    const rows = bars.map((i) => {
      const group = groupOf(i);
      const marker = STARTS[group] === i;
      let h = mode === 0 ? REST : (TREND[i] ?? REST);
      if (marker) {
        h = 1;
      }
      return { group, h, i };
    });
    const labels = GROUPS.map((g, k) => ({ ...g, i: STARTS[k] ?? 0, k }));
    return defineChart({
      guides: false,
      margin: { bottom: 1, left: 1, right: 1, top: 1 },
      marks: [
        barY(rows, {
          fill: (d) => GROUPS[d.group]?.fill ?? "#e7f1fd",
          key: "i",
          radius: 3,
          stroke: (d) => GROUPS[d.group]?.stroke ?? "#b9d7f8",
          strokeWidth: 1,
          x: "i",
          y: "h",
        }),
        text(labels, {
          anchor: "start",
          dx: 5,
          fill: MUTED,
          fontSize: 11,
          key: "k",
          text: "label",
          x: "i",
          y: () => 0.94,
        }),
        text(labels, {
          anchor: "start",
          dx: 5,
          fill: INK,
          fontSize: 12,
          fontWeight: 500,
          id: "shares",
          key: "k",
          text: (d) => `${d.share}%`,
          x: "i",
          y: () => 0.84,
        }),
      ],
      scales: {
        x: {
          axis: false,
          scale: scaleBand<number>().domain(bars).paddingInner(0.38).paddingOuter(0),
        },
        y: { axis: false, scale: scaleLinear().domain([0, 1]) },
      },
    });
  }, [mode]);

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-medium tracking-[0.02em] uppercase" style={muted}>
            Options portfolio
          </p>
          <Num
            value={24_835.58}
            className="mt-0.5 block text-[28px] font-semibold tracking-[-0.03em]"
          />
        </div>
        <div className="flex rounded-full bg-[#f2f2f5] p-0.5">
          {MODES.map((Icon, i) => (
            <button
              key={Icon.displayName ?? i}
              type="button"
              aria-label={i === 0 ? "Bar view" : "Trend view"}
              onClick={() => pin(i)}
              className="relative inline-flex h-7 w-10 items-center justify-center rounded-full"
              style={{ color: i === mode ? INK : MUTED }}
            >
              {i === mode ? (
                <motion.span
                  layoutId={`${id}-thumb`}
                  transition={SPRING}
                  className="absolute inset-0 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1)] ring-1 ring-black/[0.04]"
                />
              ) : null}
              <Icon className="relative size-4" strokeWidth={2.4} />
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {STATS.map((s) => (
          <div key={s.label} className="min-w-0">
            <IconTile icon={s.icon} color={s.color} size={30} className="!rounded-full" />
            <div className="mt-2 min-w-0">
              <p className="truncate text-[12px]" style={muted}>
                {s.label}
              </p>
              <Num
                value={s.value}
                format={s.format}
                className="block truncate text-[15px] font-semibold"
              />
            </div>
          </div>
        ))}
      </div>
      <ChartSlot height={HEIGHT} className="mt-5">
        <div onMouseLeave={() => pin(null)} onMouseEnter={() => pin(mode)}>
          <Chart
            definition={definition}
            renderer={renderer}
            height={HEIGHT}
            ariaLabel="Allocation: cash 42%, equities 31%, fixed income 27%"
          />
        </div>
      </ChartSlot>
    </Card>
  );
};
