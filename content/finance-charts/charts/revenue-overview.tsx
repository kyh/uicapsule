"use client";

import { defineChart } from "@tanstack/charts";
import { polar, radialArc, radialDot, radialLine } from "@tanstack/charts/polar";
import { Chart } from "@tanstack/charts/react/core";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { curveCatmullRom } from "d3-shape";
import { ArrowUp, ArrowUpRight, Sparkle, Wallet } from "lucide-react";
import { useMemo } from "react";

import { Card, MoreButton, Num, renderer, useActive, useCycle } from "../lib/kit";
import { GREEN, MUTED } from "../lib/tokens";

const HALF = Math.PI / 2;
const SIZE = 340;
const VISIBLE = 182;

const BLUE = "#1d7cf2";
const PURPLE = "#a43cf5";

/** The month-by-month trajectory riding the band: angle (radians from noon)
 * and radius as a fraction of the dial. */
const PATH = [
  { a: -HALF, r: 0.745, v: 0 },
  { a: -1.42, r: 0.75, v: 212.4 },
  { a: -1.25, r: 0.762, v: 318.9 },
  { a: -0.62, r: 0.775, v: 512.06 },
  { a: -0.35, r: 0.785, v: 618.4 },
  { a: -0.1, r: 0.79, v: 702.33 },
  { a: 0.16, r: 0.79, v: 781.5 },
  { a: 0.42, r: 0.775, v: 874.92 },
] as const;
const STOPS = PATH.slice(1).map((p, k) => ({ ...p, id: `p${k}`, k }));
const FIRST_ACTIVE = 2;

const ring = (inner: number, outer: number) => ({
  innerRadius: ({ radius }: { radius: number }) => radius * inner,
  outerRadius: ({ radius }: { radius: number }) => radius * outer,
});

