"use client";

import { defineChart, text, tickY } from "@tanstack/charts";
import { motion } from "@tanstack/charts/motion";
import { Chart } from "@tanstack/charts/react/core";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { scalePoint } from "@tanstack/charts/scales/point";
import { useMemo } from "react";

import type { PlanRow } from "../lib/data";
import { INK, MUTED, SPRING } from "../lib/tokens";

const renderer = motion({ transition: SPRING, initial: "always" });

// One rung = $2k of MRR. The bar is a ladder you can count.
const RUNG = 2;

type Rung = { id: string; plan: string; y: number; fifth: boolean };

export const RungBars = ({
  plans,
  reveal,
  height,
  initialWidth,
}: {
  plans: PlanRow[];
  /** 0 → 1 entrance progress; rungs climb in as it advances. */
  reveal: number;
  height: number;
  initialWidth: number;
}) => {
  const totalRungs = plans.reduce((sum, p) => sum + Math.round(p.value / RUNG), 0);
  const revealed = Math.min(totalRungs, Math.floor(reveal * (totalRungs + 1)));

  const definition = useMemo(() => {
    const rungs: Rung[] = plans.flatMap((p) =>
      Array.from({ length: Math.round(p.value / RUNG) }, (_, i) => ({
        id: `${p.plan}-${i}`,
        plan: p.plan,
        y: (i + 1) * RUNG,
        fifth: (i + 1) % 5 === 0,
      })),
    );
    // The ladder climbs column by column, rung by rung.
    const shown = rungs.slice(0, revealed);
    const done = new Map<string, number>();
    for (const r of shown) done.set(r.plan, (done.get(r.plan) ?? 0) + 1);
    const labeled = plans.filter((p) => (done.get(p.plan) ?? 0) >= Math.round(p.value / RUNG));
    const top = Math.max(...plans.map((p) => p.value)) * 1.36;
    return defineChart({
      guides: false,
      margin: 0,
      marks: [
        tickY(shown, {
          x: "plan",
          y: "y",
          span: 0.5,
          key: "id",
          stroke: (d) => (d.fifth ? INK : "rgba(27,27,25,0.55)"),
          strokeWidth: 1.2,
        }),
        text(labeled, {
          x: "plan",
          y: "value",
          key: "plan",
          text: (d) => `${d.value}`,
          dy: -13,
          fill: INK,
          fontSize: 12,
          fontWeight: 800,
        }),
      ],
      scales: {
        // Fixed domains keep columns and headroom still while marks enter.
        x: {
          scale: scalePoint<string>()
            .domain(plans.map((p) => p.plan))
            .padding(0.5),
        },
        y: { scale: scaleLinear().domain([0, top]) },
      },
    });
  }, [plans, revealed]);

  return (
    <div>
      <Chart
        definition={definition}
        renderer={renderer}
        height={height}
        initialWidth={initialWidth}
        ariaLabel="Monthly recurring revenue by plan, one rung per two thousand dollars"
      />
      <div className="flex" style={{ color: MUTED }}>
        {plans.map((p) => (
          <span
            key={p.plan}
            className="flex-1 pt-1.5 text-center text-[9px] font-semibold tracking-[0.09em]"
          >
            {p.plan}
          </span>
        ))}
      </div>
    </div>
  );
};
