"use client";

import { defineChart, rect, ruleX } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react/core";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { Ellipsis } from "lucide-react";
import { useMemo, useState } from "react";

import { compact, MONTHS, rng, usd } from "../lib/data";
import {
  Bubble,
  Card,
  ChartSlot,
  Legend,
  Num,
  PlotOverlay,
  Segmented,
  renderer,
  useCycle,
} from "../lib/kit";
import { BLUE, INK, MUTED, THEME } from "../lib/tokens";

const ROWS = 12;
const HEIGHT = 196;
const MARGIN = { bottom: 26, left: 40, right: 0, top: 6 };
const IN_COLOR = "#e5e5e9";
const EMPTY = "#f5f5f7";
const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface Range {
  name: string;
  cols: number;
  /** $ per cell row. */
  step: number;
  seed: number;
  total: number;
  /** Tick columns and their labels. */
  ticks: [number, string][];
  period: (col: number) => string;
}

const RANGES: Range[] = [
  {
    cols: 7,
    name: "Week",
    period: (c) => `${WEEK[c]}, Oct ${19 + c}, 2026`,
    seed: 3,
    step: 500,
    ticks: WEEK.map((d, i) => [i, d]),
    total: 1742.18,
  },
  {
    cols: 15,
    name: "Month",
    period: (c) => `Oct ${1 + c * 2} – ${Math.min(31, 2 + c * 2)}, 2026`,
    seed: 11,
    step: 1000,
    ticks: [0, 3, 6, 9, 12].map((c) => [c, `Oct ${1 + c * 2}`]),
    total: 9408.66,
  },
  {
    cols: 24,
    name: "Year",
    period: (c) => {
      const m = Math.floor(c / 2);
      const month = MONTHS[m] ?? "";
      return c % 2 === 0 ? `${month} 1 – 15, 2026` : `${month} 16 – ${MONTH_DAYS[m] ?? 30}, 2026`;
    },
    seed: 29,
    step: 50_000 / ROWS,
    ticks: MONTHS.map((m, i) => [i * 2, m]),
    total: 63_984.02,
  },
];

const flows = (range: Range) => {
  const r = rng(range.seed);
  return Array.from({ length: range.cols }, (_, col) => {
    const out = range.step * (0.7 + r() * 3.1);
    const swell = Math.sin((col / range.cols) * Math.PI) * 4;
    const inflow = range.step * (1.2 + swell + r() * 4.2);
    return { col, inflow, out };
  });
};

const DATA = RANGES.map(flows);

