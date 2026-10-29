"use client";

import { barX, barY, defineChart, ruleX, ruleY } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react/core";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { ChartColumn, DollarSign, ShoppingBag } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo } from "react";

import { uniform, usd } from "../lib/data";
import {
  CardHeader,
  Card,
  ChartSlot,
  Delta,
  Num,
  Segmented,
  muted,
  renderer,
  useCycle,
} from "../lib/kit";
import { BLUE, GREEN, INK, ORANGE } from "../lib/tokens";

const BARS = 20;
const GAP = 3;
const HEIGHT = 196;
const RANGE_HEIGHT = 16;
const PEACH = "#fdd5bb";

interface Period {
  label: string;
  today: number[];
  yesterday: number[];
  totals: [number, number];
  deltas: [number, number];
  low: number;
  high: number;
  rows: { yesterday: string; today: string; delta: number }[];
}

const DAY: Period = {
  deltas: [11.19, 2.43],
  high: 165.81,
  label: "Day",
  low: 57.11,
  rows: [
    { delta: 11.19, today: "$2,747", yesterday: "$2,471" },
    { delta: -2.21, today: "$33.10", yesterday: "$33.84" },
    { delta: 13.7, today: "83", yesterday: "73" },
  ],
  today: uniform(BARS, 11, 38, 100),
  totals: [2747, 2471],
  yesterday: uniform(BARS, 12, 28, 92),
};

const PERIODS: Period[] = [
  DAY,
  {
    deltas: [8.42, 5.1],
    high: 192.4,
    label: "Week",
    low: 48.2,
    rows: [
      { delta: 8.42, today: "$18,904", yesterday: "$17,436" },
      { delta: 1.64, today: "$34.02", yesterday: "$33.47" },
      { delta: 6.8, today: "556", yesterday: "521" },
    ],
    today: uniform(BARS, 21, 30, 100),
    totals: [18_904, 17_436],
    yesterday: uniform(BARS, 22, 30, 96),
  },
  {
    deltas: [14.06, 3.92],
    high: 214.6,
    label: "Month",
    low: 41.75,
    rows: [
      { delta: 14.06, today: "$80,218", yesterday: "$70,331" },
      { delta: -0.88, today: "$32.71", yesterday: "$33.00" },
      { delta: 15.2, today: "2,452", yesterday: "2,128" },
    ],
    today: uniform(BARS, 31, 34, 100),
    totals: [80_218, 70_331],
    yesterday: uniform(BARS, 32, 26, 90),
  },
];

const METRICS: { label: string; icon: LucideIcon; color: string; tint: string }[] = [
  { color: BLUE, icon: DollarSign, label: "Total Revenue", tint: "#e8f1fe" },
  { color: ORANGE, icon: ChartColumn, label: "Avg. order value", tint: "#fff1e6" },
  { color: GREEN, icon: ShoppingBag, label: "Transactions", tint: "#e7f7ed" },
];

const hours = Array.from({ length: BARS }, (_, i) => i);

