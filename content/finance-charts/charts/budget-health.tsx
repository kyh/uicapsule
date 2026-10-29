"use client";

import { barY, defineChart, rect } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react/core";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { Car, House, ShieldPlus, ShoppingBag } from "lucide-react";
import { useMemo } from "react";

import { Card, ChartSlot, Delta, Label, Num, renderer, useCycle } from "../lib/kit";
import { MUTED, THEME } from "../lib/tokens";

const PURPLE_BAR = "#a12ff5";
const STEPS = [
  { delta: 1.16, used: 59 },
  { delta: 2.84, used: 71.6 },
  { delta: -3.42, used: 46.2 },
  { delta: 4.05, used: 82.4 },
] as const;
const STRIPES = Array.from({ length: 80 }, (_, i) => ({ id: i, x: (i + 0.5) * 1.25 }));

const MARGIN = { bottom: 28, left: 0, right: 0, top: 0 };
const HEIGHT = 66;
const CATEGORY_ICONS = [
  { icon: ShoppingBag, label: "Shopping" },
  { icon: Car, label: "Transport" },
  { icon: House, label: "Housing" },
  { icon: ShieldPlus, label: "Insurance" },
] as const;
const pctFormat = (n: number) => `${n.toFixed(1)}%`;

export const BudgetHealth = () => {
  const [step, pin] = useCycle(STEPS.length, 2600, 0);
  const { used, delta } = STEPS[step] ?? STEPS[0];

  const definition = useMemo(
    () =>
      defineChart({
        focusRing: false,
        margin: MARGIN,
        marks: [
          // Hatching for the unspent remainder; the solid fill slides over it.
          barY(STRIPES, {
            fill: "#e7e7ea",
            inset: 0.7,
            key: "id",
            x: "x",
            y1: 0,
            y2: 1,
          }),
          rect([{ id: "used", used }], {
            fill: PURPLE_BAR,
            inset: 0,
            key: "id",
            radius: [6, 0, 0, 6],
            x1: () => 0,
            x2: "used",
            y1: () => 0,
            y2: () => 1,
          }),
          rect([{ id: "marker", used }], {
            fill: "#8f1ee6",
            inset: 0,
            key: "id",
            radius: 1.5,
            x1: (d) => d.used - 0.35,
            x2: (d) => d.used + 0.35,
            y1: () => -0.16,
            y2: () => 1.16,
          }),
        ],
        scales: {
          x: {
            axis: {
              line: false,
              tickLabels: {
                anchor: ({ index }) => {
                  if (index === 0) {
                    return "start";
                  }
                  return index === 4 ? "end" : "middle";
                },
                fontSize: 12,
              },
              ticks: { format: (v) => `${v}%`, padding: 14, size: 0, values: [0, 25, 50, 75, 100] },
            },
            scale: scaleLinear().domain([0, 100]),
          },
          y: { axis: false, scale: scaleLinear().domain([-0.18, 1.18]) },
        },
        theme: THEME,
      }),
    [used],
  );

  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <h3 className="flex items-center gap-2 text-[17px] font-semibold tracking-[-0.01em]">
          <span style={{ color: "#a4a4ab" }}>Threshold</span>
          <span className="font-normal" style={{ color: "#cfcfd4" }}>
            /
          </span>
          Budget Health
        </h3>
        <span
          className="rounded-full px-2.5 py-1 text-[12px] font-medium"
          style={{ backgroundColor: "#f6e9fe", color: PURPLE_BAR }}
        >
          26.4%
        </span>
      </div>
      <div className="mt-4 flex items-end justify-between">
        <div>
          <Label>Budget Utilization</Label>
          <p className="mt-0.5 flex items-end gap-1.5">
            <Num
              value={used}
              format={pctFormat}
              className="text-[28px] leading-none font-semibold tracking-[-0.03em]"
            />
            <Delta value={delta} className="text-[11px]" />
          </p>
        </div>
        <div className="text-right">
          <Label>Saving rate</Label>
          <Num
            value={98.3 - used}
            format={pctFormat}
            className="mt-0.5 block text-[28px] leading-none font-semibold tracking-[-0.03em]"
          />
        </div>
      </div>
      <ChartSlot height={HEIGHT} className="mt-5">
        <div onMouseLeave={() => pin(null)}>
          <Chart
            definition={definition}
            renderer={renderer}
            height={HEIGHT}
            ariaLabel="Budget utilization against the full budget"
            onFocusChange={(p) => {
              if (p) {
                pin(step);
              }
            }}
          />
        </div>
      </ChartSlot>
      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="text-[12px]" style={{ color: MUTED }}>
            Budget categories
          </p>
          <div className="mt-1.5 flex gap-1.5">
            {CATEGORY_ICONS.map(({ icon: Icon, label }) => (
              <span
                key={label}
                title={label}
                className="inline-flex size-8 items-center justify-center rounded-full bg-[#ececee] text-[#4a4a52]"
              >
                <Icon className="size-3.5" strokeWidth={2.4} />
              </span>
            ))}
          </div>
        </div>
        <span
          className="rounded-full px-3 py-1.5 text-[12px] font-medium"
          style={{ backgroundColor: "#f6e9fe", color: PURPLE_BAR }}
        >
          4 Categories
        </span>
      </div>
    </Card>
  );
};
