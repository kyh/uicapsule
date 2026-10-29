"use client";

import { barX, defineChart, dot, lineY, rect, ruleY } from "@tanstack/charts";
import { d3Curve } from "@tanstack/charts/d3/shape";
import { Chart } from "@tanstack/charts/react/core";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { curveMonotoneX } from "d3-shape";
import { CircleHelp, EllipsisVertical, Info, Maximize, Minus, Plus, RefreshCw } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { compact, rng, walk } from "../lib/data";
import { Card, ChartSlot, Num, Segmented, renderer, useCycle } from "../lib/kit";
import { GREEN, MUTED, RED } from "../lib/tokens";

const LINE = "#16a34a";
const N = 120;
// The price line spans x 0…92; the liquidity histogram owns the strip to 100.
const LINE_END = 92;
const DAYS = ["Fri", "Sat", "Sun", "Mon", "Tue", "Wed", "Thu"] as const;
const RANGES = ["Week", "Month", "Year"] as const;

interface Range {
  current: number;
  floor: number;
  high: number;
  low: number;
  peak: number;
  seed: number;
}
const SPECS: readonly Range[] = [
  { current: 15_000, floor: 10_600, high: 20_000, low: 10_000, peak: 21_600, seed: 5 },
  { current: 13_400, floor: 8200, high: 17_500, low: 9000, peak: 19_200, seed: 17 },
  { current: 16_800, floor: 6400, high: 22_500, low: 7500, peak: 23_400, seed: 29 },
];

/** A random walk rescaled into [floor, peak] that ends on `current`. */
const priceLine = ({ current, floor, peak, seed }: Range) => {
  const raw = walk(N, seed, { start: 0, vol: 6 });
  const lo = Math.min(...raw);
  const hi = Math.max(...raw);
  const end = raw.at(-1) ?? 0;
  return raw.map((v, i) => {
    const scaled = floor + ((v - lo) / (hi - lo || 1)) * (peak - floor);
    // Ease the tail onto the current price so the end dot sits on the dashed rule.
    const pull = Math.max(0, (i - (N - 18)) / 17);
    const target = floor + ((end - lo) / (hi - lo || 1)) * (peak - floor);
    return { i, value: scaled + (current - target) * pull, x: (i / (N - 1)) * LINE_END };
  });
};

const LEVEL_STEP = 300;
const LEVELS = Array.from({ length: 72 }, (_, k) => 3600 + k * LEVEL_STEP);
/** Liquidity depth per price level: dense around the current price. */
const depth = ({ current, seed }: Range) => {
  const r = rng(seed * 31);
  return LEVELS.map((y) => {
    const near = Math.exp(-(((y - current + 2200) / 4200) ** 2));
    return { len: (0.12 + 0.88 * near) * (0.35 + 0.65 * r()) * 9, y };
  });
};

const DATA = SPECS.map((spec) => ({ depth: depth(spec), line: priceLine(spec), spec }));
const [FIRST] = DATA;

const MIN = 3000;
const MAX = 26_000;
const MARGIN = { bottom: 26, left: 0, right: 40, top: 6 };
const HEIGHT = 210;
const smooth = d3Curve(curveMonotoneX);

const RoundButton = ({ icon: Icon, size = 30 }: { icon: LucideIcon; size?: number }) => (
  <button
    type="button"
    aria-label="Chart control"
    className="inline-flex shrink-0 items-center justify-center rounded-full bg-white text-[#3a3a42] ring-1 ring-black/[0.08]"
    style={{ height: size, width: size }}
  >
    <Icon className="size-3.5" />
  </button>
);

const Coin = ({
  glyph,
  color,
  className,
}: {
  glyph: string;
  color: string;
  className?: string;
}) => (
  <span
    className={`inline-flex size-7 items-center justify-center rounded-full text-[14px] font-bold text-white ring-2 ring-white ${className ?? ""}`}
    style={{ background: color }}
  >
    {glyph}
  </span>
);

const PriceBox = ({ label, value, change }: { label: string; value: number; change: number }) => (
  <div className="flex-1 rounded-[14px] bg-[#f4f4f6] p-3">
    <p className="text-[11.5px]" style={{ color: MUTED }}>
      {label}
    </p>
    <p className="mt-1 flex items-baseline gap-1">
      <Num value={value} className="text-[16px] font-bold tracking-[-0.02em]" />
    </p>
    <div className="mt-1.5 flex items-center justify-between">
      <span className="text-[11px] font-medium" style={{ color: change >= 0 ? GREEN : RED }}>
        {change >= 0 ? "+" : ""}
        {change.toFixed(2)}%
      </span>
      <span className="flex gap-1">
        <RoundButton icon={Plus} size={24} />
        <RoundButton icon={Minus} size={24} />
      </span>
    </div>
  </div>
);