const RevenueOverviewBody = () => {
  const active = useActive();
  // Walk the highlight over the last five months, landing on the current one.
  const [step, pin] = useCycle(STOPS.length - FIRST_ACTIVE, 1700, STOPS.length - FIRST_ACTIVE - 1);
  const hi = step + FIRST_ACTIVE;
  const head = STOPS[hi] ?? STOPS.at(-1);
  const end = (head?.a ?? 0) + 0.24;

  const definition = useMemo(() => {
    const trail = PATH.filter((p) => p.a <= (head?.a ?? 0));
    return defineChart({
      gradients: [
        {
          id: "ro-band",
          stops: [
            { color: "#e9f3fe", offset: 0 },
            { color: "#a9cff9", offset: 0.45 },
            { color: "#3a92f3", offset: 1 },
          ],
          x1: 0,
          x2: 1,
          y1: 0.6,
          y2: 0,
        },
        {
          id: "ro-rim",
          stops: [
            { color: BLUE, offset: 0, opacity: 0 },
            { color: "#69aef7", offset: 0.4, opacity: 0.8 },
            { color: BLUE, offset: 1 },
          ],
          x1: 0,
          x2: 1,
          y1: 1,
          y2: 0,
        },
        {
          id: "ro-line",
          stops: [
            { color: BLUE, offset: 0 },
            { color: "#dbe6fd", offset: 0.35 },
            { color: "#c39bf8", offset: 0.6 },
            { color: PURPLE, offset: 1 },
          ],
          x1: 0,
          x2: 1,
          y1: 1,
          y2: 0,
        },
      ],
      guides: false,
      margin: 0,
      marks: [
        polar({
          endAngle: HALF,
          marks: [
            radialArc([{ endAngle: HALF, id: "rim-track", startAngle: -HALF }], {
              ...ring(0.972, 0.985),
              fill: "#f1f1f4",
              key: "id",
            }),
            radialArc([{ endAngle: end - 0.1, id: "rim", startAngle: -HALF }], {
              ...ring(0.966, 0.99),
              cornerRadius: 3,
              fill: "url(#ro-rim)",
              key: "id",
            }),
            radialArc([{ endAngle: HALF, id: "track", startAngle: -HALF }], {
              ...ring(0.58, 0.905),
              cornerRadius: 10,
              fill: "#f6f6f8",
              key: "id",
            }),
            radialArc([{ endAngle: end, id: "fill", startAngle: -HALF }], {
              ...ring(0.58, 0.905),
              cornerRadius: 10,
              fill: "url(#ro-band)",
              key: "id",
            }),
            radialLine(trail, {
              angle: "a",
              curve: curveCatmullRom,
              radius: "r",
              stroke: "url(#ro-line)",
              strokeWidth: 6,
            }),
            radialDot(
              STOPS.filter((p) => p.k < hi),
              {
                angle: "a",
                fill: "#ffffff",
                key: "id",
                r: 7.5,
                radius: "r",
              },
            ),
            radialDot(
              STOPS.filter((p) => p.k < hi),
              {
                angle: "a",
                fill: PURPLE,
                key: "id",
                r: 6,
                radius: "r",
                stroke: "#c084fc",
                strokeWidth: 1.5,
              },
            ),
            radialDot(
              STOPS.filter((p) => p.k < 2),
              {
                angle: "a",
                fill: BLUE,
                key: "id",
                r: 6,
                radius: "r",
                stroke: "#60a5fa",
                strokeWidth: 1.5,
              },
            ),
            radialDot([{ a: head?.a ?? 0, id: "head", r: head?.r ?? 0.78 }], {
              angle: "a",
              fill: "#ffffff",
              key: "id",
              r: 7.5,
              radius: "r",
              stroke: PURPLE,
              strokeWidth: 4,
            }),
          ],
          scales: {
            angle: { scale: scaleLinear().domain([-HALF, HALF]) },
            radius: { scale: scaleLinear().domain([0, 1]) },
          },
          startAngle: -HALF,
        }),
      ],
      scales: { x: null, y: null },
    });
  }, [head, hi, end]);

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[17px] font-semibold tracking-[-0.01em]">Revenue Overview</h3>
          <p className="mt-0.5 text-[12px]" style={{ color: MUTED }}>
            Track your Revenue pattern and stay in control
          </p>
        </div>
        <MoreButton />
      </div>
      <div
        className="relative mt-4 overflow-hidden"
        style={{ height: VISIBLE }}
        onMouseEnter={() => pin(STOPS.length - FIRST_ACTIVE - 1)}
        onMouseLeave={() => pin(null)}
      >
        {active ? (
          <Chart
            definition={definition}
            renderer={renderer}
            height={SIZE}
            ariaLabel="Revenue gauge toward the monthly target"
          />
        ) : null}
        <div className="pointer-events-none absolute inset-x-0 bottom-1 flex flex-col items-center">
          <span
            className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[12px] font-medium"
            style={{ backgroundColor: "#e8f7ed", borderColor: "#bfe8cc", color: GREEN }}
          >
            <Wallet className="size-3.5" /> Revenue
          </span>
          <Num value={head?.v ?? 0} className="mt-1 text-[30px] font-bold tracking-[-0.03em]" />
          <p className="flex items-center gap-1 text-[12px]" style={{ color: MUTED }}>
            <span
              className="inline-flex size-3.5 items-center justify-center rounded-full text-white"
              style={{ backgroundColor: GREEN }}
            >
              <ArrowUp className="size-2.5" strokeWidth={3} />
            </span>
            <span className="font-medium" style={{ color: GREEN }}>
              8.34%
            </span>
            vs last month
          </p>
        </div>
      </div>
      <div
        className="mt-4 flex items-center justify-between gap-2 rounded-[14px] border px-3 py-2.5"
        style={{ backgroundColor: "#e9f7ee", borderColor: "#bfe8cc" }}
      >
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[13px] font-semibold">
            <Sparkle className="size-3.5" style={{ color: GREEN, fill: GREEN }} />
            Great Progress!
          </p>
          <p className="mt-0.5 text-[11px] text-[#3a3a42]">
            You&rsquo;re on track to exceed your monthly revenue target
          </p>
        </div>
        <span
          className="inline-flex shrink-0 items-center gap-0.5 text-[12px] font-medium"
          style={{ color: GREEN }}
        >
          View details <ArrowUpRight className="size-3.5" />
        </span>
      </div>
    </>
  );
};

// The cycle, count-ups and chart mount read the card's in-view state, so the
// body renders inside <Card> rather than beside it.
export const RevenueOverview = () => (
  <Card>
    <RevenueOverviewBody />
  </Card>
);
