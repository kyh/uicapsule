"use client";

import { areaY, defineChart, dot, lineY, ruleX, ruleY } from "@tanstack/charts";
import { d3Curve } from "@tanstack/charts/d3/shape";
import { Chart } from "@tanstack/charts/react/core";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { curveMonotoneX } from "d3-shape";
import { ArrowUp, Settings } from "lucide-react";
import { useMemo } from "react";

import { MONTHS, rng, usd, WEEKDAYS } from "../lib/data";
import { Card, ChartSlot, Label, Num, Segmented, renderer, useCycle } from "../lib/kit";
import { GREEN, MUTED, THEME } from "../lib/tokens";

const LINE = "#a034f0";
const N = 85;
const HEIGHT = 210;
const MARGIN = { bottom: 26, left: 0, right: 8, top: 8 };

// Seven label slots, matching the source's inset first and last columns.
const SLOTS = Array.from({ length: 7 }, (_, i) => 6 + i * 12);

interface Range {
  name: string;
  labels: readonly string[];
  anchors: [number, number][];
  seed: number;
  delta: number;
  pct: number;
}

const RANGES: Range[] = [
  {
    anchors: [
      [0, 46],
      [6, 41],
      [14, 41],
      [18, 50],
      [30, 46],
      [36, 53],
      [42, 64],
      [48, 61],
      [54, 75],
      [60, 79],
      [66, 81],
      [72, 80],
      [84, 83],
    ],
    delta: 1083.47,
    labels: WEEKDAYS,
    name: "Week",
    pct: 4.82,
    seed: 7,
  },
  {
    anchors: [
      [0, 34],
      [10, 40],
      [20, 37],
      [30, 52],
      [40, 48],
      [50, 62],
      [58, 57],
      [68, 70],
      [76, 74],
      [84, 85],
    ],
    delta: 2316.9,
    labels: ["1", "5", "10", "15", "20", "25", "30"],
    name: "Month",
    pct: 10.91,
    seed: 19,
  },
  {
    anchors: [
      [0, 22],
      [12, 30],
      [24, 28],
      [36, 44],
      [48, 52],
      [56, 49],
      [66, 66],
      [76, 72],
      [84, 86],
    ],
    delta: 6904.12,
    labels: MONTHS.filter((_, i) => i % 2 === 0),
    name: "Year",
    pct: 41.44,
    seed: 23,
  },
];

const series = (range: Range) => {
  const r = rng(range.seed);
  const { anchors } = range;
  return Array.from({ length: N }, (_, i) => {
    const k = anchors.findIndex(([x]) => x >= i);
    const [x0, y0] = anchors[Math.max(0, k - 1)] ?? [0, 0];
    const [x1, y1] = anchors[Math.max(0, k)] ?? [N, 0];
    const t = x1 === x0 ? 0 : (i - x0) / (x1 - x0);
    // Flat runs stay flat (the source's plateau); everywhere else gets texture.
    const flat = y0 === y1;
    return { i, value: y0 + t * (y1 - y0) + (flat ? 0 : (r() - 0.5) * 5) };
  });
};

const DATA = RANGES.map(series);

