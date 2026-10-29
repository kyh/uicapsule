"use client";

import { areaY, defineChart, dot, lineY, ruleX } from "@tanstack/charts";
import { d3Curve } from "@tanstack/charts/d3/shape";
import { Chart } from "@tanstack/charts/react/core";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { curveMonotoneX } from "d3-shape";
import { ChartPie, Clock } from "lucide-react";
import { useMemo } from "react";

import { compact, MONTHS, walk } from "../lib/data";
import { Bubble, Card, ChartSlot, IconTile, PlotOverlay, renderer, useCycle } from "../lib/kit";
import { GREEN, GRID } from "../lib/tokens";

const ASSET = "#16a34a";
const LIABILITY = "#ef4444";
const LIABILITY_FILL = "#fde4e4";

// Weekly-ish readings, January (0) through July (75).
const LAST = 75;
const RAW = walk(LAST + 1, 23, { drift: 2.6, start: 0, vol: 9 });
const RAW_MIN = Math.min(...RAW);
const RAW_MAX = Math.max(...RAW);
// Rescale the walk so it climbs from $40K to a $250K peak.
const ASSETS = RAW.map((v) => 40_000 + ((v - RAW_MIN) / (RAW_MAX - RAW_MIN)) * 210_000);
const LIABILITY_KNOTS = [
  [0, 40_000],
  [4, 52_000],
  [9, 53_000],
  [15, 50_000],
  [20, 58_000],
  [25, 56_000],
  [31, 55_000],
  [39, 60_000],
  [47, 68_000],
  [52, 70_000],
  [56, 64_000],
  [58, 65_000],
  [61, 98_000],
  [66, 110_000],
  [69, 128_000],
  [72, 175_000],
  [75, 252_000],
] as const;
const liabilityAt = (x: number) => {
  for (let k = 1; k < LIABILITY_KNOTS.length; k += 1) {
    const a = LIABILITY_KNOTS[k - 1];
    const b = LIABILITY_KNOTS[k];
    if (a && b && x <= b[0]) {
      return a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0]);
    }
  }
  return 252_000;
};
const KNOT_ROWS = LIABILITY_KNOTS.map(([i, liability]) => ({ i, liability }));
const ROWS = ASSETS.map((asset, i) => ({ asset, i, liability: liabilityAt(i) }));

const MONTH_X = [0, 12.5, 25, 37.5, 50, 62.5, 75] as const;
const TICKS = [50_000, 100_000, 150_000, 200_000, 250_000] as const;
const MIN = 38_000;
const MAX = 262_000;
const STOPS = [6, 19, 31, 44, 56, 68, 74] as const;

const MARGIN = { bottom: 28, left: 0, right: 46, top: 8 };
const HEIGHT = 240;
const smooth = d3Curve(curveMonotoneX);

