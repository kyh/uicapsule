"use client";

import { areaY, defineChart, rect, ruleX } from "@tanstack/charts";
import { d3Curve } from "@tanstack/charts/d3/shape";
import { Chart } from "@tanstack/charts/react/core";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { curveMonotoneX } from "d3-shape";
import { ArrowUp, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useId, useMemo } from "react";

import { usd } from "../lib/data";
import {
  Bubble,
  Card,
  ChartSlot,
  MoreButton,
  Num,
  PlotOverlay,
  muted,
  renderer,
  useCycle,
} from "../lib/kit";
import { GREEN, GRID, INK, SPRING, VIOLET } from "../lib/tokens";

const HEIGHT = 230;
const MARGIN = { bottom: 0, left: 0, right: 0, top: 0 };
const SAMPLES = 48;
const CHECKPOINTS = [0.24, 0.52, 0.79] as const;
const curve = d3Curve(curveMonotoneX);

interface Region {
  name: string;
  values: [number, number, number];
  /** Plateau thickness after the first and second widening. */
  p1: number;
  p2: number;
  /** Share of the half-thickness held by the green core. */
  core: number;
}

const REGIONS: Region[] = [
  { core: 0.42, name: "North America", p1: 0.6, p2: 0.98, values: [2746.26, 4075, 7192] },
  { core: 0.36, name: "Europe", p1: 0.52, p2: 0.86, values: [2411.04, 3577, 6314] },
  { core: 0.39, name: "Asia Pacific", p1: 0.56, p2: 0.91, values: [2552.86, 3788, 6685] },
];

const STATS = [
  { delta: 612, label: "Weekly", value: 7710.16, vs: "vs last week" },
  { delta: 1055, label: "Monthly", value: 11_440, vs: "vs last month" },
  { delta: 2345, label: "Yearly", value: 20_191, vs: "vs last year" },
] as const;

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Half-thickness of the stream at x: a thin tail, two widenings, a plateau. */
const thickness = (r: Region, x: number) =>
  0.07 + (r.p1 - 0.07) * smooth(0.13, 0.33, x) + (r.p2 - r.p1) * smooth(0.58, 0.74, x);

interface Slice {
  x: number;
  core: number;
  sky: number;
  edge: number;
}

const slicesFor = (r: Region): Slice[] =>
  Array.from({ length: SAMPLES }, (_, i) => {
    const x = i / (SAMPLES - 1);
    const t = thickness(r, x);
    const core = t * r.core;
    const sky = core + t * 0.26;
    return { core, edge: t, sky, x };
  });

const fade = (id: string, stops: [number, string, number][]) => ({
  id,
  stops: stops.map(([offset, color, opacity]) => ({ color, offset, opacity })),
  x1: 0,
  x2: 1,
});

const GRADIENTS = [
  fade("fof-blue", [
    [0, "#93c5fd", 0],
    [0.14, "#93c5fd", 0.55],
    [0.4, "#4b98f7", 1],
    [0.66, "#0b7cf0", 1],
    [1, "#0a5cc0", 1],
  ]),
  fade("fof-sky", [
    [0, "#bae6fd", 0],
    [0.16, "#9fd4fb", 0.75],
    [0.5, "#58c8f5", 1],
    [0.62, "#5bd3f6", 1],
    [1, "#3c9fc6", 1],
  ]),
  fade("fof-core", [
    [0, "#a5d8e6", 0],
    [0.18, "#7fd0d2", 0.85],
    [0.5, "#86d3c6", 1],
    [0.62, "#9cdcae", 1],
    [1, "#16ad4c", 1],
  ]),
  {
    cx: 0.5,
    cy: 0.5,
    id: "fof-glow",
    r: 0.5,
    stops: [
      { color: "#3b82f6", offset: 0, opacity: 0.2 },
      { color: "#60a5fa", offset: 0.6, opacity: 0.08 },
      { color: "#93c5fd", offset: 1, opacity: 0 },
    ],
    type: "radial" as const,
  },
];

const UpPill = ({ value }: { value: number }) => (
  <span
    className="inline-flex items-center gap-1 rounded-full bg-[#e7f7ed] px-1.5 py-0.5 text-[11px] font-semibold tabular-nums"
    style={{ color: GREEN }}
  >
    <span
      className="inline-flex size-3 items-center justify-center rounded-full text-white"
      style={{ backgroundColor: GREEN }}
    >
      <ArrowUp className="size-2" strokeWidth={3.5} />
    </span>
    {usd(value, true)}
  </span>
);