export const FinanceOverviewArea = () => {
  const [range, pin] = useCycle(RANGES.length, 3400);
  const meta = RANGES[range] ?? RANGES[0];

  const definition = useMemo(() => {
    const rows = DATA[range] ?? [];
    const last = rows.at(-1);
    return defineChart({
      gradients: [
        {
          id: "foa-fill",
          stops: [
            { color: LINE, offset: 0, opacity: 0.32 },
            { color: LINE, offset: 1, opacity: 0.02 },
          ],
          x1: 0,
          x2: 0,
          y1: 0,
          y2: 1,
        },
      ],
      margin: MARGIN,
      marks: [
        ruleX(SLOTS, {
          stroke: "#d4d4da",
          strokeDasharray: "5 5",
          strokeOpacity: 1,
          strokeWidth: 1,
        }),
        ruleY([0], { stroke: "#e2e2e6", strokeOpacity: 1, strokeWidth: 1.5 }),
        areaY(rows, {
          curve: d3Curve(curveMonotoneX),
          fill: "url(#foa-fill)",
          fillOpacity: 1,
          key: "i",
          x: "i",
          y1: 0,
          y2: "value",
        }),
        lineY(rows, {
          curve: d3Curve(curveMonotoneX),
          key: "i",
          stroke: LINE,
          strokeWidth: 2.5,
          x: "i",
          y: "value",
        }),
        dot(last ? [last] : [], {
          fill: LINE,
          key: () => "end",
          r: 4.5,
          stroke: "#ffffff",
          strokeWidth: 2,
          x: "i",
          y: "value",
        }),
      ],
      motion: { path: "morph" },
      scales: {
        x: {
          axis: {
            line: false,
            tickLabels: { fontSize: 12 },
            ticks: {
              format: (v: number) => meta?.labels[SLOTS.indexOf(v)] ?? "",
              size: 0,
              values: SLOTS,
            },
          },
          scale: scaleLinear().domain([0, N - 1]),
        },
        y: { axis: false, scale: scaleLinear().domain([0, 100]) },
      },
      theme: THEME,
    });
  }, [range, meta]);

  return (
    <Card
      style={{
        backgroundImage:
          "radial-gradient(120% 70% at 105% -8%, rgba(168,85,247,0.5), rgba(196,140,255,0.22) 38%, rgba(255,255,255,0) 66%)",
      }}
    >
      <div className="flex items-start justify-between">
        <h3 className="text-[17px] font-semibold tracking-[-0.01em]">Finance Overview</h3>
        <button
          type="button"
          aria-label="Settings"
          className="inline-flex size-9 items-center justify-center rounded-[12px] bg-white/45 text-[#a034f0] shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_4px_12px_-6px_rgba(124,58,237,0.5)] ring-1 ring-white/70 backdrop-blur"
        >
          <Settings className="size-4" strokeWidth={2.4} />
        </button>
      </div>
      <div className="mt-4 flex items-center gap-1.5 text-[11.5px] whitespace-nowrap">
        <span style={{ color: MUTED }}>Metric Category</span>
        <span className="rounded-full bg-[#dcfce7] px-2 py-1 font-medium text-[#16a34a]">
          All Investment
        </span>
        <span className="rounded-full bg-[#f3e8ff] px-2 py-1 font-medium text-[#a034f0]">
          Total portfolio value
        </span>
      </div>
      <Segmented
        options={RANGES.map((r) => r.name)}
        value={range}
        onChange={pin}
        className="mt-4"
      />
      <ChartSlot height={HEIGHT} className="mt-4">
        <Chart
          definition={definition}
          renderer={renderer}
          height={HEIGHT}
          ariaLabel={`Total portfolio value over the ${meta?.name.toLowerCase()}`}
        />
      </ChartSlot>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <Label info className="!text-[13px]">
            Total portfolio value
          </Label>
          <Num value={23_563.01} className="mt-1 block text-[30px] font-bold tracking-[-0.03em]" />
          <Num
            value={meta?.delta ?? 0}
            format={(n) => `+${usd(n)}`}
            className="mt-1 inline-block rounded-full bg-[#dcfce7] px-2 py-0.5 text-[12px] font-semibold text-[#16a34a]"
          />
        </div>
        <div className="pb-0.5 text-right">
          <p
            className="inline-flex items-center gap-1.5 text-[20px] font-bold tracking-[-0.02em]"
            style={{ color: GREEN }}
          >
            <span
              className="inline-flex size-5 items-center justify-center rounded-full text-white"
              style={{ backgroundColor: GREEN }}
            >
              <ArrowUp className="size-3.5" strokeWidth={3} />
            </span>
            <Num value={meta?.pct ?? 0} format={(n) => `${n.toFixed(2)}%`} />
          </p>
          <p className="text-[11px]" style={{ color: MUTED }}>
            Vs Previous period
          </p>
        </div>
      </div>
    </Card>
  );
};
