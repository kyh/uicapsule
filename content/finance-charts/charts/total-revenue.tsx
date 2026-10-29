"use client";

import { areaY, defineChart, dot } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react/core";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { ArrowUp, CalendarDays, Info } from "lucide-react";
import { useMemo } from "react";

import { rng } from "../lib/data";
import { Card, ChartSlot, Chip, MoreButton, Num, renderer, useCycle } from "../lib/kit";
import { GREEN, MUTED, THEME } from "../lib/tokens";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"] as const;
const REVENUE = [17.9, 13.3, 20.3, 14.7, 10, 15.7];
const CASH = [19_842.4, 15_210.92, 23_561.16, 16_904.7, 11_387.25, 18_115.3];
const MONTH_INDEX = new Map<string, number>(MONTHS.map((m, i) => [m, i]));

const HEIGHT = 230;
const TOP = 25;
// Each bar is a front face plus a lid: a trapezoid that narrows by `LID_IN`
// over `LID` — the top of the column seen slightly from above.
const PAD = 0.14;
const LID = 2.25;
const LID_IN = 0.07;

interface Vertex {
  month: string;
  x: number;
  lo: number;
  hi: number;
}

// Fixed sparkle positions, as fractions of the bar: the highlighted column's
// "starfield" travels with whichever month is lit.
const SPARKS = (() => {
  const r = rng(117);
  return Array.from({ length: 14 }, (_, i) => ({
    fx: 0.12 + r() * 0.76,
    fy: 0.04 + r() * 0.9,
    i,
    o: 0.35 + r() * 0.6,
    r: 0.6 + r() * 1.3,
  }));
})();

export const TotalRevenue = () => {
  const [hi, pin] = useCycle(MONTHS.length, 2200, 2);
  const picked = MONTHS[hi] ?? "Mar";

  const definition = useMemo(() => {
    const fronts: Vertex[] = [];
    const lids: Vertex[] = [];
    for (const [i, month] of MONTHS.entries()) {
      const v = REVENUE[i] ?? 0;
      const x1 = i + PAD;
      const x2 = i + 1 - PAD;
      fronts.push({ hi: v, lo: 0, month, x: x1 }, { hi: v, lo: 0, month, x: x2 });
      lids.push(
        { hi: v, lo: v, month, x: x1 },
        { hi: v + LID, lo: v, month, x: x1 + LID_IN },
        { hi: v + LID, lo: v, month, x: x2 - LID_IN },
        { hi: v, lo: v, month, x: x2 },
      );
    }
    const v = REVENUE[hi] ?? 0;
    const sparks = SPARKS.map((s) => ({
      ...s,
      key: `${picked}-${s.i}`,
      x: hi + PAD + s.fx * (1 - 2 * PAD),
      y: s.fy * v,
    }));
    const paint = (on: string, off: string) => (d: Vertex) => (d.month === picked ? on : off);
    return defineChart({
      gradients: [
        {
          id: "tr-front",
          stops: [
            { color: "#f7f7f8", offset: 0 },
            { color: "#ebebed", offset: 1 },
          ],
          y1: 0,
          y2: 1,
        },
        {
          id: "tr-lid",
          stops: [
            { color: "#f2f2f4", offset: 0 },
            { color: "#e6e6e9", offset: 1 },
          ],
          y1: 0,
          y2: 1,
        },
        {
          id: "tr-hot",
          stops: [
            { color: "#e6f1fe", offset: 0 },
            { color: "#8cc1fb", offset: 0.45 },
            { color: "#0a7cff", offset: 1 },
          ],
          y1: 0,
          y2: 1,
        },
        {
          id: "tr-hot-lid",
          stops: [
            { color: "#f4f9ff", offset: 0 },
            { color: "#d4e7fd", offset: 1 },
          ],
          y1: 0,
          y2: 1,
        },
      ],
      margin: { bottom: 26, left: 40, right: 0, top: 6 },
      marks: [
        areaY(fronts, {
          fill: paint("url(#tr-hot)", "url(#tr-front)"),
          fillOpacity: 1,
          stroke: paint("#a9cdf6", "#e4e4e7"),
          strokeWidth: 1,
          x: "x",
          y1: "lo",
          y2: "hi",
          z: "month",
        }),
        areaY(lids, {
          fill: paint("url(#tr-hot-lid)", "url(#tr-lid)"),
          fillOpacity: 1,
          stroke: paint("#a9cdf6", "#e4e4e7"),
          strokeWidth: 1,
          x: "x",
          y1: "lo",
          y2: "hi",
          z: "month",
        }),
        dot(sparks, {
          fill: "#ffffff",
          fillOpacity: 0.85,
          key: "key",
          r: "r",
          x: "x",
          y: "y",
        }),
      ],
      scales: {
        x: {
          axis: {
            line: false,
            tickLabels: { fontSize: 12 },
            ticks: {
              format: (n: number) => MONTHS[Math.floor(n)] ?? "",
              size: 0,
              values: MONTHS.map((_, i) => i + 0.5),
            },
          },
          scale: scaleLinear().domain([0, MONTHS.length]),
        },
        y: {
          axis: {
            line: false,
            tickLabels: { fontSize: 12 },
            ticks: {
              format: (n: number) => (n === 0 ? "$0" : `$${n}M`),
              size: 0,
              values: [0, 5, 10, 15, 20, 25],
            },
          },
          grid: { stroke: "#e2e2e6", strokeDasharray: "5 5", strokeWidth: 1 },
          scale: scaleLinear().domain([0, TOP]),
        },
      },
      theme: { ...THEME, muted: "#a1a1aa" },
    });
  }, [hi, picked]);

  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-[17px] font-semibold tracking-[-0.01em]">Total Revenue</h3>
        <div className="flex items-center gap-1.5">
          <Chip icon={CalendarDays} chevron>
            6 months
          </Chip>
          <MoreButton />
        </div>
      </div>
      <p className="mt-3 text-[13px]" style={{ color: MUTED }}>
        Monthly net cash flow
      </p>
      <Num value={CASH[hi] ?? 0} className="text-[28px] font-bold tracking-[-0.03em]" />
      <p className="mt-1 flex items-center gap-2 text-[12px]" style={{ color: MUTED }}>
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
          $163,747
        </span>
        vs last month
      </p>
      <ChartSlot height={HEIGHT} className="mt-3">
        <div onMouseLeave={() => pin(null)}>
          <Chart
            definition={definition}
            renderer={renderer}
            height={HEIGHT}
            ariaLabel="Total revenue by month for the last six months"
            onFocusChange={(p) => {
              const month = p?.datum && "month" in p.datum ? p.datum.month : null;
              const i = month === null ? -1 : (MONTH_INDEX.get(month) ?? -1);
              if (i !== -1) {
                pin(i);
              }
            }}
          />
        </div>
      </ChartSlot>
      <p className="mt-3 flex items-center gap-1.5 text-[12px] text-[#55555e]">
        <Info className="size-3.5 shrink-0" style={{ color: MUTED }} />
        Total revenue and monthly net cash flow for the last 6 months.
      </p>
    </Card>
  );
};
