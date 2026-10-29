"use client";

import { areaY, defineChart, dot, link, lineY, ruleX, text } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react/core";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { ChartNoAxesColumnIncreasing, CircleArrowDown, CircleArrowUp } from "lucide-react";
import { useMemo } from "react";

import { compact, MONTHS, uniform, usd, walk } from "../lib/data";
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
import { BLUE, FAINT, GREEN, GRID, MUTED, RED } from "../lib/tokens";

// Thirteen readings a month, January through the first of August.
const PER_MONTH = 13;
const LAST = PER_MONTH * 7;
/** A jagged series that wanders around `mean` without drifting off it. */
const jagged = (seed: number, mean: number, amp: number) => {
  const noise = uniform(LAST + 1, seed, -1, 1);
  const swell = walk(LAST + 1, seed + 1, { max: amp, min: -amp, start: 0, vol: amp * 0.18 });
  return noise.map((n, i) => mean + (swell[i] ?? 0) + n * amp * 0.35);
};
const CURRENT = jagged(41, 16_600, 2200);
const PREVIOUS = jagged(77, 19_600, 2900);
const ROWS = CURRENT.map((value, i) => ({ i, prev: PREVIOUS[i] ?? value, value }));

const MIN = 2500;
const MAX = 26_500;
const TICKS = [5000, 10_000, 15_000, 20_000, 25_000] as const;
// The scrubber parks on every half month.
const STOPS = Array.from({ length: 14 }, (_, k) => Math.round(k * 6.5 + 3));
const GRID_X = Array.from({ length: 15 }, (_, k) => k * 6.5);

const MARGIN = { bottom: 28, left: 0, right: 40, top: 10 };
const HEIGHT = 230;

/** Index of the entry in `list` closest to `target`. */
const nearestIndex = (list: readonly number[], target: number) => {
  let best = 0;
  for (const [k, v] of list.entries()) {
    if (Math.abs(v - target) < Math.abs((list[best] ?? 0) - target)) {
      best = k;
    }
  }
  return best;
};

const monthOf = (i: number) => MONTHS[Math.min(7, Math.round(i / PER_MONTH))] ?? "Jan";

