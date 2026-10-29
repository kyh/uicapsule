"use client";

import { defineChart } from "@tanstack/charts";
import { pie, polar, radialArc, radialGrid, radialRule } from "@tanstack/charts/polar";
import { Chart } from "@tanstack/charts/react/core";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { ArrowUp } from "lucide-react";
import { useMemo } from "react";

import { usd } from "../lib/data";
import { Card, ChartSlot, MoreButton, Num, Segmented, renderer, useCycle } from "../lib/kit";
import { GREEN, GRID, MUTED, THEME } from "../lib/tokens";

const RANGES = ["Week", "Month", "Year"] as const;
const CATEGORIES = [
  { color: "#f7863a", id: "Debt" },
  { color: "#22b25a", id: "Investment" },
  { color: "#fbcd66", id: "Asset" },
] as const;

interface Period {
  values: [number, number, number];
  budget: number;
  change: number;
}

const PERIODS: Period[] = [
  { budget: 12_600, change: 4.52, values: [2033.29, 3168.13, 3671.74] },
  { budget: 41_000, change: 2.81, values: [9120.4, 11_240.95, 8870.22] },
  { budget: 420_000, change: 6.07, values: [86_510.18, 131_302.4, 98_215.63] },
];

const ZERO: Period["values"] = [0, 0, 0];
const HEIGHT = 230;
const INNER = 0.68;
const TAU = Math.PI * 2;
const HATCH = Array.from({ length: 120 }, (_, i) => (i / 120) * TAU);

export const Expenses = () => {
  const [range, pin] = useCycle(RANGES.length, 3000);
  const period = PERIODS[range] ?? PERIODS[0];
  const values = period?.values ?? ZERO;
  const total = values.reduce((s, v) => s + v, 0);
  const budget = period?.budget ?? total;

  const definition = useMemo(() => {
    const rows = [
      ...CATEGORIES.map((c, i) => ({ id: c.id, value: values[i] ?? 0 })),
      { id: "rest", value: Math.max(0, budget - total) },
    ];
    const slices = pie(rows, { gapAngle: 0.025, value: "value" });
    const rest = slices.find((s) => s.id === "rest");
    const open = HATCH.filter(
      (a) => rest && a > rest.startAngle + 0.03 && a < rest.endAngle - 0.03,
    );
    return defineChart({
      color: {
        domain: CATEGORIES.map((c) => c.id),
        range: CATEGORIES.map((c) => c.color),
      },
      guides: false,
      margin: 0,
      marks: [
        polar({
          guides: [
            radialGrid({
              stroke: "#f7863a",
              strokeOpacity: 0.55,
              strokeWidth: 1,
              values: [INNER, 1],
            }),
          ],
          inset: 4,
          marks: [
            radialRule(
              open.map((a) => ({ a })),
              {
                angle: "a",
                key: "a",
                radius1: INNER + 0.05,
                radius2: 0.97,
                stroke: "#fde3d1",
                strokeWidth: 2.2,
              },
            ),
            radialArc(
              slices.filter((s) => s.id !== "rest"),
              {
                color: "id",
                cornerRadius: 7,
                innerRadius: ({ radius }) => radius * INNER,
                key: "id",
                outerRadius: ({ radius }) => radius,
                stroke: "#ffffff",
                strokeOpacity: 0.35,
                strokeWidth: 1,
              },
            ),
          ],
          scales: {
            angle: { scale: scaleLinear().domain([0, TAU]) },
            radius: { scale: scaleLinear().domain([0, 1]) },
          },
        }),
      ],
      scales: { x: null, y: null },
      theme: THEME,
    });
  }, [values, budget, total]);

  return (
    <Card>
      <div className="flex items-start justify-between">
        <h3 className="text-[17px] font-semibold tracking-[-0.01em]">Expenses</h3>
        <MoreButton />
      </div>
      <p className="mt-3 text-[13px]" style={{ color: MUTED }}>
        Total Expenses
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Num value={total} className="text-[28px] font-bold tracking-[-0.03em]" />
        <span className="flex items-center gap-1.5 text-[12px]" style={{ color: MUTED }}>
          <span
            className="inline-flex items-center gap-1 rounded-full bg-[#dcfce7] px-2 py-0.5 font-semibold"
            style={{ color: GREEN }}
          >
            <span
              className="inline-flex size-3 items-center justify-center rounded-full text-white"
              style={{ backgroundColor: GREEN }}
            >
              <ArrowUp className="size-2" strokeWidth={3.5} />
            </span>
            <Num value={period?.change ?? 0} format={(n) => `${n.toFixed(2)}%`} />
          </span>
          vs last {RANGES[range]?.toLowerCase()}
        </span>
      </div>
      <Segmented options={RANGES} value={range} onChange={pin} className="mt-4" />
      <ChartSlot height={HEIGHT} className="mt-4">
        <Chart
          definition={definition}
          renderer={renderer}
          height={HEIGHT}
          ariaLabel="Expenses by category against budget"
        />
      </ChartSlot>
      <ul className="mt-4 flex flex-col gap-2">
        {CATEGORIES.map((c, i) => (
          <li
            key={c.id}
            className="flex items-center gap-2 rounded-xl border bg-[#f7f7f8] px-3 py-2.5 text-[13px]"
            style={{ borderColor: GRID }}
          >
            <span className="size-2.5 rounded-full" style={{ backgroundColor: c.color }} />
            <span className="flex-1 text-[#3a3a42]">{c.id}</span>
            <Num value={values[i] ?? 0} format={(n) => usd(n)} className="font-medium" />
          </li>
        ))}
      </ul>
    </Card>
  );
};
