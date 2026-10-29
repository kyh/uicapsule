"use client";

import { areaY, barY, defineChart, dot, lineY, ruleX } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react/core";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { useMemo } from "react";
import type { ReactNode } from "react";

import { walk } from "../lib/data";
import {
  Card,
  ChartSlot,
  Delta,
  MoreButton,
  Num,
  Segmented,
  muted,
  renderer,
  useCycle,
} from "../lib/kit";
import { BLUE, GREEN } from "../lib/tokens";

const POINTS = 9;
const LAST = POINTS - 1;
const TOP = 100;
const COLS = 40;
const ROW_STEP = 4.2;
const HEIGHT = 210;
const MINI_HEIGHT = 64;

interface Range {
  line: number[];
  inflow: number;
  outflow: number;
  bars: number[];
  tx: number;
}

const WEEK: Range = {
  bars: [4, 7, 6, 2, 4, 3, 6],
  inflow: 526.2,
  line: [40, 47, 54, 46, 52, 48, 52, 75, 82],
  outflow: 264.8,
  tx: 26.8,
};

const RANGES: Range[] = [
  WEEK,
  {
    bars: [3, 5, 7, 6, 3, 5, 4],
    inflow: 1984.6,
    line: walk(POINTS, 41, { drift: 4, max: 88, min: 30, start: 36, vol: 9 }),
    outflow: 1120.4,
    tx: 104.2,
  },
  {
    bars: [2, 3, 4, 4, 5, 6, 7],
    inflow: 6120.9,
    line: walk(POINTS, 77, { drift: 5, max: 90, min: 22, start: 28, vol: 7 }),
    outflow: 3410.3,
    tx: 391.5,
  },
];

const SHADES = ["#7fb5f2", "#a3caf6", "#c2dcf9", "#dbeafc"] as const;

/** Linear interpolation of the line at a fractional x. */
const sample = (line: readonly number[], x: number) => {
  const i = Math.min(LAST - 1, Math.floor(x));
  const t = x - i;
  return (line[i] ?? 0) * (1 - t) + (line[i + 1] ?? 0) * t;
};

/** The dotted fill under the line, binned by height so it fades downward. */
const dotGrid = (line: readonly number[]) => {
  const bands: { id: string; x: number; y: number }[][] = [[], [], [], []];
  for (let c = 0; c < COLS; c += 1) {
    const x = (c / (COLS - 1)) * LAST;
    const ceiling = sample(line, x) - ROW_STEP * 0.8;
    for (let y = ROW_STEP * 0.5; y < ceiling; y += ROW_STEP) {
      const band = Math.min(3, Math.floor((y / TOP) * 4));
      bands[band]?.push({ id: `${c}-${Math.round(y * 10)}`, x, y });
    }
  }
  return bands;
};

const BAND_OPACITY = [0.14, 0.28, 0.48, 0.72] as const;

/** Blueprint corner ticks around a panel. */
const Corners = () => (
  <>
    <span className="absolute top-0 left-0 size-2.5 border-t border-l border-[#c4c4cb]" />
    <span className="absolute top-0 right-0 size-2.5 border-t border-r border-[#c4c4cb]" />
    <span className="absolute bottom-0 left-0 size-2.5 border-b border-l border-[#c4c4cb]" />
    <span className="absolute right-0 bottom-0 size-2.5 border-r border-b border-[#c4c4cb]" />
  </>
);

const Panel = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={`relative bg-white p-4 ${className ?? ""}`}>
    <Corners />
    {children}
  </div>
);

const UpPill = ({ value }: { value: number }) => (
  <span className="inline-flex items-center rounded-full bg-[#dcfce7] px-2 py-0.5 text-[12px]">
    <Delta value={value} variant="circle" />
  </span>
);

const millions = (n: number) =>
  `$${n.toLocaleString("en-US", { maximumFractionDigits: 1, minimumFractionDigits: 1 })}M`;

