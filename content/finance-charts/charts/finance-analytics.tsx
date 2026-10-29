"use client";

import { barY, defineChart, tickY } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react/core";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { CalendarDays } from "lucide-react";
import { useMemo } from "react";

import { MONTHS, usd } from "../lib/data";
import {
  Bubble,
  Card,
  ChartSlot,
  Chip,
  MoreButton,
  PlotOverlay,
  renderer,
  useCycle,
} from "../lib/kit";
import { DASHED_GRID, MUTED, ORANGE, THEME } from "../lib/tokens";

const INCOME = [4080, 4700, 5380, 5102.87, 4980, 4890, 5190, 5510, 5900, 5080, 4720, 4220] as const;
const EXPENSES = [
  3580, 3200, 2780, 4151.99, 3060, 3450, 2560, 3850, 4480, 3400, 3700, 2150,
] as const;
const FULL = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const rows = MONTHS.map((m, i) => ({
  expenses: EXPENSES[i] ?? 0,
  income: INCOME[i] ?? 0,
  m,
}));

const MARGIN = { bottom: 26, left: 44, right: 0, top: 8 };
const HEIGHT = 250;
const TOP = 7000;
const PAD = 0.16;

const bandFrac = (i: number, at: number) => (i + at * (1 - PAD)) / (MONTHS.length - PAD);

const Pill = ({ hot }: { hot?: boolean }) => (
  <span
    className="inline-block h-3.5 w-1.5 rounded-full"
    style={{
      background: hot
        ? "linear-gradient(180deg, #fdba74, #ea580c)"
        : "linear-gradient(180deg, #f4f4f6, #d4d4d8)",
      boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.08)",
    }}
  />
);

export const FinanceAnalytics = () => {
  const [hi, pin] = useCycle(MONTHS.length, 2000, 3);
  const picked = rows[hi] ?? rows[0];

  const definition = useMemo(
    () =>
      defineChart({
        gradients: [
          {
            id: "fa-glow",
            stops: [
              { color: "#fdba74", offset: 0, opacity: 0.95 },
              { color: "#fed7aa", offset: 0.45, opacity: 0.6 },
              { color: "#ffedd5", offset: 1, opacity: 0 },
            ],
            x1: 0,
            x2: 0,
            y1: 0,
            y2: 1,
          },
        ],
        margin: MARGIN,
        marks: [
          barY([{ id: "glow", m: picked?.m ?? "Jan", v: picked?.income ?? 0 }], {
            fill: "url(#fa-glow)",
            id: "glow",
            key: "id",
            x: "m",
            y: "v",
          }),
          tickY(rows, {
            id: "expenses",
            key: "m",
            stroke: (d) => (d.m === picked?.m ? "#d4d4d8" : "#e8e8ec"),
            strokeWidth: 4,
            x: "m",
            y: "expenses",
          }),
          tickY(rows, {
            id: "income",
            key: "m",
            stroke: (d) => (d.m === picked?.m ? ORANGE : "#fcd3b6"),
            strokeWidth: 4,
            x: "m",
            y: "income",
          }),
        ],
        scales: {
          x: {
            axis: {
              line: false,
              tickLabels: {
                fontSize: 10,
                fontWeight: (c) => (c.value === picked?.m ? 600 : 400),
                thin: false,
              },
              ticks: { padding: 8, size: 0 },
            },
            scale: scaleBand<string>()
              .domain([...MONTHS])
              .paddingInner(PAD)
              .paddingOuter(0),
          },
          y: {
            axis: {
              line: false,
              tickLabels: { fontSize: 11 },
              ticks: {
                format: (v: number) => `$${v}`,
                padding: 8,
                size: 0,
                values: [0, 1000, 2000, 3000, 4000, 5000, 6000, 7000],
              },
            },
            grid: DASHED_GRID,
            scale: scaleLinear().domain([0, TOP]),
          },
        },
        theme: THEME,
      }),
    [picked],
  );

  const right = hi < 5;

  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-[17px] font-semibold tracking-[-0.01em]">Finance Analytics</h3>
          <p className="mt-0.5 text-[12px]" style={{ color: MUTED }}>
            Track recurring income and expenses.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Chip icon={CalendarDays} chevron>
            Yearly
          </Chip>
          <MoreButton />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3 text-[12px] text-[#3a3a42]">
        <span className="inline-flex items-center gap-1.5">
          <Pill hot />
          Income
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Pill />
          Expenses
        </span>
      </div>
      <ChartSlot height={HEIGHT} className="mt-2">
        <div onMouseLeave={() => pin(null)}>
          <Chart
            definition={definition}
            renderer={renderer}
            height={HEIGHT}
            ariaLabel="Monthly income and expenses"
            onFocusChange={(p) => {
              if (p) {
                const i = rows.findIndex((r) => r.m === p.xValue);
                if (i !== -1) {
                  pin(i);
                }
              }
            }}
          />
        </div>
        <PlotOverlay margin={MARGIN}>
          <Bubble
            left={bandFrac(hi, right ? 1 : 0) * 100}
            top={100 - ((picked?.income ?? 0) / TOP) * 100}
            align={right ? "left" : "right"}
            className={`${right ? "ml-1.5" : "-ml-1.5"} -mt-4 !rounded-[12px] !p-0 text-[11px]`}
          >
            <p className="border-b border-black/[0.06] px-2.5 py-1.5 font-medium text-[#3a3a42]">
              {`${FULL[hi] ?? ""} 2026`}
            </p>
            <div className="space-y-1 px-2.5 py-1.5">
              <div className="flex items-center justify-between gap-4">
                <span className="inline-flex items-center gap-1.5" style={{ color: MUTED }}>
                  <Pill hot /> Income
                </span>
                <span className="text-[13px] font-semibold tabular-nums">
                  {usd(picked?.income ?? 0)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="inline-flex items-center gap-1.5" style={{ color: MUTED }}>
                  <Pill /> Expenses
                </span>
                <span className="text-[13px] font-semibold tabular-nums">
                  {usd(picked?.expenses ?? 0)}
                </span>
              </div>
            </div>
          </Bubble>
        </PlotOverlay>
      </ChartSlot>
    </Card>
  );
};
