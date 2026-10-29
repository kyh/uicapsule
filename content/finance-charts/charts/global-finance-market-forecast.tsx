"use client";

import { defineChart, dot, lineY, rect, ruleX, ruleY } from "@tanstack/charts";
import { d3Curve } from "@tanstack/charts/d3/shape";
import { Chart } from "@tanstack/charts/react/core";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { curveMonotoneX } from "d3-shape";
import { CalendarDays, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo } from "react";

import { Card, ChartSlot, Chip, Num, renderer, useCycle } from "../lib/kit";
import { GREEN, GRID, MUTED, ORANGE, RED, THEME } from "../lib/tokens";

const FIRST = 2020;
const YEARS = 8;
const TOP = 80;
// Scrubber stops at column centers, 2023 → 2027; it parks on 2026 first.
const STOPS = [3.5, 4.5, 5.5, 6.5, 7.5] as const;
const START = 3;

const SERIES = [
  { id: "aum", plateau: 70 },
  { id: "mid", plateau: 47 },
  { id: "low", plateau: 32 },
] as const;
type SeriesId = (typeof SERIES)[number]["id"];

const smooth = (t: number) => {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
};

/** An S-curve that idles near $10M, climbs 2021→2024, then plateaus; the
 * headline series carries a 2027 forecast bump to $74.8M. */
const valueAt = (id: SeriesId, plateau: number, x: number) => {
  const dip = -0.6 * Math.sin(Math.min(1, x / 1.4) * Math.PI);
  const lift = id === "aum" ? smooth((x - 1.2) / 3.1) : smooth((x - 1.3) / 3.5);
  const forecast = id === "aum" ? smooth(x - 6.5) * 4.8 : 0;
  return 10 + dip + (plateau - 10) * lift + forecast;
};

const MARGIN = { bottom: 26, left: 40, right: 6, top: 8 };
const HEIGHT = 240;
const curve = d3Curve(curveMonotoneX);
const yearLabel = (x: number) => String(FIRST + Math.floor(x));
const millions = (n: number) => `$${n.toFixed(1)}M`;

