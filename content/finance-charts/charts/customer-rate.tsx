"use client";

import { areaY, defineChart, dot, ruleX } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react/core";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { useMemo } from "react";

import { Bubble, Card, ChartSlot, PlotOverlay, renderer, useCycle } from "../lib/kit";
import {
  ChannelRows,
  SalesHeader,
  SquareLegend,
  X_DOMAIN,
  clockLabel,
  hourlyAxes,
  valueAt,
} from "./total-sales-parts";

const AMBER = "#fbbf24";
const AMBER_DEEP = "#f59e0b";
const GREY = "#ebebee";

// First-time visitors (grey) tower over returning ones (amber); both fade out
// past midnight.
const FIRST_TIME = [
  [17.6, 0],
  [18, 7.5],
  [18.6, 6.5],
  [19.2, 14.5],
  [19.7, 18],
  [20.2, 4.2],
  [20.7, 11],
  [21.1, 8.5],
  [21.5, 13],
  [22.1, 14.5],
  [22.6, 9.2],
  [23.1, 5.3],
  [23.6, 2.6],
  [24.5, 0.8],
  [25.1, 0],
  [26.4, 0],
] as const;
const RETURNING = [
  [17.6, 0],
  [18, 2.6],
  [18.8, 2.9],
  [19.5, 13.5],
  [20, 5],
  [20.6, 3.6],
  [21.2, 9.8],
  [21.8, 4.6],
  [22.7, 6.5],
  [23.3, 1.8],
  [23.8, 0],
  [26.4, 0],
] as const;

// Both series on one shared hour grid so the scrubber reads them together.
const GRID_H = [...new Set([...FIRST_TIME, ...RETURNING].map(([h]) => h))].toSorted(
  (a, b) => a - b,
);
const ROWS = GRID_H.map((h) => ({
  first: valueAt(FIRST_TIME, h),
  h,
  returning: valueAt(RETURNING, h),
}));

const STOPS = [19.5, 19.7, 21.2, 22.1, 22.7, 23.6, 18.4] as const;
const TICKS = [0, 10, 20, 30] as const;
const MAX = 30;

const CHANNELS = [
  { change: 4.82, name: "Online store", value: 10.24 },
  { change: 2.64, name: "Facebook", value: 6.37 },
  { change: -1.64, name: "Offline store", value: 9.58 },
] as const;

const MARGIN = { bottom: 28, left: 44, right: 4, top: 10 };
const HEIGHT = 210;
const pct = (n: number) => `${n.toFixed(2)}%`;

export const CustomerRate = () => {
  const [stop, pin] = useCycle(STOPS.length, 1900);
  const h = STOPS[stop] ?? 19.5;
  const first = valueAt(FIRST_TIME, h);
  const returning = valueAt(RETURNING, h);

  const definition = useMemo(() => {
    const axes = hourlyAxes(TICKS, (v) => `${v}%`);
    const at = [{ first, h, returning }];
    return defineChart({
      margin: MARGIN,
      marks: [
        areaY(ROWS, { fill: GREY, fillOpacity: 1, x: "h", y1: 0, y2: "first" }),
        areaY(ROWS, { fill: AMBER, fillOpacity: 1, x: "h", y1: 0, y2: "returning" }),
        ruleX([h], { stroke: "#71717a", strokeDasharray: "3 3", strokeOpacity: 0.6 }),
        dot(at, {
          fill: "#ffffff",
          key: () => "first",
          r: 4,
          stroke: "#a1a1aa",
          strokeWidth: 2,
          x: "h",
          y: "first",
        }),
        dot(at, {
          fill: "#ffffff",
          key: () => "returning",
          r: 4.5,
          stroke: AMBER_DEEP,
          strokeWidth: 2.5,
          x: "h",
          y: "returning",
        }),
      ],
      scales: {
        x: { ...axes.x, scale: scaleLinear().domain([...X_DOMAIN]) },
        y: { ...axes.y, scale: scaleLinear().domain([0, MAX]) },
      },
      theme: { muted: "#a1a1aa" },
    });
  }, [h, first, returning]);

  const left = ((h - X_DOMAIN[0]) / (X_DOMAIN[1] - X_DOMAIN[0])) * 100;

  return (
    <Card>
      <SalesHeader label="Customer rate" value={8.73} format={pct} change={2.51} />
      <ChannelRows rows={CHANNELS} format={pct} />
      <ChartSlot height={HEIGHT} className="mt-5">
        <div onMouseLeave={() => pin(null)}>
          <Chart
            definition={definition}
            renderer={renderer}
            height={HEIGHT}
            ariaLabel="Returning and first-time customer rate by hour"
            onFocusChange={(p) => {
              if (p) {
                const x = Number(p.xValue);
                let best = 0;
                for (const [k, s] of STOPS.entries()) {
                  if (Math.abs(s - x) < Math.abs((STOPS[best] ?? 0) - x)) {
                    best = k;
                  }
                }
                pin(best);
              }
            }}
          />
        </div>
        <PlotOverlay margin={MARGIN}>
          <Bubble
            left={left}
            top={100 - (Math.max(first, returning) / MAX) * 100}
            align={left > 60 ? "right" : "left"}
            className={`-translate-y-[calc(100%+10px)] text-[11px] ${left > 60 ? "" : "-ml-3"}`}
          >
            <p className="font-semibold">{clockLabel(h)}</p>
            <p className="mt-0.5 flex items-center gap-1.5">
              <span className="size-2 rounded-[3px]" style={{ backgroundColor: AMBER }} />
              Returning <span className="ml-auto pl-2 font-semibold">{pct(returning)}</span>
            </p>
            <p className="flex items-center gap-1.5">
              <span className="size-2 rounded-[3px] bg-[#d4d4d8]" />
              First time <span className="ml-auto pl-2 font-semibold">{pct(first)}</span>
            </p>
          </Bubble>
        </PlotOverlay>
      </ChartSlot>
      <SquareLegend
        items={[
          { color: AMBER, label: "Returning" },
          { color: GREY, label: "First time" },
        ]}
      />
    </Card>
  );
};
