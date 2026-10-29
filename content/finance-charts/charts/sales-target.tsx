"use client";

import { barY, defineChart } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react/core";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { useMemo } from "react";

import { usd } from "../lib/data";
import { Card, ChartSlot, Legend, MoreButton, Num, renderer, useCycle } from "../lib/kit";
import { MUTED, THEME } from "../lib/tokens";

const VIOLET_BAR = "#a12ff5";
const IDLE = "#ebebee";
const COUNT = 40;
// Months of the quarter: the meter refills to each month's progress.
const PROGRESS = [27.5, 46.2, 71.8, 38.4, 88.6] as const;
const TARGET = 39_673;

const MARGIN = { bottom: 26, left: 0, right: 0, top: 0 };
const HEIGHT = 64;

export const SalesTarget = () => {
  const [step, pin] = useCycle(PROGRESS.length, 2600, 0);
  const pct = PROGRESS[step] ?? PROGRESS[0];
  const filled = Math.round((pct / 100) * COUNT);

  const definition = useMemo(() => {
    const rows = Array.from({ length: COUNT }, (_, i) => ({
      i,
      on: i < filled,
      x: ((i + 0.5) / COUNT) * 100,
    }));
    return defineChart({
      focusRing: false,
      margin: MARGIN,
      marks: [
        barY(rows, {
          fill: (d) => (d.on ? VIOLET_BAR : IDLE),
          key: "i",
          radius: 2.5,
          x: "x",
          y1: (d) => (d.on ? 0 : 0.17),
          y2: (d) => (d.on ? 1 : 0.83),
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
            ticks: { format: (v) => `${v}%`, padding: 10, size: 0, values: [0, 25, 50, 75, 100] },
          },
          scale: scaleLinear().domain([0, 100]),
        },
        y: { axis: false, scale: scaleLinear().domain([0, 1]) },
      },
      theme: THEME,
    });
  }, [filled]);

  return (
    <Card>
      <div className="flex items-start justify-between">
        <h3 className="text-[17px] font-semibold tracking-[-0.01em]">Sales Target</h3>
        <MoreButton />
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <Num
            value={(TARGET * pct) / 100}
            format={(n) => usd(n, true)}
            className="block text-[28px] font-bold tracking-[-0.03em]"
          />
          <p className="text-[12px]" style={{ color: MUTED }}>
            Project Earnings
          </p>
        </div>
        <Legend
          swatch="bar"
          className="justify-end pb-0.5 !text-[11px]"
          items={[
            { color: VIOLET_BAR, label: "Actual Revenue" },
            { color: "#e2e2e6", label: "Monthly Target" },
          ]}
        />
      </div>
      <ChartSlot height={HEIGHT} className="mt-5">
        <div onMouseLeave={() => pin(null)}>
          <Chart
            definition={definition}
            renderer={renderer}
            height={HEIGHT}
            ariaLabel="Sales progress toward the monthly target"
            onFocusChange={(p) => {
              // Hovering the meter holds the current month.
              if (p) {
                pin(step);
              }
            }}
          />
        </div>
      </ChartSlot>
    </Card>
  );
};
