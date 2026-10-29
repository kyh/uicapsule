"use client";

import { areaY, defineChart, text } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react/core";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { PiggyBank } from "lucide-react";
import { motion } from "motion/react";
import { useId, useMemo } from "react";

import { Card, ChartSlot, IconTile, MoreButton, Num, renderer, useCycle } from "../lib/kit";
import { MUTED, ORANGE, SPRING, THEME } from "../lib/tokens";

const GROUPS = [
  { born: [2002, 2008], label: "18-24", share: 22.6 },
  { born: [1992, 2001], label: "25-34", share: 34.6 },
  { born: [1982, 1991], label: "35-44", share: 19 },
  { born: [1971, 1981], label: "45-55", share: 27.7 },
  { born: [1961, 1970], label: "56-65", share: 23.7 },
  { born: [1940, 1960], label: "66+", share: 12.2 },
] as const;

const TOP = 40;
// Box geometry: bar half-width in x units, top-diamond depth in y units.
const HALF = 0.33;
const DEPTH = 0.9;
const HEIGHT = 200;
const MARGIN = { bottom: 0, left: 0, right: 0, top: 26 };

type Face = "l" | "r" | "t";
interface Pt {
  face: Face;
  g: string;
  hot: boolean;
  k: string;
  x: number;
  y1: number;
  y2: number;
}

/** One box as three faces (left, right, top) of area rows. */
const box = (i: number, v: number, id: string): Pt[] => {
  const l = i + 0.5 - HALF;
  const c = i + 0.5;
  const r = i + 0.5 + HALF;
  const faces: [Face, number, number, number][] = [
    ["l", l, 0, v],
    ["l", c, 0, v - DEPTH],
    ["r", c, 0, v - DEPTH],
    ["r", r, 0, v],
    ["t", l, v, v],
    ["t", c, v - DEPTH, v + DEPTH],
    ["t", r, v, v],
  ];
  return faces.map(([face, x, y1, y2], j) => ({
    face,
    g: `${id}-${face}`,
    hot: id === "hl",
    k: `${id}-${j}`,
    x,
    y1,
    y2,
  }));
};

const COLD_FILL = { l: "url(#ua-cold-l)", r: "url(#ua-cold-r)", t: "#ececee" } as const;
const HOT_FILL = { l: "url(#ua-hot-l)", r: "url(#ua-hot-r)", t: "#ffd8bd" } as const;
const fillOf = (d: Pt) => (d.hot ? HOT_FILL : COLD_FILL)[d.face];

const fade = (id: string, color: string, top: number) => ({
  id,
  stops: [
    { color, offset: 0, opacity: top },
    { color, offset: 0.7, opacity: top * 0.55 },
    { color, offset: 1, opacity: 0 },
  ],
  y1: 0,
  y2: 1,
});

export const InvestmentAppUserAge = () => {
  const id = useId();
  const [hi, pin] = useCycle(GROUPS.length, 2300, 1);
  const group = GROUPS[hi] ?? GROUPS[1];

  const definition = useMemo(() => {
    const cold = GROUPS.flatMap((g, i) => box(i, g.share, `b${i}`));
    const hot = box(hi, GROUPS[hi]?.share ?? 0, "hl");
    const labels = GROUPS.map((g, i) => ({ i, label: `${g.share.toFixed(1)}%`, v: g.share }));
    return defineChart({
      gradients: [
        fade("ua-cold-l", "#e4e4e7", 0.75),
        fade("ua-cold-r", "#ededef", 0.6),
        fade("ua-hot-l", "#fdba8c", 1),
        fade("ua-hot-r", "#fb8a3c", 1),
      ],
      margin: MARGIN,
      marks: [
        areaY(cold, {
          fill: fillOf,
          fillOpacity: 1,
          key: "k",
          x: "x",
          y1: "y1",
          y2: "y2",
          z: "g",
        }),
        areaY(hot, {
          fill: fillOf,
          fillOpacity: 1,
          id: "ua-hot",
          key: "k",
          x: "x",
          y1: "y1",
          y2: "y2",
          z: "g",
        }),
        text(labels, {
          dy: -14,
          fill: (d) => (d.i === hi ? ORANGE : "#a1a1aa"),
          fontSize: 14,
          fontWeight: 500,
          key: "i",
          text: "label",
          x: (d) => d.i + 0.5,
          y: "v",
        }),
      ],
      motion: { path: "morph" },
      scales: {
        x: { axis: false, scale: scaleLinear().domain([0, GROUPS.length]) },
        y: { axis: false, scale: scaleLinear().domain([0, TOP]) },
      },
      theme: THEME,
    });
  }, [hi]);

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <IconTile icon={PiggyBank} color={ORANGE} size={40} className="!rounded-[12px]" />
          <div>
            <h3 className="text-[15px] font-semibold tracking-[-0.01em]">
              Age of investment app user?
            </h3>
            <p className="text-[12px]" style={{ color: MUTED }}>
              in 2026
            </p>
          </div>
        </div>
        <MoreButton />
      </div>
      <p className="mt-4 text-[12px]" style={{ color: "#a1a1aa" }}>
        People born between
      </p>
      <p className="mt-0.5 text-[28px] font-bold tracking-[-0.03em]">
        <Num value={group.born[0]} format={(n) => String(Math.round(n))} /> -{" "}
        <Num value={group.born[1]} format={(n) => String(Math.round(n))} />
      </p>
      <div onMouseLeave={() => pin(null)}>
        <ChartSlot height={HEIGHT} className="mt-2">
          <Chart
            definition={definition}
            renderer={renderer}
            height={HEIGHT}
            ariaLabel="Share of investment app users by age group"
            onFocusChange={(p) => {
              const x = Number(p?.xValue);
              if (p && Number.isFinite(x)) {
                pin(Math.min(GROUPS.length - 1, Math.max(0, Math.floor(x))));
              }
            }}
          />
        </ChartSlot>
        <div className="mt-2 flex">
          {GROUPS.map((g, i) => (
            <button
              key={g.label}
              type="button"
              onMouseEnter={() => pin(i)}
              className="relative flex-1 py-1 text-[12px] font-medium"
              style={{ color: i === hi ? "#ffffff" : "#a1a1aa" }}
            >
              {i === hi ? (
                <motion.span
                  layoutId={`${id}-age`}
                  transition={SPRING}
                  className="absolute inset-x-0.5 inset-y-0 rounded-lg bg-[#262626]"
                />
              ) : null}
              <span className="relative">{g.label}</span>
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
};
