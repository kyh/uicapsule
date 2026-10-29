"use client";

import { defineChart } from "@tanstack/charts";
import { polar, radialBarRadius } from "@tanstack/charts/polar";
import { Chart } from "@tanstack/charts/react/core";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { motion } from "motion/react";
import { useMemo } from "react";

import { uniform, usd } from "../lib/data";
import { Card, ChartSlot, MoreButton, Num, renderer, useCycle } from "../lib/kit";
import { BLUE, ORANGE, PURPLE, SPRING } from "../lib/tokens";

const SPOKES = 20;
const HEIGHT = 300;
const RING = 0.5;

interface Region {
  name: string;
  color: string;
  light: string;
  deep: string;
  tint: string;
  gain: number;
  revenue: number;
  seed: number;
}

const REGIONS: Region[] = [
  {
    color: BLUE,
    deep: "#0b63d6",
    gain: 2100,
    light: "#4ea3ff",
    name: "Los Angeles",
    revenue: 3900,
    seed: 5,
    tint: "#e5f0fd",
  },
  {
    color: ORANGE,
    deep: "#e2600c",
    gain: 1250,
    light: "#ffa45c",
    name: "Brooklyn",
    revenue: 2480,
    seed: 17,
    tint: "#fff0e4",
  },
  {
    color: PURPLE,
    deep: "#8b31e0",
    gain: 550,
    light: "#c98bff",
    name: "New York",
    revenue: 1630,
    seed: 29,
    tint: "#f4eafe",
  },
];

const spokes = Array.from({ length: SPOKES }, (_, i) => i);

/** Short stubs around the ring with a few long spikes, like the source. */
const lengths = (seed: number) => {
  const base = uniform(SPOKES, seed, 0.035, 0.07);
  const spikes = uniform(5, seed + 1, 0, SPOKES);
  for (const [k, s] of spikes.entries()) {
    const i = Math.floor(s);
    base[i] = 0.11 + k * 0.035;
  }
  return base;
};

export const AssetOverviewRadial = () => {
  const [active, pin] = useCycle(REGIONS.length, 3000);
  const region = REGIONS[active] ?? REGIONS[0];

  const definition = useMemo(() => {
    const r = region ?? REGIONS[0];
    const ls = lengths(r?.seed ?? 0);
    const outer = spokes.map((i) => ({ i, r1: RING, r2: 0.96 + ((i * 7) % 5) * 0.01 }));
    const inner = spokes.map((i) => ({ i, r1: RING - 0.13, r2: RING - 0.13 + (ls[i] ?? 0) }));
    return defineChart({
      gradients: [
        {
          id: "aor-gloss",
          stops: [
            { color: r?.light ?? BLUE, offset: 0 },
            { color: r?.color ?? BLUE, offset: 0.55 },
            { color: r?.deep ?? BLUE, offset: 1 },
          ],
          x1: 0,
          x2: 1,
          y1: 0,
          y2: 1,
        },
      ],
      guides: false,
      margin: 0,
      marks: [
        polar({
          marks: [
            radialBarRadius(outer, {
              angle: "i",
              cornerRadius: 6,
              fill: r?.tint ?? "#e5f0fd",
              id: "wedges",
              key: "i",
              radius1: "r1",
              radius2: "r2",
            }),
            radialBarRadius(inner, {
              angle: "i",
              angleScale: "halo",
              cornerRadius: "full",
              fill: r?.color ?? BLUE,
              fillOpacity: 0.16,
              id: "halo",
              key: "i",
              radius1: (d) => d.r1 - 0.015,
              radius2: (d) => d.r2 + 0.02,
            }),
            radialBarRadius(inner, {
              angle: "i",
              angleScale: "stub",
              cornerRadius: 4,
              fill: "url(#aor-gloss)",
              id: "stubs",
              key: "i",
              radius1: "r1",
              radius2: "r2",
              stroke: r?.deep ?? BLUE,
              strokeOpacity: 0.35,
              strokeWidth: 0.75,
            }),
          ],
          scales: {
            angle: { scale: scaleBand<number>().domain(spokes).paddingInner(0.14) },
            halo: {
              channel: "angle",
              scale: scaleBand<number>().domain(spokes).paddingInner(0.28),
            },
            radius: { scale: scaleLinear().domain([0, 1]) },
            stub: {
              channel: "angle",
              scale: scaleBand<number>().domain(spokes).paddingInner(0.42),
            },
          },
        }),
      ],
      scales: { x: null, y: null },
    });
  }, [region]);

  return (
    <Card>
      <div className="flex items-start justify-between">
        <h3 className="text-[16px] font-semibold tracking-[-0.01em]">Asset Overview</h3>
        <MoreButton />
      </div>
      <div className="mt-3 grid grid-cols-2">
        <div>
          <p className="text-[12px] text-[#5b5b63]">Mutual Funds</p>
          <Num
            value={12_350}
            format={(n) => usd(n, true)}
            className="text-[24px] font-semibold tracking-[-0.02em]"
          />
        </div>
        <div>
          <p className="text-[12px] text-[#5b5b63]">Stocks</p>
          <Num
            value={1820}
            format={(n) => usd(n, true)}
            className="text-[24px] font-semibold tracking-[-0.02em]"
          />
        </div>
      </div>
      <ChartSlot height={HEIGHT} className="mt-3">
        <Chart
          definition={definition}
          renderer={renderer}
          height={HEIGHT}
          ariaLabel={`Revenue by month for ${region?.name ?? ""}`}
        />
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-[12px] text-[#5b5b63]">Revenue</p>
          <Num value={region?.revenue ?? 0} className="text-[18px] font-semibold" />
        </div>
      </ChartSlot>
      <div className="mt-3 space-y-2" onMouseLeave={() => pin(null)}>
        {REGIONS.map((r, i) => (
          <button
            key={r.name}
            type="button"
            onMouseEnter={() => pin(i)}
            className="relative flex w-full items-center gap-2.5 rounded-2xl bg-[#f6f6f7] px-3.5 py-2.5 text-left ring-1 ring-black/[0.05]"
          >
            {i === active ? (
              <motion.span
                layoutId="aor-row"
                transition={SPRING}
                className="absolute inset-0 rounded-2xl bg-white shadow-[0_4px_14px_-6px_rgba(0,0,0,0.18)] ring-1 ring-black/[0.06]"
              />
            ) : null}
            <span className="relative size-2.5 rounded-full" style={{ backgroundColor: r.color }} />
            <span className="relative flex-1 text-[13px] text-[#5b5b63]">{r.name}</span>
            <span className="relative text-[13px] font-medium tabular-nums">
              +{usd(r.gain, true)}
            </span>
          </button>
        ))}
      </div>
    </Card>
  );
};
