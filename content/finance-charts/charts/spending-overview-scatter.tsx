"use client";

import { d3Curve, defineChart, lineY, rect } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react/core";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { curveMonotoneX } from "d3-shape";
import { ArrowUpRight } from "lucide-react";
import { useMemo } from "react";

import { MONTHS, rng, usd } from "../lib/data";
import { Bubble, Card, ChartSlot, Num, PlotOverlay, renderer, useCycle } from "../lib/kit";
import { GRID, MUTED, ORANGE, THEME } from "../lib/tokens";

const COLS = 24;
const ROWS = 16;
const TOP = 4000;
const STEP = TOP / ROWS;
const SPAN = MONTHS.slice(0, 7);
const PER = COLS / SPAN.length;

const MARGIN = { bottom: 26, left: 44, right: 0, top: 4 };
const HEIGHT = 228;

const SERIES = [
  { color: "#bcdcfd", id: "income", label: "Income" },
  { color: "#5ea8f7", id: "expenses", label: "Expenses" },
  { color: "#0a6edb", id: "investment", label: "Investment" },
] as const;
type SeriesId = (typeof SERIES)[number]["id"];

/** The trend the scatter rides: $400 in January, $4,000 by the end of July. */
const trend = (x: number) => 400 * 10 ** (x / COLS);

interface Cell {
  id: string;
  c: number;
  r: number;
}

const grid: Cell[] = [];
for (let c = 0; c < COLS; c += 1) {
  for (let r = 0; r < ROWS; r += 1) {
    grid.push({ c, id: `${c}-${r}`, r });
  }
}

interface Hit extends Cell {
  series: SeriesId;
}

const hits: Hit[] = (() => {
  const rand = rng(712);
  const out: Hit[] = [];
  const seen = new Set<string>();
  for (let c = 0; c < COLS; c += 1) {
    const count = rand() > 0.4 ? 2 : 1;
    for (let k = 0; k < count; k += 1) {
      const base = trend(c + 0.5) / STEP;
      const r = Math.max(0, Math.min(ROWS - 1, Math.round(base + (rand() - 0.5) * 6)));
      const id = `${c}-${r}`;
      if (!seen.has(id)) {
        seen.add(id);
        out.push({ c, id, r, series: SERIES[Math.floor(rand() * 3)]?.id ?? "income" });
      }
    }
  }
  return out;
})();

const curve = Array.from({ length: COLS * 2 + 1 }, (_, i) => ({ x: i / 2, y: trend(i / 2) }));

const totals = SPAN.map((_, i) => {
  const rand = rng(90 + i);
  const scale = 0.55 + i * 0.12;
  return {
    expenses: (900 + rand() * 500) * scale,
    income: (1400 + rand() * 600) * scale,
    investment: (650 + rand() * 400) * scale,
  };
});

const FULL = ["January", "February", "March", "April", "May", "June", "July"] as const;

