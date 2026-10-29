"use client";

import { defineChart } from "@tanstack/charts";
import { pie, polar, radialArc, radialDot, radialText } from "@tanstack/charts/polar";
import { Chart } from "@tanstack/charts/react/core";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { useMemo } from "react";

import { usd } from "../lib/data";
import { Card, ChartSlot, MoreButton, Num, renderer, useCycle } from "../lib/kit";
import { MUTED } from "../lib/tokens";

const TAU = Math.PI * 2;
const START = -0.5;
const INNER = 0.6;
const HEIGHT = 270;
const TOTAL = 248_600;

const SLICES = [
  { color: "#0b74e5", id: "Equities", ink: "#ffffff", outer: 0.9, swatch: "#1d7cf2", value: 51 },
  { color: "#b65cfb", id: "Other", ink: "#1b1030", outer: 0.86, swatch: "#a43cf5", value: 16 },
  { color: "#f7751e", id: "Bonds", ink: "#2a1405", outer: 0.86, swatch: "#f97316", value: 15 },
  { color: "#e5f0fd", id: "Cash", ink: "#0b0b0f", outer: 0.82, swatch: "#9ec8fa", value: 18 },
] as const;

const arcs = pie(SLICES, { endAngle: START + TAU, startAngle: START, value: "value" });

const LEGEND_ORDER = ["Equities", "Cash", "Bonds", "Other"] as const;

export const PortfolioAllocation = () => {
  const [hi, pin] = useCycle(SLICES.length, 2400);
  const activeId = SLICES[hi]?.id ?? "Equities";
  const active = arcs.find((a) => a.id === activeId) ?? arcs[0];

  const definition = useMemo(() => {
    const outerOf = (id: string, base: number) => (id === activeId ? 1 : base);
    return defineChart({
      guides: false,
      margin: 0,
      marks: [
        polar({
          marks: [
            ...arcs.map((a) =>
              radialArc([a], {
                fill: a.color,
                fillOpacity: a.id === activeId ? 0.16 : 0,
                id: `glow-${a.id}`,
                innerRadius: ({ radius }) => radius * (INNER - 0.03),
                key: "id",
                outerRadius: ({ radius }) => radius * (outerOf(a.id, a.outer) + 0.035),
              }),
            ),
            ...arcs.map((a) =>
              radialArc([a], {
                fill: a.color,
                id: `arc-${a.id}`,
                innerRadius: ({ radius }) => radius * INNER,
                key: "id",
                outerRadius: ({ radius }) => radius * outerOf(a.id, a.outer),
                stroke: a.id === "Cash" ? "#d6e7fb" : "#ffffff",
                strokeOpacity: a.id === "Cash" ? 1 : 0.25,
                strokeWidth: 1,
              }),
            ),
            radialDot(arcs, {
              angle: "angle",
              fill: "#ffffff",
              fillOpacity: 0.2,
              key: "id",
              r: 18,
              radius: (d) => (INNER + outerOf(d.id, d.outer)) / 2,
              stroke: "#ffffff",
              strokeOpacity: 0.65,
              strokeWidth: 1,
            }),
            ...arcs.map((a) =>
              radialText([a], {
                angle: "angle",
                dy: 0,
                fill: a.ink,
                fontSize: 13,
                fontWeight: 500,
                id: `label-${a.id}`,
                key: "id",
                radius: (d) => (INNER + outerOf(d.id, d.outer)) / 2,
                text: (d) => `${d.value}%`,
              }),
            ),
          ],
          scales: {
            angle: { scale: scaleLinear().domain([0, TAU]) },
            radius: { scale: scaleLinear().domain([0, 1]) },
          },
        }),
      ],
      scales: { x: null, y: null },
    });
  }, [activeId]);

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[17px] font-semibold tracking-[-0.01em]">Portfolio allocation</h3>
          <p className="mt-0.5 text-[12px]" style={{ color: MUTED }}>
            Track your spending pattern and stay in control
          </p>
        </div>
        <MoreButton />
      </div>
      <ChartSlot height={HEIGHT} className="mt-3">
        <div onMouseLeave={() => pin(null)}>
          <Chart
            definition={definition}
            renderer={renderer}
            height={HEIGHT}
            ariaLabel="Portfolio allocation by asset class"
            onFocusChange={(p) => {
              if (p) {
                const i = SLICES.findIndex((s) => s.id === p.key || s.id === p.datum?.id);
                if (i !== -1) {
                  pin(i);
                }
              }
            }}
          />
        </div>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[12px]" style={{ color: MUTED }}>
            {activeId}
          </span>
          <Num
            value={(TOTAL * (active?.value ?? 0)) / 100}
            format={(n) => usd(n, true)}
            className="text-[20px] font-semibold tracking-[-0.02em]"
          />
        </div>
      </ChartSlot>
      <div className="mt-3 flex items-center justify-between text-[13px] text-[#3a3a42]">
        {LEGEND_ORDER.map((id) => {
          const s = SLICES.find((x) => x.id === id);
          return (
            <span key={id} className="inline-flex items-center gap-1.5">
              <span
                className="size-3 rounded-full"
                style={{
                  background: `radial-gradient(circle at 35% 30%, color-mix(in oklab, ${s?.swatch ?? "#000"} 55%, white), ${s?.swatch ?? "#000"})`,
                  boxShadow: `0 1px 3px -1px ${s?.swatch ?? "#000"}`,
                }}
              />
              {id}
            </span>
          );
        })}
      </div>
    </Card>
  );
};
