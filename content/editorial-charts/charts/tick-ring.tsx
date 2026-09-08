"use client";

import { defineChart, vector } from "@tanstack/charts";
import { motion } from "@tanstack/charts/motion";
import { Chart } from "@tanstack/charts/react/core";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { useMemo } from "react";

import type { ChannelRow } from "../lib/data";
import { SPRING } from "../lib/tokens";

const renderer = motion({ initial: "always", transition: SPRING });

interface RingTick {
  id: number;
  x: number;
  y: number;
  rotate: number;
  channel: string;
  major: boolean;
}

// 100 radial dashes, one per percent, read clockwise from noon. The reveal
// sweeps the dial once; after that each scene twists it a few degrees so the
// update itself is visible motion.
export const TickRing = ({
  channels,
  reveal,
  size,
  twist,
  ladder,
}: {
  channels: ChannelRow[];
  /** 0 → 1 entrance progress; the dial sweeps clockwise as it advances. */
  reveal: number;
  size: number;
  twist: number;
  ladder: readonly string[];
}) => {
  const revealed = Math.min(100, Math.floor(reveal * 101));

  const definition = useMemo(() => {
    const bounds: number[] = [];
    let acc = 0;
    for (const c of channels) {
      acc += c.share;
      bounds.push(acc);
    }
    const shade = new Map(channels.map((c, i) => [c.channel, ladder[i % ladder.length]]));
    const ticks: RingTick[] = Array.from({ length: revealed }, (_, i) => {
      const deg = i * 3.6 + twist;
      const rad = (deg * Math.PI) / 180;
      const slot = bounds.findIndex((b) => i < b);
      const row = channels[slot === -1 ? channels.length - 1 : slot];
      return {
        channel: row?.channel ?? "",
        id: i,
        major: i % 10 === 0,
        rotate: deg + 180,
        x: Math.sin(rad),
        y: Math.cos(rad),
      };
    });
    return defineChart({
      guides: false,
      margin: 0,
      marks: [
        vector(ticks, {
          anchor: "start",
          headLength: 0,
          key: "id",
          length: (d) => (d.major ? 26 : 18),
          rotate: "rotate",
          stroke: (d) => shade.get(d.channel) ?? ladder[0] ?? "#f1f0ec",
          strokeWidth: 2.4,
          x: "x",
          y: "y",
        }),
      ],
      scales: {
        x: { scale: scaleLinear().domain([-1, 1]) },
        y: { scale: scaleLinear().domain([-1, 1]) },
      },
    });
  }, [channels, revealed, twist, ladder]);

  return (
    <Chart
      definition={definition}
      renderer={renderer}
      width={size}
      height={size}
      ariaLabel="Sessions by acquisition channel, one tick per percent"
    />
  );
};
