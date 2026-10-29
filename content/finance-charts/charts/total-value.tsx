"use client";

import { barY, defineChart, ruleY } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react/core";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { EyeOff, Wallet } from "lucide-react";
import { useMemo, useState } from "react";

import { usd, WEEKDAYS } from "../lib/data";
import {
  Bubble,
  Card,
  ChartSlot,
  Delta,
  IconTile,
  MoreButton,
  Num,
  PlotOverlay,
  Segmented,
  renderer,
  useCycle,
} from "../lib/kit";
import { GRID, MUTED, ORANGE, THEME } from "../lib/tokens";

const RANGES = [
  [2860, 3410, 2480, 4200.91, 2870, 3420, 2350],
  [3120, 2940, 3880, 3310, 4020.44, 2760, 3050],
  [3650, 4105.2, 3200, 2980, 3340, 3900, 2710],
] as const;

const MARGIN = { bottom: 28, left: 0, right: 0, top: 36 };
const HEIGHT = 220;
const TOP = 4800;

export const TotalValue = () => {
  const [range, setRange] = useState(0);
  const values = RANGES[range] ?? RANGES[0];
  const [hi, pin] = useCycle(WEEKDAYS.length, 2000, 3);
  const rows = useMemo(() => WEEKDAYS.map((day, i) => ({ day, value: values[i] ?? 0 })), [values]);
  const picked = rows[hi] ?? rows[0];

  const definition = useMemo(
    () =>
      defineChart({
        gradients: [
          {
            id: "tv-hot",
            stops: [
              { color: "#fb923c", offset: 0 },
              { color: "#ea580c", offset: 1 },
            ],
            y1: 0,
            y2: 1,
          },
          {
            id: "tv-cold",
            stops: [
              { color: "#f4f4f6", offset: 0 },
              { color: "#ececef", offset: 1 },
            ],
            y1: 0,
            y2: 1,
          },
        ],
        margin: MARGIN,
        marks: [
          barY(rows, {
            fill: (d) => (d.day === picked?.day ? "url(#tv-hot)" : "url(#tv-cold)"),
            key: "day",
            radius: [16, 16, 0, 0],
            x: "day",
            y: "value",
          }),
          ruleY([picked?.value ?? 0], {
            stroke: ORANGE,
            strokeDasharray: "4 4",
            strokeOpacity: 1,
            strokeWidth: 1.5,
          }),
        ],
        scales: {
          x: {
            axis: {
              line: false,
              tickLabels: {
                fontSize: 13,
                fontWeight: (c) => (c.value === picked?.day ? 600 : 400),
              },
              ticks: { size: 0 },
            },
            scale: scaleBand<string>()
              .domain([...WEEKDAYS])
              .paddingInner(0.22)
              .paddingOuter(0),
          },
          y: { axis: false, scale: scaleLinear().domain([0, TOP]) },
        },
        theme: THEME,
      }),
    [rows, picked],
  );

  return (
    <Card>
      <div className="flex items-start justify-between">
        <p className="inline-flex items-center gap-1.5 text-[14px]" style={{ color: MUTED }}>
          Total value <EyeOff className="size-3.5" />
        </p>
        <MoreButton />
      </div>
      <div className="mt-1 flex items-end gap-3">
        <Num value={320_418.16} className="text-[32px] font-bold tracking-[-0.03em]" />
        <div className="pb-1.5 text-[12px] leading-tight">
          <Delta value={-120.62} prefix="$" suffix="" />{" "}
          <Delta value={-1.16} className="opacity-90" />
          <p style={{ color: MUTED }}>Today</p>
        </div>
      </div>
      <Segmented
        options={["Week", "Month", "Year"]}
        value={range}
        onChange={setRange}
        className="mt-4"
      />
      <ChartSlot height={HEIGHT} className="mt-4">
        <div onMouseLeave={() => pin(null)}>
          <Chart
            definition={definition}
            renderer={renderer}
            height={HEIGHT}
            ariaLabel="Total value by weekday"
            onFocusChange={(p) => {
              if (p) {
                pin(rows.findIndex((r) => r.day === p.xValue));
              }
            }}
          />
        </div>
        <PlotOverlay margin={MARGIN}>
          <Bubble
            left={100}
            top={100 - ((picked?.value ?? 0) / TOP) * 100}
            align="right"
            className="flex -translate-y-1/2 gap-1.5 !rounded-full !bg-[#f97316] !px-2.5 !py-1 font-semibold !text-white"
          >
            <span>{picked?.day}</span>
            <span className="opacity-60">|</span>
            <span>{usd(picked?.value ?? 0)}</span>
          </Bubble>
        </PlotOverlay>
      </ChartSlot>
      <div className="mt-4 flex items-center gap-3 border-t pt-3" style={{ borderColor: GRID }}>
        <IconTile icon={Wallet} color="#3b82f6" size={36} />
        <div className="flex-1">
          <p className="text-[14px] font-semibold">Main Pocket</p>
          <p className="text-[12px]" style={{ color: MUTED }}>
            Today
          </p>
        </div>
        <div className="text-right">
          <p className="text-[14px] font-semibold tabular-nums">$4,250.00</p>
          <p className="text-[12px]" style={{ color: MUTED }}>
            <Delta value={12} suffix="%" className="text-[12px]" /> this month
          </p>
        </div>
      </div>
    </Card>
  );
};