export const GlobalFinanceMarketForecast = () => {
  const [stop, pin] = useCycle(STOPS.length, 2400, START);
  const sx = STOPS[stop] ?? 6.5;
  const year = FIRST + Math.floor(sx);
  const headline = valueAt("aum", 70, sx);

  const definition = useMemo(() => {
    const rows = SERIES.flatMap(({ id, plateau }) => {
      const xs: number[] = [];
      for (let x = 0; x < sx; x += 0.125) {
        xs.push(x);
      }
      xs.push(sx);
      return xs.map((x) => ({ key: `${id}-${x}`, s: id, v: valueAt(id, plateau, x), x }));
    });
    const heads = SERIES.map(({ id, plateau }) => ({ s: id, v: valueAt(id, plateau, sx), x: sx }));
    const columns = Array.from({ length: YEARS + 1 }, (_, i) => i);
    return defineChart({
      gradients: [
        {
          id: "gfm-line",
          stops: [
            { color: "#4ade80", offset: 0 },
            { color: "#fbbf24", offset: 0.3 },
            { color: "#fb923c", offset: 1 },
          ],
          x1: 0,
          x2: 1,
          y1: 0,
          y2: 0,
        },
        {
          id: "gfm-band",
          stops: [
            { color: ORANGE, offset: 0, opacity: 0.04 },
            { color: ORANGE, offset: 1, opacity: 0.14 },
          ],
          x1: 0,
          x2: 1,
          y1: 0,
          y2: 0,
        },
        {
          id: "gfm-scrub",
          stops: [
            { color: ORANGE, offset: 0, opacity: 0.25 },
            { color: ORANGE, offset: 0.12, opacity: 1 },
            { color: ORANGE, offset: 0.7, opacity: 1 },
            { color: ORANGE, offset: 1, opacity: 0 },
          ],
          y1: 0,
          y2: 1,
        },
      ],
      margin: MARGIN,
      marks: [
        ruleX(columns, { stroke: GRID, strokeOpacity: 1 }),
        ruleY([20, 40, 60, 80], { stroke: GRID, strokeOpacity: 1 }),
        ruleY([10, 30, 50, 70], { stroke: GRID, strokeDasharray: "4 4", strokeOpacity: 1 }),
        rect([{ id: "band", v: headline }], {
          fill: "url(#gfm-band)",
          inset: 0,
          key: "id",
          x1: () => 0,
          x2: () => sx,
          y1: "v",
          y2: () => TOP,
        }),
        lineY(
          rows.filter((r) => r.s !== "aum"),
          {
            curve,
            key: "key",
            stroke: "#d4d4d8",
            strokeWidth: 2.5,
            x: "x",
            y: "v",
            z: "s",
          },
        ),
        lineY(
          rows.filter((r) => r.s === "aum"),
          {
            curve,
            key: "key",
            stroke: "url(#gfm-line)",
            strokeWidth: 3,
            x: "x",
            y: "v",
            z: "s",
          },
        ),
        rect([{ id: "scrub", x: sx }], {
          fill: "url(#gfm-scrub)",
          inset: 0,
          key: "id",
          x1: (d) => d.x - 0.04,
          x2: (d) => d.x + 0.04,
          y1: () => 0,
          y2: () => TOP + 2,
        }),
        dot(heads, {
          fill: "#ffffff",
          key: "s",
          r: 5,
          stroke: ORANGE,
          strokeWidth: 2.5,
          x: "x",
          y: "v",
        }),
      ],
      motion: { path: "morph" },
      scales: {
        x: {
          axis: {
            line: { stroke: "#d4d4d8" },
            tickLabels: { fontSize: 11, fontWeight: (c) => (c.value === sx ? 600 : 400) },
            ticks: {
              format: yearLabel,
              size: 0,
              values: Array.from({ length: YEARS }, (_, i) => i + 0.5),
            },
          },
          scale: scaleLinear().domain([0, YEARS]),
        },
        y: {
          axis: {
            line: false,
            tickLabels: { fontSize: 11 },
            ticks: {
              format: (v: number) => (v === 0 ? "$0" : `$${v}M`),
              size: 0,
              values: [0, 20, 40, 60, 80],
            },
          },
          scale: scaleLinear().domain([0, TOP + 2]),
        },
      },
      theme: THEME,
    });
  }, [sx, headline]);

  return (
    <Card className="!p-0">
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold tracking-[-0.01em]">
              Global finance market overview
            </h3>
            <p className="mt-0.5 text-[12px]" style={{ color: MUTED }}>
              2020-2027
            </p>
          </div>
          <Chip icon={CalendarDays} chevron>
            7 Years
          </Chip>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-medium">
          <span className="rounded-full border border-[#bbf7d0] bg-[#f0fdf4] px-2 py-0.5 text-[#16a34a]">
            0% YoY Growth
          </span>
          <span className="rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-2 py-0.5 text-[#1d7cf2]">
            $70.0M AUM&apos;26
          </span>
          <span className="rounded-full border border-[#e9d5ff] bg-[#faf5ff] px-2 py-0.5 text-[#9333ea]">
            $74.8M AUM&apos;27
          </span>
        </div>
      </div>
      <div className="border-t px-5 pt-4 pb-4" style={{ borderColor: GRID }}>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-[#f6f6f7] px-2.5 py-2.5">
            <p className="truncate text-[11px]" style={{ color: MUTED }}>
              Global AUM&apos;{String(year).slice(2)}
            </p>
            <Num
              value={headline}
              format={millions}
              className="mt-1 block text-[18px] font-bold tracking-[-0.02em]"
            />
            <p
              className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium"
              style={{ color: GREEN }}
            >
              <TrendingUp className="size-3" />
              <Num value={0} format={(n) => `${n.toFixed(2)}%`} />
            </p>
          </div>
          <div className="rounded-xl bg-[#f6f6f7] px-2.5 py-2.5">
            <p className="truncate text-[11px]" style={{ color: MUTED }}>
              Market growth
            </p>
            <Num
              value={34}
              format={(n) => `${Math.round(n)}%`}
              className="mt-1 block text-[18px] font-bold tracking-[-0.02em]"
            />
            <p
              className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium"
              style={{ color: RED }}
            >
              <TrendingDown className="size-3" />
              7.19%
            </p>
          </div>
          <div className="rounded-xl bg-[#f6f6f7] px-2.5 py-2.5">
            <p className="truncate text-[11px]" style={{ color: MUTED }}>
              2027 Forecast
            </p>
            <Num
              value={74.8}
              format={millions}
              className="mt-1 block text-[18px] font-bold tracking-[-0.02em]"
            />
            <p
              className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium"
              style={{ color: GREEN }}
            >
              <TrendingUp className="size-3" />
              6.82%
            </p>
          </div>
        </div>
        <ChartSlot height={HEIGHT} className="mt-4">
          <div onMouseLeave={() => pin(null)}>
            <Chart
              definition={definition}
              renderer={renderer}
              height={HEIGHT}
              ariaLabel="Global assets under management, 2020 to 2027"
              onFocusChange={(p) => {
                const x = Number(p?.xValue);
                if (p && Number.isFinite(x)) {
                  let best = 0;
                  for (const [i, s] of STOPS.entries()) {
                    if (Math.abs(s - x) < Math.abs((STOPS[best] ?? 0) - x)) {
                      best = i;
                    }
                  }
                  pin(best);
                }
              }}
            />
          </div>
        </ChartSlot>
      </div>
    </Card>
  );
};
