"use client";

import { areaY, defineChart, lineY } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react/core";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { ArrowUp, CalendarDays, Sparkles } from "lucide-react";
import { useMemo } from "react";

import { compact } from "../lib/data";
import { Card, ChartSlot, Chip, MoreButton, Num, renderer, useCycle } from "../lib/kit";
import { GREEN, GRID, MUTED, THEME } from "../lib/tokens";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const ACTUAL = [7820, 10_410, 12_330, 16_120, 1790, 11_020, 12_449];
const TARGET = [18_600, 17_200, 17_900, 26_000, 12_600, 16_100, 18_400];
const FULL = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;
const DAY_INDEX = new Map<string, number>(DAYS.map((d, i) => [d, i]));
const TOTAL = ACTUAL.reduce((s, v) => s + v, 0) - 0.22;

const HEIGHT = 230;
const TOP = 26_000;
// Each day is a box: a front face `FRONT` wide, then a side face receding
// `DEPTH` to the right and `SLANT` down — a faux-3D extrusion from flat areas.
const FRONT = 0.74;
const DEPTH = 0.26;
const SLANT = 1500;
const ORANGE_BAR = "#fb8c45";

interface Vertex {
  day: string;
  x: number;
  lo: number;
  hi: number;
}

const face = (day: string, x1: number, x2: number, lo: [number, number], hi: [number, number]) => [
  { day, hi: hi[0], lo: lo[0], x: x1 },
  { day, hi: hi[1], lo: lo[1], x: x2 },
];

