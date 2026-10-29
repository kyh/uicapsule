"use client";

import { barY, defineChart, ruleX, ruleY, text } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react/core";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { ArrowUpRight, ChartLine, Info } from "lucide-react";
import { useMemo } from "react";

import { Card, ChartSlot, Legend, Num, renderer, useCycle } from "../lib/kit";
import { GRID, MUTED, THEME } from "../lib/tokens";

const LINES = [
  { avg: 31.1, label: "Subscription", top: 17.5 },
  { avg: 37.8, label: "Expenses", top: 23.2 },
  { avg: 32.7, label: "Investment", top: 31 },
] as const;

const DEEP = "#1279ee";
const PALE = "#8fc3f8";
const HEIGHT = 220;
const MARGIN = { bottom: 26, left: 34, right: 0, top: 22 };

interface Bar {
  c: number;
  series: "avg" | "top";
  v: number;
  x: number;
}
const BARS: Bar[] = LINES.flatMap((l, c) => [
  { c, series: "avg" as const, v: l.avg, x: c + 0.335 },
  { c, series: "top" as const, v: l.top, x: c + 0.665 },
]);

const gradient = (id: string, top: string, bottom: string, opacity: number) => ({
  id,
  stops: [
    { color: top, offset: 0, opacity },
    { color: bottom, offset: 1, opacity },
  ],
  y1: 0,
  y2: 1,
});

const RevenueByProductLineBody = () => {
  const [hi, pin] = useCycle(LINES.length, 2600, 0);
  const line = LINES[hi] ?? LINES[0];
  const gap = (1 - line.top / line.avg) * 100;

  const definition = useMemo(
    () =>
      defineChart({
        gradients: [
          gradient("rp-avg", "#4ea2fb", "#0e73ea", 1),
          gradient("rp-top", "#eef6ff", "#a5cffa", 1),
          gradient("rp-avg-dim", "#4ea2fb", "#0e73ea", 0.6),
          gradient("rp-top-dim", "#eef6ff", "#a5cffa", 0.6),
        ],
        margin: MARGIN,
        marks: [
          ruleX([0, 1, 2], { stroke: GRID, strokeOpacity: 1 }),
          ruleY([10, 20, 30, 40, 50], { stroke: GRID, strokeDasharray: "5 5", strokeOpacity: 1 }),
          ruleY([0], { stroke: "#d4d4d8", strokeOpacity: 1 }),
          barY(BARS, {
            fill: (d) => `url(#rp-${d.series}${d.c === hi ? "" : "-dim"})`,
            key: (d) => `${d.c}-${d.series}`,
            radius: [9, 9, 3, 3],
            stroke: (d) => (d.series === "avg" ? "#1a6fd6" : "#a9d0f8"),
            strokeWidth: 1,
            x: "x",
            y1: () => 0,
            y2: "v",
          }),
          text(BARS, {
            dx: (d) => (d.series === "avg" ? -3 : 3),
            dy: -9,
            fill: (d) => (d.series === "avg" ? DEEP : PALE),
            fontSize: 11.5,
            fontWeight: 600,
            key: (d) => `${d.c}-${d.series}`,
            text: (d) => `${d.v.toFixed(1)}%`,
            x: "x",
            y: "v",
          }),
        ],
        scales: {
          x: {
            axis: {
              line: false,
              tickLabels: { fontSize: 12, fontWeight: (c) => (c.value === hi + 0.5 ? 600 : 400) },
              ticks: {
                format: (v: number) => LINES[Math.floor(v)]?.label ?? "",
                size: 0,
                values: LINES.map((_, i) => i + 0.5),
              },
            },
            scale: scaleLinear().domain([0, LINES.length]),
          },
          y: {
            axis: {
              line: false,
              tickLabels: { fontSize: 11 },
              ticks: { format: (v: number) => `${v}%`, size: 0, values: [0, 10, 20, 30, 40, 50] },
            },
            scale: scaleLinear().domain([0, 50]),
          },
        },
        theme: THEME,
      }),
    [hi],
  );

  return (
    <>
      <div className="px-5 pt-5 pb-4">
        <h3 className="text-[16px] font-semibold tracking-[-0.01em]">Revenue by product line</h3>
        <p className="mt-0.5 text-[12px]" style={{ color: MUTED }}>
          Churn rate comparison across revenue streams
        </p>
        <p className="mt-2 inline-flex items-center gap-1.5 text-[12px]" style={{ color: MUTED }}>
          Data source:
          <span className="font-medium text-[#1279ee] underline underline-offset-2">Stripe</span>
          <Info className="size-3.5" />
        </p>
      </div>
      <div className="border-t px-5 pt-4 pb-5" style={{ borderColor: GRID }}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[12px] text-[#3a3a42]">Churn rate %</p>
          <Legend
            items={[
              { color: DEEP, label: "Industry Avg. churn" },
              { color: PALE, label: "Top Quartile churn" },
            ]}
            className="!text-[11px]"
          />
        </div>
        <ChartSlot height={HEIGHT} className="mt-3">
          <div onMouseLeave={() => pin(null)}>
            <Chart
              definition={definition}
              renderer={renderer}
              height={HEIGHT}
              ariaLabel="Churn rate by product line, industry average against top quartile"
              onFocusChange={(p) => {
                const x = Number(p?.xValue);
                if (p && Number.isFinite(x)) {
                  pin(Math.min(LINES.length - 1, Math.max(0, Math.floor(x))));
                }
              }}
            />
          </div>
        </ChartSlot>
        <div className="mt-4 flex items-center gap-3">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[#e8f2fe] text-[#1279ee]">
            <ChartLine className="size-4" />
          </span>
          <p className="text-[12.5px] leading-snug text-[#3a3a42]">
            Top quartile companies achieve up to{" "}
            <Num
              value={gap}
              format={(n) => `${Math.round(n)}%`}
              className="text-[15px] font-semibold text-[#1279ee]"
            />{" "}
            lower churn than industry averages in {line.label.toLowerCase()}.
          </p>
        </div>
        <div
          className="mt-3 flex items-center justify-between border-t pt-3"
          style={{ borderColor: GRID }}
        >
          <p className="text-[12.5px] text-[#3a3a42]">Retain customers, grow revenue.</p>
          <button
            type="button"
            aria-label="Open"
            className="inline-flex size-8 items-center justify-center rounded-full border border-black/[0.08] text-[#52525b]"
          >
            <ArrowUpRight className="size-4" />
          </button>
        </div>
      </div>
    </>
  );
};

/** Card is the activation provider, so the cycling body must render inside it. */
export const RevenueByProductLine = () => (
  <Card className="!p-0">
    <RevenueByProductLineBody />
  </Card>
);
