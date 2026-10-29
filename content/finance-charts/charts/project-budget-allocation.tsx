"use client";

import { areaY, defineChart, link, rect, ruleX } from "@tanstack/charts";
import { d3Curve } from "@tanstack/charts/d3/shape";
import { Chart } from "@tanstack/charts/react/core";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { curveMonotoneX } from "d3-shape";
import { ArrowUp } from "lucide-react";
import { useMemo } from "react";

import { usd } from "../lib/data";
import {
  Bubble,
  Card,
  ChartSlot,
  MoreButton,
  Num,
  PlotOverlay,
  renderer,
  useCycle,
} from "../lib/kit";
import { GREEN, GRID, MUTED, THEME } from "../lib/tokens";

const PHASES = [
  { amount: 27_600, label: "Research & UI/UX" },
  { amount: 17_650, label: "Frontend Dev" },
  { amount: 10_700, label: "Backend & Infra" },
  { amount: 3300, label: "QA & Deployment" },
] as const;
const TOTAL = PHASES.reduce((s, p) => s + p.amount, 0);

const HEIGHT = 180;
const MARGIN = { bottom: 0, left: 0, right: 0, top: 6 };
const curve = d3Curve(curveMonotoneX);

// Three nested envelopes (committed, forecast, ceiling) that step down at each
// phase boundary with a soft shoulder rather than a cliff.
const LAYERS = [
  { id: "ceiling", levels: [0.95, 0.66, 0.4, 0.06], opacity: 0.26 },
  { id: "forecast", levels: [0.75, 0.53, 0.31, 0.06], opacity: 0.5 },
  { id: "committed", levels: [0.54, 0.39, 0.23, 0.06], opacity: 1 },
] as const;

const smooth = (t: number) => {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
};

const envelope = (levels: readonly number[], x: number) => {
  let y = levels[0] ?? 0;
  for (let k = 0; k < levels.length - 1; k += 1) {
    y += ((levels[k + 1] ?? 0) - (levels[k] ?? 0)) * smooth((x - (k + 0.55)) / 0.7);
  }
  return y;
};

const SAMPLES = Array.from({ length: 81 }, (_, i) => (i / 80) * PHASES.length);
const ROWS = LAYERS.flatMap((layer) =>
  SAMPLES.map((x) => ({ layer: layer.id, x, y: envelope(layer.levels, x) })),
);

export const ProjectBudgetAllocation = () => {
  const [hi, pin] = useCycle(PHASES.length, 2200);

  const definition = useMemo(
    () =>
      defineChart({
        gradients: LAYERS.map((layer) => ({
          id: `pba-${layer.id}`,
          stops: [
            { color: "#fb8c45", offset: 0, opacity: layer.opacity },
            { color: "#fba25c", offset: 0.35, opacity: layer.opacity },
            { color: "#f9c87a", offset: 0.58, opacity: layer.opacity },
            { color: "#c9bfa6", offset: 0.78, opacity: layer.opacity },
            { color: "#86bdf8", offset: 1, opacity: layer.opacity },
          ],
          x1: 0,
          x2: 1,
          y1: 0,
          y2: 0,
        })),
        guides: false,
        margin: MARGIN,
        marks: [
          ...LAYERS.map((layer) =>
            areaY(
              ROWS.filter((r) => r.layer === layer.id),
              {
                curve,
                fill: `url(#pba-${layer.id})`,
                fillOpacity: 1,
                x: "x",
                y1: 0,
                y2: "y",
              },
            ),
          ),
          // Phases not in focus sit under a white veil; the veil re-keys as
          // focus walks, so the lit phase fades up while the last one dims.
          rect(
            PHASES.map((p, i) => ({ id: p.label, x1: i, x2: i + 1, y1: 0, y2: 1 })).filter(
              (_, i) => i !== hi,
            ),
            {
              fill: "#ffffff",
              fillOpacity: 0.42,
              inset: 0,
              key: "id",
              x1: "x1",
              x2: "x2",
              y1: "y1",
              y2: "y2",
            },
          ),
          ruleX([1, 2, 3], { stroke: "#ffffff", strokeOpacity: 1, strokeWidth: 3 }),
          link(
            [
              { base: 0, color: "#fb8c45", id: "start", x: 0.012, y: 1.04 },
              { base: 0, color: "#2f7ff0", id: "end", x: PHASES.length - 0.012, y: 0.11 },
            ],
            {
              key: "id",
              lineCap: "butt",
              stroke: (d) => d.color,
              strokeWidth: 2,
              x1: "x",
              x2: "x",
              y1: "base",
              y2: "y",
            },
          ),
        ],
        scales: {
          x: { scale: scaleLinear().domain([0, PHASES.length]) },
          y: { scale: scaleLinear().domain([0, 1.04]) },
        },
        theme: THEME,
      }),
    [hi],
  );

  const phase = PHASES[hi] ?? PHASES[0];
  const peak = envelope(LAYERS[0].levels, hi + 0.3);

  return (
    <Card>
      <div className="flex items-start justify-between">
        <h3 className="text-[17px] font-semibold tracking-[-0.01em]">Project Budget Allocation</h3>
        <MoreButton />
      </div>
      <div className="mt-4 border-t pt-4" style={{ borderColor: GRID }}>
        <p className="text-[13px]" style={{ color: MUTED }}>
          Total Project Expenses
        </p>
        <Num value={TOTAL} className="text-[28px] font-bold tracking-[-0.03em]" />
        <p className="mt-1 flex items-center gap-2 text-[12px]" style={{ color: MUTED }}>
          <span
            className="inline-flex items-center gap-1 rounded-full bg-[#dcfce7] px-2 py-0.5 font-semibold"
            style={{ color: GREEN }}
          >
            <span
              className="inline-flex size-3 items-center justify-center rounded-full text-white"
              style={{ backgroundColor: GREEN }}
            >
              <ArrowUp className="size-2" strokeWidth={3.5} />
            </span>
            $16,375
          </span>
          vs last month
        </p>
      </div>
      <ChartSlot height={HEIGHT} className="mt-4">
        <div onMouseLeave={() => pin(null)}>
          <Chart
            definition={definition}
            renderer={renderer}
            height={HEIGHT}
            ariaLabel="Project budget by phase"
            onFocusChange={(p) => {
              const x = Number(p?.xValue);
              if (p && Number.isFinite(x)) {
                pin(Math.min(PHASES.length - 1, Math.max(0, Math.floor(x))));
              }
            }}
          />
        </div>
        <PlotOverlay margin={MARGIN}>
          <Bubble
            left={((hi + 0.5) / PHASES.length) * 100}
            top={Math.max(4, (1 - peak / 1.04) * 100 - 22)}
            className="!rounded-full !px-2 !py-0.5 text-[11px] font-semibold"
          >
            {(((phase?.amount ?? 0) / TOTAL) * 100).toFixed(1)}%
          </Bubble>
        </PlotOverlay>
      </ChartSlot>
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
        {PHASES.map((p, i) => (
          <div key={p.label}>
            <p
              className="text-[12px] transition-colors"
              style={{ color: i === hi ? "#3a3a42" : MUTED }}
            >
              {p.label}
            </p>
            <Num
              value={p.amount}
              format={(n) => usd(n)}
              className="text-[17px] font-semibold tracking-[-0.02em]"
            />
          </div>
        ))}
      </div>
    </Card>
  );
};
