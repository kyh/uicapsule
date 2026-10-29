"use client";

import { defineChart } from "@tanstack/charts";
import { polar, radialArc, radialDot } from "@tanstack/charts/polar";
import { Chart } from "@tanstack/charts/react/core";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { ArrowUpRight, Briefcase, Package, Palette } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo } from "react";

import { compact, usd } from "../lib/data";
import { Card, ChartSlot, MoreButton, Num, renderer, useCycle } from "../lib/kit";
import { GREEN, GRID, MUTED, THEME } from "../lib/tokens";

// The dial is a slice of a circle much larger than the card: its centre sits
// far below the visible strip, so only the crown shows and both ends run off
// the card's edges.
const HEIGHT = 150;
// The drawing is a square wider than the card, centred under it.
const SIZE = 480;
const TOP = 24;
const SWEEP = 1;
const GAP = 0.1;
const TRACK_W = 13;

interface Month {
  progress: number;
  sources: [number, number, number];
}

const MONTHS: Month[] = [
  { progress: 0.5, sources: [2100, 1250, 550] },
  { progress: 0.62, sources: [2650, 1250, 940] },
  { progress: 0.41, sources: [1500, 1250, 420] },
  { progress: 0.56, sources: [2300, 1250, 780] },
];

const SOURCES: { label: string; icon: LucideIcon; color: string }[] = [
  { color: "#ea4c89", icon: Palette, label: "UI/UX Freelance Project" },
  { color: "#0a66c2", icon: Briefcase, label: "Retainer Design Studio" },
  { color: "#e3242b", icon: Package, label: "Digital Asset Sales" },
];

export const MonthlyIncome = () => {
  const [m] = useCycle(MONTHS.length, 2800);
  const month = MONTHS[m] ?? MONTHS[0];
  const progress = month?.progress ?? 0;
  const total = (month?.sources ?? [0, 0, 0]).reduce((s, v) => s + v, 0);
  const knob = -SWEEP + progress * 2 * SWEEP;

  const definition = useMemo(
    () =>
      defineChart({
        gradients: [
          {
            id: "mi-fill",
            stops: [
              { color: "#bbf7d0", offset: 0 },
              { color: "#22c55e", offset: 1 },
            ],
            x1: 0,
            x2: 1,
            y1: 0,
            y2: 0,
          },
          {
            id: "mi-knob",
            stops: [
              { color: "#86efac", offset: 0 },
              { color: "#16a34a", offset: 1 },
            ],
            x1: 0,
            x2: 0,
            y1: 0,
            y2: 1,
          },
        ],
        guides: false,
        margin: 0,
        marks: [
          polar({
            endAngle: Math.PI,
            marks: [
              radialArc(
                [
                  { endAngle: knob - GAP, id: "done", startAngle: -SWEEP - 0.6 },
                  { endAngle: SWEEP + 0.6, id: "left", startAngle: knob + GAP },
                ],
                {
                  cornerRadius: TRACK_W / 2,
                  fill: (d) => (d.id === "done" ? "url(#mi-fill)" : "#dcdcdf"),
                  innerRadius: ({ radius }) => radius - TOP - TRACK_W,
                  key: "id",
                  outerRadius: ({ radius }) => radius - TOP,
                },
              ),
              radialDot([{ a: knob, id: "knob", r: 1 }], {
                angle: "a",
                fill: "#ffffff",
                key: "id",
                r: 13,
                radius: "r",
                stroke: "url(#mi-knob)",
                strokeWidth: 6,
              }),
            ],
            scales: {
              angle: { scale: scaleLinear().domain([-Math.PI, Math.PI]) },
              radius: {
                range: [0, ({ radius }) => radius - TOP - TRACK_W / 2],
                scale: scaleLinear().domain([0, 1]),
              },
            },
            startAngle: -Math.PI,
          }),
        ],
        scales: { x: null, y: null },
        theme: THEME,
      }),
    [knob],
  );

  return (
    <Card>
      <div className="flex items-start justify-between">
        <h3 className="text-[17px] font-semibold tracking-[-0.01em]">Monthly Income</h3>
        <MoreButton />
      </div>
      <ChartSlot height={HEIGHT} className="-mx-5 mt-1 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2" style={{ width: SIZE }}>
          <Chart
            definition={definition}
            renderer={renderer}
            width={SIZE}
            height={SIZE}
            ariaLabel="Monthly income progress toward target"
          />
        </div>
      </ChartSlot>
      <div className="relative -mt-[78px] text-center">
        <Num
          value={total}
          format={(n) => compact(n)}
          className="text-[34px] font-bold tracking-[-0.03em]"
        />
        <p className="mt-0.5 text-[13px]">
          <Num
            value={progress * 100}
            format={(n) => `+${Math.round(n)}%`}
            className="font-semibold"
            style={{ color: GREEN }}
          />{" "}
          of monthly target
        </p>
      </div>
      <div className="mt-7 border-t pt-4" style={{ borderColor: GRID }}>
        <p className="text-[14px] font-semibold">Income Sources</p>
        <p className="mt-0.5 text-[12px]" style={{ color: MUTED }}>
          Monthly recurring revenue and freelance project mockups.
        </p>
        <ul className="mt-3 flex flex-col gap-2">
          {SOURCES.map((s, i) => (
            <li
              key={s.label}
              className="flex items-center gap-2.5 rounded-xl border bg-[#fafafa] px-3 py-2.5 text-[13px]"
              style={{ borderColor: GRID }}
            >
              <span
                className="inline-flex size-5 items-center justify-center rounded-md text-white"
                style={{ backgroundColor: s.color }}
              >
                <s.icon className="size-3" strokeWidth={2.5} />
              </span>
              <span className="flex-1 text-[#3a3a42]">{s.label}</span>
              <Num
                value={month?.sources[i] ?? 0}
                format={(n) => `+${usd(n, true)}`}
                className="text-[#3a3a42]"
              />
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border py-2 text-[13px] text-[#3a3a42]"
          style={{ borderColor: GRID }}
        >
          See insight <ArrowUpRight className="size-3.5" style={{ color: MUTED }} />
        </button>
      </div>
    </Card>
  );
};
