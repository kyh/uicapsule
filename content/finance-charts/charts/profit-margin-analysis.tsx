"use client";

import { areaY, defineChart, dot, frame, lineY, link, rect, ruleX, ruleY } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react/core";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { CalendarDays, Sparkles } from "lucide-react";
import { useMemo } from "react";

import { walk } from "../lib/data";
import { Card, ChartSlot, Chip, Legend, MoreButton, Num, renderer, useCycle } from "../lib/kit";
import { BLUE, GRID, MUTED, PURPLE, THEME } from "../lib/tokens";

const N = 60;
const HEIGHT = 108;
const MARGIN = { bottom: 1, left: 1, right: 1, top: 1 };
const COLUMNS = Array.from({ length: 10 }, (_, i) => ((i + 1) * (N - 1)) / 11);

interface Series {
  id: string;
  label: string;
  color: string;
  wash: string;
  fill: string;
  domain: [number, number];
  values: number[];
  /** Scrubber positions the sweep visits, in point indexes. */
  stops: number[];
}

const SERIES: Series[] = [
  {
    color: PURPLE,
    domain: [40, 80],
    fill: "#e2b8fb",
    id: "gross",
    label: "Gross Margin",
    stops: [40, 37, 33, 29, 25, 21, 18, 23, 28, 33, 37, 41],
    values: walk(N, 71, { max: 74, min: 50, start: 57, vol: 3.4 }),
    wash: "#f6e8fe",
  },
  {
    color: BLUE,
    domain: [6, 30],
    fill: "#acd2f8",
    id: "net",
    label: "Net Margin",
    stops: [22, 18, 14, 19, 25, 30, 35, 40, 42, 37, 32, 27],
    values: walk(N, 74, { max: 25, min: 11, start: 18, vol: 3 }),
    wash: "#e6f1fd",
  },
];

const Panel = ({ series, step }: { series: Series; step: number }) => {
  const at = series.stops[step % series.stops.length] ?? 0;
  const value = series.values[at] ?? 0;
  const rows = useMemo(() => series.values.map((v, i) => ({ i, v })), [series]);

  const definition = useMemo(
    () =>
      defineChart({
        clip: true,
        guides: false,
        margin: MARGIN,
        marks: [
          rect([{ hi: series.domain[1], id: "wash", lo: series.domain[0], x1: 0, x2: at }], {
            fill: series.wash,
            inset: 0,
            key: "id",
            x1: "x1",
            x2: "x2",
            y1: "lo",
            y2: "hi",
          }),
          areaY(rows, {
            fill: series.fill,
            fillOpacity: 1,
            x: "i",
            y1: series.domain[0],
            y2: "v",
          }),
          lineY(rows, { stroke: series.color, strokeWidth: 1.25, x: "i", y: "v" }),
          // The unrevealed side: a white sheet whose left edge is the scrubber.
          rect([{ hi: series.domain[1], id: "sheet", lo: series.domain[0], x1: at, x2: N - 1 }], {
            fill: "#ffffff",
            inset: 0,
            key: "id",
            x1: "x1",
            x2: "x2",
            y1: "lo",
            y2: "hi",
          }),
          ruleX(COLUMNS, { stroke: GRID, strokeDasharray: "4 4", strokeWidth: 1 }),
          ruleY([(series.domain[0] + series.domain[1]) / 2], {
            stroke: GRID,
            strokeDasharray: "4 4",
            strokeWidth: 1,
          }),
          frame({ stroke: GRID, strokeOpacity: 1 }),
          link([{ hi: series.domain[1], id: "cursor", lo: series.domain[0], x: at }], {
            key: "id",
            lineCap: "butt",
            stroke: series.color,
            strokeWidth: 2,
            x1: "x",
            x2: "x",
            y1: "lo",
            y2: "hi",
          }),
          dot([{ id: "cursor", v: value, x: at }], {
            fill: "#ffffff",
            key: "id",
            r: 6,
            stroke: series.color,
            strokeWidth: 2.5,
            x: "x",
            y: "v",
          }),
        ],
        scales: {
          x: { scale: scaleLinear().domain([0, N - 1]) },
          y: { scale: scaleLinear().domain(series.domain) },
        },
        theme: THEME,
      }),
    [rows, series, at, value],
  );

  return (
    <ChartSlot height={HEIGHT}>
      <Chart
        definition={definition}
        renderer={renderer}
        height={HEIGHT}
        ariaLabel={`${series.label} over the period`}
      />
      <div className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-right">
        <p className="text-[12px]" style={{ color: MUTED }}>
          {series.label}
        </p>
        <Num
          value={value}
          format={(n) => `${n.toFixed(2)}%`}
          className="text-[17px] font-semibold tracking-[-0.02em]"
        />
      </div>
    </ChartSlot>
  );
};

export const ProfitMarginAnalysis = () => {
  const [step] = useCycle(12, 1600);
  const [gross] = SERIES;
  const grossNow = gross ? (gross.values[gross.stops[step] ?? 0] ?? 0) : 0;
  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold tracking-[-0.01em]">Profit Margin Analysis</h3>
          <p className="mt-0.5 text-[12px]" style={{ color: MUTED }}>
            Comparison of Gross vs Net Profit Margin
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Chip icon={CalendarDays} chevron>
            Weekly
          </Chip>
          <MoreButton />
        </div>
      </div>
      <div className="mt-4 border-t pt-4" style={{ borderColor: GRID }}>
        <Legend
          items={[
            { color: PURPLE, label: "Gross Profit Margin" },
            { color: BLUE, label: "Net Profit Margin" },
          ]}
        />
      </div>
      <div className="mt-3 flex flex-col gap-2.5">
        {SERIES.map((s) => (
          <Panel key={s.id} series={s} step={step} />
        ))}
      </div>
      <div
        className="mt-3 flex items-center gap-2 rounded-xl border bg-[#fafafa] px-3 py-2.5 text-[12px]"
        style={{ borderColor: GRID }}
      >
        <Sparkles className="size-3.5 shrink-0" style={{ color: PURPLE }} fill={PURPLE} />
        <p className="text-[#55555e]">
          <span className="font-semibold text-[#0b0b0f]">Insights:</span> Lower supplier costs
          pushed Gross Margin to {grossNow.toFixed(2)}%.
        </p>
      </div>
    </Card>
  );
};
