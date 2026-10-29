"use client";

import { defineChart } from "@tanstack/charts";
import { pie, polar, radialArc } from "@tanstack/charts/polar";
import { Chart } from "@tanstack/charts/react/core";
import { CalendarDays } from "lucide-react";
import { useMemo } from "react";

import { usd } from "../lib/data";
import { Card, ChartSlot, Chip, MoreButton, Num, muted, renderer, useCycle } from "../lib/kit";
import { GREEN } from "../lib/tokens";

const SEGMENTS = 16;
// The visible half of a full-circle polar chart: the centre sits on the card's
// bottom edge, like the source gauge.
const HALF = 178;

interface Period {
  label: string;
  saved: number;
  target: number;
  total: number;
  delta: number;
}

const PERIODS: Period[] = [
  { delta: 12, label: "Weekly", saved: 1820, target: 3185, total: 167_350.2 },
  { delta: 9, label: "Monthly", saved: 7420, target: 9800, total: 171_204.6 },
  { delta: 16, label: "Yearly", saved: 41_380, target: 112_000, total: 182_915.4 },
];

const STOPS: [number, [number, number, number]][] = [
  [0, [10, 69, 32]],
  [0.3, [22, 163, 74]],
  [0.62, [178, 230, 196]],
  [1, [214, 243, 223]],
];

const mix = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);

/** Dark forest through house green to mint; filled segments read left to right. */
const shade = (i: number) => {
  const t = i / (SEGMENTS - 1);
  const upper = STOPS.findIndex(([at]) => at >= t);
  const [a0, ca] = STOPS[Math.max(0, upper - 1)] ?? STOPS[0] ?? [0, [0, 0, 0]];
  const [a1, cb] = STOPS[upper] ?? [1, ca];
  const k = a1 === a0 ? 0 : (t - a0) / (a1 - a0);
  return `rgb(${mix(ca[0], cb[0], k)}, ${mix(ca[1], cb[1], k)}, ${mix(ca[2], cb[2], k)})`;
};

const slices = pie(
  Array.from({ length: SEGMENTS }, (_, i) => ({ id: `seg-${i}`, index: i, value: 1 })),
  {
    endAngle: Math.PI / 2,
    gapAngle: 0.045,
    startAngle: -Math.PI / 2,
    value: "value",
  },
);

export const BudgetAllocation = () => {
  const [period, pin] = useCycle(PERIODS.length, 3600);
  const data = PERIODS[period] ?? PERIODS[0];
  const saved = data?.saved ?? 0;
  const target = data?.target ?? 1;
  const filled = Math.round((saved / target) * SEGMENTS);

  const definition = useMemo(
    () =>
      defineChart({
        guides: false,
        margin: 0,
        marks: [
          polar({
            marks: [
              radialArc(slices, {
                cornerRadius: 7,
                fill: "#ededef",
                id: "track",
                innerRadius: ({ radius }) => radius * 0.66,
                key: "id",
                outerRadius: ({ radius }) => radius,
              }),
              radialArc(
                slices.filter((s) => s.index < filled),
                {
                  cornerRadius: 7,
                  fill: (d) => shade(d.index),
                  id: "saved",
                  innerRadius: ({ radius }) => radius * 0.66,
                  key: "id",
                  outerRadius: ({ radius }) => radius,
                },
              ),
            ],
            scales: { angle: null, radius: null },
          }),
        ],
        scales: { x: null, y: null },
      }),
    [filled],
  );

  return (
    <Card className="!pb-0">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[16px] font-semibold tracking-[-0.01em]">Budget Allocation</h3>
        <div className="flex items-center gap-1.5">
          <Chip icon={CalendarDays} chevron>
            {data?.label}
          </Chip>
          <MoreButton />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 text-center">
        <div>
          <p className="inline-flex items-center gap-1.5 text-[12px]" style={muted}>
            <span className="h-1.5 w-3 rounded-full" style={{ backgroundColor: GREEN }} />
            Current Saved
          </p>
          <Num
            value={saved}
            format={(n) => usd(n, true)}
            className="block text-[24px] font-semibold tracking-[-0.02em]"
          />
        </div>
        <div>
          <p className="inline-flex items-center gap-1.5 text-[12px]" style={muted}>
            <span className="h-1.5 w-3 rounded-full bg-[#ececf0]" />
            Target Amount
          </p>
          <Num
            value={target}
            format={(n) => usd(n, true)}
            className="block text-[24px] font-semibold tracking-[-0.02em]"
          />
        </div>
      </div>
      <ChartSlot height={HALF} className="mt-3 overflow-hidden">
        <div onMouseEnter={() => pin(period)} onMouseLeave={() => pin(null)}>
          <Chart
            definition={definition}
            renderer={renderer}
            height={HALF * 2}
            ariaLabel={`${usd(saved, true)} saved of ${usd(target, true)}`}
          />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-3 text-center">
          <p className="text-[12px]" style={muted}>
            Total Saved
          </p>
          <Num
            value={data?.total ?? 0}
            className="block text-[22px] font-semibold tracking-[-0.02em]"
          />
          <p className="text-[12px]" style={muted}>
            <span style={{ color: GREEN }}>+{data?.delta}%</span> than last month.
          </p>
        </div>
      </ChartSlot>
    </Card>
  );
};
