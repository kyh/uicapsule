"use client";

import { barY, defineChart, dot } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react/core";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { useMemo } from "react";

import { compact, MONTHS, rng } from "../lib/data";
import {
  Bubble,
  Card,
  CardHeader,
  ChartSlot,
  MoreButton,
  Num,
  PlotOverlay,
  renderer,
  useCycle,
} from "../lib/kit";
import { GRID } from "../lib/tokens";

// Money out (purple, left) and in (blue, right) per month.
const PAIRS = [
  [13_500, 19_700],
  [7400, 17_500],
  [22_628.05, 27_874.93],
  [7400, 12_800],
  [15_600, 19_500],
  [17_900, 13_500],
] as const;
const SIDES = ["out", "in"] as const;
type Side = (typeof SIDES)[number];
interface Bar {
  id: string;
  m: number;
  side: Side;
  value: number;
  x: number;
}
// A linear x lets each pair sit at month ± 0.2: the bars come out a third of
// a step wide with a narrow gap inside the pair, as in the source.
const BARS: Bar[] = PAIRS.flatMap((pair, m) =>
  SIDES.map((side, k) => ({
    id: `${m}-${side}`,
    m,
    side,
    value: pair[k] ?? 0,
    x: m + (k === 0 ? -0.2 : 0.2),
  })),
);

// Sparkles: fixed flecks inside each bar, drawn only for the active pair.
const FLECKS = BARS.flatMap((b) => {
  const r = rng(b.m * 7 + (b.side === "in" ? 3 : 1));
  return Array.from({ length: 6 }, (_, k) => ({
    bar: b.id,
    id: `${b.id}-${k}`,
    m: b.m,
    r: 0.6 + r() * 1.1,
    x: b.x + (r() - 0.5) * 0.16,
    y: b.value * (0.06 + 0.88 * r()),
  }));
});

const PAINT: Record<Side, { fill: string; stroke: string; swatch: string }> = {
  in: { fill: "url(#cfm-in)", stroke: "#1d7cf2", swatch: "linear-gradient(#7cc4ff,#1d7cf2)" },
  out: { fill: "url(#cfm-out)", stroke: "#9333ea", swatch: "linear-gradient(#d78bff,#9333ea)" },
};

const MAX = 30_000;
const TICKS = [0, 6000, 12_000, 18_000, 24_000, 30_000] as const;
const MARGIN = { bottom: 28, left: 0, right: 40, top: 8 };
const HEIGHT = 230;
const X0 = -0.5;
const X1 = 5.5;

export const CashFlowMonthlyBar = () => {
  const [hi, pin] = useCycle(PAIRS.length, 2100, 2);
  const pair = PAIRS[hi] ?? PAIRS[0];

  const definition = useMemo(
    () =>
      defineChart({
        gradients: [
          {
            id: "cfm-idle",
            stops: [
              { color: "#f7f7f8", offset: 0 },
              { color: "#dedee2", offset: 1 },
            ],
            y1: 0,
            y2: 1,
          },
          {
            id: "cfm-out",
            stops: [
              { color: "#a855f7", offset: 0 },
              { color: "#e15cf6", offset: 0.5 },
              { color: "#8b2fd6", offset: 1 },
            ],
            y1: 0,
            y2: 1,
          },
          {
            id: "cfm-in",
            stops: [
              { color: "#6aaefc", offset: 0 },
              { color: "#2ad4f5", offset: 0.5 },
              { color: "#1f7cf0", offset: 1 },
            ],
            y1: 0,
            y2: 1,
          },
          // A sideways sheen over every bar reads as a glossy cylinder.
          {
            id: "cfm-gloss",
            stops: [
              { color: "#ffffff", offset: 0, opacity: 0.05 },
              { color: "#ffffff", offset: 0.28, opacity: 0.4 },
              { color: "#ffffff", offset: 0.62, opacity: 0.06 },
              { color: "#000000", offset: 1, opacity: 0.06 },
            ],
            x1: 0,
            x2: 1,
          },
        ],
        margin: MARGIN,
        marks: [
          barY(BARS, {
            fill: (b) => (b.m === hi ? PAINT[b.side].fill : "url(#cfm-idle)"),
            key: "id",
            radius: 5,
            stroke: (b) => (b.m === hi ? PAINT[b.side].stroke : "#e4e4e7"),
            strokeWidth: 1,
            x: "x",
            y1: 0,
            y2: "value",
          }),
          barY(BARS, {
            fill: "url(#cfm-gloss)",
            fillOpacity: 1,
            id: "gloss",
            key: "id",
            radius: 5,
            x: "x",
            y1: 0,
            y2: "value",
          }),
          dot(
            FLECKS.filter((f) => f.m === hi),
            {
              fill: "#ffffff",
              fillOpacity: 0.75,
              key: "id",
              r: "r",
              x: "x",
              y: "y",
            },
          ),
        ],
        scales: {
          x: {
            axis: {
              line: { stroke: GRID, strokeOpacity: 1 },
              tickLabels: { fontSize: 11.5 },
              ticks: {
                format: (v) => MONTHS[Math.round(Number(v))] ?? "",
                size: 0,
                values: [0, 1, 2, 3, 4, 5],
              },
            },
            scale: scaleLinear().domain([X0, X1]),
          },
          y: {
            axis: {
              line: { stroke: GRID, strokeOpacity: 1 },
              tickLabels: { fontSize: 11.5 },
              ticks: { format: (v) => compact(v), padding: 8, size: 0, values: [...TICKS] },
            },
            grid: { stroke: GRID, strokeOpacity: 1 },
            scale: scaleLinear().domain([0, MAX]),
            side: "right",
          },
        },
        theme: { muted: "#a1a1aa" },
      }),
    [hi],
  );

  // The readout sits just past the active pair, or before it near the axis.
  const flip = hi >= 4;
  const left = ((hi + (flip ? -0.45 : 0.45) - X0) / (X1 - X0)) * 100;

  return (
    <Card>
      <CardHeader
        title="Cash Flow"
        subtitle="Track money moving in and out across all accounts"
        actions={<MoreButton className="!rounded-[10px]" />}
      />
      <ChartSlot height={HEIGHT} className="mt-4">
        <div onMouseLeave={() => pin(null)}>
          <Chart
            definition={definition}
            renderer={renderer}
            height={HEIGHT}
            ariaLabel="Monthly money in and out"
            onFocusChange={(p) => {
              if (p) {
                pin(Math.round(Number(p.xValue)));
              }
            }}
          />
        </div>
        <PlotOverlay margin={MARGIN}>
          <Bubble
            left={left}
            top={100 - (Math.max(...pair) / MAX) * 100}
            align={flip ? "right" : "left"}
            className="!rounded-2xl !px-2.5 !py-2 text-[12.5px]"
          >
            {[pair[1], pair[0]].map((v, k) => (
              <p
                key={SIDES[1 - k]}
                className={`flex items-center gap-2 ${k === 1 ? "mt-1.5 border-t border-[#dbe7fb] pt-1.5" : ""}`}
              >
                <span
                  className="h-4 w-1.5 rounded-full"
                  style={{ background: PAINT[SIDES[1 - k] ?? "in"].swatch }}
                />
                <Num value={v} className="font-medium" />
              </p>
            ))}
          </Bubble>
        </PlotOverlay>
      </ChartSlot>
    </Card>
  );
};
