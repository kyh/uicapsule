"use client";

import { areaY, defineChart, dot, lineY, link, text } from "@tanstack/charts";
import { d3Curve } from "@tanstack/charts/d3/shape";
import { Chart } from "@tanstack/charts/react/core";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { curveMonotoneX } from "d3-shape";
import { CalendarDays } from "lucide-react";
import { useMemo } from "react";

import {
  Bubble,
  Card,
  ChartSlot,
  Chip,
  Num,
  PlotOverlay,
  muted,
  renderer,
  useCycle,
} from "../lib/kit";
import { DASHED_GRID, GRID, INK, MUTED, ORANGE, PURPLE } from "../lib/tokens";

const YEARS = [0, 1, 2, 3, 4, 5] as const;
const ANNUAL = [0.6, 4.5, 10.2, 15, 19.6, 24.4] as const;
const MRR = [0.1, 3.4, 5, 6.6, 8.3, 9.8] as const;
const X_MAX = 7;
const Y_MAX = 25;
const HEIGHT = 250;
const MARGIN = { bottom: 26, left: 40, right: 6, top: 14 };
const curve = d3Curve(curveMonotoneX);

const rows = YEARS.map((year) => ({ annual: ANNUAL[year], mrr: MRR[year], year }));

export const RevenueGrowth = () => {
  // Walks years 1..5; starts on year 5 like the source.
  const [step, pin] = useCycle(5, 2400, 4);
  const year = step + 1;
  const picked = rows[year] ?? rows[5];
  const annual = picked?.annual ?? 0;
  const mrr = picked?.mrr ?? 0;

  const definition = useMemo(
    () =>
      defineChart({
        gradients: [
          {
            id: "rg-purple",
            stops: [
              { color: PURPLE, offset: 0, opacity: 0.2 },
              { color: PURPLE, offset: 1, opacity: 0.02 },
            ],
            y1: 0,
            y2: 1,
          },
          {
            id: "rg-orange",
            stops: [
              { color: ORANGE, offset: 0, opacity: 0.2 },
              { color: ORANGE, offset: 1, opacity: 0.02 },
            ],
            y1: 0,
            y2: 1,
          },
        ],
        margin: MARGIN,
        marks: [
          areaY(rows, {
            curve,
            fill: "url(#rg-purple)",
            fillOpacity: 1,
            id: "annual-area",
            key: "year",
            x: "year",
            y1: "mrr",
            y2: "annual",
          }),
          areaY(rows, {
            curve,
            fill: "url(#rg-orange)",
            fillOpacity: 1,
            id: "mrr-area",
            key: "year",
            x: "year",
            y1: 0,
            y2: "mrr",
          }),
          link([picked], {
            id: "gap",
            key: () => "gap",
            stroke: INK,
            strokeDasharray: "2 3",
            strokeWidth: 1.5,
            x1: (d) => d?.year ?? 0,
            x2: (d) => d?.year ?? 0,
            y1: () => 0,
            y2: (d) => d?.annual ?? 0,
          }),
          text([picked], {
            dy: -11,
            fill: INK,
            fontSize: 10,
            id: "cap-top",
            key: () => "top",
            text: () => "▼",
            x: (d) => d?.year ?? 0,
            y: (d) => d?.annual ?? 0,
          }),
          text([picked], {
            dy: -4,
            fill: INK,
            fontSize: 10,
            id: "cap-bottom",
            key: () => "bottom",
            text: () => "▲",
            x: (d) => d?.year ?? 0,
            y: () => 0,
          }),
          lineY(rows, { curve, id: "annual", key: "year", stroke: PURPLE, x: "year", y: "annual" }),
          lineY(rows, { curve, id: "mrr", key: "year", stroke: ORANGE, x: "year", y: "mrr" }),
          dot(rows, {
            fill: PURPLE,
            id: "annual-dots",
            key: "year",
            r: 4.5,
            stroke: "#ffffff",
            strokeWidth: 1.75,
            x: "year",
            y: "annual",
          }),
          dot(rows, {
            fill: ORANGE,
            id: "mrr-dots",
            key: "year",
            r: 4.5,
            stroke: "#ffffff",
            strokeWidth: 1.75,
            x: "year",
            y: "mrr",
          }),
        ],
        scales: {
          x: {
            axis: {
              line: false,
              tickLabels: {
                fontSize: 11,
                fontWeight: (c) => (c.value === year ? 600 : 400),
              },
              ticks: { format: (v) => `Year ${v}`, size: 0, values: [...YEARS] },
            },
            scale: scaleLinear().domain([0, X_MAX]),
          },
          y: {
            axis: {
              line: { stroke: GRID },
              tickLabels: { fontSize: 11 },
              ticks: {
                format: (v) => (v === 0 ? "$0" : `$${v}M`),
                size: 0,
                values: [0, 5, 10, 15, 20, 25],
              },
            },
            grid: { ...DASHED_GRID, stroke: "#e4e4e7", strokeOpacity: 1 },
            scale: scaleLinear().domain([0, Y_MAX]),
          },
        },
        theme: { foreground: INK, grid: GRID, muted: MUTED },
      }),
    [picked, year],
  );

  const ratio = mrr > 0 ? annual / mrr : 0;
  const left = (5.2 / X_MAX) * 100;
  const mid = 100 - ((annual + mrr) / 2 / Y_MAX) * 100;

  return (
    <Card className="!px-0">
      <div className="flex items-start justify-between gap-3 px-5">
        <div className="min-w-0">
          <h3 className="text-[16px] font-semibold tracking-[-0.01em]">Revenue Growth</h3>
          <p className="mt-0.5 text-[12px]" style={muted}>
            Track recurring revenue growth with compounding.
          </p>
        </div>
        <Chip icon={CalendarDays} chevron>
          5 Years
        </Chip>
      </div>
      <div className="mt-4 border-t px-5 pt-4" style={{ borderColor: GRID }}>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-2xl bg-[#f6f6f7] px-3 py-2.5">
            <p
              className="inline-flex items-center gap-1.5 text-[11px] whitespace-nowrap"
              style={muted}
            >
              <span className="size-2.5 rounded-full" style={{ backgroundColor: PURPLE }} />
              Annual Revenue
            </p>
            <p className="mt-1 flex items-baseline gap-1.5">
              <Num
                value={annual}
                format={(n) => `$${n.toFixed(1)}M`}
                className="text-[20px] font-semibold tracking-[-0.02em]"
              />
              <span className="text-[11px]" style={muted}>
                Year {year}
              </span>
            </p>
          </div>
          <div className="rounded-2xl bg-[#f6f6f7] px-3 py-2.5">
            <p
              className="inline-flex items-center gap-1.5 text-[11px] whitespace-nowrap"
              style={muted}
            >
              <span className="size-2.5 rounded-full" style={{ backgroundColor: ORANGE }} />
              Monthly Recurring (MRR)
            </p>
            <p className="mt-1 flex items-baseline gap-1.5">
              <Num
                value={mrr}
                format={(n) => `$${n.toFixed(1)}M`}
                className="text-[20px] font-semibold tracking-[-0.02em]"
              />
              <span className="text-[11px]" style={muted}>
                Year {year}
              </span>
            </p>
          </div>
        </div>
        <p className="mt-5 text-[12px] text-[#3a3a42]">Revenue</p>
        <ChartSlot height={HEIGHT} className="mt-2">
          <div onMouseLeave={() => pin(null)}>
            <Chart
              definition={definition}
              renderer={renderer}
              height={HEIGHT}
              ariaLabel="Annual revenue and MRR over five years"
              onFocusChange={(p) => {
                if (p) {
                  const y = Number(p.xValue);
                  if (Number.isInteger(y) && y >= 1 && y <= 5) {
                    pin(y - 1);
                  }
                }
              }}
            />
          </div>
          <PlotOverlay margin={MARGIN}>
            <Bubble
              left={left}
              top={mid}
              align="left"
              className="-translate-y-1/2 !bg-transparent !px-0 !py-0 !shadow-none !ring-0"
            >
              <Num
                value={ratio}
                format={(n) => `${n.toFixed(1)}x`}
                className="block text-[24px] leading-none font-semibold"
                style={{ color: PURPLE }}
              />
              <p className="mt-1 w-[78px] text-[11px] leading-snug" style={muted}>
                more revenue with compounding
              </p>
            </Bubble>
          </PlotOverlay>
        </ChartSlot>
      </div>
    </Card>
  );
};
