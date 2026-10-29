"use client";

import { defineChart, rect, ruleX, ruleY } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react/core";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { ArrowUp } from "lucide-react";
import { useMemo } from "react";

import { usd, WEEKDAYS } from "../lib/data";
import {
  Bubble,
  Card,
  ChartSlot,
  MoreButton,
  Num,
  PlotOverlay,
  renderer,
  useCycle,
} from "../lib/kit";
import { GREEN, GRID, MUTED, THEME } from "../lib/tokens";

const SERIES = [
  { bg: "#e6f1fe", color: "#0f7ff0", id: "needs", label: "Needs" },
  { bg: "#f6e9fe", color: "#a335f5", id: "wants", label: "Wants" },
  { bg: "#fff1e7", color: "#fb7417", id: "saving", label: "Saving" },
] as const;

// Per day: needs, wants, saving. Weekly totals land on $533 / $466 / $375.
const SPEND = [
  [85, 85, 35],
  [55, 35, 65],
  [215, 100, 0],
  [0, 125, 60],
  [48, 0, 0],
  [130, 65, 125],
  [0, 56, 90],
] as const;

const TOTALS = SERIES.map((_, s) => SPEND.reduce((sum, day) => sum + (day[s] ?? 0), 0));
const WEEK = TOTALS.reduce((a, b) => a + b, 0);
const TOP = 620;
const HEIGHT = 220;
const MARGIN = { bottom: 26, left: 40, right: 2, top: 4 };
const PAD = 0.22;

interface Seg {
  day: number;
  y1: number;
  y2: number;
}

const FinanceOverviewStackedBarBody = () => {
  const [hi, pin] = useCycle(WEEKDAYS.length, 2200, 5);
  const dayTotal = (SPEND[hi] ?? []).reduce((a: number, b) => a + b, 0);

  const definition = useMemo(() => {
    const segs = SERIES.map((_, s) =>
      SPEND.flatMap((day, d): Seg[] => {
        const v = day[s] ?? 0;
        if (v === 0) {
          return [];
        }
        const y1 = day.slice(0, s).reduce((a: number, b) => a + b, 0);
        return [{ day: d, y1, y2: y1 + v }];
      }),
    );
    return defineChart({
      margin: MARGIN,
      marks: [
        rect([{ id: "hl", x: hi }], {
          fill: "#f4f6fa",
          inset: 0,
          key: "id",
          radius: 8,
          x1: (d) => d.x + 0.04,
          x2: (d) => d.x + 0.96,
          y1: () => 0,
          y2: () => TOP,
        }),
        ruleX([0, 1, 2, 3, 4, 5, 6, 7], { stroke: GRID, strokeOpacity: 1 }),
        ruleY([200, 400, 600], { stroke: GRID, strokeOpacity: 1 }),
        ruleY([100, 300, 500], { stroke: GRID, strokeDasharray: "4 4", strokeOpacity: 1 }),
        ruleY([0], { stroke: "#d4d4d8", strokeOpacity: 1 }),
        ...SERIES.map((s, i) =>
          rect(segs[i] ?? [], {
            fill: s.color,
            id: `fo-${s.id}`,
            inset: 0,
            key: "day",
            radius: 1.5,
            stroke: "#ffffff",
            strokeWidth: 1.25,
            x: (d) => d.day + 0.5,
            x1: (d) => d.day + PAD,
            x2: (d) => d.day + 1 - PAD,
            y1: "y1",
            y2: "y2",
          }),
        ),
      ],
      scales: {
        x: {
          axis: {
            line: false,
            tickLabels: { fontSize: 12, fontWeight: (c) => (c.value === hi + 0.5 ? 600 : 400) },
            ticks: {
              format: (v: number) => WEEKDAYS[Math.floor(v)] ?? "",
              size: 0,
              values: WEEKDAYS.map((_, i) => i + 0.5),
            },
          },
          scale: scaleLinear().domain([0, WEEKDAYS.length]),
        },
        y: {
          axis: {
            line: false,
            tickLabels: { fontSize: 11 },
            ticks: { format: (v: number) => `$${v}`, size: 0, values: [0, 200, 400, 600] },
          },
          scale: scaleLinear().domain([0, TOP]),
        },
      },
      theme: THEME,
    });
  }, [hi]);

  return (
    <>
      <div className="flex items-start justify-between">
        <h3 className="pt-1 text-[16px] font-semibold tracking-[-0.01em]">Finance Overview</h3>
        <MoreButton />
      </div>
      <p className="mt-3 text-[13px]" style={{ color: "#52525b" }}>
        Daily spending
      </p>
      <div className="flex items-end justify-between gap-2">
        <Num value={WEEK / 7} className="text-[28px] font-bold tracking-[-0.03em]" />
        <p className="inline-flex items-center gap-1.5 pb-1.5 text-[11px]">
          <span
            className="inline-flex items-center gap-1 rounded-full bg-[#dcfce7] px-2 py-0.5 font-medium"
            style={{ color: GREEN }}
          >
            <span className="inline-flex size-3 items-center justify-center rounded-full bg-[#16a34a] text-white">
              <ArrowUp className="size-2" strokeWidth={3} />
            </span>
            8.34%
          </span>
          <span style={{ color: MUTED }}>vs last week</span>
        </p>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1.5">
        {SERIES.map((s, i) => (
          <div key={s.id} className="rounded-xl px-2.5 py-2" style={{ backgroundColor: s.bg }}>
            <p className="text-[12px] font-medium" style={{ color: s.color }}>
              {s.label}
            </p>
            <Num
              value={TOTALS[i] ?? 0}
              format={(n) => usd(n, true)}
              className="mt-0.5 block text-[17px] font-semibold tracking-[-0.02em]"
            />
          </div>
        ))}
      </div>
      <ChartSlot height={HEIGHT} className="mt-4">
        <div onMouseLeave={() => pin(null)}>
          <Chart
            definition={definition}
            renderer={renderer}
            height={HEIGHT}
            ariaLabel="Daily spending by needs, wants and saving"
            onFocusChange={(p) => {
              const x = Number(p?.xValue);
              if (p && Number.isFinite(x)) {
                pin(Math.min(6, Math.max(0, Math.floor(x))));
              }
            }}
          />
        </div>
        <PlotOverlay margin={MARGIN}>
          <Bubble
            left={((hi + 0.5) / WEEKDAYS.length) * 100}
            top={100 - (dayTotal / TOP) * 100}
            dark
            className="-translate-y-[calc(100%+8px)] !px-2 !py-1 text-[11px] font-semibold"
          >
            {WEEKDAYS[hi]} · {usd(dayTotal, true)}
          </Bubble>
        </PlotOverlay>
      </ChartSlot>
      <div className="mt-4 flex items-center justify-between rounded-xl border-[1.5px] border-[#3b8ef3] bg-[#e8f2fe] px-3.5 py-2.5">
        <span className="text-[12px] font-semibold">Total Spending:</span>
        <span className="text-[12px]" style={{ color: MUTED }}>
          <Num
            value={WEEK}
            format={(n) => usd(n, true)}
            className="text-[16px] font-semibold text-[#0b0b0f]"
          />{" "}
          /week
        </span>
      </div>
    </>
  );
};

/** Card is the activation provider, so the cycling body must render inside it. */
export const FinanceOverviewStackedBar = () => (
  <Card>
    <FinanceOverviewStackedBarBody />
  </Card>
);
