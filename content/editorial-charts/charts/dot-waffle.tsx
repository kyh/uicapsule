"use client";

import { defineChart, dot } from "@tanstack/charts";
import { motion } from "@tanstack/charts/motion";
import { Chart } from "@tanstack/charts/react/core";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { useMemo } from "react";

import type { MixRow } from "../lib/data";
import { SPRING } from "../lib/tokens";

const renderer = motion({ initial: "always", transition: SPRING });

interface Cell {
  id: string;
  col: number;
  row: number;
  plan: string;
}

// A hundred dots, one per percent. Cells fill left to right, top to bottom;
// keys carry the plan so a shifted percent pops out and back in.
export const DotWaffle = ({
  mix,
  reveal,
  size,
  ladder,
}: {
  mix: MixRow[];
  /** 0 → 1 entrance progress; the grid inks in dot by dot. */
  reveal: number;
  size: number;
  ladder: readonly string[];
}) => {
  const revealed = Math.min(100, Math.floor(reveal * 101));

  const definition = useMemo(() => {
    const bounds: number[] = [];
    let acc = 0;
    for (const m of mix) {
      acc += m.share;
      bounds.push(acc);
    }
    const cells: Cell[] = Array.from({ length: revealed }, (_, i) => {
      const slot = bounds.findIndex((b) => i < b);
      const plan = mix[slot === -1 ? mix.length - 1 : slot]?.plan ?? "";
      // Fill left → right, top → bottom, so the darkest plan starts where the
      // legend starts reading.
      return { col: i % 10, id: `${i}:${plan}`, plan, row: 9 - Math.floor(i / 10) };
    });
    return defineChart({
      color: { domain: mix.map((m) => m.plan), range: [...ladder] },
      guides: false,
      margin: 0,
      marks: [
        dot(cells, {
          color: "plan",
          key: "id",
          r: size / 30,
          x: "col",
          y: "row",
        }),
      ],
      scales: {
        x: { scale: scaleLinear().domain([-0.65, 9.65]) },
        y: { scale: scaleLinear().domain([-0.65, 9.65]) },
      },
    });
  }, [mix, revealed, size, ladder]);

  return (
    <Chart
      definition={definition}
      renderer={renderer}
      width={size}
      height={size}
      ariaLabel="New accounts by plan, one dot per percent"
    />
  );
};