export const FinanceOverviewDivergingBar = () => {
  const [period, pinPeriod] = useCycle(PERIODS.length, 7200);
  const [hi, pin] = useCycle(BARS, 900, 12);
  const data = PERIODS[period] ?? DAY;
  const { today, yesterday, low, high } = data;

  const definition = useMemo(() => {
    const up = hours.map((h) => ({ h, v: today[h] ?? 0 }));
    const down = hours.map((h) => ({ h, v: -(yesterday[h] ?? 0) }));
    const fill = (d: { h: number }) => (d.h === hi ? "url(#fodb-hot)" : PEACH);
    return defineChart({
      gradients: [
        {
          id: "fodb-hot",
          stops: [
            { color: "#fb923c", offset: 0 },
            { color: "#f97316", offset: 0.5 },
            { color: "#ea580c", offset: 1 },
          ],
          y1: 0,
          y2: 1,
        },
      ],
      guides: false,
      margin: 0,
      marks: [
        ruleY([0], { stroke: PEACH, strokeOpacity: 0.7, strokeWidth: 2 }),
        barY(up, {
          fill,
          id: "today",
          key: "h",
          radius: [5, 5, 0, 0],
          x: "h",
          y1: GAP,
          y2: "v",
        }),
        barY(down, {
          fill,
          id: "yesterday",
          key: "h",
          radius: [0, 0, 5, 5],
          x: "h",
          y1: -GAP,
          y2: "v",
        }),
      ],
      scales: {
        x: {
          axis: false,
          scale: scaleBand<number>().domain(hours).paddingInner(0.32).paddingOuter(0),
        },
        y: { axis: false, scale: scaleLinear().domain([-112, 112]) },
      },
    });
  }, [today, yesterday, hi]);

  // The highlighted hour's price inside the day's range.
  const price = low + ((today[hi] ?? 0) / 100) * (high - low);
  const t = (price - low) / (high - low);

  const rangeDef = useMemo(
    () =>
      defineChart({
        gradients: [
          {
            id: "fodb-range",
            stops: [
              { color: ORANGE, offset: 0, opacity: 0.05 },
              { color: ORANGE, offset: 1, opacity: 0.95 },
            ],
            x1: 0,
            x2: 1,
          },
        ],
        guides: false,
        margin: { bottom: 0, left: 0, right: 4, top: 0 },
        marks: [
          barX(
            [
              { id: "a", x1: 0, x2: 0.33 },
              { id: "b", x1: 0.335, x2: 1 },
            ],
            { fill: "#f3f3f5", key: "id", radius: 4, x1: "x1", x2: "x2", y: () => "r" },
          ),
          barX([{ id: "fill", x1: 0.335, x2: t }], {
            fill: "url(#fodb-range)",
            key: "id",
            radius: 4,
            x1: "x1",
            x2: "x2",
            y: () => "r",
          }),
          ruleX([t], { stroke: INK, strokeOpacity: 1, strokeWidth: 2 }),
        ],
        scales: {
          x: { axis: false, scale: scaleLinear().domain([0, 1]) },
          y: { axis: false, scale: scaleBand<string>().domain(["r"]).padding(0) },
        },
      }),
    [t],
  );

  return (
    <Card>
      <CardHeader
        title="Finance Overview"
        subtitle="Track your Finance"
        actions={
          <Segmented
            options={PERIODS.map((p) => p.label)}
            value={period}
            onChange={pinPeriod}
            size="sm"
          />
        }
      />
      <div className="mt-5 flex gap-3">
        <div className="flex w-[92px] shrink-0 flex-col justify-between py-1">
          <div>
            <p className="text-[12px]" style={muted}>
              Today
            </p>
            <Num
              value={data.totals[0]}
              format={(n) => usd(n, true)}
              className="block text-[22px] font-semibold tracking-[-0.02em]"
            />
            <Delta value={data.deltas[0]} variant="trend" className="text-[12px]" />
          </div>
          <div className="h-px" style={{ backgroundColor: "#fdeee4" }} />
          <div>
            <p className="text-[12px]" style={muted}>
              Yesterday
            </p>
            <Num
              value={data.totals[1]}
              format={(n) => usd(n, true)}
              className="block text-[22px] font-semibold tracking-[-0.02em]"
            />
            <Delta value={data.deltas[1]} variant="trend" className="text-[12px]" />
          </div>
        </div>
        <ChartSlot height={HEIGHT} className="min-w-0 flex-1">
          <div onMouseLeave={() => pin(null)}>
            <Chart
              definition={definition}
              renderer={renderer}
              height={HEIGHT}
              ariaLabel="Hourly revenue, today above the line and yesterday below"
              onFocusChange={(p) => {
                if (p) {
                  const i = Number(p.xValue);
                  if (Number.isInteger(i) && i >= 0 && i < BARS) {
                    pin(i);
                  }
                }
              }}
            />
          </div>
        </ChartSlot>
      </div>
      <div className="mt-4 rounded-2xl border border-black/[0.08] px-3.5 pt-3 pb-3.5">
        <div className="flex items-center justify-between text-[12px] tabular-nums">
          <span>{usd(low)}</span>
          <span className="tracking-[0.04em] uppercase" style={muted}>
            Day&rsquo;s range
          </span>
          <span>{usd(high)}</span>
        </div>
        <ChartSlot height={RANGE_HEIGHT} className="mt-2.5">
          <Chart
            definition={rangeDef}
            renderer={renderer}
            height={RANGE_HEIGHT}
            ariaLabel={`Price ${usd(price)} within the day's range`}
          />
        </ChartSlot>
      </div>
      <div className="mt-4 grid grid-cols-[1fr_72px_72px] px-1 text-[12px]" style={muted}>
        <span />
        <span className="text-center">Yesterday</span>
        <span className="text-center">Today</span>
      </div>
      <div className="mt-2 space-y-2">
        {METRICS.map((m, i) => {
          const row = data.rows[i];
          return (
            <div
              key={m.label}
              className="grid grid-cols-[1fr_72px_72px] items-center rounded-2xl bg-[#f7f7f8] p-2.5 ring-1 ring-black/[0.05]"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: m.tint,
                    boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${m.color} 25%, transparent)`,
                    color: m.color,
                  }}
                >
                  <m.icon className="size-4" strokeWidth={2.4} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px]">{m.label}</p>
                  <Delta value={row?.delta ?? 0} variant="trend" className="text-[12px]" />
                </div>
              </div>
              <span className="text-center text-[14px] tabular-nums">{row?.yesterday}</span>
              <span className="text-center text-[14px] tabular-nums">{row?.today}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
