"use client";

import { defineChart, hexagon, rect } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react/core";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { ChevronRight, Wallet } from "lucide-react";
import { useMemo } from "react";

import { Card, ChartSlot, MoreButton, Num, renderer, useCycle } from "../lib/kit";
import { BLUE, GREEN, MUTED, THEME } from "../lib/tokens";

const STEPS = [32.5, 47.8, 24.1, 61.3] as const;
const BUDGET = 5064.52;
const COLS = 52;
const DOT_ROWS = 7;
// Pixel layout: the texture fills the white band, axis labels sit in the
// grey band under the track.
const HEIGHT = 128;
const BAND = 86;
const MARGIN = { bottom: HEIGHT - BAND, left: 0, right: 0, top: 0 };
const TRACK = 4 / BAND;
const PAD = 14;

const DOTS = Array.from({ length: COLS * DOT_ROWS }, (_, i) => {
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  return {
    col,
    id: i,
    row,
    x: ((col + 0.5) / COLS) * 100,
    y: 0.14 + (row / (DOT_ROWS - 1)) * 0.78,
  };
});

export const BudgetPlan = () => {
  const [step, pin] = useCycle(STEPS.length, 2600, 0);
  const pct = STEPS[step] ?? STEPS[0];

  const definition = useMemo(
    () =>
      defineChart({
        focusRing: false,
        margin: MARGIN,
        marks: [
          hexagon(DOTS, {
            // Dots under the spent share pick up the accent; the rest stay grey.
            fill: (d) => {
              if (d.x <= pct) {
                return d.row < 3 ? "#d5e5fb" : "#c3d9f8";
              }
              return d.row < 3 ? "#eeeef1" : "#e4e4e8";
            },
            key: "id",
            r: 1.7,
            x: "x",
            y: "y",
          }),
          rect([{ id: "track" }], {
            fill: "#cfcfd4",
            inset: 0,
            key: "id",
            x1: () => 0,
            x2: () => 100,
            y1: () => 0,
            y2: () => TRACK,
          }),
          rect([{ id: "fill", pct }], {
            fill: BLUE,
            inset: 0,
            key: "id",
            radius: [0, 2, 2, 0],
            x1: () => 0,
            x2: "pct",
            y1: () => 0,
            y2: () => TRACK,
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
                  return index === 4 ? "end" : "middle";
                },
                dx: ({ index }) => {
                  if (index === 0) {
                    return PAD;
                  }
                  return index === 4 ? -PAD : 0;
                },
                fontSize: 12,
              },
              ticks: { format: (v) => `${v}%`, padding: 14, size: 0, values: [0, 25, 50, 75, 100] },
            },
            scale: scaleLinear().domain([0, 100]),
          },
          y: { axis: false, scale: scaleLinear().domain([0, 1]) },
        },
        theme: { ...THEME, background: "transparent" },
      }),
    [pct],
  );

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[12px]" style={{ color: MUTED }}>
            Step 2/2
          </p>
          <h3 className="mt-0.5 flex items-center gap-1.5 text-[17px] font-semibold tracking-[-0.01em]">
            <span style={{ color: "#a4a4ab" }}>Budget Plan</span>
            <ChevronRight className="size-4" style={{ color: "#a4a4ab" }} />
            Expense Ratio
          </h3>
        </div>
        <MoreButton />
      </div>
      <div
        className="relative mt-4 overflow-hidden rounded-2xl ring-1 ring-black/[0.06]"
        style={{ background: `linear-gradient(180deg, #ffffff 0 ${BAND}px, #ececee ${BAND}px)` }}
      >
        <ChartSlot height={HEIGHT}>
          <div onMouseLeave={() => pin(null)}>
            <Chart
              definition={definition}
              renderer={renderer}
              height={HEIGHT}
              ariaLabel="Expenses as a share of the monthly budget"
              onFocusChange={(p) => {
                if (p) {
                  pin(step);
                }
              }}
            />
          </div>
        </ChartSlot>
        <div
          className="pointer-events-none absolute inset-x-0 flex items-center justify-between gap-2"
          style={{ paddingInline: PAD, top: 18 }}
        >
          <p className="flex items-baseline gap-1.5 text-[12px]">
            <span style={{ color: MUTED }}>Expenses</span>
            <Num value={(BUDGET * pct) / 100} className="text-[13px] font-medium" />
          </p>
          <div className="flex items-center gap-1.5">
            <Num
              value={pct}
              format={(n) => `${n.toFixed(1)}%`}
              className="rounded-full bg-[#e7f8ec] px-2 py-1 text-[11px] font-medium"
              style={{ color: GREEN }}
            />
            <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[12px] font-medium shadow-[0_1px_3px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.06]">
              <Wallet className="size-3.5" style={{ color: BLUE }} strokeWidth={2.6} />
              Saving
            </span>
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <span className="h-1.5 w-4 rounded-full bg-[#e6e6ea]" />
          <span className="h-1.5 w-8 rounded-full bg-[#b8d6fb]" />
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="h-9 rounded-full border border-black/[0.08] px-3.5 text-[13px] font-medium text-[#3a3a42]"
          >
            Adjust budget
          </button>
          <button
            type="button"
            className="h-9 rounded-full px-3.5 text-[13px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_4px_12px_-4px_rgba(29,124,242,0.7)]"
            style={{ background: "linear-gradient(180deg, #3b93f7, #1572ec)" }}
          >
            Save plan
          </button>
        </div>
      </div>
    </Card>
  );
};
