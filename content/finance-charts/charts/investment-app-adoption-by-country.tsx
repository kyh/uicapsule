"use client";

import { areaY, defineChart, rect, text } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react/core";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { Earth } from "lucide-react";
import { useMemo } from "react";

import {
  Bubble,
  Card,
  ChartSlot,
  IconTile,
  Legend,
  MoreButton,
  PlotOverlay,
  muted,
  renderer,
  useCycle,
} from "../lib/kit";
import { BLUE, GREEN, MUTED, ORANGE, PURPLE, YELLOW } from "../lib/tokens";

const COUNTRIES = [
  { color: ORANGE, deep: "#e5600f", label: "USA", light: "#fb8a3c" },
  { color: PURPLE, deep: "#9233ea", label: "India", light: "#bd7cfb" },
  { color: BLUE, deep: "#0f67d8", label: "UK", light: "#4a9bf6" },
  { color: GREEN, deep: "#13863d", label: "Canada", light: "#34c06a" },
  { color: YELLOW, deep: "#e9a514", label: "Other", light: "#fcd05c" },
] as const;

// Millions of active investors per year, by country.
const YEARS = [
  { mix: [1.78, 1.6, 1.22, 1.03, 0.57], year: 2023 },
  { mix: [3.42, 3.04, 2.38, 2, 1.56], year: 2024 },
  { mix: [5.32, 3.99, 3.28, 2.93, 3.28], year: 2025 },
] as const;

const CENTERS = [0.8, 5, 9.2] as const;
const HALF = 0.8;
const Y_MAX = 20.5;
const HEIGHT = 230;
const MARGIN = { bottom: 30, left: 0, right: 0, top: 4 };

interface Block {
  country: number;
  col: number;
  c: number;
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}

const blocks: Block[] = YEARS.flatMap((y, col) => {
  let acc = 0;
  return y.mix.map((v, country) => {
    const c = CENTERS[col] ?? 0;
    const block = { c, col, country, x1: c - HALF, x2: c + HALF, y1: acc, y2: acc + v };
    acc += v;
    return block;
  });
});

const totals = YEARS.map((y, col) => ({
  c: CENTERS[col] ?? 0,
  col,
  total: y.mix.reduce((a, b) => a + b, 0),
  year: y.year,
}));

/** Ribbons run edge to edge across each bar so they read as one flow. */
const ribbon = (country: number) =>
  blocks.flatMap((b) =>
    b.country === country
      ? [
          { id: `${b.col}l`, x: b.x1, y1: b.y1, y2: b.y2 },
          { id: `${b.col}r`, x: b.x2, y1: b.y1, y2: b.y2 },
        ]
      : [],
  );

const gradients = COUNTRIES.map((c, i) => ({
  id: `iaac-${i}`,
  stops: [
    { color: c.light, offset: 0 },
    { color: c.color, offset: 0.45 },
    { color: c.color, offset: 1 },
  ],
  y1: 0,
  y2: 1,
}));

export const InvestmentAppAdoptionByCountry = () => {
  const [hi, pin] = useCycle(YEARS.length, 2400, 2);
  const picked = totals[hi] ?? totals[2];

  const definition = useMemo(
    () =>
      defineChart({
        gradients,
        guides: false,
        margin: MARGIN,
        marks: [
          ...COUNTRIES.map((c, i) =>
            areaY(ribbon(i), {
              fill: c.color,
              fillOpacity: 0.09,
              id: `ribbon-${i}`,
              key: "id",
              stroke: "#ffffff",
              strokeWidth: 1.5,
              x: "x",
              y1: "y1",
              y2: "y2",
            }),
          ),
          ...COUNTRIES.map((c, i) =>
            rect(
              blocks.filter((b) => b.country === i),
              {
                fill: `url(#iaac-${i})`,
                id: `bar-${i}`,
                inset: 1.5,
                key: "col",
                radius: 6,
                stroke: c.deep,
                strokeWidth: 0.75,
                x: "c",
                x1: "x1",
                x2: "x2",
                y1: "y1",
                y2: "y2",
              },
            ),
          ),
          text(totals, {
            dy: -10,
            fill: (d) => (d.col === hi ? ORANGE : MUTED),
            fontSize: 14,
            fontWeight: 600,
            id: "years",
            key: "col",
            text: (d) => `${d.year}`,
            x: "c",
            y: "total",
          }),
          text(totals, {
            dy: 18,
            fill: (d) => (d.col === hi ? "transparent" : MUTED),
            fontSize: 12,
            id: "totals",
            key: "col",
            text: (d) => `${d.total.toFixed(1)}M`,
            x: "c",
            y: () => 0,
          }),
        ],
        scales: {
          x: { axis: false, scale: scaleLinear().domain([0, 10]) },
          y: { axis: false, scale: scaleLinear().domain([0, Y_MAX]) },
        },
      }),
    [hi],
  );

  return (
    <Card>
      <div className="flex items-start gap-3">
        <IconTile icon={Earth} color={ORANGE} size={40} className="!rounded-[12px]" />
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] leading-snug font-semibold tracking-[-0.01em]">
            Which country leads investment app adoption?
          </h3>
          <p className="mt-0.5 text-[12px]" style={muted}>
            Active investor
          </p>
        </div>
        <MoreButton />
      </div>
      <Legend
        items={COUNTRIES.map((c) => ({ color: c.color, label: c.label }))}
        className="mt-4 [&_span>span]:size-2.5"
      />
      <ChartSlot height={HEIGHT} className="mt-3">
        <div onMouseLeave={() => pin(null)}>
          <Chart
            definition={definition}
            renderer={renderer}
            height={HEIGHT}
            ariaLabel="Active investors by country, 2023 to 2025"
            onFocusChange={(p) => {
              if (p) {
                const i = totals.findIndex((t) => t.c === p.xValue);
                if (i !== -1) {
                  pin(i);
                }
              }
            }}
          />
        </div>
        <PlotOverlay margin={MARGIN}>
          <Bubble
            left={((picked?.c ?? 0) / 10) * 100}
            top={100}
            dark
            className="mt-1.5 !rounded-lg !px-2 !py-0.5 text-[12px] font-semibold"
          >
            {`${(picked?.total ?? 0).toFixed(1)}M`}
          </Bubble>
        </PlotOverlay>
      </ChartSlot>
    </Card>
  );
};
