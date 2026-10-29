"use client";

import { bandX, barY, defineChart, ruleY } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react/core";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { ArrowUpRight, CircleArrowOutUpRight } from "lucide-react";
import { useMemo } from "react";

import { compact, usd } from "../lib/data";
import {
  Bubble,
  Card,
  CardHeader,
  ChartSlot,
  Chip,
  Label,
  Num,
  PlotOverlay,
  renderer,
  useCycle,
} from "../lib/kit";
import { GREEN, THEME } from "../lib/tokens";
import { stripes } from "./net-worth-stripes";

const VALUES = [
  2650, 3700, 8500, 13_450, 19_400, 16_600, 25_833.33, 23_300, 17_200, 2700, 3400, 4700, 11_800,
];
const WEEKDAY = ["Fri", "Sat", "Sun", "Mon", "Tue", "Wed", "Thu"] as const;
const ROWS = VALUES.map((value, i) => ({
  day: i + 1,
  value,
  weekday: WEEKDAY[i % 7] ?? "Mon",
}));
const DAYS = ROWS.map((r) => r.day);

const TOP = 30_000;
const HEIGHT = 230;
const MARGIN = { bottom: 26, left: 40, right: 0, top: 8 };
const PLOT_H = HEIGHT - MARGIN.top - MARGIN.bottom;
// Expected painted bar width at the ~300px plot width of a wall card.
const BAR_W = 14;

const GRADIENTS = ROWS.flatMap((r) => {
  const height = (r.value / TOP) * PLOT_H;
  return [
    stripes({
      base: "#e0e0e4",
      height,
      id: `nw-idle-${r.day}`,
      line: "#d5d5da",
      width: BAR_W,
    }),
    stripes({
      base: "#16a34a",
      height,
      id: `nw-hot-${r.day}`,
      line: "#22c55e",
      width: BAR_W,
    }),
  ];
});

export const NetWorth = () => {
  const [hi, pin] = useCycle(ROWS.length, 1900, 6);
  const picked = ROWS[hi] ?? ROWS[0];

  const definition = useMemo(
    () =>
      defineChart({
        gradients: GRADIENTS,
        margin: MARGIN,
        marks: [
          bandX([picked], {
            fill: GREEN,
            fillOpacity: 0.1,
            inset: -3,
            key: () => "band",
            x: (d) => d?.day ?? 1,
          }),
          ruleY([0], { stroke: "#e4e4e8", strokeOpacity: 1, strokeWidth: 1 }),
          ruleY([10_000, 20_000, 30_000], {
            stroke: "#dcdce2",
            strokeDasharray: "5 5",
            strokeOpacity: 1,
            strokeWidth: 1,
          }),
          barY(ROWS, {
            fill: (d) =>
              d.day === picked?.day ? `url(#nw-hot-${d.day})` : `url(#nw-idle-${d.day})`,
            key: "day",
            radius: [5, 5, 0, 0],
            x: "day",
            y: "value",
          }),
        ],
        scales: {
          x: {
            axis: {
              line: false,
              tickLabels: {
                fontSize: 11,
                fontWeight: (c) => (c.value === picked?.day ? 600 : 400),
                thin: false,
              },
              ticks: { format: (d: number) => `${d}`, size: 0 },
            },
            scale: scaleBand<number>().domain(DAYS).paddingInner(0.38).paddingOuter(0.1),
          },
          y: {
            axis: {
              line: false,
              tickLabels: { fontSize: 11 },
              ticks: {
                format: (v: number) => compact(v),
                size: 0,
                values: [0, 10_000, 20_000, 30_000],
              },
            },
            scale: scaleLinear().domain([0, TOP]),
          },
        },
        theme: THEME,
      }),
    [picked],
  );

  // Band center with paddingInner 0.38 / paddingOuter 0.1.
  const center = ((hi + 0.1 + 0.31) / (ROWS.length - 0.38 + 0.2)) * 100;
  let align: "center" | "left" | "right" = "center";
  if (hi <= 1) {
    align = "left";
  } else if (hi >= ROWS.length - 2) {
    align = "right";
  }
  const barTop = 100 - ((picked?.value ?? 0) / TOP) * 100;

  return (
    <Card>
      <CardHeader
        icon={CircleArrowOutUpRight}
        color={GREEN}
        title="Net worth"
        actions={
          <Chip>
            View data <ArrowUpRight className="size-3.5" />
          </Chip>
        }
      />
      <Num value={18_645.16} className="mt-5 block text-[30px] font-bold tracking-[-0.03em]" />
      <Label info className="mt-0.5 !text-[13px]">
        Total net worth
      </Label>

      <ChartSlot height={HEIGHT} className="mt-5">
        <div onMouseLeave={() => pin(null)}>
          <Chart
            definition={definition}
            renderer={renderer}
            height={HEIGHT}
            ariaLabel="Net worth by day, May 1 to May 13"
            onFocusChange={(p) => {
              if (p) {
                pin(ROWS.findIndex((r) => r.day === p.xValue));
              }
            }}
          />
        </div>
        <PlotOverlay margin={MARGIN}>
          <Bubble
            left={center}
            top={barTop < 55 ? Math.min(70, barTop + 28) : barTop - 32}
            dark
            align={align}
            className="!rounded-[10px] !px-3 !py-2"
          >
            <p className="text-[11px] text-white/70">
              {picked?.weekday}, May {picked?.day}
            </p>
            <p className="text-[14px] font-semibold tabular-nums">{usd(picked?.value ?? 0)}</p>
          </Bubble>
        </PlotOverlay>
      </ChartSlot>
      <p className="mt-1 text-center text-[11px] text-[#a1a1aa]">May 2026</p>
    </Card>
  );
};
