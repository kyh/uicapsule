"use client";

import { cell, defineChart } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react/core";
import { scaleBand } from "@tanstack/charts/scales/band";
import { useMemo } from "react";

import { Card, ChartSlot, MoreButton, Num, renderer, useCycle } from "../lib/kit";
import { THEME } from "../lib/tokens";

const FIRST = 2023;
const YEARS = 8;
const PER_YEAR = 4;
const COLS = YEARS * PER_YEAR;
const ROWS = 22;
// Quarters where the market crossed a milestone: their top cell is lit.
const MILESTONES = new Set([1, 5, 8, 10, 12, 17, 21, 25, 28, 29, 31]);

/** Filled rows per quarter: 46% CAGR compounding from two rows to the top. */
const level = (c: number) => {
  const t = c / (COLS - 1);
  const g = 1.46 ** (t * (YEARS - 1));
  const span = 1.46 ** (YEARS - 1) - 1;
  return Math.round(2 + (ROWS - 3) * ((g - 1) / span));
};

interface Cell {
  c: number;
  id: string;
  r: number;
}
const cellAt = (c: number, r: number): Cell => ({ c, id: `${c}-${r}`, r });

const ALL: Cell[] = [];
for (let c = 0; c < COLS; c += 1) {
  for (let r = 0; r < ROWS; r += 1) {
    ALL.push(cellAt(c, r));
  }
}

const HEIGHT = 200;
const MARGIN = { bottom: 22, left: 0, right: 0, top: 0 };
// Eight reveal steps, then two beats holding the full decade.
const STEPS = YEARS + 2;

const GlobalDefiBody = () => {
  const [step, pin] = useCycle(STEPS, 900, STEPS - 1);
  const years = Math.min(YEARS, step + 1);

  const definition = useMemo(() => {
    const filled: Cell[] = [];
    const lit: Cell[] = [];
    for (let c = 0; c < years * PER_YEAR; c += 1) {
      const top = level(c);
      for (let r = 0; r < top; r += 1) {
        if (r === top - 1 && MILESTONES.has(c)) {
          lit.push(cellAt(c, r));
        } else {
          filled.push(cellAt(c, r));
        }
      }
    }
    const grid = (rows: Cell[], fill: string, id: string) =>
      cell(rows, { fill, id, inset: 1.1, key: "id", radius: 2, x: "c", y: "r" });
    return defineChart({
      margin: MARGIN,
      marks: [
        grid(ALL, "#f4f4f5", "defi-empty"),
        grid(filled, "#fde8b4", "defi-fill"),
        grid(lit, "#fbbf24", "defi-lit"),
      ],
      scales: {
        x: {
          axis: {
            line: false,
            tickLabels: {
              dx: ({ bandwidth }) => -bandwidth / 2,
              fontSize: 11,
              opacity: ({ index }) => (index < years ? 1 : 0.45),
            },
            ticks: {
              format: (v: number) => String(FIRST + Math.floor(v / PER_YEAR)),
              size: 0,
              values: Array.from({ length: YEARS }, (_, y) => y * PER_YEAR + 2),
            },
          },
          scale: scaleBand<number>()
            .domain(Array.from({ length: COLS }, (_, i) => i))
            .padding(0),
        },
        y: {
          axis: false,
          reverse: true,
          scale: scaleBand<number>()
            .domain(Array.from({ length: ROWS }, (_, i) => i))
            .padding(0),
        },
      },
      theme: THEME,
    });
  }, [years]);

  return (
    <>
      <div className="flex items-center justify-between px-3 pt-2 pb-2.5">
        <h3 className="text-[16px] font-semibold tracking-[-0.01em]">Global DeFi</h3>
        <MoreButton className="bg-white" />
      </div>
      <div className="rounded-[16px] border border-black/[0.06] bg-white p-3.5">
        <p className="text-[11px] leading-[1.55] tracking-[0.01em] text-[#52525b] uppercase">
          The global <span className="normal-case">DeFi</span> market is currently valued at{" "}
          <Num
            value={13.92}
            format={(n) => `$${n.toFixed(2)} billion`}
            className="font-semibold text-[#0b0b0f]"
          />
          , and is expected to grow at a{" "}
          <span className="font-semibold text-[#0b0b0f]">CAGR of 46%</span> between{" "}
          <span className="font-semibold text-[#0b0b0f]">2023-2030</span>.
        </p>
        <ChartSlot height={HEIGHT} className="mt-3">
          <div onMouseEnter={() => pin(STEPS - 1)} onMouseLeave={() => pin(null)}>
            <Chart
              definition={definition}
              renderer={renderer}
              height={HEIGHT}
              ariaLabel="DeFi market size by quarter, 2023 to 2030"
            />
          </div>
        </ChartSlot>
      </div>
    </>
  );
};

/** Card is the activation provider, so the cycling body must render inside it. */
export const GlobalDefi = () => (
  <Card className="!bg-[#f6f6f7] !p-1.5">
    <GlobalDefiBody />
  </Card>
);
