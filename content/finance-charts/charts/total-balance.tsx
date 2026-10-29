"use client";

import { barY, defineChart, text } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react/core";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { ArrowUp, Ellipsis, Lock } from "lucide-react";
import { useMemo } from "react";

import { Card, ChartSlot, Num, renderer, useCycle } from "../lib/kit";
import { GREEN, MUTED, THEME } from "../lib/tokens";

const COUNT = 25;
const MARKERS = new Map([
  [0, "0"],
  [12, "50"],
  [24, "100"],
]);
// 35% maturity of 25 capsules; the full charge rests HOLD frames, then replays.
const FILLED = 9;
const HOLD = 8;
const HEIGHT = 150;
const MARGIN = { bottom: 2, left: 0, right: 0, top: 22 };

const BARS = Array.from({ length: COUNT }, (_, i) => ({
  i,
  marker: MARKERS.has(i),
}));
const LABELS = BARS.filter((b) => b.marker);

export const TotalBalance = () => {
  // Charges capsule by capsule up to the maturity mark, rests, replays.
  const [frame, pin] = useCycle(FILLED + HOLD, 210, FILLED + HOLD - 1);
  const lit = Math.min(FILLED, frame + 1);

  const definition = useMemo(
    () =>
      defineChart({
        gradients: [
          {
            id: "tb-on",
            stops: [
              { color: "#139443", offset: 0 },
              { color: "#22c55e", offset: 0.42 },
              { color: "#16a34a", offset: 0.62 },
              { color: "#117f37", offset: 1 },
            ],
            x1: 0,
            x2: 1,
            y1: 0,
            y2: 0,
          },
          {
            id: "tb-off",
            stops: [
              { color: "#d4d4d8", offset: 0 },
              { color: "#ececef", offset: 0.42 },
              { color: "#e2e2e5", offset: 0.62 },
              { color: "#cdcdd1", offset: 1 },
            ],
            x1: 0,
            x2: 1,
            y1: 0,
            y2: 0,
          },
        ],
        guides: false,
        margin: MARGIN,
        marks: [
          barY(BARS, {
            fill: (d) => (d.i < lit ? "url(#tb-on)" : "url(#tb-off)"),
            key: "i",
            // Half the ~8px capsule width at wall-card size.
            radius: 4,
            stroke: (d) => (d.i < lit ? "#15803d" : "#cacace"),
            strokeWidth: 1,
            x: "i",
            y1: 0,
            y2: (d) => (d.marker ? 1 : 0.84),
          }),
          text(LABELS, {
            anchor: (d) => {
              if (d.i === 0) {
                return "start";
              }
              return d.i === COUNT - 1 ? "end" : "middle";
            },
            dx: (d) => {
              if (d.i === 0) {
                return -4;
              }
              return d.i === COUNT - 1 ? 4 : 0;
            },
            dy: -11,
            fill: (d) => (d.i === 0 ? GREEN : "#a1a1aa"),
            fontSize: 12,
            key: "i",
            text: (d) => MARKERS.get(d.i) ?? "",
            x: "i",
            y: () => 1,
          }),
        ],
        scales: {
          x: {
            scale: scaleBand<number>()
              .domain(BARS.map((b) => b.i))
              .paddingInner(0.42)
              .paddingOuter(0),
          },
          y: { scale: scaleLinear().domain([0, 1]) },
        },
        theme: THEME,
      }),
    [lit],
  );

  return (
    <Card>
      <div className="flex items-start justify-between">
        <p className="text-[13px]" style={{ color: MUTED }}>
          Total balance
        </p>
        <Ellipsis className="size-5 text-[#a1a1aa]" />
      </div>
      <div className="mt-1 flex items-center gap-2.5">
        <Num value={357_835.58} className="text-[30px] font-bold tracking-[-0.03em]" />
        <span className="inline-flex items-center gap-1 rounded-full bg-[#dcfce7] px-2 py-0.5 text-[12px] font-medium text-[#16a34a]">
          <span className="inline-flex size-3.5 items-center justify-center rounded-full bg-[#16a34a] text-white">
            <ArrowUp className="size-2.5" strokeWidth={3.2} />
          </span>
          2.64%
        </span>
      </div>
      <div className="mt-2 flex gap-1.5">
        {["min 8.6% APR", "earned +457.97"].map((c) => (
          <span
            key={c}
            className="rounded-full bg-[#ededf0] px-2.5 py-1 text-[12px] font-medium text-[#55555c]"
          >
            {c}
          </span>
        ))}
      </div>
      <ChartSlot height={HEIGHT} className="mt-5">
        <div onMouseEnter={() => pin(FILLED + HOLD - 1)} onMouseLeave={() => pin(null)}>
          <Chart
            definition={definition}
            renderer={renderer}
            height={HEIGHT}
            ariaLabel="Lock-up maturity: 35% of 100"
          />
        </div>
      </ChartSlot>
      <div className="mt-5 flex items-end justify-between">
        <div>
          <p className="text-[12px]" style={{ color: MUTED }}>
            Unlock at
          </p>
          <p className="mt-0.5 text-[20px] font-bold tracking-[-0.02em]">May 20, 2026</p>
        </div>
        <p
          className="inline-flex items-center gap-1.5 pb-0.5 text-[14px] font-medium"
          style={{ color: GREEN }}
        >
          <Lock className="size-4" strokeWidth={2.4} fill="currentColor" fillOpacity={0.2} />
          <Num value={35} format={(n) => `${Math.round(n)}% maturity`} />
        </p>
      </div>
    </Card>
  );
};
