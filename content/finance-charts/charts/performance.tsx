"use client";

import { defineChart, rect, ruleX, ruleY, text } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react/core";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { ArrowUp, CircleHelp, RefreshCw } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo } from "react";

import { usd } from "../lib/data";
import { Card, ChartSlot, Num, renderer, useCycle } from "../lib/kit";
import { BLUE, GREEN, GRID, INK, MUTED, ORANGE, PURPLE, SPRING, THEME } from "../lib/tokens";

const KPIS = [
  { color: ORANGE, delta: 8.34, format: (n: number) => usd(n), label: "Revenue", value: 23_561.16 },
  {
    color: BLUE,
    delta: 8.13,
    format: (n: number) => Math.round(n).toLocaleString("en-US"),
    label: "Orders",
    value: 266,
  },
  {
    color: PURPLE,
    delta: 8.34,
    format: (n: number) => `${n.toFixed(2)}%`,
    label: "Conversion rate",
    value: 88.83,
  },
  {
    color: ORANGE,
    delta: 0.19,
    format: (n: number) => usd(n),
    label: "Avg Order value",
    value: 88.58,
  },
] as const;

// Revenue (share of the $2K daily target) and conversion, each with its
// lighter ceiling: what the day could have done.
const DAYS = [
  { conv: 44, convCap: 61, day: "June 15", rev: 36, revCap: 49 },
  { conv: 52, convCap: 66, day: "June 16", rev: 47, revCap: 60 },
  { conv: 38, convCap: 55, day: "June 17", rev: 31, revCap: 52 },
  { conv: 57, convCap: 74, day: "June 18", rev: 52, revCap: 63 },
  { conv: 50, convCap: 67, day: "June 19", rev: 43, revCap: 58 },
  { conv: 61, convCap: 78, day: "June 20", rev: 55, revCap: 70 },
  { conv: 47, convCap: 62, day: "June 21", rev: 40, revCap: 54 },
] as const;

const MARGIN = { bottom: 4, left: 34, right: 38, top: 14 };
const HEIGHT = 210;
const TICKS = [0, 25, 50, 75, 100];
const GAP = 0.035;
const BAR = 1;

export const Performance = () => {
  const [day, pin] = useCycle(DAYS.length, 2300, 4);
  const today = DAYS[day] ?? DAYS[4];

  const definition = useMemo(() => {
    const bar = (id: string, x1: number, x2: number, y: number, fill: string) =>
      rect([{ id, x1, x2, y }], {
        fill,
        inset: 0,
        key: "id",
        radius: [5, 5, 0, 0],
        x1: "x1",
        x2: "x2",
        y1: () => 0,
        y2: "y",
      });
    return defineChart({
      margin: MARGIN,
      marks: [
        ruleY(TICKS, { stroke: (v) => (v === 0 ? "#d4d4d8" : GRID), strokeOpacity: 1 }),
        bar("rev-cap", -BAR - GAP, -GAP, today.revCap, "#fdeee4"),
        bar("conv-cap", GAP, BAR + GAP, today.convCap, "#f3e5fd"),
        bar("rev", -BAR - GAP, -GAP, today.rev, "#fba46a"),
        bar("conv", GAP, BAR + GAP, today.conv, "#c172fb"),
        ruleX([0], { stroke: INK, strokeDasharray: "3 3", strokeOpacity: 1, strokeWidth: 1.5 }),
        text([{ id: "caret" }], {
          dy: 2,
          fill: INK,
          fontSize: 12,
          key: "id",
          text: () => "▼",
          x: () => 0,
          y: () => 100,
        }),
      ],
      scales: {
        x: { axis: false, scale: scaleLinear().domain([-3.4, 3.4]) },
        y: {
          axis: {
            line: false,
            tickLabels: { fontSize: 11 },
            ticks: { format: (v: number) => `${v}%`, size: 0, values: TICKS },
          },
          scale: scaleLinear().domain([0, 100]),
        },
        yMoney: {
          axis: {
            line: false,
            tickLabels: { fontSize: 11 },
            ticks: {
              format: (v: number) => (v >= 1000 ? `$${v / 1000}K` : `$${v}`),
              size: 0,
              values: [0, 500, 1000, 1500, 2000],
            },
          },
          channel: "y",
          scale: scaleLinear().domain([0, 2000]),
          side: "right",
        },
      },
      theme: THEME,
    });
  }, [today]);

  return (
    <Card className="!bg-[#f6f6f7] !p-2">
      <div className="rounded-[16px] bg-white p-3">
        <h3 className="inline-flex items-center gap-1.5 px-1 text-[15px] font-semibold tracking-[-0.01em]">
          Performance <CircleHelp className="size-3.5" style={{ color: MUTED }} />
        </h3>
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          {KPIS.map((k) => (
            <div key={k.label} className="rounded-xl border border-black/[0.07] p-2.5">
              <p className="inline-flex items-center gap-1.5 text-[11px] text-[#3a3a42]">
                <span className="size-2 rounded-full" style={{ backgroundColor: k.color }} />
                {k.label}
              </p>
              <Num
                value={k.value}
                format={k.format}
                className="mt-1 block text-[18px] font-bold tracking-[-0.02em]"
              />
              <p className="mt-1 inline-flex items-center gap-1 text-[10.5px]">
                <span
                  className="inline-flex size-3 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: GREEN }}
                >
                  <ArrowUp className="size-2" strokeWidth={3} />
                </span>
                <span className="font-semibold" style={{ color: GREEN }}>
                  {k.delta.toFixed(2)}%
                </span>
                <span style={{ color: MUTED }}>vs last month</span>
              </p>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 rounded-[16px] bg-white p-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="inline-flex items-center gap-1.5 text-[17px] font-semibold tracking-[-0.01em]">
            Daily <CircleHelp className="size-3.5" style={{ color: MUTED }} />
          </h3>
          <button
            type="button"
            aria-label="Refresh"
            className="inline-flex size-8 items-center justify-center rounded-full border border-black/[0.08] text-[#52525b]"
          >
            <RefreshCw className="size-3.5" />
          </button>
        </div>
        <ChartSlot height={HEIGHT} className="mt-2">
          <div onMouseLeave={() => pin(null)} onMouseEnter={() => pin(day)}>
            <Chart
              definition={definition}
              renderer={renderer}
              height={HEIGHT}
              ariaLabel="Daily revenue and conversion"
            />
          </div>
        </ChartSlot>
        <div className="mx-auto mt-2 flex h-7 w-[46%] items-center justify-center overflow-hidden rounded-lg bg-[#262626] text-[12px] font-semibold text-white">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={today.day}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={SPRING}
            >
              {today.day}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </Card>
  );
};
