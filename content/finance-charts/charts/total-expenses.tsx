"use client";

import { areaY, defineChart, dot, lineY, ruleX, ruleY } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react/core";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { CreditCard } from "lucide-react";
import { useMemo } from "react";

import { usd, WEEKDAYS } from "../lib/data";
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
  useActive,
  useCycle,
} from "../lib/kit";
import { BLUE, GRID, MUTED, ORANGE, PURPLE } from "../lib/tokens";

// Thirteen readings across the week: a lazy middle, then a climb into Saturday.
const VALUES = [
  31_200, 35_400, 33_100, 33_800, 32_900, 32_100, 33_700, 37_300, 36_500, 38_400, 40_300, 42_900,
  46_200,
] as const;
const ROWS = VALUES.map((value, i) => ({ i, value }));
const LAST = ROWS.length - 1;
const TOP = 52_000;
const BOTTOM = 8000;

const CATEGORIES = [
  { amount: 4250, change: 4.82, color: BLUE, label: "Shopping" },
  { amount: 846.85, change: 2.64, color: ORANGE, label: "Subscriptions" },
  { amount: 2753.04, change: -1.64, color: PURPLE, label: "Investment" },
] as const;

const MARGIN = { bottom: 0, left: 0, right: 0, top: 6 };
const HEIGHT = 168;

const dayFor = (i: number) => WEEKDAYS[Math.min(6, Math.round((i / LAST) * 6))] ?? "Sun";

export const TotalExpenses = () => {
  const [hi, pin] = useCycle(ROWS.length, 1500, 8);
  const picked = ROWS[hi] ?? ROWS[0];
  console.error("FOCUSDBG render", hi, useActive());

  const definition = useMemo(
    () =>
      defineChart({
        gradients: [
          {
            id: "te-fill",
            stops: [
              { color: BLUE, offset: 0, opacity: 0.2 },
              { color: BLUE, offset: 1, opacity: 0 },
            ],
            y1: 0,
            y2: 1,
          },
        ],
        guides: false,
        margin: MARGIN,
        marks: [
          ruleY([TOP], { stroke: GRID, strokeDasharray: "4 4", strokeOpacity: 1 }),
          areaY(ROWS, { fill: "url(#te-fill)", fillOpacity: 1, x: "i", y1: BOTTOM, y2: "value" }),
          ruleX([picked?.i ?? 0], {
            stroke: BLUE,
            strokeDasharray: "3 3",
            strokeOpacity: 0.45,
          }),
          lineY(ROWS, { stroke: BLUE, strokeWidth: 2.5, x: "i", y: "value" }),
          dot(picked ? [picked] : [], {
            fill: "#ffffff",
            key: () => "focus",
            r: 5,
            stroke: BLUE,
            strokeWidth: 2.5,
            x: "i",
            y: "value",
          }),
        ],
        scales: {
          x: { scale: scaleLinear().domain([0, LAST]) },
          y: { scale: scaleLinear().domain([BOTTOM, TOP]) },
        },
      }),
    [picked],
  );

  const left = ((picked?.i ?? 0) / LAST) * 100;
  let align: "center" | "left" | "right" = "center";
  if (left < 18) {
    align = "left";
  } else if (left > 82) {
    align = "right";
  }

  return (
    <Card className="bg-[linear-gradient(180deg,#a9c8fb_0%,#dce8fd_26%,#ffffff_48%)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-10 items-center justify-center rounded-[12px] bg-[#8db8fb] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] ring-1 ring-white/60">
            <CreditCard className="size-5 text-white" strokeWidth={2.4} />
          </span>
          <div>
            <p className="text-[12px] text-[#5f6672]">Spending</p>
            <h3 className="text-[16px] font-semibold tracking-[-0.01em]">Total Expenses</h3>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Chip chevron className="!border-white/80 !bg-white/50 backdrop-blur">
            Monthly
          </Chip>
          <MoreButton className="!rounded-[10px] !border-white/80 bg-white/40" />
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between gap-2">
        <p className="flex items-start gap-1">
          <span className="mt-1 text-[18px] font-semibold" style={{ color: MUTED }}>
            $
          </span>
          <Num
            value={320_418.16}
            format={(n) => usd(n).slice(1)}
            className="text-[34px] leading-none font-bold tracking-[-0.03em]"
          />
        </p>
        <p className="pb-0.5 text-[12px]" style={{ color: MUTED }}>
          <Delta value={1.16} variant="trend" /> Today
        </p>
      </div>

      <div className="mt-4 space-y-2.5">
        {CATEGORIES.map((c) => (
          <div key={c.label} className="flex items-center text-[13px]">
            <span className="mr-2 h-1.5 w-3.5 rounded-full" style={{ backgroundColor: c.color }} />
            <span className="flex-1 text-[#3a3a42]">{c.label}</span>
            <Num value={c.amount} className="w-[78px] font-semibold" />
            <span className="w-[120px] text-right text-[11.5px]" style={{ color: MUTED }}>
              <Delta value={c.change} variant="trend" /> this month
            </span>
          </div>
        ))}
      </div>

      <ChartSlot height={HEIGHT} className="mt-4">
        <div onMouseLeave={() => pin(null)}>
          <Chart
            definition={definition}
            renderer={renderer}
            height={HEIGHT}
            ariaLabel="Spending across the week"
            onFocusChange={(p) => {
              console.error("FOCUSDBG", p ? p.xValue : null);
              if (p) {
                pin(ROWS.findIndex((r) => r.i === p.xValue));
              }
            }}
          />
        </div>
        <PlotOverlay margin={MARGIN}>
          <Bubble
            left={left}
            top={((TOP - (picked?.value ?? 0)) / (TOP - BOTTOM)) * 100}
            align={align}
            dark
            className="-translate-y-[calc(100%+12px)] font-semibold"
          >
            <span className="opacity-60">{dayFor(picked?.i ?? 0)}</span> {usd(picked?.value ?? 0)}
          </Bubble>
        </PlotOverlay>
      </ChartSlot>
      <div
        className="mt-2 grid grid-cols-7 text-center text-[11px] tracking-wide"
        style={{ color: MUTED }}
      >
        {WEEKDAYS.map((d) => (
          <span key={d} style={{ color: dayFor(picked?.i ?? 0) === d ? BLUE : undefined }}>
            {d.toUpperCase()}
          </span>
        ))}
      </div>
    </Card>
  );
};