export const FinanceOverviewFlow = () => {
  const [active, pin] = useCycle(REGIONS.length, 3200);
  const region = REGIONS[active] ?? REGIONS[0];
  const id = useId();

  const definition = useMemo(() => {
    const rows = slicesFor(
      region ?? REGIONS[0] ?? { core: 0.4, name: "", p1: 0.6, p2: 1, values: [0, 0, 0] },
    );
    const band = (key: string, fill: string, y1: (s: Slice) => number, y2: (s: Slice) => number) =>
      areaY(rows, { curve, fill, fillOpacity: 1, id: key, key: "x", x: "x", y1, y2 });
    return defineChart({
      gradients: GRADIENTS,
      guides: false,
      margin: MARGIN,
      marks: [
        rect([{ id: "glow" }], {
          fill: "url(#fof-glow)",
          inset: 0,
          key: "id",
          x1: () => 0.08,
          x2: () => 0.98,
          y1: () => -1.25,
          y2: () => 1.25,
        }),
        band(
          "blue-top",
          "url(#fof-blue)",
          (s) => s.sky,
          (s) => s.edge,
        ),
        band(
          "blue-bottom",
          "url(#fof-blue)",
          (s) => -s.edge,
          (s) => -s.sky,
        ),
        band(
          "sky-top",
          "url(#fof-sky)",
          (s) => s.core,
          (s) => s.sky,
        ),
        band(
          "sky-bottom",
          "url(#fof-sky)",
          (s) => -s.sky,
          (s) => -s.core,
        ),
        band(
          "core",
          "url(#fof-core)",
          (s) => -s.core,
          (s) => s.core,
        ),
        ruleX([...CHECKPOINTS], { stroke: INK, strokeOpacity: 1, strokeWidth: 2 }),
      ],
      scales: {
        x: { axis: false, scale: scaleLinear().domain([0, 1]) },
        y: { axis: false, scale: scaleLinear().domain([-1.12, 1.12]) },
      },
    });
  }, [region]);

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h3 className="text-[16px] font-semibold tracking-[-0.01em]">Finance Overview</h3>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Insights"
            className="inline-flex size-8 items-center justify-center rounded-full border border-black/[0.08]"
          >
            <Sparkles
              className="size-4"
              style={{ color: VIOLET }}
              fill="#6366f1"
              strokeWidth={1.5}
            />
          </button>
          <MoreButton />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {STATS.map((s) => (
          <div key={s.label} className="min-w-0">
            <p className="min-h-[2.5em] text-[11px] leading-tight" style={muted}>
              {s.label} net cash flow
            </p>
            <Num
              value={s.value}
              className="mt-1 block text-[17px] font-semibold tracking-[-0.02em]"
            />
            <div className="mt-1 flex flex-wrap items-center gap-x-1 gap-y-0.5">
              <UpPill value={s.delta} />
              <span className="text-[10px]" style={muted}>
                {s.vs}
              </span>
            </div>
          </div>
        ))}
      </div>
      <ChartSlot height={HEIGHT} className="-mx-5 mt-2">
        <Chart
          definition={definition}
          renderer={renderer}
          height={HEIGHT}
          ariaLabel={`Net cash flow for ${region?.name ?? ""}, widening from weekly to yearly`}
        />
        <PlotOverlay margin={MARGIN}>
          {CHECKPOINTS.map((x, i) => (
            <Bubble
              key={x}
              left={x * 100}
              top={50}
              dark
              className="-translate-y-1/2 !rounded-full !px-2.5 !py-1 text-[12px] font-medium"
            >
              <Num value={region?.values[i] ?? 0} />
            </Bubble>
          ))}
        </PlotOverlay>
      </ChartSlot>
      <div className="mt-3 text-[12px]" onMouseLeave={() => pin(null)}>
        <div
          className="grid grid-cols-[1.25fr_1fr_1fr_1fr] border-b pb-2"
          style={{ borderColor: GRID, ...muted }}
        >
          <span>Region</span>
          <span>Weekly</span>
          <span>Monthly</span>
          <span>Yearly</span>
        </div>
        {REGIONS.map((r, i) => (
          <button
            key={r.name}
            type="button"
            onMouseEnter={() => pin(i)}
            className="relative grid w-full grid-cols-[1.25fr_1fr_1fr_1fr] border-b py-2.5 text-left tabular-nums last:border-b-0"
            style={{ borderColor: GRID, color: i === active ? INK : "#55555d" }}
          >
            {i === active ? (
              <motion.span
                layoutId={`${id}-row`}
                transition={SPRING}
                className="absolute inset-y-1 -inset-x-2 rounded-lg bg-[#f4f6fb]"
              />
            ) : null}
            <span className="relative truncate pr-1">{r.name}</span>
            {r.values.map((v) => (
              <span key={v} className={`relative ${i === active ? "font-semibold" : ""}`}>
                {usd(v)}
              </span>
            ))}
          </button>
        ))}
      </div>
    </Card>
  );
};