export const CumulativeAssetsAndLiabilities = () => {
  const [stop, pin] = useCycle(STOPS.length, 2000, 4);
  const at = STOPS[stop] ?? 0;
  const picked = ROWS[at] ?? ROWS[0];

  const definition = useMemo(
    () =>
      defineChart({
        margin: MARGIN,
        marks: [
          areaY(KNOT_ROWS, {
            curve: smooth,
            fill: LIABILITY_FILL,
            fillOpacity: 0.85,
            x: "i",
            y1: MIN,
            y2: "liability",
          }),
          ruleX([at], { stroke: "#a1a1aa", strokeDasharray: "3 3", strokeOpacity: 0.7 }),
          // A wide faint under-stroke stands in for the source's glow.
          lineY(ROWS, {
            id: "glow",
            stroke: ASSET,
            strokeOpacity: 0.16,
            strokeWidth: 7,
            x: "i",
            y: "asset",
          }),
          lineY(ROWS, { stroke: ASSET, strokeWidth: 2.25, x: "i", y: "asset" }),
          dot(picked ? [picked] : [], {
            fill: LIABILITY,
            key: () => "liability",
            r: 4,
            stroke: "#ffffff",
            strokeWidth: 2,
            x: "i",
            y: "liability",
          }),
          dot(picked ? [picked] : [], {
            fill: ASSET,
            key: () => "asset",
            r: 4.5,
            stroke: "#ffffff",
            strokeWidth: 2,
            x: "i",
            y: "asset",
          }),
        ],
        scales: {
          x: {
            axis: {
              line: false,
              tickLabels: {
                anchor: ({ index }) => {
                  if (index === 0) {
                    return "start";
                  }
                  return index === MONTH_X.length - 1 ? "end" : "middle";
                },
                fontSize: 11.5,
              },
              ticks: {
                format: (v) => MONTHS[Math.round(Number(v) / 12.5)] ?? "",
                size: 0,
                values: [...MONTH_X],
              },
            },
            scale: scaleLinear().domain([0, LAST]),
          },
          y: {
            axis: {
              line: { stroke: GRID, strokeOpacity: 1 },
              tickLabels: { fontSize: 11.5 },
              ticks: { format: (v) => compact(v), padding: 10, size: 0, values: [...TICKS] },
            },
            grid: { stroke: "#e4e4e7", strokeDasharray: "4 4", strokeOpacity: 1 },
            scale: scaleLinear().domain([MIN, MAX]),
            side: "right",
          },
        },
        theme: { muted: "#a1a1aa" },
      }),
    [at, picked],
  );

  const left = (at / LAST) * 100;
  const top = 100 - (((picked?.asset ?? MIN) - MIN) / (MAX - MIN)) * 100;

  return (
    <Card className="!bg-[#f4f4f6] !p-1.5">
      <div className="flex items-center justify-between gap-2 px-3 pt-2.5 pb-3">
        <div className="flex items-center gap-2.5">
          <IconTile icon={ChartPie} color="#3b82f6" size={30} />
          <h3 className="text-[14.5px] leading-tight font-semibold tracking-[-0.01em]">
            Cumulative Assets and Liabilities
          </h3>
        </div>
        <span className="shrink-0 rounded-full bg-[#e8e8eb] px-2.5 py-1 text-[9.5px] font-medium tracking-wide text-[#55555e]">
          FINANCE OVERVIEW
        </span>
      </div>
      <div className="rounded-[18px] bg-white p-4 ring-1 ring-black/[0.05]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#55555e]">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="size-3 rounded-[4px] shadow-[0_1px_4px_rgba(22,163,74,0.5)]"
                style={{ backgroundColor: ASSET }}
              />
              Cumulative Assets
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="size-3 rounded-[4px] shadow-[0_1px_4px_rgba(239,68,68,0.5)]"
                style={{ backgroundColor: LIABILITY }}
              />
              Cumulative Liabilities
            </span>
          </div>
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#e7f8ee] px-2 py-1 text-[11px] font-semibold"
            style={{ color: GREEN }}
          >
            <Clock className="size-3" strokeWidth={2.6} /> YTD
          </span>
        </div>
        <ChartSlot height={HEIGHT} className="mt-3">
          <div onMouseLeave={() => pin(null)}>
            <Chart
              definition={definition}
              renderer={renderer}
              height={HEIGHT}
              ariaLabel="Cumulative assets and liabilities, year to date"
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
              top={top}
              align={left > 55 ? "right" : "left"}
              dark
              // High on the plot the readout hangs below the point, clear of the legend.
              className={`text-[11px] ${top < 40 ? "translate-y-3" : "-translate-y-[calc(100%+12px)]"} ${left > 55 ? "ml-2" : "-ml-2"}`}
            >
              <p className="flex items-center gap-1.5">
                <span className="size-2 rounded-[3px]" style={{ backgroundColor: ASSET }} />
                Assets{" "}
                <span className="ml-auto pl-2 font-semibold">{compact(picked?.asset ?? 0)}</span>
              </p>
              <p className="flex items-center gap-1.5">
                <span className="size-2 rounded-[3px]" style={{ backgroundColor: LIABILITY }} />
                Liabilities{" "}
                <span className="ml-auto pl-2 font-semibold">
                  {compact(picked?.liability ?? 0)}
                </span>
              </p>
            </Bubble>
          </PlotOverlay>
        </ChartSlot>
      </div>
    </Card>
  );
};
