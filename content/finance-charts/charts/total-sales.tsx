"use client";

import { defineChart, dot, lineY, ruleX } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react/core";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { useMemo } from "react";

import { compact, usd } from "../lib/data";
import { Bubble, Card, ChartSlot, PlotOverlay, renderer, useCycle } from "../lib/kit";
import { BLUE } from "../lib/tokens";
import {
  ChannelRows,
  SalesHeader,
  SquareLegend,
  X_DOMAIN,
  clockLabel,
  hourlyAxes,
  valueAt,
} from "./total-sales-parts";

// Sales arrive in bursts: flat hours, then a sharp spike.
const TODAY = [
  [18, 0],
  [19.76, 0],
  [20.54, 21_400],
  [21.17, 0],
  [22.13, 0],
  [22.5, 8100],
  [22.9, 0],
  [24.78, 0],
  [26, 17_800],
] as const;
const YESTERDAY = [
  [18, 0],
  [18.69, 7000],
  [19.38, 0],
  [20.57, 0],
  [20.9, 4500],
  [21.78, 6000],
  [22.13, 12_700],
  [22.7, 0],
  [26, 0],
] as const;
const toRows = (pts: readonly (readonly [number, number])[]) =>
  pts.map(([h, value]) => ({ h, value }));
const TODAY_ROWS = toRows(TODAY);
const YESTERDAY_ROWS = toRows(YESTERDAY);

// The readout hops between the moments worth reading.
const STOPS = [20.54, 21.6, 22.5, 23.8, 26, 18.9] as const;
const TICKS = [0, 10_000, 20_000, 30_000] as const;
const MAX = 30_000;

const CHANNELS = [
  { change: 4.82, name: "Online store", value: 4250 },
  { change: 2.64, name: "Facebook", value: 846.85 },
  { change: -1.64, name: "Offline store", value: 2753.04 },
] as const;

const MARGIN = { bottom: 28, left: 44, right: 4, top: 10 };
const HEIGHT = 210;
const YESTERDAY_GREY = "#e4e4e7";

const TotalSalesBody = () => {
  const [stop, pin] = useCycle(STOPS.length, 1900);
  const h = STOPS[stop] ?? 20.54;
  const value = valueAt(TODAY, h);
  const before = valueAt(YESTERDAY, h);

  const definition = useMemo(() => {
    const axes = hourlyAxes(TICKS, (v) => compact(v));
    return defineChart({
      margin: MARGIN,
      marks: [
        ruleX([h], { stroke: BLUE, strokeDasharray: "3 3", strokeOpacity: 0.5 }),
        lineY(YESTERDAY_ROWS, { stroke: YESTERDAY_GREY, strokeWidth: 2, x: "h", y: "value" }),
        // A soft under-stroke stands in for the source's glow.
        lineY(TODAY_ROWS, {
          id: "glow",
          stroke: BLUE,
          strokeOpacity: 0.1,
          strokeWidth: 8,
          x: "h",
          y: "value",
        }),
        lineY(TODAY_ROWS, { stroke: BLUE, strokeWidth: 2.5, x: "h", y: "value" }),
        dot([{ h, value }], {
          fill: "#ffffff",
          key: () => "focus",
          r: 4.5,
          stroke: BLUE,
          strokeWidth: 2.5,
          x: "h",
          y: "value",
        }),
      ],
      scales: {
        x: { ...axes.x, scale: scaleLinear().domain([...X_DOMAIN]) },
        y: { ...axes.y, scale: scaleLinear().domain([0, MAX]) },
      },
      theme: { muted: "#a1a1aa" },
    });
  }, [h, value]);

  const left = ((h - X_DOMAIN[0]) / (X_DOMAIN[1] - X_DOMAIN[0])) * 100;
  let align: "center" | "left" | "right" = "center";
  if (left < 22) {
    align = "left";
  } else if (left > 75) {
    align = "right";
  }

  return (
    <>
      <SalesHeader label="Total Sales" value={18_645.16} format={(n) => usd(n)} change={1.16} />
      <ChannelRows rows={CHANNELS} format={(n) => usd(n)} />
      <ChartSlot height={HEIGHT} className="mt-5">
        <div onMouseLeave={() => pin(null)}>
          <Chart
            definition={definition}
            renderer={renderer}
            height={HEIGHT}
            ariaLabel="Sales by hour, today against yesterday"
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
            top={Math.min(62, 100 - (value / MAX) * 100)}
            align={align}
            dark
            className="-translate-y-[calc(100%+12px)] text-[11px]"
          >
            <p className="font-semibold">{usd(value)}</p>
            <p className="opacity-60">
              {clockLabel(h)} · {usd(before, true)} yday
            </p>
          </Bubble>
        </PlotOverlay>
      </ChartSlot>
      <SquareLegend
        items={[
          { color: BLUE, label: "Today" },
          { color: YESTERDAY_GREY, label: "Yesterday" },
        ]}
      />
    </>
  );
};

// `useCycle` reads the card's in-view state, so the body renders inside <Card>.
export const TotalSales = () => (
  <Card>
    <TotalSalesBody />
  </Card>
);