const SpendingOverviewScatterBody = () => {
  const [month, pin] = useCycle(SPAN.length, 2300, 2);
  const values = totals[month] ?? totals[0];

  const definition = useMemo(
    () =>
      defineChart({
        clip: true,
        margin: MARGIN,
        marks: [
          rect([{ id: "hl", m: month }], {
            fill: "#fff1e6",
            id: "highlight",
            inset: 0,
            key: "id",
            radius: 4,
            x1: (d) => d.m * PER,
            x2: (d) => (d.m + 1) * PER,
            y1: () => 0,
            y2: () => TOP,
          }),
          rect(grid, {
            fill: "#14141f",
            fillOpacity: 0.04,
            id: "grid",
            inset: 1.6,
            key: "id",
            radius: 3,
            x: (d) => d.c + 0.5,
            x1: "c",
            x2: (d) => d.c + 1,
            y1: (d) => d.r * STEP,
            y2: (d) => (d.r + 1) * STEP,
          }),
          ...SERIES.map((s) =>
            rect(
              hits.filter((h) => h.series === s.id),
              {
                fill: s.color,
                id: s.id,
                inset: 1.6,
                key: "id",
                radius: 3,
                x: (d) => d.c + 0.5,
                x1: "c",
                x2: (d) => d.c + 1,
                y1: (d) => d.r * STEP,
                y2: (d) => (d.r + 1) * STEP,
              },
            ),
          ),
          lineY(curve, {
            curve: d3Curve(curveMonotoneX),
            id: "trend",
            stroke: ORANGE,
            strokeDasharray: "5 5",
            strokeWidth: 2,
            x: "x",
            y: "y",
          }),
        ],
        scales: {
          x: {
            axis: {
              line: false,
              tickLabels: {
                fontSize: 12,
                fontWeight: (c) => (Math.floor(c.value / PER) === month ? 700 : 400),
              },
              ticks: {
                format: (v: number) => SPAN[Math.floor(v / PER)] ?? "",
                padding: 8,
                size: 0,
                values: SPAN.map((_, i) => (i + 0.5) * PER),
              },
            },
            scale: scaleLinear().domain([0, COLS]),
          },
          y: {
            axis: {
              line: false,
              tickLabels: { fontSize: 12 },
              ticks: {
                format: (v: number) => `$${v}`,
                padding: 8,
                size: 0,
                values: [0, 1000, 2000, 3000, 4000],
              },
            },
            scale: scaleLinear().domain([0, TOP]),
          },
        },
        theme: THEME,
      }),
    [month],
  );

  const right = month <= 2;

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[17px] font-semibold tracking-[-0.01em]">Spending Overview</h3>
          <p className="mt-0.5 text-[12px]" style={{ color: MUTED }}>
            Track your spending pattern and stay in control
          </p>
        </div>
        <button
          type="button"
          aria-label="Open"
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-black/[0.08] text-[#8a8a93]"
        >
          <ArrowUpRight className="size-4" />
        </button>
      </div>
      <ChartSlot height={HEIGHT} className="mt-4">
        <div onMouseLeave={() => pin(null)}>
          <Chart
            definition={definition}
            renderer={renderer}
            height={HEIGHT}
            ariaLabel="Monthly income, expenses and investment as a dot grid"
            onFocusChange={(p) => {
              const x = Number(p?.xValue);
              if (p && Number.isFinite(x)) {
                pin(Math.min(SPAN.length - 1, Math.floor(x / PER)));
              }
            }}
          />
        </div>
        <PlotOverlay margin={MARGIN}>
          <Bubble
            left={((right ? month + 1 : month) / SPAN.length) * 100}
            top={6}
            align={right ? "left" : "right"}
            dark
            className={`${right ? "ml-1" : "-ml-1"} !rounded-[12px] !p-0 text-[11px]`}
          >
            <p className="border-b border-white/10 px-2.5 py-1.5 text-white/80">
              {`${FULL[month] ?? ""}, 2026`}
            </p>
            <div className="space-y-1 px-2.5 py-1.5">
              {SERIES.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-4">
                  <span className="inline-flex items-center gap-1.5 text-white/70">
                    <span className="size-2 rounded-full" style={{ backgroundColor: s.color }} />
                    {s.label}
                  </span>
                  <span className="font-semibold tabular-nums">{usd(values?.[s.id] ?? 0)}</span>
                </div>
              ))}
            </div>
          </Bubble>
        </PlotOverlay>
      </ChartSlot>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {SERIES.map((s) => (
          <div
            key={s.id}
            className="rounded-[14px] border bg-[#f7f7f8] px-2.5 py-2"
            style={{ borderColor: GRID }}
          >
            <p className="inline-flex items-center gap-1.5 text-[11px]" style={{ color: MUTED }}>
              <span className="size-2 rounded-full" style={{ backgroundColor: s.color }} />
              {s.label}
            </p>
            <Num
              value={values?.[s.id] ?? 0}
              className="mt-0.5 block text-[14px] font-semibold tracking-[-0.01em]"
            />
          </div>
        ))}
      </div>
    </>
  );
};

// The cycle, count-ups and chart mount read the card's in-view state, so the
// body renders inside <Card> rather than beside it.
export const SpendingOverviewScatter = () => (
  <Card>
    <SpendingOverviewScatterBody />
  </Card>
);
