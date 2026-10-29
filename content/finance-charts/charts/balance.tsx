"use client";

import { bandX, defineChart, dot, link, lineY, ruleX, text } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react/core";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { ChartNoAxesColumnIncreasing, EyeOff } from "lucide-react";
import { useMemo } from "react";

import { MONTHS } from "../lib/data";
import {
  Bubble,
  Card,
  ChartSlot,
  Chip,
  Delta,
  MoreButton,
  Num,
  PlotOverlay,
  renderer,
  useCycle,
} from "../lib/kit";
import { FAINT, GREEN, MUTED, RED } from "../lib/tokens";

const PURPLE = "#9333ea";
const LILAC = "#dcc2fb";

// x = -0.45 is the lead-in from the card's edge; months sit at 0…7.
const POINTS = [
  { i: -0.45, value: 64_000 },
  { i: 0, value: 71_500 },
  { i: 1, value: 84_200 },
  { i: 2, value: 71_600 },
  { i: 3, value: 80_900 },
  { i: 4, value: 72_900 },
  { i: 5, value: 88_300 },
  { i: 6, value: 103_400 },
  { i: 7, value: 113_600 },
] as const;
const MONTH_POINTS = POINTS.filter((p) => p.i >= 0);
const BAND = 36;
const MIN = 0;
const MAX = 158_000;
const X0 = -0.45;
const X1 = 7.3;

const MARGIN = { bottom: 26, left: 0, right: 0, top: 0 };
const HEIGHT = 230;

export const Balance = () => {
  const [hi, pin] = useCycle(MONTH_POINTS.length, 2000, 3);
  const picked = MONTH_POINTS[hi] ?? MONTH_POINTS[0];
  const at = picked?.i ?? 0;
  const prev = POINTS.find((p) => p.i === at - 1) ?? POINTS[0];
  const change = ((picked?.value ?? 0) / (prev?.value ?? 1) - 1) * 100;

  const definition = useMemo(() => {
    const past = POINTS.filter((p) => p.i <= at);
    const future = POINTS.filter((p) => p.i >= at);
    return defineChart({
      gradients: [
        {
          id: "bal-band",
          stops: [
            { color: "#c084fc", offset: 0, opacity: 0.55 },
            { color: "#e9d5ff", offset: 0.65, opacity: 0.35 },
            { color: "#f5f3ff", offset: 1, opacity: 0 },
          ],
          y1: 0,
          y2: 1,
        },
      ],
      guides: false,
      margin: MARGIN,
      marks: [
        ruleX(
          MONTH_POINTS.map((p) => p.i),
          { stroke: FAINT, strokeDasharray: "4 4", strokeOpacity: 0.6 },
        ),
        bandX([{ i: at }], {
          fill: "url(#bal-band)",
          fillOpacity: 1,
          key: () => "band",
          radius: 8,
          width: BAND,
          x: "i",
        }),
        link([{ i: at }], {
          key: () => "band-top",
          stroke: "#c084fc",
          strokeWidth: 1,
          x1: (d) => d.i - 0.25,
          x2: (d) => d.i + 0.25,
          y1: () => MAX,
          y2: () => MAX,
        }),
        link([{ i: at }], {
          key: () => "band-mid",
          stroke: PURPLE,
          strokeDasharray: "3 3",
          strokeWidth: 1.25,
          x1: "i",
          x2: "i",
          y1: () => MIN,
          y2: () => MAX,
        }),
        lineY(future, { id: "future", stroke: LILAC, strokeWidth: 2, x: "i", y: "value" }),
        lineY(past, { id: "past", stroke: PURPLE, strokeWidth: 2, x: "i", y: "value" }),
        dot(
          future.filter((p) => p.i > at),
          { fill: LILAC, id: "future-dots", key: "i", r: 3.5, x: "i", y: "value" },
        ),
        dot(
          past.filter((p) => p.i >= 0),
          {
            fill: PURPLE,
            id: "past-dots",
            key: "i",
            r: 3.5,
            stroke: "#ffffff",
            strokeWidth: 1.25,
            x: "i",
            y: "value",
          },
        ),
        // Text paint is constant per mark, so the active month is its own layer.
        text(
          MONTH_POINTS.filter((p) => p.i !== at),
          {
            dy: 16,
            fill: MUTED,
            fontSize: 11.5,
            id: "months",
            key: "i",
            text: (p) => MONTHS[Math.round(p.i)] ?? "",
            x: "i",
            y: () => MIN,
          },
        ),
        text([{ i: at }], {
          dy: 16,
          fill: PURPLE,
          fontSize: 11.5,
          fontWeight: 600,
          id: "month-on",
          key: () => "on",
          text: (p) => MONTHS[Math.round(p.i)] ?? "",
          x: "i",
          y: () => MIN,
        }),
      ],
      scales: {
        x: { scale: scaleLinear().domain([X0, X1]) },
        y: { scale: scaleLinear().domain([MIN, MAX]) },
      },
    });
  }, [at]);

  const left = ((at - X0) / (X1 - X0)) * 100;

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-9 items-center justify-center rounded-[11px] bg-[#f3e8ff] ring-1 ring-[#e9d5ff]">
            <ChartNoAxesColumnIncreasing
              className="size-4.5"
              style={{ color: PURPLE }}
              strokeWidth={2.6}
            />
          </span>
          <h3 className="text-[16px] font-semibold tracking-[-0.01em]">Balance</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <Chip chevron className="!rounded-[10px]">
            2025
          </Chip>
          <MoreButton className="!rounded-[10px]" />
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between gap-2">
        <div className="flex gap-3">
          <span className="w-1 rounded-full bg-[linear-gradient(180deg,#c084fc,#9333ea)] shadow-[0_2px_6px_-1px_rgba(147,51,234,0.5)]" />
          <div>
            <p className="inline-flex items-center gap-1.5 text-[12px]" style={{ color: MUTED }}>
              Total Balance <EyeOff className="size-3.5" />
            </p>
            <Num
              value={320_418.16}
              className="block text-[28px] leading-tight font-bold tracking-[-0.03em]"
            />
          </div>
        </div>
        <p className="pb-1 text-[11.5px]" style={{ color: MUTED }}>
          <Delta value={-120.62} prefix="$" suffix="" /> vs Last year
        </p>
      </div>

      <ChartSlot height={HEIGHT} className="mt-4">
        <div onMouseLeave={() => pin(null)}>
          <Chart
            definition={definition}
            renderer={renderer}
            height={HEIGHT}
            ariaLabel="Monthly balance"
            onFocusChange={(p) => {
              if (p) {
                const k = MONTH_POINTS.findIndex((m) => m.i === p.xValue);
                if (k !== -1) {
                  pin(k);
                }
              }
            }}
          />
        </div>
        <PlotOverlay margin={MARGIN}>
          <Bubble
            left={left > 62 ? left - 7 : left + 7}
            top={8}
            align={left > 62 ? "right" : "left"}
            className="!rounded-2xl !px-3 !py-2 text-[12px]"
          >
            <p>
              <Num value={picked?.value ?? 0} className="text-[14px] font-medium" />{" "}
              <span style={{ color: MUTED }}>Income</span>
            </p>
            <p className="mt-0.5">
              <span className="font-medium" style={{ color: change >= 0 ? GREEN : RED }}>
                {change >= 0 ? "+" : ""}
                {change.toFixed(2)}%
              </span>{" "}
              <span style={{ color: MUTED }}>Last month</span>
            </p>
          </Bubble>
        </PlotOverlay>
      </ChartSlot>
    </Card>
  );
};
