"use client";

import { defineChart, link, rect, text } from "@tanstack/charts";
import { d3Curve } from "@tanstack/charts/d3/shape";
import { sankeyDiagram } from "@tanstack/charts/network/sankey";
import { Chart } from "@tanstack/charts/react/core";
import { curveBumpX } from "d3-shape";
import { ChartPie, ChevronDown } from "lucide-react";
import { useMemo } from "react";

import {
  Bubble,
  Card,
  ChartSlot,
  Label,
  Legend,
  MoreButton,
  Num,
  PlotOverlay,
  renderer,
  useCycle,
} from "../lib/kit";
import { MUTED, THEME } from "../lib/tokens";

interface Node {
  id: string;
  label: string;
  color: string;
}

interface Flow {
  id: string;
  source: string;
  target: string;
  value: number;
}

const NODES: Node[] = [
  { color: "#93c5fd", id: "eq", label: "Equities" },
  { color: "#fdba8c", id: "cash", label: "Cash Equivalents" },
  { color: "#0a84ff", id: "fi", label: "Fixed Income" },
  { color: "#f97316", id: "re", label: "Real estate" },
  { color: "#fbbf24", id: "co", label: "Commodities" },
];

// Input order is deliberate: with `linkSort: null` each node stacks its links
// in this order, which reproduces the source's crossing pattern.
const FLOWS: Flow[] = [
  { id: "cash-re", source: "cash", target: "re", value: 107.7 },
  { id: "eq-fi-a", source: "eq", target: "fi", value: 165.7 },
  { id: "eq-re", source: "eq", target: "re", value: 101.5 },
  { id: "eq-co", source: "eq", target: "co", value: 64.2 },
  { id: "eq-fi-b", source: "eq", target: "fi", value: 186.4 },
  { id: "cash-co", source: "cash", target: "co", value: 62.1 },
];

const TOTAL = FLOWS.reduce((s, f) => s + f.value, 0);
const nodeOf = new Map(NODES.map((n) => [n.id, n]));
const totalOf = (id: string, side: "source" | "target") =>
  FLOWS.filter((f) => f[side] === id).reduce((s, f) => s + f.value, 0);

const HEIGHT = 270;
const MARGIN = { bottom: 0, left: 0, right: 0, top: 0 };
const NODE_W = 34;
const curve = d3Curve(curveBumpX);

// Sequence the walk through the crossing flows first — they're the story.
const ORDER = ["eq-re", "cash-re", "eq-co", "eq-fi-b", "cash-co", "eq-fi-a"];

