"use client";

import { barY, defineChart, tickY } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react/core";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { ArrowDown, ArrowUp, ArrowUpRight } from "lucide-react";
import { useMemo } from "react";

import { usd } from "../lib/data";
import { Card, ChartSlot, Num, renderer, useCycle } from "../lib/kit";
import { GREEN, GRID, MUTED, ORANGE, PURPLE, RED, THEME } from "../lib/tokens";

const WINDOW = 10;
const STEPS = 7;
const HEIGHT = 96;

interface Metric {
  id: string;
  title: string;
  color: string;
  series: number[];
  change: number[];
  amounts: number[];
}

const METRICS: Metric[] = [
  {
    amounts: [163_747, 171_204, 168_930, 176_412, 181_055, 179_320, 186_904],
    change: [48.45, 49.1, 47.82, 50.31, 51.2, 50.64, 52.4],
    color: GREEN,
    id: "rev",
    series: [10, 20, 30, 42, 54, 62, 72, 82, 90, 100, 108, 118, 124, 134, 142, 150, 160],
    title: "Revenue growth",
  },
  {
    amounts: [48_975, 51_220, 46_310, 49_870, 44_905, 47_660, 50_120],
    change: [-13.55, -11.2, -14.83, -12.1, -15.32, -13.04, -10.9],
    color: PURPLE,
    id: "profit",
    series: [12, 72, 42, 82, 20, 28, 62, 88, 100, 52, 64, 30, 78, 46, 90, 58, 70],
    title: "Profit trend",
  },
  {
    amounts: [863, 912, 788, 845, 901, 760, 830],
    change: [-14.29, -12.71, -15.1, -13.42, -11.8, -14.93, -12.2],
    color: ORANGE,
    id: "expense",
    series: [86, 82, 64, 10, 18, 98, 70, 26, 60, 40, 72, 34, 88, 52, 20, 76, 58],
    title: "Expense efficiency",
  },
];

const pct = (n: number) => `${n >= 0 ? "+" : "-"}${Math.abs(n).toFixed(2)}%`;

const Row = ({ metric, step }: { metric: Metric; step: number }) => {
  const rows = useMemo(
    () =>
      metric.series.slice(step, step + WINDOW).map((value, i) => ({ id: `m${step + i}`, value })),
    [metric, step],
  );
  const change = metric.change[step] ?? 0;
  const top = Math.max(...rows.map((r) => r.value));
  const amount = metric.amounts[step] ?? 0;
  const up = change >= 0;
  const gradient = `gt-${metric.id}`;

  const definition = useMemo(
    () =>
      defineChart({
        gradients: [
          {
            id: gradient,
            stops: [
              { color: metric.color, offset: 0, opacity: 0.42 },
              { color: metric.color, offset: 1, opacity: 0 },
            ],
            y1: 0,
            y2: 1,
          },
        ],
        guides: false,
        margin: { bottom: 0, left: 0, right: 0, top: 2 },
        marks: [
          barY(rows, {
            fill: `url(#${gradient})`,
            key: "id",
            x: "id",
            y: "value",
          }),
          tickY(rows, {
            key: "id",
            stroke: metric.color,
            strokeWidth: 2.5,
            x: "id",
            y: "value",
          }),
        ],
        scales: {
          x: {
            scale: scaleBand<string>()
              .domain(rows.map((r) => r.id))
              .paddingInner(0.14)
              .paddingOuter(0),
          },
          y: { scale: scaleLinear().domain([0, top]) },
        },
        theme: THEME,
      }),
    [rows, metric, gradient, top],
  );

  return (
    <section className="py-4 first:pt-0 last:pb-0" style={{ borderColor: GRID }}>
      <div className="flex items-start justify-between">
        <h3 className="text-[15px] font-semibold tracking-[-0.01em]">{metric.title}</h3>
        <span className="inline-flex size-7 items-center justify-center rounded-full border border-black/[0.08] text-[#8a8a93]">
          <ArrowUpRight className="size-3.5" />
        </span>
      </div>
      <div className="mt-1 flex items-end gap-4">
        <div className="w-[150px] shrink-0">
          <Num value={change} format={pct} className="text-[28px] font-bold tracking-[-0.03em]" />
          <p className="text-[12px]" style={{ color: MUTED }}>
            Vs last 6 months
          </p>
          <p
            className="mt-3 flex items-center gap-1.5 whitespace-nowrap text-[11px]"
            style={{ color: MUTED }}
          >
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold"
              style={{
                backgroundColor: up ? "#dcfce7" : "#fee2e2",
                color: up ? GREEN : RED,
              }}
            >
              <span
                className="inline-flex size-3 items-center justify-center rounded-full text-white"
                style={{ backgroundColor: up ? GREEN : RED }}
              >
                {up ? (
                  <ArrowUp className="size-2" strokeWidth={3.5} />
                ) : (
                  <ArrowDown className="size-2" strokeWidth={3.5} />
                )}
              </span>
              <Num value={amount} format={(n) => usd(n, true)} />
            </span>
            This month
          </p>
        </div>
        <ChartSlot height={HEIGHT} className="min-w-0 flex-1">
          <Chart
            definition={definition}
            renderer={renderer}
            height={HEIGHT}
            ariaLabel={`${metric.title}, last ten months`}
          />
        </ChartSlot>
      </div>
    </section>
  );
};

export const GrowthTrends = () => {
  const [step] = useCycle(STEPS, 2600);
  return (
    <Card className="divide-y divide-[#ececf0]">
      {METRICS.map((m) => (
        <Row key={m.id} metric={m} step={step} />
      ))}
    </Card>
  );
};
