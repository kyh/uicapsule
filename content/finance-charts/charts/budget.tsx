"use client";

import { cell, defineChart } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react/core";
import { scaleBand } from "@tanstack/charts/scales/band";
import { useMemo } from "react";

import { usd } from "../lib/data";
import { Card, ChartSlot, MoreButton, Num, renderer, useCycle } from "../lib/kit";
import { MUTED, ORANGE, THEME } from "../lib/tokens";

const SPENT = 1657;
const LIMIT = 5000;
const COLS = 30;
const ROWS = 2;
const FILLED = Math.floor((SPENT / LIMIT) * COLS);
// Two rows of ~11px squares at wall-card width.
const HEIGHT = 23;

const COL_IDS = Array.from({ length: COLS }, (_, i) => i);
const ROW_IDS = Array.from({ length: ROWS }, (_, i) => i);
const CELLS = ROW_IDS.flatMap((row) => COL_IDS.map((col) => ({ col, id: `${row}:${col}`, row })));

const BudgetBody = () => {
  // A glint walks the spent columns, then rests a beat off the end.
  const [glint, pin] = useCycle(FILLED + 4, 170);

  const definition = useMemo(
    () =>
      defineChart({
        color: { domain: ["on", "glint", "off"], range: [ORANGE, "#fdba74", "#f3f3f5"] },
        guides: false,
        margin: 0,
        marks: [
          cell(CELLS, {
            color: (d) => {
              if (d.col >= FILLED) {
                return "off";
              }
              return d.col === glint ? "glint" : "on";
            },
            inset: 1.3,
            key: "id",
            radius: 2.2,
            x: "col",
            y: "row",
          }),
        ],
        scales: {
          x: { scale: scaleBand<number>().domain(COL_IDS) },
          y: { scale: scaleBand<number>().domain(ROW_IDS) },
        },
        theme: THEME,
      }),
    [glint],
  );

  return (
    <>
      <div className="flex items-center justify-between">
        <h3 className="text-[18px] font-semibold tracking-[-0.01em]">Budget</h3>
        <MoreButton />
      </div>
      <div className="mt-4 flex items-baseline justify-between text-[13px]">
        <p>
          <span style={{ color: MUTED }}>Spent : </span>
          <Num value={SPENT} format={(n) => usd(n, true)} className="font-medium" />
        </p>
        <p>
          <span style={{ color: MUTED }}>Limit : </span>
          <span className="font-medium tabular-nums">{usd(LIMIT, true)}</span>
        </p>
      </div>
      <ChartSlot height={HEIGHT} className="mt-2">
        <div onMouseEnter={() => pin(FILLED + 3)} onMouseLeave={() => pin(null)}>
          <Chart
            definition={definition}
            renderer={renderer}
            height={HEIGHT}
            ariaLabel={`Budget used: ${usd(SPENT, true)} of ${usd(LIMIT, true)}`}
          />
        </div>
      </ChartSlot>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="text-[13px] leading-snug text-[#55555c]">
          <p>You’re well within your limit</p>
          <p>
            <Num value={LIMIT - SPENT} format={(n) => usd(n, true)} /> left to spend
          </p>
        </div>
        <button
          type="button"
          className="rounded-full px-4 py-2 text-[14px] font-medium text-white ring-1 ring-[#e0620c]"
          style={{
            background: "linear-gradient(180deg, #fb923c, #f97316 55%, #ea6a0c)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -2px 4px rgba(194,65,12,0.35), 0 6px 14px -6px rgba(249,115,22,0.8)",
          }}
        >
          Details
        </button>
      </div>
    </>
  );
};

// The cycle hooks read the Card's in-view context, so they live a level below it.
export const Budget = () => (
  <Card>
    <BudgetBody />
  </Card>
);
