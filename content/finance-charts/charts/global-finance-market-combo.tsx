"use client";

import { barY, d3Curve, defineChart, dot, lineY, ruleX } from "@tanstack/charts";
import type { ChartGradient } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react/core";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { curveBasis } from "d3-shape";
import { CalendarDays, Download, List, Package } from "lucide-react";
import { useMemo } from "react";

import { MONTHS, walk } from "../lib/data";
import {
  Bubble,
  Card,
  ChartSlot,
  Chip,
  Delta,
  Num,
  PlotOverlay,
  renderer,
  useCycle,
} from "../lib/kit";
import { DASHED_GRID, GREEN, GRID, MUTED, THEME } from "../lib/tokens";

const SPAN = MONTHS.slice(0, 7);
const PER = 28;
const N = SPAN.length * PER;
const TOP = 80;

const MARGIN = { bottom: 28, left: 42, right: 4, top: 8 };
const HEIGHT = 236;

/** Linear interpolation through evenly spaced anchors, plus seeded jitter. */
const throughAnchors = (anchors: readonly number[], seed: number, vol: number) => {
  const noise = walk(N, seed, { max: vol * 1.6, min: -vol * 1.6, start: 0, vol: vol * 0.45 });
  return Array.from({ length: N }, (_, i) => {
    const t = (i / (N - 1)) * (anchors.length - 1);
    const k = Math.min(anchors.length - 2, Math.floor(t));
    const lo = anchors[k] ?? 0;
    const hi = anchors[k + 1] ?? lo;
    return { i, v: lo + (hi - lo) * (t - k) + (noise[i] ?? 0) };
  });
};

/** Actual AUM ($M): a climb with a sharp June drawdown and recovery. */
const actual = throughAnchors([16, 29, 24, 31, 44, 52, 46, 50, 48, 59, 50, 42, 50, 60], 4207, 3.4);
const forecast = throughAnchors([18, 13, 24, 21, 20, 26, 19, 22, 28, 34, 40, 38, 42, 54], 77, 1.6);

// Three filter chips share one row at card width.
const TIGHT = "!h-6 !gap-1 !px-2 !text-[11px] [&>svg]:!size-3";

const BAR_VALUES = [15, 9, -7, 13, -10, -5, 18.5, 13, -10, -5, 7, 13, -11.5] as const;
const bars = BAR_VALUES.map((v, k) => ({
  id: `b${k}`,
  up: v >= 0,
  v: Math.abs(v),
  x: ((k + 0.5) * N) / BAR_VALUES.length,
}));

/** Diagonal hatching as hard-stopped gradient bands: TanStack has no pattern
 * paint, but a gradient with coincident stops draws crisp stripes. */
const stripes = (id: string, base: string, line: string, count = 9): ChartGradient => ({
  id,
  stops: Array.from({ length: count }, (_, k) => {
    const a = k / count;
    const b = (k + 0.5) / count;
    const c = (k + 1) / count;
    return [
      { color: base, offset: a },
      { color: base, offset: b },
      { color: line, offset: b },
      { color: line, offset: c },
    ];
  }).flat(),
  x1: 0,
  x2: 1,
  y1: 0,
  y2: 0.35,
});

const STATS = [
  { delta: 8.05, format: (n: number) => `$${n.toFixed(1)}M`, label: "Global AUM’26", value: 59.6 },
  { delta: 3.13, format: (n: number) => `${Math.round(n)}%`, label: "Market growth", value: 23 },
  { delta: 6.82, format: (n: number) => `$${n.toFixed(1)}M`, label: "2027 Forecast", value: 63.6 },
] as const;