const PriceRangeBody = () => {
  const [pair, setPair] = useState(0);
  const [range, pin] = useCycle(RANGES.length, 3200);
  const {
    depth: levels,
    line,
    spec,
  } = DATA[range] ?? FIRST ?? { depth: [], line: [], spec: SPECS[0] };
  const { current = 0, high = 0, low = 0 } = spec ?? {};
  const last = line.at(-1);

  const definition = useMemo(
    () =>
      defineChart({
        margin: MARGIN,
        marks: [
          ruleY([MAX - 1000, MIN + 800], { stroke: "#ececf0", strokeOpacity: 1 }),
          rect([{ high, low }], {
            fill: LINE,
            fillOpacity: 0.08,
            inset: 0,
            key: () => "band",
            x1: () => 0,
            x2: () => 100,
            y1: "low",
            y2: "high",
          }),
          ruleY([current], { stroke: "#b4b4bb", strokeDasharray: "4 4", strokeOpacity: 1 }),
          barX(levels, {
            fill: (d) => (d.y >= low && d.y <= high ? LINE : "#dcdce0"),
            key: "y",
            x1: (d) => 100 - d.len,
            x2: () => 100,
            y: "y",
          }),
          lineY(line, {
            curve: smooth,
            key: "i",
            stroke: LINE,
            strokeWidth: 2,
            x: "x",
            y: "value",
          }),
          dot(last ? [last] : [], {
            fill: LINE,
            fillOpacity: 0.18,
            key: () => "halo",
            r: 8,
            x: "x",
            y: "value",
          }),
          dot(last ? [last] : [], {
            fill: LINE,
            key: () => "now",
            r: 3.5,
            stroke: "#ffffff",
            strokeWidth: 1.5,
            x: "x",
            y: "value",
          }),
        ],
        motion: { path: "morph" },
        scales: {
          x: {
            axis: {
              line: false,
              tickLabels: { fontSize: 11 },
              ticks: {
                format: (v) => DAYS[Math.round((Number(v) - 4) / 13)] ?? "",
                size: 0,
                values: DAYS.map((_, k) => 4 + k * 13),
              },
            },
            scale: scaleLinear().domain([0, 100]),
          },
          y: {
            axis: {
              line: false,
              tickLabels: { fontSize: 11 },
              ticks: {
                format: (v) => compact(v),
                padding: 8,
                size: 0,
                values: [5000, 10_000, 15_000, 20_000, 25_000],
              },
            },
            scale: scaleLinear().domain([MIN, MAX]),
            side: "right",
          },
        },
        theme: { muted: "#a1a1aa" },
      }),
    [levels, line, last, current, high, low],
  );

  return (
    <>
      <div className="rounded-[18px] bg-white px-3.5 py-3 ring-1 ring-black/[0.04]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex">
              <Coin glyph="Ξ" color="linear-gradient(160deg,#8a9cf5,#5b6fe6)" />
              <Coin glyph="₿" color="linear-gradient(160deg,#fbb44a,#f7931a)" className="-ml-2" />
            </span>
            <h3 className="text-[15px] font-semibold">ETH/BTC</h3>
            <Info className="size-3.5" style={{ color: MUTED }} />
          </div>
          <Segmented options={["ETH", "BTC"]} value={pair} onChange={setPair} size="sm" />
        </div>
        <div className="mt-2 flex gap-1.5 text-[11px] text-[#55555e]">
          {["0.3% fee", "Version 4", "79% select"].map((t) => (
            <span key={t} className="rounded-full bg-[#f0f0f2] px-2 py-0.5">
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-1.5 rounded-[18px] bg-white ring-1 ring-black/[0.04]">
        <div className="flex items-center justify-between gap-2 border-b border-[#ececf0] px-3.5 py-3">
          <h3 className="flex items-center gap-1.5 text-[16px] font-semibold tracking-[-0.01em]">
            Price range <CircleHelp className="size-3.5" style={{ color: MUTED }} />
          </h3>
          <div className="flex items-center gap-1.5">
            <Segmented options={RANGES} value={range} onChange={pin} size="sm" />
            <RoundButton icon={RefreshCw} size={26} />
          </div>
        </div>
        <div className="px-3.5 pt-3 pb-3.5">
          <div className="flex items-center justify-between">
            <span className="flex gap-1">
              <RoundButton icon={Plus} size={26} />
              <RoundButton icon={Minus} size={26} />
            </span>
            <span className="text-[11px] font-medium tracking-[0.06em] text-[#55555e]">
              EXPONENTA
            </span>
            <span className="flex gap-1">
              <RoundButton icon={Maximize} size={26} />
              <RoundButton icon={EllipsisVertical} size={26} />
            </span>
          </div>
          <ChartSlot height={HEIGHT} className="mt-2">
            <Chart
              definition={definition}
              renderer={renderer}
              height={HEIGHT}
              ariaLabel="ETH/BTC price with the selected range and liquidity depth"
            />
          </ChartSlot>
          <div className="mt-3 flex gap-2">
            <PriceBox label="Low price" value={low} change={(low / current - 1) * 100} />
            <PriceBox label="High price" value={high} change={(high / current - 1) * 100} />
          </div>
        </div>
      </div>
    </>
  );
};

// `useCycle` reads the card's in-view state, so the body renders inside <Card>.
export const PriceRange = () => (
  <Card className="!bg-[#f4f4f6] !p-1.5">
    <PriceRangeBody />
  </Card>
);