export const SalesPerformance = () => {
  const [hi, pin] = useCycle(DAYS.length, 2200, 3);
  const picked = DAYS[hi] ?? "Thu";

  const definition = useMemo(() => {
    const fronts: Vertex[] = [];
    const sides: Vertex[] = [];
    const ghosts: Vertex[] = [];
    const ghostSides: Vertex[] = [];
    const outlines: { day: string; x: number; y: number }[] = [];
    for (const [i, day] of DAYS.entries()) {
      const a = ACTUAL[i] ?? 0;
      const t = TARGET[i] ?? 0;
      const x1 = i;
      const x2 = i + FRONT;
      const x3 = x2 + DEPTH;
      fronts.push(...face(day, x1, x2, [0, 0], [a, a]));
      sides.push(...face(day, x2, x3, [0, 0], [a, Math.max(0, a - SLANT)]));
      ghosts.push(...face(day, x1, x2, [a, a], [t, t]));
      ghostSides.push(...face(day, x2, x3, [a, Math.max(0, a - SLANT)], [t, t - SLANT]));
      outlines.push(
        { day, x: x1, y: a },
        { day, x: x1, y: t },
        { day, x: x2, y: t },
        { day, x: x3, y: t - SLANT },
        { day, x: x3, y: Math.max(0, a - SLANT) },
      );
    }
    const paint = (on: string, off: string) => (d: Vertex) => (d.day === picked ? on : off);
    return defineChart({
      gradients: [
        {
          id: "sp-front",
          stops: [
            { color: "#e6e6e9", offset: 0 },
            { color: "#fbfbfb", offset: 1 },
          ],
          y1: 0,
          y2: 1,
        },
        {
          id: "sp-side",
          stops: [
            { color: "#fafafa", offset: 0 },
            { color: "#ececee", offset: 1 },
          ],
          x1: 0,
          x2: 1,
          y1: 0,
          y2: 0,
        },
        {
          id: "sp-hot",
          stops: [
            { color: "#fb8c45", offset: 0 },
            { color: "#fdc8a4", offset: 1 },
          ],
          y1: 0,
          y2: 1,
        },
        {
          id: "sp-hot-side",
          stops: [
            { color: "#fdf0e6", offset: 0 },
            { color: "#fb9a5c", offset: 1 },
          ],
          x1: 0,
          x2: 1,
          y1: 0,
          y2: 0,
        },
        {
          id: "sp-ghost",
          stops: [
            { color: "#fbfbfb", offset: 0 },
            { color: "#ffffff", offset: 1 },
          ],
          y1: 0,
          y2: 1,
        },
        {
          id: "sp-hot-ghost",
          stops: [
            { color: "#fde6d6", offset: 0 },
            { color: "#fff7f1", offset: 1 },
          ],
          y1: 0,
          y2: 1,
        },
      ],
      margin: { bottom: 26, left: 40, right: 0, top: 6 },
      marks: [
        areaY(ghosts, {
          fill: paint("url(#sp-hot-ghost)", "url(#sp-ghost)"),
          fillOpacity: 1,
          x: "x",
          y1: "lo",
          y2: "hi",
          z: "day",
        }),
        areaY(ghostSides, {
          fill: paint("url(#sp-hot-ghost)", "url(#sp-ghost)"),
          fillOpacity: 1,
          x: "x",
          y1: "lo",
          y2: "hi",
          z: "day",
        }),
        lineY(outlines, {
          stroke: (d) => (d.day === picked ? "#fbc9a6" : "#d4d4d8"),
          strokeDasharray: "4 4",
          strokeWidth: 1,
          x: "x",
          y: "y",
          z: "day",
        }),
        areaY(sides, {
          fill: paint("url(#sp-hot-side)", "url(#sp-side)"),
          fillOpacity: 1,
          x: "x",
          y1: "lo",
          y2: "hi",
          z: "day",
        }),
        areaY(fronts, {
          fill: paint("url(#sp-hot)", "url(#sp-front)"),
          fillOpacity: 1,
          x: "x",
          y1: "lo",
          y2: "hi",
          z: "day",
        }),
      ],
      scales: {
        x: {
          axis: {
            line: false,
            tickLabels: { fontSize: 12 },
            ticks: {
              format: (v: number) => DAYS[Math.round(v - (FRONT + DEPTH) / 2)] ?? "",
              size: 0,
              values: DAYS.map((_, i) => i + (FRONT + DEPTH) / 2),
            },
          },
          scale: scaleLinear().domain([0, DAYS.length]),
        },
        y: {
          axis: {
            line: false,
            tickLabels: { fontSize: 12 },
            ticks: {
              format: (v: number) => compact(v),
              size: 0,
              values: [0, 5000, 10_000, 15_000, 20_000, 25_000],
            },
          },
          scale: scaleLinear().domain([0, TOP]),
        },
      },
      theme: { ...THEME, muted: "#a1a1aa" },
    });
  }, [picked]);

  const lift = Math.round(((ACTUAL[hi] ?? 0) / Math.max(1, ACTUAL[(hi + 6) % 7] ?? 1)) * 100 - 100);

  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-[17px] font-semibold tracking-[-0.01em]">Sales Performance</h3>
        <div className="flex items-center gap-1.5">
          <Chip icon={CalendarDays} chevron>
            Weekly
          </Chip>
          <MoreButton />
        </div>
      </div>
      <p className="mt-3 text-[13px]" style={{ color: MUTED }}>
        Total revenue
      </p>
      <Num value={TOTAL} className="text-[28px] font-bold tracking-[-0.03em]" />
      <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-[12px]" style={{ color: MUTED }}>
          <span
            className="inline-flex items-center gap-1 rounded-full bg-[#dcfce7] px-2 py-0.5 font-semibold"
            style={{ color: GREEN }}
          >
            <span
              className="inline-flex size-3 items-center justify-center rounded-full text-white"
              style={{ backgroundColor: GREEN }}
            >
              <ArrowUp className="size-2" strokeWidth={3.5} />
            </span>
            12.4%
          </span>
          vs last week
        </p>
        <div className="flex items-center gap-3 text-[11px] text-[#3a3a42]">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1 w-3 rounded-full" style={{ backgroundColor: ORANGE_BAR }} />
            Actual Revenue
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1 w-3.5 rounded-full bg-[repeating-linear-gradient(90deg,#fbc9a6_0_3px,transparent_3px_5px)]" />
            Daily Target
          </span>
        </div>
      </div>
      <ChartSlot height={HEIGHT} className="mt-3">
        <div onMouseLeave={() => pin(null)}>
          <Chart
            definition={definition}
            renderer={renderer}
            height={HEIGHT}
            ariaLabel="Daily revenue against daily target"
            onFocusChange={(p) => {
              const day = p?.datum && "day" in p.datum ? p.datum.day : null;
              const i = day === null ? -1 : (DAY_INDEX.get(day) ?? -1);
              if (i !== -1) {
                pin(i);
              }
            }}
          />
        </div>
      </ChartSlot>
      <div
        className="mt-3 flex items-center gap-2 rounded-xl border bg-[#fafafa] px-3 py-2.5 text-[12px]"
        style={{ borderColor: GRID }}
      >
        <Sparkles className="size-3.5 shrink-0" style={{ color: ORANGE_BAR }} fill={ORANGE_BAR} />
        <p className="text-[#55555e]">
          <span className="font-semibold text-[#0b0b0f]">Insights:</span> {FULL[hi]}&apos;s revenue{" "}
          {lift >= 0 ? "rose" : "fell"} {Math.abs(lift)}% from the day before.
        </p>
      </div>
    </Card>
  );
};