export const GlobalFinanceMarketCombo = () => {
  const [hi, pin] = useCycle(SPAN.length, 2200, 4);
  const at = Math.min(N - 1, Math.round((hi + 0.5) * PER));
  const picked = actual[at] ?? actual[0];

  const definition = useMemo(
    () =>
      defineChart({
        gradients: [
          stripes("gf-up", "#d3f3dd", "#c0ebcf"),
          stripes("gf-down", "#fde0e0", "#fbcdcd"),
        ],
        margin: MARGIN,
        marks: [
          barY(bars, {
            fill: (d) => (d.up ? "url(#gf-up)" : "url(#gf-down)"),
            id: "bars",
            key: "id",
            maxThickness: 20,
            radius: [7, 7, 0, 0],
            stroke: (d) => (d.up ? "#8fdcaa" : "#f6a5a5"),
            strokeWidth: 1,
            x: "x",
            y: "v",
          }),
          lineY(forecast, {
            curve: d3Curve(curveBasis),
            id: "forecast",
            stroke: "#c9c9cf",
            strokeDasharray: "5 4",
            strokeWidth: 1.6,
            x: "i",
            y: "v",
          }),
          ruleX([{ id: "scrub", x: picked?.i ?? 0 }], {
            id: "scrub",
            stroke: GREEN,
            strokeDasharray: "3 3",
            strokeOpacity: 0.5,
            x: "x",
          }),
          lineY(actual, {
            curve: d3Curve(curveBasis),
            id: "actual",
            stroke: GREEN,
            strokeWidth: 2.2,
            x: "i",
            y: "v",
          }),
          dot([{ i: picked?.i ?? 0, id: "head", v: picked?.v ?? 0 }], {
            fill: GREEN,
            id: "head",
            key: "id",
            r: 5,
            stroke: "#ffffff",
            strokeWidth: 2.5,
            x: "i",
            y: "v",
          }),
        ],
        scales: {
          x: {
            axis: {
              line: { stroke: GRID },
              tickLabels: {
                fontSize: 12,
                fontWeight: (c) => (Math.floor(c.value / PER) === hi ? 600 : 400),
              },
              ticks: {
                format: (v: number) => SPAN[Math.floor(v / PER)] ?? "",
                padding: 8,
                size: 0,
                values: SPAN.map((_, i) => (i + 0.5) * PER),
              },
            },
            scale: scaleLinear().domain([0, N - 1]),
          },
          y: {
            axis: {
              line: false,
              tickLabels: { fontSize: 12 },
              ticks: {
                format: (v: number) => `$${v}M`,
                padding: 8,
                size: 0,
                values: [0, 20, 40, 60, 80],
              },
            },
            grid: DASHED_GRID,
            scale: scaleLinear().domain([0, TOP]),
          },
        },
        theme: THEME,
      }),
    [picked, hi],
  );

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[16px] leading-tight font-semibold tracking-[-0.01em]">
            Global finance market overview
          </h3>
          <p className="mt-1 text-[12px]" style={{ color: MUTED }}>
            2020-2027
          </p>
        </div>
        <Chip icon={Download}>Export CSV</Chip>
      </div>
      <div className="-mx-5 mt-4 h-px" style={{ backgroundColor: GRID }} />
      <div className="mt-4 grid grid-cols-3 gap-2">
        {STATS.map((s) => (
          <div key={s.label} className="rounded-[14px] bg-[#f6f6f7] px-2.5 py-2.5">
            <p className="truncate text-[11px]" style={{ color: MUTED }}>
              {s.label}
            </p>
            <Num
              value={s.value}
              format={s.format}
              className="mt-1 block text-[19px] font-semibold tracking-[-0.02em]"
            />
            <Delta value={s.delta} variant="trend" className="mt-1 text-[11px]" />
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-1">
        <Chip icon={Package} chevron className={TIGHT}>
          All products
        </Chip>
        <Chip icon={List} chevron className={TIGHT}>
          All category
        </Chip>
        <Chip icon={CalendarDays} chevron className={`${TIGHT} ml-auto`}>
          Monthly
        </Chip>
      </div>
      <div className="mt-3 flex items-center gap-4 text-[12px] text-[#3a3a42]">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1 w-4 rounded-full" style={{ backgroundColor: GREEN }} />
          Total AUM (Actual)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0 w-4 border-t-[3px] border-dotted border-[#c9c9cf]" />
          Forecast
        </span>
      </div>
      <ChartSlot height={HEIGHT} className="mt-2">
        <div onMouseLeave={() => pin(null)}>
          <Chart
            definition={definition}
            renderer={renderer}
            height={HEIGHT}
            ariaLabel="Total assets under management, actual against forecast, with monthly net flows"
            onFocusChange={(p) => {
              const x = Number(p?.xValue);
              if (p && Number.isFinite(x)) {
                pin(Math.max(0, Math.min(SPAN.length - 1, Math.floor(x / PER))));
              }
            }}
          />
        </div>
        <PlotOverlay margin={MARGIN}>
          <Bubble
            left={((picked?.i ?? 0) / (N - 1)) * 100}
            top={100 - ((picked?.v ?? 0) / TOP) * 100}
            align={hi >= SPAN.length - 2 ? "right" : "center"}
            dark
            className="-mt-10 !px-2 !py-1 text-[11px]"
          >
            <span className="text-white/60">{SPAN[hi]}</span>{" "}
            <span className="font-semibold tabular-nums">{`$${(picked?.v ?? 0).toFixed(1)}M`}</span>
          </Bubble>
        </PlotOverlay>
      </ChartSlot>
    </Card>
  );
};