export const AssetAllocation = () => {
  const [hi, pin] = useCycle(ORDER.length, 2300);
  const focus = FLOWS.find((f) => f.id === ORDER[hi]) ?? FLOWS[0];

  const definition = useMemo(
    () =>
      defineChart({
        color: { domain: NODES.map((n) => n.id), range: NODES.map((n) => n.color) },
        gradients: NODES.map((n) => ({
          id: `aa-${n.id}`,
          stops: [
            { color: n.color, offset: 0, opacity: 0.12 },
            { color: n.color, offset: 1, opacity: 0.62 },
          ],
          x1: 0,
          x2: 1,
          y1: 0,
          y2: 0,
        })),
        guides: false,
        margin: MARGIN,
        marks: [
          sankeyDiagram({
            align: "justify",
            iterations: 0,
            linkKey: "id",
            linkSort: null,
            links: FLOWS,
            marks: ({ nodes, links }) =>
              [
                link(links, {
                  curve,
                  key: "key",
                  lineCap: "butt",
                  stroke: (l) => `url(#aa-${l.targetKey})`,
                  strokeOpacity: (l) => (l.key === focus?.id ? 1 : 0.55),
                  strokeWidth: (l) => Math.max(1, l.width - 1.5),
                  x1: "x1",
                  x2: "x2",
                  y1: "y1",
                  // A hair of slope so a perfectly level flow keeps a
                  // non-degenerate bounding box for its gradient.
                  y2: (l) => l.y2 + 0.01,
                }),
                rect(nodes, {
                  color: (n) => n.data.id,
                  inset: 0,
                  key: "key",
                  radius: 6,
                  x1: "x0",
                  x2: "x1",
                  y1: "y0",
                  y2: "y1",
                }),
                rect(nodes, {
                  fill: "#000000",
                  fillOpacity: 0.16,
                  inset: 0,
                  key: "key",
                  radius: 4,
                  x1: (n) => n.x0 + 3,
                  x2: (n) => n.x1 - 3,
                  y1: (n) => n.y0 + 4,
                  y2: (n) => n.y0 + 20,
                }),
                text(nodes, {
                  fill: "#ffffff",
                  fontSize: 10.5,
                  fontWeight: 600,
                  key: "key",
                  text: (n) => `${Math.round((n.value / TOTAL) * 100)}%`,
                  x: "x",
                  y: (n) => n.y0 + 12,
                }),
                text(links, {
                  anchor: "start",
                  fill: "#3a3a42",
                  fontSize: 11,
                  key: "key",
                  text: (l) => `$${l.value}M`,
                  x: (l) => l.x1 + 6,
                  y: (l) => l.y1,
                }),
                text(links, {
                  anchor: "end",
                  fill: "#55555e",
                  fontSize: 11,
                  key: "key",
                  text: (l) =>
                    `${Math.round((l.value / totalOf(String(l.targetKey), "target")) * 100)}%`,
                  x: (l) => l.x2 - 6,
                  y: (l) => l.y2,
                }),
              ] as const,
            nodeKey: "id",
            nodePadding: 6,
            nodeSort: null,
            nodeWidth: NODE_W,
            nodes: NODES,
            source: "source",
            target: "target",
            value: "value",
          }),
        ],
        scales: { x: null, y: null },
        theme: THEME,
      }),
    [focus],
  );

  const src = nodeOf.get(focus?.source ?? "");
  const dst = nodeOf.get(focus?.target ?? "");
  const outShare = focus ? (focus.value / totalOf(focus.source, "source")) * 100 : 0;
  const inShare = focus ? (focus.value / totalOf(focus.target, "target")) * 100 : 0;

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-2.5">
          <span
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-[11px] text-white"
            style={{
              background: "linear-gradient(160deg, #3b9bff, #0a6cff)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35), 0 4px 10px -4px #0a6cff",
            }}
          >
            <ChartPie className="size-[18px]" strokeWidth={2.6} />
          </span>
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold tracking-[-0.01em]">
              Asset allocation <span style={{ color: MUTED }}>/ $M</span>
            </h3>
            <p className="mt-0.5 text-[12px] leading-snug" style={{ color: MUTED }}>
              Strategic asset allocation approach to optimize portfolio distribution
            </p>
          </div>
        </div>
        <MoreButton />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <Label>Allocated</Label>
          <Num
            value={687.6}
            format={(n) => `$${n.toFixed(2)}M`}
            className="text-[24px] font-bold tracking-[-0.03em]"
          />
        </div>
        <div>
          <Label>Total value locked</Label>
          <Num
            value={687.6}
            format={(n) => `$${n.toFixed(2)}M`}
            className="text-[24px] font-bold tracking-[-0.03em]"
          />
        </div>
      </div>

      <ChartSlot height={HEIGHT} className="mt-4">
        <div onMouseLeave={() => pin(null)}>
          <Chart
            definition={definition}
            renderer={renderer}
            height={HEIGHT}
            ariaLabel="Asset allocation flows from equities and cash into fixed income, real estate and commodities"
            onFocusChange={(p) => {
              // Scene keys are scoped under the Sankey mark and end in the link key.
              const i = p ? ORDER.findIndex((id) => p.key.endsWith(id)) : -1;
              if (i !== -1) {
                pin(i);
              }
            }}
          />
        </div>
        <PlotOverlay margin={MARGIN}>
          <Bubble left={50} top={30} dark className="!rounded-2xl !px-3 !py-2 text-[11px]">
            <div className="flex items-center justify-between gap-5">
              <span className="inline-flex items-center gap-1.5 text-white/80">
                <span className="size-2 rounded-full" style={{ backgroundColor: src?.color }} />
                {src?.label}
              </span>
              <span className="font-semibold tabular-nums">-{outShare.toFixed(0)}%</span>
            </div>
            <div className="my-1 flex items-center gap-1.5 pl-0.5 text-white/70">
              <ChevronDown className="size-3" />
              <span className="tabular-nums">${focus?.value}M</span>
            </div>
            <div className="flex items-center justify-between gap-5">
              <span className="inline-flex items-center gap-1.5 text-white/80">
                <span className="size-2 rounded-full" style={{ backgroundColor: dst?.color }} />
                {dst?.label}
              </span>
              <span className="font-semibold tabular-nums">+{inShare.toFixed(0)}%</span>
            </div>
          </Bubble>
        </PlotOverlay>
      </ChartSlot>

      <Legend
        className="mt-4"
        items={[
          { color: "#0a84ff", label: "Fixed Income" },
          { color: "#f97316", label: "Real estate" },
          { color: "#93c5fd", label: "Equities" },
          { color: "#fdba8c", label: "Cash Equivalents" },
          { color: "#fbbf24", label: "Commodities" },
        ]}
      />
    </Card>
  );
};
