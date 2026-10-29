"use client";

import { barY, defineChart, ruleY } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react/core";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { PieChart } from "lucide-react";
import { useMemo } from "react";

import { compact, rng, usd } from "../lib/data";
import {
  Bubble,
  Card,
  ChartSlot,
  IconTile,
  Label,
  Num,
  PlotOverlay,
  renderer,
  useCycle,
} from "../lib/kit";
import { DASHED_GRID, GRID, ORANGE, THEME } from "../lib/tokens";
import { PeriodChip, UsdChip } from "./cash-flow-daily-bar-chrome";

const DAYS = ["May 1", "May 2", "May 3", "May 4", "May 5", "May 6", "May 7"];
const PER_DAY = 7;
const LO = 5000;
const HI = 20_000;

interface Segment {
  id: string;
  slot: string;
  day: number;
  y1: number;
  y2: number;
}

// Each slot is one intraday spending range; some split into a long run plus a
// short dash, the way the source draws them.
const SEGMENTS: Segment[] = (() => {
  const r = rng(4242);
  const out: Segment[] = [];
  for (let day = 0; day < DAYS.length; day += 1) {
    // May 3 runs lowest, so it is the "lowest day" the stats call out.
    const base = day === 2 ? 7000 : 9500;
    for (let k = 0; k < PER_DAY; k += 1) {
      const slot = `${day}-${k}`;
      const low = base + r() * 6500;
      const len = 1200 + r() * 4200;
      out.push({ day, id: `${slot}-a`, slot, y1: low, y2: Math.min(HI - 800, low + len) });
      if (r() < 0.45) {
        const above = r() < 0.5;
        const y1 = above ? low + len + 500 : low - 1100;
        if (y1 + 600 > HI - 300) {
          continue;
        }
        out.push({ day, id: `${slot}-b`, slot, y1, y2: y1 + 600 });
      }
    }
  }
  return out;
})();

const SLOTS = [...new Set(SEGMENTS.map((s) => s.slot))];
const MIDDLES = DAYS.map((_, d) => `${d}-${Math.floor(PER_DAY / 2)}`);
const GRID_LINES = { ...DASHED_GRID, stroke: "#e2e2e7", strokeOpacity: 1 };
const DAY_LOWS = DAYS.map((_, d) =>
  Math.min(...SEGMENTS.filter((s) => s.day === d).map((s) => s.y1)),
);

const MARGIN = { bottom: 30, left: 36, right: 0, top: 10 };
const HEIGHT = 210;

export const SpendingOverviewRange = () => {
  const [hi, pin] = useCycle(DAYS.length, 2000, 2);

  const definition = useMemo(
    () =>
      defineChart({
        margin: MARGIN,
        marks: [
          ruleY([LO], { stroke: GRID, strokeOpacity: 1, strokeWidth: 1 }),
          barY(SEGMENTS, {
            fill: (d) => (d.day === hi ? ORANGE : "#ededf0"),
            key: "id",
            radius: 4,
            x: "slot",
            y1: "y1",
            y2: "y2",
          }),
        ],
        scales: {
          x: {
            axis: {
              line: false,
              tickLabels: {
                fontSize: 11,
                fontWeight: (c) => (c.value === MIDDLES[hi] ? 600 : 400),
              },
              ticks: {
                format: (v) => DAYS[Number(v.split("-")[0])] ?? "",
                padding: 10,
                size: 0,
                values: MIDDLES,
              },
            },
            scale: scaleBand<string>().domain(SLOTS).paddingInner(0.45).paddingOuter(0.3),
          },
          y: {
            axis: {
              line: false,
              tickLabels: { fontSize: 11 },
              ticks: { format: (v) => compact(v), size: 0, values: [5000, 10_000, 15_000, 20_000] },
            },
            grid: GRID_LINES,
            scale: scaleLinear().domain([LO, HI]),
          },
        },
        theme: THEME,
      }),
    [hi],
  );

  const low = DAY_LOWS[hi] ?? LO;

  return (
    <Card>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <IconTile icon={PieChart} color={ORANGE} size={30} />
          <h3 className="truncate text-[14px] font-semibold tracking-[-0.01em]">
            Spending Overview
          </h3>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <UsdChip compact />
          <PeriodChip compact label="Weekly" />
        </div>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2">
        {[
          { label: "Total spending", value: 151_083.4 },
          { label: "Daily average", value: 21_583.34 },
          { label: "Lowest day", value: 13_916.67 },
        ].map((s) => (
          <div key={s.label} className="min-w-0">
            <Label className="truncate">{s.label}</Label>
            <Num
              value={s.value}
              className="mt-0.5 block text-[16px] font-bold tracking-[-0.03em]"
            />
          </div>
        ))}
      </div>
      <ChartSlot height={HEIGHT} className="mt-5">
        <div onMouseLeave={() => pin(null)}>
          <Chart
            definition={definition}
            renderer={renderer}
            height={HEIGHT}
            ariaLabel="Intraday spending ranges for each day of the week"
            onFocusChange={(p) => {
              if (p) {
                pin(Number(String(p.xValue).split("-")[0]));
              }
            }}
          />
        </div>
        <PlotOverlay margin={MARGIN}>
          <Bubble
            dark
            left={(hi === DAYS.length - 1 ? hi : hi + 1) * (100 / DAYS.length)}
            top={Math.min(80, 100 - ((low - LO) / (HI - LO)) * 100)}
            align={hi === DAYS.length - 1 ? "right" : "left"}
            className="-translate-y-1/2 text-center leading-tight"
          >
            <span className="block text-[10px] text-white/60">Low · {DAYS[hi]}</span>
            <span className="font-semibold">{usd(low, true)}</span>
          </Bubble>
        </PlotOverlay>
      </ChartSlot>
    </Card>
  );
};
