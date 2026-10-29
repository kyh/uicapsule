"use client";

import { bandX, barY, defineChart, ruleY } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react/core";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { ArrowUpRight, ChartPie } from "lucide-react";
import { useMemo } from "react";

import { compact, usd } from "../lib/data";
import {
  Bubble,
  Card,
  CardHeader,
  ChartSlot,
  Chip,
  Num,
  PlotOverlay,
  renderer,
  useCycle,
} from "../lib/kit";
import { BLUE, GREEN, MUTED, ORANGE, THEME } from "../lib/tokens";

const VIVID_PURPLE = "#a43cf5";

const SERIES = [
  { color: GREEN, label: "Assets", total: 643_867.09 },
  { color: ORANGE, label: "Debt", total: 138_645.16 },
  { color: BLUE, label: "Investments", total: 264_864.86 },
  { color: VIVID_PURPLE, label: "Cash", total: 79_742.92 },
] as const;

// $ per series per day, May 1–13: assets, debt, investments, cash.
const TABLE: [number, number, number, number][] = [
  [9460, 1520, 4480, 5600],
  [7420, 2560, 7010, 2140],
  [4180, 0, 4560, 8640],
  [9080, 0, 0, 8520],
  [0, 5540, 7120, 17_960],
  [4363.64, 5181.82, 3000, 22_909.09],
  [17_820, 980, 3640, 8420],
  [14_130, 4120, 5060, 6280],
  [9620, 6040, 1980, 3840],
  [4470, 4980, 0, 3060],
  [1660, 2480, 1520, 2460],
  [12_480, 4960, 5120, 8640],
  [1480, 2060, 0, 0],
];

const WEEKDAY = ["Fri", "Sat", "Sun", "Mon", "Tue", "Wed", "Thu"] as const;
const DAYS = TABLE.map((_, i) => i + 1);
const ROWS = TABLE.flatMap((vals, i) =>
  SERIES.map((s, j) => ({
    day: i + 1,
    id: `${i + 1}-${s.label}`,
    series: s.label,
    value: vals[j] ?? 0,
  })),
);

const TOP = 60_000;
const HEIGHT = 220;
const MARGIN = { bottom: 26, left: 40, right: 0, top: 8 };

export const FinancialBreakdown = () => {
  const [hi, pin] = useCycle(DAYS.length, 2000, 5);
  const day = hi + 1;
  const vals = TABLE[hi] ?? TABLE[0];

  const definition = useMemo(
    () =>
      defineChart({
        color: { domain: SERIES.map((s) => s.label), range: SERIES.map((s) => s.color) },
        margin: MARGIN,
        marks: [
          bandX([day], {
            fill: VIVID_PURPLE,
            fillOpacity: 0.1,
            inset: -3,
            key: () => "band",
            x: (d) => d,
          }),
          ruleY([0], { stroke: "#e4e4e8", strokeOpacity: 1, strokeWidth: 1 }),
          ruleY([20_000, 40_000, 60_000], {
            stroke: "#dcdce2",
            strokeDasharray: "5 5",
            strokeOpacity: 1,
            strokeWidth: 1,
          }),
          barY(ROWS, {
            color: "series",
            key: "id",
            radius: { end: 4 },
            stroke: "#ffffff",
            strokeWidth: 1.25,
            x: "day",
            y: "value",
            z: "series",
          }),
        ],
        scales: {
          x: {
            axis: {
              line: false,
              tickLabels: {
                fontSize: 11,
                fontWeight: (c) => (c.value === day ? 600 : 400),
                thin: false,
              },
              ticks: { format: (d: number) => `${d}`, size: 0 },
            },
            scale: scaleBand<number>().domain(DAYS).paddingInner(0.34).paddingOuter(0.1),
          },
          y: {
            axis: {
              line: false,
              tickLabels: { fontSize: 11 },
              ticks: {
                format: (v: number) => compact(v),
                size: 0,
                values: [0, 20_000, 40_000, 60_000],
              },
            },
            scale: scaleLinear().domain([0, TOP]),
          },
        },
        theme: THEME,
      }),
    [day],
  );

  // Band center with paddingInner 0.34 / paddingOuter 0.1.
  const center = ((hi + 0.1 + 0.33) / (DAYS.length - 0.34 + 0.2)) * 100;
  // A narrow callout beside the band, flipping sides past the middle.
  const flip = hi > 6;
  const align = flip ? "right" : "left";
  const left = flip ? center - 3.5 : center + 3.5;

  return (
    <Card>
      <CardHeader
        icon={ChartPie}
        color={VIVID_PURPLE}
        title="Financial Breakdown"
        actions={
          <Chip>
            View data <ArrowUpRight className="size-3.5" />
          </Chip>
        }
      />
      <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3">
        {SERIES.map((s) => (
          <div key={s.label}>
            <p className="inline-flex items-center gap-1.5 text-[12px]" style={{ color: MUTED }}>
              <span className="h-1 w-3 rounded-full" style={{ backgroundColor: s.color }} />
              {s.label}
            </p>
            <Num
              value={s.total}
              className="mt-0.5 block text-[18px] font-bold tracking-[-0.02em]"
            />
          </div>
        ))}
      </div>

      <ChartSlot height={HEIGHT} className="mt-5">
        <div onMouseLeave={() => pin(null)}>
          <Chart
            definition={definition}
            renderer={renderer}
            height={HEIGHT}
            ariaLabel="Assets, debt, investments and cash by day, May 1 to May 13"
            onFocusChange={(p) => {
              if (p) {
                pin(DAYS.indexOf(Number(p.xValue)));
              }
            }}
          />
        </div>
        <PlotOverlay margin={MARGIN}>
          <Bubble
            left={left}
            top={0}
            dark
            align={align}
            className="w-[142px] !rounded-[12px] !px-2.5 !py-2"
          >
            <p className="mb-1 text-[11px] text-white/70">
              {WEEKDAY[hi % 7]}, May {day}
            </p>
            {SERIES.map((s, j) => (
              <p key={s.label} className="flex items-center gap-1.5 py-0.5 text-[10.5px]">
                <span className="h-1 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-white/70">{s.label}</span>
                <span className="ml-auto font-semibold tabular-nums">{usd(vals?.[j] ?? 0)}</span>
              </p>
            ))}
          </Bubble>
        </PlotOverlay>
      </ChartSlot>
      <p className="mt-1 text-center text-[11px] text-[#a1a1aa]">May 2026</p>
    </Card>
  );
};
