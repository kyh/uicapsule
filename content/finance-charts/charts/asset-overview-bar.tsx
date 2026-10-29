"use client";

import { barY, defineChart, stack } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react/core";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { useMemo } from "react";

import { rng, usd } from "../lib/data";
import { Card, ChartSlot, MoreButton, Num, Segmented, renderer, useCycle } from "../lib/kit";
import { GRID, MUTED, THEME } from "../lib/tokens";

const BARS = 42;
const HEIGHT = 168;
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const PER_DAY = BARS / DAYS.length;
const RANGES = ["Week", "Month", "Year"] as const;
const TOTALS: [number, number][] = [
  [12_350, 4761],
  [48_920, 17_305],
  [563_180, 208_442],
];

const BLUE_BAR = "#2f8cf7";
const ORANGE_BAR = "#fb8c5a";

interface Row {
  i: number;
  kind: "funds" | "stocks";
  value: number;
}

// A busy Monday that cools through the week, with a mid-week spike — the shape
// of the source — reseeded per range so the bars visibly re-settle.
const build = (seed: number): Row[] => {
  const r = rng(seed);
  const rows: Row[] = [];
  for (let i = 0; i < BARS; i += 1) {
    const day = i / PER_DAY;
    const pulse = 0.35 + 0.65 * Math.exp(-day * 0.55);
    const spike = Math.exp(-((day - 2.2 - r() * 0.4) ** 2) * 6) * 0.5;
    const funds = Math.max(0.08, (pulse * 0.75 + spike) * (0.45 + r() * 0.7));
    const stocks = 0.05 + r() * (r() < 0.25 ? 0.22 : 0.07);
    rows.push({ i, kind: "funds", value: funds }, { i, kind: "stocks", value: stocks });
  }
  const peak = Math.max(
    ...Array.from({ length: BARS }, (_, i) =>
      rows.filter((row) => row.i === i).reduce((sum, row) => sum + row.value, 0),
    ),
  );
  return rows.map((row) => ({ ...row, value: row.value / peak }));
};

const DATA = [build(91), build(92), build(93)];
const EMPTY: Row[] = [];
// build() normalises every range to the same peak, so one ceiling fits all.
const TOP = 1.02;

export const AssetOverviewBar = () => {
  const [range, pin] = useCycle(RANGES.length, 3000);
  const rows = DATA[range] ?? EMPTY;
  const [funds, stocks] = TOTALS[range] ?? [0, 0];

  const definition = useMemo(
    () =>
      defineChart({
        gradients: [
          {
            id: "aob-funds",
            stops: [
              { color: "#cfe5ff", offset: 0 },
              { color: "#0f74f0", offset: 1 },
            ],
            y1: 0,
            y2: 1,
          },
          {
            id: "aob-stocks",
            stops: [
              { color: "#fdb48c", offset: 0 },
              { color: "#fde1cf", offset: 1 },
            ],
            y1: 0,
            y2: 1,
          },
        ],
        margin: { bottom: 26, left: 0, right: 0, top: 4 },
        marks: [
          barY(rows, {
            fill: (d) => (d.kind === "funds" ? "url(#aob-funds)" : "url(#aob-stocks)"),
            inset: 0.5,
            key: (d) => `${d.kind}-${d.i}`,
            layout: stack({ order: ["funds", "stocks"] }),
            radius: { end: 2.5, stack: "each" },
            x: "i",
            y: "value",
            z: "kind",
          }),
        ],
        scales: {
          x: {
            axis: {
              line: false,
              tickLabels: { fontSize: 12 },
              ticks: {
                format: (v: number) => DAYS[Math.floor(v / PER_DAY)] ?? "",
                size: 0,
                values: DAYS.map((_, d) => Math.floor(d * PER_DAY + PER_DAY / 2)),
              },
            },
            scale: scaleBand<number>()
              .domain(Array.from({ length: BARS }, (_, i) => i))
              .paddingInner(0.28)
              .paddingOuter(0),
          },
          y: { axis: false, scale: scaleLinear().domain([0, TOP]) },
        },
        theme: { ...THEME, muted: "#a1a1aa" },
      }),
    [rows],
  );

  return (
    <Card>
      <div className="flex items-start justify-between">
        <h3 className="text-[17px] font-semibold tracking-[-0.01em]">Asset Overview</h3>
        <MoreButton />
      </div>
      <Segmented options={RANGES} value={range} onChange={pin} className="mt-4" />
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-[12px]" style={{ color: MUTED }}>
            <span className="h-1 w-3.5 rounded-full" style={{ backgroundColor: BLUE_BAR }} />
            Mutual Funds
          </p>
          <Num
            value={funds}
            format={(n) => usd(n, true)}
            className="text-[24px] font-bold tracking-[-0.03em]"
          />
        </div>
        <div>
          <p className="flex items-center gap-1.5 text-[12px]" style={{ color: MUTED }}>
            <span className="h-1 w-3.5 rounded-full" style={{ backgroundColor: ORANGE_BAR }} />
            Stocks
          </p>
          <Num
            value={stocks}
            format={(n) => usd(n, true)}
            className="text-[24px] font-bold tracking-[-0.03em]"
          />
        </div>
      </div>
      <ChartSlot height={HEIGHT} className="mt-3">
        <Chart
          definition={definition}
          renderer={renderer}
          height={HEIGHT}
          ariaLabel="Mutual funds and stocks activity across the week"
        />
      </ChartSlot>
      <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#fbd5c0] bg-[#fff6f1] px-3 py-2.5 text-[12px]">
        <Sparkles className="size-3.5 shrink-0" style={{ color: ORANGE_BAR }} fill={ORANGE_BAR} />
        <p className="text-[#55555e]">
          <span className="font-semibold text-[#0b0b0f]">Insights:</span> High market activity
          driven by tech stocks.
        </p>
      </div>
      <button
        type="button"
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border py-2 text-[13px] text-[#3a3a42]"
        style={{ borderColor: GRID }}
      >
        See insight <ArrowUpRight className="size-3.5" style={{ color: MUTED }} />
      </button>
    </Card>
  );
};