export const ValueLocked = () => {
  const [range, pinRange] = useCycle(RANGES.length, 6400);
  const [hi, pin] = useCycle(POINTS, 1100, 4);
  const data = RANGES[range] ?? WEEK;
  const { line, bars, inflow, outflow } = data;

  const definition = useMemo(() => {
    const rows = line.map((value, x) => ({ value, x }));
    const bands = dotGrid(line);
    const picked = rows[hi] ?? rows[0];
    return defineChart({
      gradients: [
        {
          id: "vl-wash",
          stops: [
            { color: BLUE, offset: 0, opacity: 0.08 },
            { color: BLUE, offset: 1, opacity: 0 },
          ],
          y1: 0,
          y2: 1,
        },
      ],
      guides: false,
      margin: { bottom: 0, left: 1, right: 1, top: 8 },
      marks: [
        areaY(rows, { fill: "url(#vl-wash)", fillOpacity: 1, key: "x", x: "x", y: "value" }),
        ...bands.map((band, i) =>
          dot(band, {
            fill: BLUE,
            fillOpacity: BAND_OPACITY[i],
            id: `dots-${i}`,
            key: "id",
            r: 1.1,
            x: "x",
            y: "y",
          }),
        ),
        ruleX([picked?.x ?? 0], { stroke: BLUE, strokeOpacity: 0.7, strokeWidth: 1.5 }),
        lineY(rows, { key: "x", stroke: BLUE, strokeWidth: 2.25, x: "x", y: "value" }),
        dot([picked], {
          fill: "#ffffff",
          id: "marker",
          key: () => "marker",
          r: 4,
          stroke: BLUE,
          strokeWidth: 1.75,
          x: (d) => d?.x ?? 0,
          y: (d) => d?.value ?? 0,
        }),
      ],
      scales: {
        x: { axis: false, scale: scaleLinear().domain([0, LAST]) },
        y: { axis: false, scale: scaleLinear().domain([0, TOP]) },
      },
    });
  }, [line, hi]);

  const mini = useMemo(() => {
    const segments = bars.flatMap((count, col) =>
      Array.from({ length: count }, (_, k) => ({
        col,
        id: `${col}-${k}`,
        level: count - 1 - k,
        y1: k,
        y2: k + 0.62,
      })),
    );
    return defineChart({
      guides: false,
      margin: 0,
      marks: [
        barY(segments, {
          fill: (d) => SHADES[Math.min(3, d.level)] ?? SHADES[3],
          key: "id",
          radius: 2,
          x: "col",
          y1: "y1",
          y2: "y2",
        }),
      ],
      scales: {
        x: {
          axis: false,
          scale: scaleBand<number>()
            .domain(bars.map((_, i) => i))
            .paddingInner(0.18)
            .paddingOuter(0),
        },
        y: { axis: false, scale: scaleLinear().domain([0, 7]) },
      },
    });
  }, [bars]);

  return (
    <Card className="!bg-[#f6f6f7] !p-2">
      <Panel className="px-4 pt-5 pb-5">
        <div className="flex items-start justify-between">
          <h3 className="text-[16px] font-semibold tracking-[-0.01em]">Value Locked</h3>
          <MoreButton className="!rounded-none" />
        </div>
        <p className="mt-3 text-[13px]" style={muted}>
          Total value locked
        </p>
        <div className="mt-1 flex items-center gap-2.5">
          <Num
            value={23.56}
            format={(n) => `$${n.toFixed(2)}B`}
            className="text-[30px] font-semibold tracking-[-0.03em]"
          />
          <UpPill value={8.34} />
          <span className="text-[12px]" style={muted}>
            vs last month
          </span>
        </div>
        <Segmented
          options={["Week", "Month", "Year"]}
          value={range}
          onChange={pinRange}
          className="mt-4 !rounded-none [&_button]:!rounded-none [&_span]:!rounded-none"
        />
        <ChartSlot height={HEIGHT} className="mt-3">
          <div onMouseLeave={() => pin(null)}>
            <Chart
              definition={definition}
              renderer={renderer}
              height={HEIGHT}
              ariaLabel="Total value locked over the selected range"
              onFocusChange={(p) => {
                if (p) {
                  const i = line.findIndex((_, x) => x === p.xValue);
                  if (i !== -1) {
                    pin(i);
                  }
                }
              }}
            />
          </div>
        </ChartSlot>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div>
            <p className="text-[12px]" style={muted}>
              Inflow
            </p>
            <Num value={inflow} format={millions} className="text-[18px] font-semibold" />
          </div>
          <div>
            <p className="text-[12px]" style={muted}>
              Outflow
            </p>
            <Num value={outflow} format={millions} className="text-[18px] font-semibold" />
          </div>
          <div>
            <p className="text-[12px]" style={muted}>
              Net flow
            </p>
            <Num
              value={inflow - outflow}
              format={(n) => `+${millions(n)}`}
              className="text-[18px] font-semibold"
              style={{ color: GREEN }}
            />
          </div>
        </div>
      </Panel>
      <Panel className="mt-2 flex items-end justify-between gap-3 px-4 py-4">
        <div className="shrink-0">
          <p className="text-[13px]" style={muted}>
            Transactions
          </p>
          <div className="mt-1 flex items-center gap-2">
            <Num
              value={data.tx}
              format={(n) => `+${n.toFixed(1)}M`}
              className="text-[26px] font-semibold tracking-[-0.03em]"
            />
            <UpPill value={8.34} />
          </div>
        </div>
        <ChartSlot height={MINI_HEIGHT} className="w-full max-w-[120px] flex-1">
          <Chart
            definition={mini}
            renderer={renderer}
            height={MINI_HEIGHT}
            ariaLabel="Transactions by day"
          />
        </ChartSlot>
      </Panel>
    </Card>
  );
};
