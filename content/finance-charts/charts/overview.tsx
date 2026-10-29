"use client";

import { barY, defineChart, link, rect } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react/core";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { Info, Plus, X } from "lucide-react";
import { useMemo, useState } from "react";

import { MONTHS, usd, uniform } from "../lib/data";
import {
  Bubble,
  Card,
  ChartSlot,
  Chip,
  Delta,
  Num,
  PlotOverlay,
  Segmented,
  renderer,
  useCycle,
} from "../lib/kit";
import { GREEN, MUTED } from "../lib/tokens";

const N = 60;
const WINDOW = 16;
const QUARTERS = ["Q1", "Q2", "Q3"] as const;
// Each bar is a day and a half of revenue.
const DAYS_PER_BAR = 1.5;
const SERIES = QUARTERS.map((_, q) => {
  const noise = uniform(N, 90 + q * 13, 0, 1);
  return noise.map((n, i) => ({
    i,
    // Revenue per bar in dollars: a slow swell with day-to-day chatter.
    value: 520 + 190 * Math.sin(i / 6.5 + q * 1.7) + 120 * Math.sin(i / 2.3 + q) + 260 * n,
  }));
});
const FIRST = SERIES[0] ?? [];
const MAX = 1120;
// The brush lives below the baseline: a track and the orange selection.
const BRUSH_TOP = -90;
const BRUSH_BOTTOM = -190;
const MIN = -205;
const STARTS = [24, 36, 44, 8, 16] as const;
const MONTH_TICKS = [10, 30, 50] as const;

const MARGIN = { bottom: 26, left: 0, right: 0, top: 8 };
const HEIGHT = 230;

const dateFor = (q: number, i: number) => {
  const d = new Date(2026, q * 3, 1);
  d.setDate(d.getDate() + Math.round(i * DAYS_PER_BAR));
  return d;
};
const fmtDay = (d: Date) => d.toLocaleString("en-US", { day: "numeric", month: "short" });

