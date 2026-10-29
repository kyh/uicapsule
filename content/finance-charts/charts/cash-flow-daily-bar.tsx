"use client";

import { barY, defineChart, ruleY } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react/core";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { ArrowUpRight, RefreshCcw } from "lucide-react";
import { useMemo } from "react";

import { compact, uniform, usd } from "../lib/data";
import {
  Bubble,
  Card,
  CardHeader,
  ChartSlot,
  Label,
  Num,
  PlotOverlay,
  renderer,
  useCycle,
} from "../lib/kit";
import { DASHED_GRID, GRID, GREEN, THEME } from "../lib/tokens";
import { PeriodChip, UsdChip } from "./cash-flow-daily-bar-chrome";

const DAYS = Array.from({ length: 17 }, (_, i) => `May ${i + 1}`);
const TOTALS = uniform(DAYS.length, 311, 11_500, 28_500);
const SHARES = uniform(DAYS.length, 977, 0.12, 0.62);
const ROWS = DAYS.map((day, i) => {
  const total = Math.round(TOTALS[i] ?? 0);
  return { day, flow: Math.round(total * (SHARES[i] ?? 0)), total };
});
const LABELED = DAYS.filter((_, i) => i % 4 === 0);
// The theme paints grids at 11% opacity; the kit's dashed grid wants them solid.
const GRID_LINES = { ...DASHED_GRID, stroke: "#e2e2e7", strokeOpacity: 1 };

const MARGIN = { bottom: 30, left: 38, right: 0, top: 10 };
const HEIGHT = 210;
const TOP = 30_000;

export const CashFlowDailyBar = () => {
  const [hi, pin] = useCycle(ROWS.length, 1700, 5);
  const picked = ROWS[hi] ?? ROWS[0];

  const definition = useMemo(
    () =>
      defineChart({
        margin: MARGIN,
        marks: [
          ruleY([0], { stroke: GRID, strokeOpacity: 1, strokeWidth: 1 }),
          barY(ROWS, {
            fill: (d) => (d.day === picked?.day ? "#e6e6ea" : "#f1f1f3"),
            key: (d) => `${d.day}-total`,
            radius: [7, 7, 0, 0],
            x: "day",
            y1: 0,
            y2: "total",
          }),
          barY(ROWS, {
            fill: (d) => (d.day === picked?.day ? "#0f8a3a" : GREEN),
            key: (d) => `${d.day}-flow`,
            radius: [7, 7, 0, 0],
            x: "day",
            y1: 0,
            y2: "flow",
          }),
        ],
        scales: {
          x: {
            axis: {
              line: false,
              tickLabels: {
                fontSize: 11,
                fontWeight: (c) => (c.value === picked?.day ? 600 : 400),
              },
              ticks: { padding: 10, size: 0, values: LABELED },
            },
            scale: scaleBand<string>().domain(DAYS).paddingInner(0.3).paddingOuter(0),
          },
          y: {
            axis: {
              line: false,
              tickLabels: { fontSize: 11 },
              ticks: { format: (v) => compact(v), size: 0, values: [0, 10_000, 20_000, 30_000] },
            },
            grid: GRID_LINES,
            scale: scaleLinear().domain([0, TOP]),
          },
        },
        theme: THEME,
      }),
    [picked],
  );

  const total = ROWS.reduce((s, r) => s + r.flow, 0) + 0.34;

  return (
    <Card>
      <CardHeader
        icon={RefreshCcw}
        color={GREEN}
        title="Cash flow"
        actions={
          <>
            <UsdChip />
            <PeriodChip label="Monthly" />
          </>
        }
      />
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div>
          <Label>Total cash flow</Label>
          <Num value={total} className="mt-0.5 block text-[22px] font-bold tracking-[-0.03em]" />
        </div>
        <div>
          <Label>Daily average</Label>
          <Num
            value={total / ROWS.length}
            className="mt-0.5 block text-[22px] font-bold tracking-[-0.03em]"
          />
        </div>
      </div>
      <ChartSlot height={HEIGHT} className="mt-5">
        <div onMouseLeave={() => pin(null)}>
          <Chart
            definition={definition}
            renderer={renderer}
            height={HEIGHT}
            ariaLabel="Daily cash flow against total volume, May 1 to May 17"
            onFocusChange={(p) => {
              if (p) {
                pin(ROWS.findIndex((r) => r.day === p.xValue));
              }
            }}
          />
        </div>
        <PlotOverlay margin={MARGIN}>
          <Bubble
            dark
            left={((hi + 0.5) / ROWS.length) * 100}
            top={100 - ((picked?.total ?? 0) / TOP) * 100}
            className="-translate-y-[calc(100%+8px)] text-center leading-tight"
          >
            <span className="block text-[10px] text-white/60">{picked?.day}</span>
            <span className="font-semibold">{usd(picked?.flow ?? 0, true)}</span>
          </Bubble>
        </PlotOverlay>
      </ChartSlot>
      <button
        type="button"
        className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-full border border-black/[0.08] px-3.5 text-[13px] font-medium text-[#3a3a42]"
      >
        See insight <ArrowUpRight className="size-3.5" />
      </button>
    </Card>
  );
};
