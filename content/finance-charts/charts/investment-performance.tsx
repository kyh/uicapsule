"use client";

import { arrow, defineChart, dot, lineY, ruleX } from "@tanstack/charts";
import { d3Curve } from "@tanstack/charts/d3/shape";
import { Chart } from "@tanstack/charts/react/core";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { curveMonotoneX } from "d3-shape";
import { ArrowUp, CreditCard } from "lucide-react";
import { useMemo } from "react";

import { compact, MONTHS, usd } from "../lib/data";
import {
  Bubble,
  Card,
  ChartSlot,
  IconTile,
  Legend,
  MoreButton,
  Num,
  PlotOverlay,
  renderer,
  useCycle,
} from "../lib/kit";
import { BLUE, INK, MUTED, ORANGE, THEME } from "../lib/tokens";

const STOCK = "#a334fa";

const SERIES = [
  {
    color: STOCK,
    label: "Stock portfolio",
    values: [
      28_520, 28_540, 32_180, 35_369.72, 38_100, 40_050, 41_200, 43_350, 43_300, 46_250, 46_820,
      44_800,
    ],
  },
  {
    color: BLUE,
    label: "Bonds portfolio",
    values: [
      25_010, 23_050, 26_980, 25_006.34, 23_620, 24_050, 26_020, 31_100, 36_050, 36_120, 37_600,
      40_600,
    ],
  },
  {
    color: ORANGE,
    label: "Cash portfolio",
    values: [
      20_620, 24_180, 23_640, 21_981.52, 20_780, 20_640, 24_020, 23_240, 27_380, 25_640, 30_600,
      32_700,
    ],
  },
] as const;

const ROWS = SERIES.flatMap((s) =>
  s.values.map((value, m) => ({ id: `${s.label}-${m}`, m, series: s.label, value })),
);
const MONTH_IDX = MONTHS.map((_, i) => i);
const LONG_MONTHS = [
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
];
// First-of-month weekdays for 2026.
const FIRST_WEEKDAY = [
  "Thursday",
  "Sunday",
  "Sunday",
  "Wednesday",
  "Friday",
  "Monday",
  "Wednesday",
  "Saturday",
  "Tuesday",
  "Thursday",
  "Sunday",
  "Tuesday",
];

const TOP = 60_000;
const HEIGHT = 260;
const MARGIN = { bottom: 28, left: 46, right: 6, top: 6 };
const GRID_STYLE = { stroke: "#e6e6ea", strokeOpacity: 1, strokeWidth: 1 };

export const InvestmentPerformance = () => {
  const [month, pin] = useCycle(12, 2100, 3);

  const definition = useMemo(
    () =>
      defineChart({
        color: { domain: SERIES.map((s) => s.label), range: SERIES.map((s) => s.color) },
        margin: MARGIN,
        marks: [
          ruleX([month], {
            stroke: INK,
            strokeDasharray: "3 3",
            strokeOpacity: 0.85,
            strokeWidth: 1.2,
          }),
          arrow(
            [
              { id: "top", y1: TOP + 600, y2: TOP - 1600 },
              { id: "bottom", y1: -600, y2: 1600 },
            ],
            {
              headAngle: 38,
              headLength: 5,
              key: "id",
              stroke: INK,
              strokeWidth: 1.2,
              x1: () => month,
              x2: () => month,
              y1: "y1",
              y2: "y2",
            },
          ),
          lineY(ROWS, {
            color: "series",
            curve: d3Curve(curveMonotoneX),
            key: "id",
            strokeWidth: 2.4,
            x: "m",
            y: "value",
            z: "series",
          }),
          dot(
            ROWS.filter((r) => r.m === month),
            {
              color: "series",
              key: "series",
              r: 4,
              stroke: "#ffffff",
              strokeWidth: 2,
              x: "m",
              y: "value",
            },
          ),
        ],
        scales: {
          x: {
            axis: {
              line: { stroke: "#d4d4da" },
              tickLabels: {
                fontSize: 11,
                fontWeight: (c) => (c.value === month ? 600 : 400),
              },
              ticks: {
                format: (v: number) => MONTHS[v] ?? "",
                line: { stroke: "#3f3f46" },
                size: 5,
                values: MONTH_IDX,
              },
            },
            grid: GRID_STYLE,
            scale: scaleLinear().domain([0, 11]),
          },
          y: {
            axis: {
              line: false,
              tickLabels: { fontSize: 11 },
              ticks: {
                format: (v: number) => compact(v),
                line: { stroke: "#3f3f46" },
                size: 5,
                values: [0, 10_000, 20_000, 30_000, 40_000, 50_000, 60_000],
              },
            },
            grid: GRID_STYLE,
            scale: scaleLinear().domain([0, TOP]),
          },
        },
        theme: THEME,
      }),
    [month],
  );

  const right = month < 6;
  const x = (month / 11) * 100;

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <IconTile icon={CreditCard} color={STOCK} className="!rounded-full" />
          <h3 className="text-[15px] font-semibold tracking-[-0.01em]">Investment performance</h3>
        </div>
        <MoreButton />
      </div>
      <p className="mt-5 text-[12px]" style={{ color: MUTED }}>
        Total balance
      </p>
      <Num value={118_008.37} className="mt-0.5 block text-[30px] font-bold tracking-[-0.03em]" />
      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#dcfce7] px-2 py-0.5 text-[12px] font-medium text-[#16a34a]">
          <span className="inline-flex size-3.5 items-center justify-center rounded-full bg-[#16a34a] text-white">
            <ArrowUp className="size-2.5" strokeWidth={3.2} />
          </span>
          2.71%
        </span>
        <Legend
          items={SERIES.map((s) => ({ color: s.color, label: s.label.replace(" portfolio", "") }))}
          className="!gap-x-2.5 text-[11.5px]"
        />
      </div>

      <ChartSlot height={HEIGHT} className="mt-4">
        <div onMouseLeave={() => pin(null)}>
          <Chart
            definition={definition}
            renderer={renderer}
            height={HEIGHT}
            ariaLabel="Stock, bonds and cash portfolio value by month"
            onFocusChange={(p) => {
              const m = Number(p?.xValue);
              if (p && Number.isInteger(m)) {
                pin(m);
              }
            }}
          />
        </div>
        <PlotOverlay margin={MARGIN}>
          <Bubble
            left={right ? x + 2.5 : x - 2.5}
            top={15}
            dark
            align={right ? "left" : "right"}
            className="!rounded-[12px] !p-0"
          >
            <p className="border-b border-white/10 px-3 py-1.5 text-[11px] text-white/80">
              {FIRST_WEEKDAY[month]}, {LONG_MONTHS[month]} 1
            </p>
            <div className="px-3 py-1.5">
              {SERIES.map((s) => (
                <p key={s.label} className="flex items-center gap-1.5 py-0.5 text-[11px]">
                  <span className="size-2 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-white/70">{s.label.replace(" portfolio", "")}</span>
                  <span className="ml-auto pl-3 font-semibold tabular-nums">
                    {usd(s.values[month] ?? 0)}
                  </span>
                </p>
              ))}
            </div>
          </Bubble>
        </PlotOverlay>
      </ChartSlot>
    </Card>
  );
};