const OverviewBody = () => {
  const [quarter, setQuarter] = useState(0);
  const [slot, pin] = useCycle(STARTS.length, 2400);
  const start = STARTS[slot] ?? 24;
  const end = start + WINDOW - 1;
  const mid = start + WINDOW / 2;
  const rows = SERIES[quarter] ?? FIRST;

  let total = 0;
  let before = 0;
  for (const r of rows) {
    if (r.i >= start && r.i <= end) {
      total += r.value;
    } else if (r.i >= start - WINDOW && r.i < start) {
      before += r.value;
    }
  }
  const change = before > 0 ? (total / before - 1) * 100 : 0;

  const definition = useMemo(
    () =>
      defineChart({
        gradients: [
          {
            id: "ov-soft",
            stops: [
              { color: "#4ade80", offset: 0, opacity: 0.85 },
              { color: "#86efac", offset: 0.75, opacity: 0.45 },
              { color: "#bbf7d0", offset: 1, opacity: 0.12 },
            ],
            y1: 0,
            y2: 1,
          },
          {
            id: "ov-deep",
            stops: [
              { color: "#16a34a", offset: 0 },
              { color: "#22c55e", offset: 0.7 },
              { color: "#bbf7d0", offset: 1, opacity: 0.25 },
            ],
            y1: 0,
            y2: 1,
          },
          {
            id: "ov-brush",
            stops: [
              { color: "#fb923c", offset: 0 },
              { color: "#f97316", offset: 1 },
            ],
            y1: 0,
            y2: 1,
          },
        ],
        guides: true,
        margin: MARGIN,
        marks: [
          barY(rows, {
            fill: (r) => {
              if (r.i < start || r.i > end) {
                return "#ececee";
              }
              return r.i < mid ? "url(#ov-soft)" : "url(#ov-deep)";
            },
            inset: 0.4,
            key: "i",
            radius: [1.5, 1.5, 0, 0],
            x: "i",
            y1: 0,
            y2: "value",
          }),
          rect([{ x1: -0.5, x2: N - 0.5 }], {
            fill: "#efeff2",
            inset: 0,
            radius: 3,
            x1: "x1",
            x2: "x2",
            y1: () => BRUSH_BOTTOM,
            y2: () => BRUSH_TOP,
          }),
          rect([{ x1: start - 0.5, x2: end + 0.5 }], {
            fill: "url(#ov-brush)",
            inset: 0,
            key: () => "brush",
            radius: 3,
            stroke: "#ea580c",
            strokeWidth: 1,
            x1: "x1",
            x2: "x2",
            y1: () => BRUSH_BOTTOM,
            y2: () => BRUSH_TOP,
          }),
          // Grips at either end and the split handle in the middle.
          link(
            [
              { id: "l", x: start + 0.1 },
              { id: "r", x: end - 0.1 },
            ],
            {
              key: "id",
              stroke: "#ffffff",
              strokeOpacity: 0.9,
              strokeWidth: 1.5,
              x1: "x",
              x2: "x",
              y1: () => BRUSH_BOTTOM + 25,
              y2: () => BRUSH_TOP - 25,
            },
          ),
          link([{ x: mid - 0.5 }], {
            key: () => "split",
            stroke: "#18181b",
            strokeWidth: 1.5,
            x1: "x",
            x2: "x",
            y1: () => BRUSH_BOTTOM - 12,
            y2: () => BRUSH_TOP + 12,
          }),
          link([{ x1: -0.5, x2: N - 0.5 }], {
            stroke: "#e4e4e7",
            strokeWidth: 1,
            x1: "x1",
            x2: "x2",
            y1: () => 0,
            y2: () => 0,
          }),
        ],
        scales: {
          x: {
            axis: {
              line: false,
              tickLabels: { fontSize: 11.5 },
              ticks: {
                format: (v) => MONTHS[quarter * 3 + Math.floor(Number(v) / 20)] ?? "",
                size: 0,
                values: [...MONTH_TICKS],
              },
            },
            scale: scaleLinear().domain([-0.5, N - 0.5]),
          },
          y: { axis: false, scale: scaleLinear().domain([MIN, MAX]) },
        },
        theme: { muted: "#a1a1aa" },
      }),
    [rows, start, end, mid, quarter],
  );

  const center = ((mid - 0.5 + 0.5) / N) * 100;
  const left = Math.min(70, Math.max(30, center));

  return (
    <>
      <div className="rounded-[18px] bg-white px-4 py-3.5 ring-1 ring-black/[0.04]">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[16px] font-semibold tracking-[-0.01em]">Overview</h3>
          <div className="flex items-center gap-1.5">
            <Chip chevron>Revenue</Chip>
            <button
              type="button"
              className="inline-flex h-7 items-center gap-1 rounded-full bg-[linear-gradient(180deg,#fb923c,#f97316)] px-3 text-[12px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_4px_10px_-4px_#f97316] ring-1 ring-[#ea580c]"
            >
              <Plus className="size-3.5" strokeWidth={2.6} /> Create
            </button>
          </div>
        </div>
        <p className="mt-1 text-[12px] leading-snug" style={{ color: MUTED }}>
          Track revenue, payouts, and affiliate performance in a single powerful chart.
        </p>
      </div>

      <div className="mt-1.5 rounded-[18px] bg-white p-4 ring-1 ring-black/[0.04]">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="inline-flex items-center gap-1.5 text-[12.5px]" style={{ color: MUTED }}>
              Total revenue <Info className="size-3.5" />
            </p>
            <Num
              value={18_645.16 + quarter * 1312.4}
              className="block text-[26px] leading-tight font-bold tracking-[-0.03em]"
            />
            <p className="mt-0.5 text-[11.5px]" style={{ color: MUTED }}>
              <Delta value={4.82} variant="circle" /> vs last quarter
            </p>
          </div>
          <Segmented options={QUARTERS} value={quarter} onChange={setQuarter} size="sm" />
        </div>

        <ChartSlot height={HEIGHT} className="mt-3">
          <div onMouseLeave={() => pin(null)}>
            <Chart
              definition={definition}
              renderer={renderer}
              height={HEIGHT}
              ariaLabel="Daily revenue with a selected range"
              onFocusChange={(p) => {
                if (p) {
                  const x = Number(p.xValue) - WINDOW / 2;
                  let best = 0;
                  for (const [k, s] of STARTS.entries()) {
                    if (Math.abs(s - x) < Math.abs((STARTS[best] ?? 0) - x)) {
                      best = k;
                    }
                  }
                  pin(best);
                }
              }}
            />
          </div>
          <PlotOverlay margin={MARGIN}>
            <Bubble left={left} top={57} className="!rounded-xl !px-2.5 !py-1.5 text-[10.5px]">
              <p className="flex items-center gap-1.5">
                <span className="font-semibold">Revenue</span>
                <span style={{ color: MUTED }}>
                  {fmtDay(dateFor(quarter, start))} – {fmtDay(dateFor(quarter, end))}
                </span>
                <X className="ml-auto size-3" style={{ color: MUTED }} />
              </p>
              <p className="mt-0.5 flex items-baseline justify-between gap-3">
                <Num value={total} format={(n) => usd(n)} className="text-[13px] font-semibold" />
                <span>
                  <span className="font-medium" style={{ color: change >= 0 ? GREEN : "#ef4444" }}>
                    {change >= 0 ? "+" : ""}
                    {change.toFixed(2)}%
                  </span>{" "}
                  <span style={{ color: MUTED }}>{change >= 0 ? "Increase" : "Decrease"}</span>
                </span>
              </p>
            </Bubble>
          </PlotOverlay>
        </ChartSlot>
      </div>
    </>
  );
};

// `useCycle` reads the card's in-view state, so the body renders inside <Card>.
export const Overview = () => (
  <Card className="!bg-[#f4f4f6] !p-1.5">
    <OverviewBody />
  </Card>
);