export const CashFlowArea = () => {
  const [stop, pin] = useCycle(STOPS.length, 1800, 6);
  const at = STOPS[stop] ?? 0;
  const picked = ROWS[at] ?? ROWS[0];
  const current = picked?.value ?? 0;
  const previous = picked?.prev ?? 0;
  const diff = current - previous;
  const nearest = TICKS[nearestIndex(TICKS, current)];

  const definition = useMemo(() => {
    const labels = [
      { i: 0, key: "start", label: "Jan" },
      { i: at, key: "cursor", label: monthOf(at) },
      { i: LAST, key: "end", label: "Aug" },
    ].filter((l) => l.key === "cursor" || Math.abs(l.i - at) > 14);
    return defineChart({
      gradients: [
        {
          id: "cfa-fill",
          stops: [
            { color: BLUE, offset: 0, opacity: 0.26 },
            { color: BLUE, offset: 0.85, opacity: 0 },
          ],
          y1: 0,
          y2: 1,
        },
      ],
      guides: false,
      margin: MARGIN,
      marks: [
        ruleX(GRID_X, { stroke: FAINT, strokeDasharray: "4 4", strokeOpacity: 0.7 }),
        link([{ x1: 0, x2: LAST, y: MIN }], {
          stroke: GRID,
          strokeWidth: 1.25,
          x1: "x1",
          x2: "x2",
          y1: "y",
          y2: "y",
        }),
        areaY(ROWS, { fill: "url(#cfa-fill)", fillOpacity: 1, x: "i", y1: MIN, y2: "value" }),
        lineY(ROWS, { stroke: "#cfcfd4", strokeWidth: 1.5, x: "i", y: "prev" }),
        lineY(ROWS, { stroke: BLUE, strokeWidth: 2, x: "i", y: "value" }),
        link([{ i: at }], {
          key: () => "scrub",
          stroke: BLUE,
          strokeDasharray: "3 3",
          strokeWidth: 1.25,
          x1: "i",
          x2: "i",
          y1: () => MIN,
          y2: () => MAX,
        }),
        text([{ i: at, y: MAX }], {
          dy: 2,
          fill: BLUE,
          fontSize: 8,
          key: () => "cap-top",
          text: () => "▼",
          x: "i",
          y: "y",
        }),
        text([{ i: at, y: MIN }], {
          dy: -2,
          fill: BLUE,
          fontSize: 8,
          key: () => "cap-bottom",
          text: () => "▲",
          x: "i",
          y: "y",
        }),
        dot(picked ? [picked] : [], {
          fill: "#d4d4d8",
          key: () => "prev-dot",
          r: 4,
          stroke: "#ffffff",
          strokeWidth: 2,
          x: "i",
          y: "prev",
        }),
        dot(picked ? [picked] : [], {
          fill: BLUE,
          key: () => "cur-dot",
          r: 4.5,
          stroke: "#ffffff",
          strokeWidth: 2,
          x: "i",
          y: "value",
        }),
        // Text paint must be constant per mark, so each color is its own layer.
        ...[false, true].map((hot) =>
          text(
            TICKS.filter((v) => (v === nearest) === hot),
            {
              anchor: "start",
              dx: 10,
              fill: hot ? BLUE : MUTED,
              fontSize: 11,
              fontWeight: hot ? 600 : 500,
              id: hot ? "y-hot" : "y-cold",
              text: (v) => compact(v),
              x: () => LAST,
              y: (v) => v,
            },
          ),
        ),
        ...[false, true].map((hot) =>
          text(
            labels.filter((l) => (l.key === "cursor") === hot),
            {
              anchor: (l) => {
                if (l.key === "start") {
                  return "start";
                }
                return l.key === "end" ? "end" : "middle";
              },
              dy: 20,
              fill: hot ? BLUE : MUTED,
              fontSize: 11,
              fontWeight: hot ? 600 : 500,
              id: hot ? "x-hot" : "x-cold",
              key: "key",
              text: "label",
              x: "i",
              y: () => MIN,
            },
          ),
        ),
      ],
      scales: {
        x: { scale: scaleLinear().domain([0, LAST]) },
        y: { scale: scaleLinear().domain([MIN, MAX]) },
      },
    });
  }, [at, picked, nearest]);

  const left = (at / LAST) * 100;
  const DiffIcon = diff >= 0 ? CircleArrowUp : CircleArrowDown;

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-[16px] font-semibold tracking-[-0.01em]">
            <ChartNoAxesColumnIncreasing
              className="size-4.5"
              style={{ color: BLUE }}
              strokeWidth={2.6}
            />
            Cash Flow
          </h3>
          <p className="mt-1 text-[12px]" style={{ color: MUTED }}>
            Track money moving in and out across all accounts
          </p>
        </div>
        <MoreButton className="!rounded-[10px]" />
      </div>

      <div className="mt-4 grid grid-cols-2 text-center">
        <div className="border-r" style={{ borderColor: GRID }}>
          <p className="text-[12px]" style={{ color: MUTED }}>
            Total cash flow
          </p>
          <Num value={14_345.09} className="mt-1 block text-[22px] font-bold tracking-[-0.02em]" />
        </div>
        <div>
          <p className="text-[12px]" style={{ color: MUTED }}>
            Last month
          </p>
          <Num
            value={2456}
            format={(n) => `+${usd(n)}`}
            className="mt-1 block text-[22px] font-bold tracking-[-0.02em]"
            style={{ color: GREEN }}
          />
        </div>
      </div>

      <ChartSlot height={HEIGHT} className="mt-3">
        <div onMouseLeave={() => pin(null)}>
          <Chart
            definition={definition}
            renderer={renderer}
            height={HEIGHT}
            ariaLabel="Cash flow this year against last year"
            onFocusChange={(p) => {
              if (p) {
                pin(nearestIndex(STOPS, Number(p.xValue)));
              }
            }}
          />
        </div>
        <PlotOverlay margin={MARGIN}>
          <Bubble
            // ~45% of the plot wide: sit beside the scrubber, on whichever side has room.
            left={left > 50 ? Math.max(0, left - 49) : left + 3}
            top={22}
            align="left"
            className="!rounded-2xl !px-2.5 !py-2 text-[11px]"
          >
            <p className="flex items-center gap-1.5">
              <span className="h-4 w-1 rounded-full" style={{ backgroundColor: BLUE }} />
              <Num value={current} className="font-semibold" />
              <span style={{ color: MUTED }}>{monthOf(at)}</span>
            </p>
            <p className="mt-1 flex items-center gap-1.5">
              <span className="h-4 w-1 rounded-full bg-[#d4d4d8]" />
              <Num value={previous} className="font-semibold" />
              <span style={{ color: MUTED }}>Last yr</span>
            </p>
            <p
              className="mt-1.5 flex items-center gap-1 border-t border-dashed pt-1.5 font-semibold"
              style={{ borderColor: FAINT, color: diff >= 0 ? GREEN : RED }}
            >
              <DiffIcon className="size-3.5" />
              <Num value={Math.abs(diff)} />
            </p>
          </Bubble>
        </PlotOverlay>
      </ChartSlot>
    </Card>
  );
};
