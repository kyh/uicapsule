"use client";

import { barX, defineChart } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react/core";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { ArrowUp, ArrowUpRight } from "lucide-react";
import { useMemo } from "react";

import { compact, usd } from "../lib/data";
import {
  Bubble,
  Card,
  ChartSlot,
  MoreButton,
  Num,
  PlotOverlay,
  renderer,
  useCycle,
} from "../lib/kit";
import { GREEN, GRID, MUTED, THEME } from "../lib/tokens";

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"] as const;
const VALUES = [76_400, 39_200, 32_300, 40_100] as const;
const TARGET = 100_000;

const MARGIN = { bottom: 30, left: 30, right: 2, top: 0 };
const HEIGHT = 228;
const PADDING = 0.26;

const rows = QUARTERS.map((q, i) => ({ q, target: TARGET, value: VALUES[i] ?? 0 }));

// Center of band `i` as a fraction of the plot height (d3 band, no outer padding).
const bandCenter = (i: number) => (i + (1 - PADDING) / 2) / (QUARTERS.length - PADDING);

const wholeUsd = (n: number) => usd(n, true);

const IncomeOverviewBody = () => {
  const [hi, pin] = useCycle(QUARTERS.length, 2100);
  const picked = rows[hi] ?? rows[0];
  const share = (picked?.value ?? 0) / TARGET;
  // Long bars carry their readout inside the bar end so it never clips the card.
  const inside = share > 0.6;

  const definition = useMemo(
    () =>
      defineChart({
        gradients: [
          {
            id: "io-bar",
            stops: [
              { color: "#4b97f2", offset: 0 },
              { color: "#62a7f6", offset: 0.72 },
              { color: "#b9d8fc", offset: 1 },
            ],
            x1: 0,
            x2: 1,
            y1: 0,
            y2: 0,
          },
          {
            id: "io-hot",
            stops: [
              { color: "#1f7ced", offset: 0 },
              { color: "#3e93f4", offset: 0.75 },
              { color: "#9cc9fb", offset: 1 },
            ],
            x1: 0,
            x2: 1,
            y1: 0,
            y2: 0,
          },
        ],
        margin: MARGIN,
        marks: [
          barX(rows, {
            fill: "#fafafa",
            id: "track",
            key: "q",
            radius: 9,
            stroke: GRID,
            strokeWidth: 1,
            x: "target",
            y: "q",
          }),
          barX(rows, {
            fill: (d) => (d.q === picked?.q ? "url(#io-hot)" : "url(#io-bar)"),
            id: "value",
            key: "q",
            radius: 9,
            x: "value",
            y: "q",
          }),
        ],
        scales: {
          x: {
            axis: {
              line: false,
              tickLabels: { fontSize: 12 },
              ticks: {
                format: (v: number) => compact(v, ""),
                padding: 10,
                size: 0,
                values: [0, 20_000, 40_000, 60_000, 80_000, 100_000],
              },
            },
            scale: scaleLinear().domain([0, TARGET]),
          },
          y: {
            axis: {
              line: false,
              tickLabels: {
                fontSize: 13,
                fontWeight: (c) => (c.value === picked?.q ? 600 : 400),
              },
              ticks: { padding: 8, size: 0 },
            },
            scale: scaleBand<string>()
              .domain([...QUARTERS])
              .paddingInner(PADDING)
              .paddingOuter(0),
          },
        },
        theme: THEME,
      }),
    [picked],
  );

  return (
    <>
      <div className="flex items-start justify-between">
        <h3 className="text-[17px] font-semibold tracking-[-0.01em]">Income Overview</h3>
        <MoreButton />
      </div>
      <p className="mt-3 text-[13px]" style={{ color: MUTED }}>
        Total Revenue
      </p>
      <Num value={189_000} className="block text-[30px] font-bold tracking-[-0.03em]" />
      <div className="mt-1.5 flex items-center gap-2 text-[13px]">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium"
          style={{ backgroundColor: "#e3f6e9", color: GREEN }}
        >
          <span
            className="inline-flex size-3.5 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: GREEN }}
          >
            <ArrowUp className="size-2.5" strokeWidth={3} />
          </span>
          <Num value={163_747} format={wholeUsd} />
        </span>
        <span style={{ color: MUTED }}>vs last year</span>
      </div>
      <div className="my-4 h-px" style={{ backgroundColor: GRID }} />
      <p className="text-[14px] font-semibold">Income Breakdown</p>
      <p className="mt-0.5 text-[12px]" style={{ color: MUTED }}>
        Tracking progress toward $100K quarterly targets
      </p>
      <ChartSlot height={HEIGHT} className="mt-3">
        <div onMouseLeave={() => pin(null)}>
          <Chart
            definition={definition}
            renderer={renderer}
            height={HEIGHT}
            ariaLabel="Quarterly income against a $100K target"
            onFocusChange={(p) => {
              if (p) {
                pin(rows.findIndex((r) => r.q === p.yValue));
              }
            }}
          />
        </div>
        <PlotOverlay margin={MARGIN}>
          <Bubble
            left={share * 100}
            top={bandCenter(hi) * 100}
            align={inside ? "right" : "left"}
            dark={!inside}
            className={`${inside ? "-ml-1.5" : "ml-2"} -translate-y-1/2 !rounded-full !px-2 !py-0.5 text-[11px] font-semibold`}
          >
            {`${compact(picked?.value ?? 0)} · ${Math.round(share * 100)}%`}
          </Bubble>
        </PlotOverlay>
      </ChartSlot>
      <button
        type="button"
        className="mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-full border text-[14px] font-medium text-[#3a3a42] transition-colors hover:bg-black/[0.02]"
        style={{ borderColor: GRID }}
      >
        See insight <ArrowUpRight className="size-4" style={{ color: MUTED }} />
      </button>
    </>
  );
};

// The cycle, count-ups and chart mount read the card's in-view state, so the
// body renders inside <Card> rather than beside it.
export const IncomeOverview = () => (
  <Card>
    <IncomeOverviewBody />
  </Card>
);