const FinancialTrendsBody = () => {
  const [range, setRange] = useState(2);
  const meta = RANGES[range] ?? RANGES[2];
  const cols = meta?.cols ?? 24;
  const step = meta?.step ?? 1;
  const [hi, pin] = useCycle(cols, 1500, Math.min(cols - 1, 9));
  const col = Math.min(hi, cols - 1);
  const picked = DATA[range]?.[col];

  const definition = useMemo(() => {
    const data = DATA[range] ?? [];
    const cells = data.flatMap((d) => {
      const outRows = Math.max(1, Math.round(d.out / step));
      const inRows = Math.round(d.inflow / step);
      return Array.from({ length: ROWS }, (_, row) => {
        let kind = "empty";
        if (row < outRows) {
          kind = "out";
        } else if (row < outRows + inRows) {
          kind = "in";
        }
        return { col: d.col, id: `${d.col}:${row}`, kind, row };
      });
    });
    const colIds = data.map((d) => d.col);
    const ticks = meta?.ticks ?? [];
    return defineChart({
      color: { domain: ["out", "in", "empty"], range: [BLUE, IN_COLOR, EMPTY] },
      margin: MARGIN,
      marks: [
        rect(cells, {
          color: "kind",
          inset: 1.4,
          key: "id",
          radius: 2.5,
          x: "col",
          y1: (d) => d.row * step,
          y2: (d) => (d.row + 1) * step,
        }),
        ruleX([col], {
          stroke: INK,
          strokeDasharray: "3 3",
          strokeOpacity: 0.55,
          strokeWidth: 1,
        }),
      ],
      scales: {
        x: {
          axis: {
            line: false,
            tickLabels: { fontSize: 11 },
            ticks: {
              format: (v: number) => ticks.find(([c]) => c === v)?.[1] ?? "",
              size: 0,
              values: ticks.map(([c]) => c),
            },
          },
          scale: scaleBand<number>().domain(colIds).padding(0),
        },
        y: {
          axis: {
            line: false,
            tickLabels: { fontSize: 11 },
            ticks: {
              format: (v: number) => compact(v),
              size: 0,
              values: [0, 1, 2, 3, 4, 5].map((k) => (k * step * ROWS) / 5),
            },
          },
          scale: scaleLinear().domain([0, step * ROWS]),
        },
      },
      theme: THEME,
    });
  }, [range, step, col, meta]);

  const center = ((col + 0.5) / cols) * 100;
  const right = center < 50;
  const outTop = picked ? Math.max(1, Math.round(picked.out / step)) / ROWS : 0;

  return (
    <>
      <div className="flex items-center justify-between px-3 pt-2 pb-2.5">
        <h3 className="text-[16px] font-semibold tracking-[-0.01em]">Financial Trends</h3>
        <button
          type="button"
          aria-label="More"
          className="inline-flex size-8 items-center justify-center rounded-[10px] bg-white text-[#8a8a93] shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
        >
          <Ellipsis className="size-4" />
        </button>
      </div>
      <div className="rounded-[18px] bg-white p-4 ring-1 ring-black/[0.05]">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[12px]" style={{ color: MUTED }}>
              Total net cash flow
            </p>
            <Num
              value={meta?.total ?? 0}
              className="mt-0.5 block text-[24px] font-bold tracking-[-0.03em]"
            />
          </div>
          <Segmented
            options={RANGES.map((r) => r.name)}
            value={range}
            onChange={setRange}
            size="sm"
            className="shrink-0"
          />
        </div>
        <Legend
          swatch="square"
          items={[
            { color: "#dedee3", label: "Cash inflow" },
            { color: BLUE, label: "Cash outflow" },
          ]}
          className="mt-3"
        />
        <ChartSlot height={HEIGHT} className="mt-3">
          <div onMouseLeave={() => pin(null)}>
            <Chart
              definition={definition}
              renderer={renderer}
              height={HEIGHT}
              ariaLabel={`Cash inflow and outflow by period, ${meta?.name.toLowerCase()}`}
              onFocusChange={(p) => {
                const c = Number(p?.xValue);
                if (p && Number.isInteger(c)) {
                  pin(c);
                }
              }}
            />
          </div>
          <PlotOverlay margin={MARGIN}>
            <Bubble
              left={right ? center + 3 : center - 3}
              top={Math.max(4, 100 - outTop * 100 - 52)}
              align={right ? "left" : "right"}
              className="!rounded-[14px] !p-1.5"
            >
              <p className="rounded-[9px] bg-[#f4f4f6] px-2 py-1 text-[11px] font-medium">
                {meta?.period(col)}
              </p>
              <div className="px-1.5 pt-1 pb-0.5">
                {[
                  { color: "#dedee3", label: "Cash inflow", value: picked?.inflow ?? 0 },
                  { color: BLUE, label: "Cash outflow", value: picked?.out ?? 0 },
                ].map((row) => (
                  <p key={row.label} className="flex items-center gap-1.5 py-0.5 text-[11px]">
                    <span className="size-2 rounded-[2px]" style={{ backgroundColor: row.color }} />
                    <span style={{ color: MUTED }}>{row.label}</span>
                    <span className="ml-auto pl-3 font-semibold tabular-nums">
                      {usd(row.value)}
                    </span>
                  </p>
                ))}
              </div>
            </Bubble>
          </PlotOverlay>
        </ChartSlot>
      </div>
    </>
  );
};

// The cycle hooks read the Card's in-view context, so they live a level below it.
export const FinancialTrends = () => (
  <Card className="!bg-[#f3f3f5] !p-1.5">
    <FinancialTrendsBody />
  </Card>
);
