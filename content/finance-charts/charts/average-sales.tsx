"use client";

import { areaY, defineChart, lineY } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react/core";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { ArrowUp, CalendarDays } from "lucide-react";
import { useMemo } from "react";

import { MONTHS } from "../lib/data";
import { Card, ChartSlot, Chip, MoreButton, Num, renderer, useCycle } from "../lib/kit";
import { GREEN, MUTED, THEME } from "../lib/tokens";

const REVENUE = [1680, 3340, 2610, 2891.12, 2560, 2580] as const;
const GROWTH = [6.2, 21.4, 9.8, 14, 4.1, 5.3] as const;
const GOAL = 6000;
const TOP = 3700;
// Isometric box: half width in x units, diamond depth in y units.
const W = 0.37;
const D = TOP * 0.05;

const MARGIN = { bottom: 26, left: 2, right: 2, top: 6 };
const HEIGHT = 210;

interface Pt {
  g: string;
  k: string;
  x: number;
  y: number;
}
interface Face {
  k: string;
  x: number;
  y1: number;
  y2: number;
}

/** The dashed wireframe of one box: silhouette, front edge and top ridge. */
const wire = (i: number, h: number): Pt[] => {
  const cx = i + 0.5;
  const outline: [number, number][] = [
    [cx - W, D],
    [cx - W, h],
    [cx, h + D],
    [cx + W, h],
    [cx + W, D],
    [cx, 0],
    [cx - W, D],
  ];
  const ridge: [number, number][] = [
    [cx - W, h],
    [cx, h - D],
    [cx + W, h],
  ];
  const spine: [number, number][] = [
    [cx, h - D],
    [cx, 0],
  ];
  return [
    ...outline.map(([x, y], j) => ({ g: `${i}-o`, k: `${i}-o${j}`, x, y })),
    ...ridge.map(([x, y], j) => ({ g: `${i}-r`, k: `${i}-r${j}`, x, y })),
    ...spine.map(([x, y], j) => ({ g: `${i}-s`, k: `${i}-s${j}`, x, y })),
  ];
};

export const AverageSales = () => {
  const [hi, pin] = useCycle(REVENUE.length, 2400, 3);
  const revenue = REVENUE[hi] ?? 0;
  const growth = GROWTH[hi] ?? 0;

  const definition = useMemo(() => {
    const h = REVENUE[hi] ?? 0;
    const cx = hi + 0.5;
    const wires = REVENUE.flatMap((v, i) => (i === hi ? [] : wire(i, v)));
    const left: Face[] = [
      { k: "l0", x: cx - W, y1: D, y2: h },
      { k: "l1", x: cx, y1: 0, y2: h - D },
    ];
    const right: Face[] = [
      { k: "r0", x: cx, y1: 0, y2: h - D },
      { k: "r1", x: cx + W, y1: D, y2: h },
    ];
    const top: Face[] = [
      { k: "t0", x: cx - W, y1: h, y2: h },
      { k: "t1", x: cx, y1: h - D, y2: h + D },
      { k: "t2", x: cx + W, y1: h, y2: h },
    ];
    const face = (rows: Face[], fill: string, id: string) =>
      areaY(rows, { fill, fillOpacity: 1, id, key: "k", x: "x", y1: "y1", y2: "y2" });
    return defineChart({
      gradients: [
        {
          id: "as-left",
          stops: [
            { color: "#16a34a", offset: 0 },
            { color: "#a7e5bb", offset: 1 },
          ],
          y1: 0,
          y2: 1,
        },
        {
          id: "as-right",
          stops: [
            { color: "#b4ebc6", offset: 0 },
            { color: "#1fae4f", offset: 1 },
          ],
          y1: 0,
          y2: 1,
        },
        {
          id: "as-top",
          stops: [
            { color: "#9be3b1", offset: 0 },
            { color: "#22b455", offset: 1 },
          ],
          x1: 0,
          x2: 1,
          y1: 0,
          y2: 0,
        },
      ],
      margin: MARGIN,
      marks: [
        lineY(wires, {
          key: "k",
          stroke: "#a1a1aa",
          strokeDasharray: "4 4",
          strokeWidth: 1,
          x: "x",
          y: "y",
          z: "g",
        }),
        face(left, "url(#as-left)", "as-face-left"),
        face(right, "url(#as-right)", "as-face-right"),
        face(top, "url(#as-top)", "as-face-top"),
      ],
      motion: { path: "morph" },
      scales: {
        x: {
          axis: {
            line: false,
            tickLabels: { fontSize: 12, fontWeight: (c) => (c.value === cx ? 600 : 400) },
            ticks: {
              format: (v: number) => MONTHS[Math.floor(v)] ?? "",
              size: 0,
              values: REVENUE.map((_, i) => i + 0.5),
            },
          },
          scale: scaleLinear().domain([0, REVENUE.length]),
        },
        y: { axis: false, scale: scaleLinear().domain([0, TOP + D]) },
      },
      theme: THEME,
    });
  }, [hi]);

  return (
    <Card>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[15px] font-semibold tracking-[-0.01em]">Average Sales</h3>
        <div className="flex items-center gap-1.5">
          <Chip icon={CalendarDays} chevron>
            6 months
          </Chip>
          <MoreButton />
        </div>
      </div>
      <p className="mt-4 text-[13px]" style={{ color: MUTED }}>
        Total revenue
      </p>
      <Num value={revenue} className="mt-0.5 block text-[30px] font-bold tracking-[-0.03em]" />
      <div className="mt-1.5 flex items-center gap-2 text-[12px]">
        <span
          className="inline-flex items-center gap-1 rounded-full bg-[#dcfce7] px-2 py-0.5 font-semibold"
          style={{ color: GREEN }}
        >
          <span className="inline-flex size-3.5 items-center justify-center rounded-full bg-[#16a34a] text-white">
            <ArrowUp className="size-2.5" strokeWidth={3} />
          </span>
          <Num value={growth} format={(n) => `${n.toFixed(0)}%`} />
        </span>
        <span style={{ color: "#52525b" }}>
          <Num value={(revenue / GOAL) * 100} format={(n) => `${n.toFixed(0)}%`} /> of $6K goal met
        </span>
      </div>
      <ChartSlot height={HEIGHT} className="mt-3">
        <div onMouseLeave={() => pin(null)}>
          <Chart
            definition={definition}
            renderer={renderer}
            height={HEIGHT}
            ariaLabel="Monthly revenue, January to June"
            onFocusChange={(p) => {
              const x = Number(p?.xValue);
              if (p && Number.isFinite(x)) {
                pin(Math.min(REVENUE.length - 1, Math.max(0, Math.floor(x))));
              }
            }}
          />
        </div>
      </ChartSlot>
      <p className="mt-2 text-[12px] leading-snug" style={{ color: "#52525b" }}>
        This week revenue increased due to a 4.4 promo
      </p>
    </Card>
  );
};
