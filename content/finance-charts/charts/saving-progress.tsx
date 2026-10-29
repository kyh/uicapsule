"use client";

import { barY, defineChart } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react/core";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { PiggyBank } from "lucide-react";
import { useMemo } from "react";

import { usd } from "../lib/data";
import {
  CardHeader,
  Card,
  ChartSlot,
  Delta,
  MoreButton,
  Num,
  renderer,
  useCycle,
} from "../lib/kit";
import { BLUE, GREEN, GRID, MUTED } from "../lib/tokens";

const SLOTS = 42;
const GOAL = 20_000;
const BASE_FILLED = 11;
const BASE_SAVED = 5238.1;
const STEP = GOAL / SLOTS;
// Deposits land one slot at a time, then the month resets.
const DEPOSITS = 4;
const HEIGHT = 92;

const slots = Array.from({ length: SLOTS }, (_, i) => ({ id: `s${i}`, slot: i }));

export const SavingProgress = () => {
  const [step, pin] = useCycle(DEPOSITS, 1800);
  const filled = BASE_FILLED + step;
  const saved = BASE_SAVED + step * STEP;
  const percent = Math.round((saved / GOAL) * 100);
  // The projected finish slot, ahead of what is saved.
  const projected = filled + 2;

  const definition = useMemo(() => {
    const done = slots.filter((s) => s.slot < filled);
    const ahead = slots.filter((s) => s.slot >= filled && s.slot < projected);
    return defineChart({
      gradients: [
        {
          id: "sp-green",
          stops: [
            { color: "#22c55e", offset: 0 },
            { color: GREEN, offset: 1 },
          ],
          y1: 0,
          y2: 1,
        },
      ],
      guides: false,
      margin: 0,
      marks: [
        barY(slots, {
          fill: "#f5f5f7",
          id: "track",
          key: "id",
          radius: 3,
          x: "slot",
          y: () => 1,
        }),
        barY(ahead, {
          fill: BLUE,
          fillOpacity: 0.16,
          id: "ahead",
          key: "id",
          radius: 3,
          x: "slot",
          y: () => 1,
        }),
        barY(done, {
          fill: "url(#sp-green)",
          id: "done",
          key: "id",
          radius: 3,
          x: "slot",
          y: () => 1,
        }),
      ],
      scales: {
        x: {
          axis: false,
          scale: scaleBand<number>()
            .domain(slots.map((s) => s.slot))
            .paddingInner(0.18)
            .paddingOuter(0),
        },
        y: { axis: false, scale: scaleLinear().domain([0, 1]) },
      },
    });
  }, [filled, projected]);

  return (
    <Card>
      <CardHeader icon={PiggyBank} color={GREEN} title="Saving progress" actions={<MoreButton />} />
      <p className="mt-1.5 text-[12px]" style={{ color: MUTED }}>
        You&rsquo;re on track to reach your saving target{" "}
        <span style={{ color: GREEN }}>3 days early</span>
      </p>
      <div className="mt-4 border-t pt-4" style={{ borderColor: GRID }}>
        <div className="flex items-center gap-3">
          <Num
            value={percent}
            format={(n) => `${Math.round(n)}%`}
            className="text-[36px] font-semibold tracking-[-0.03em]"
          />
          <span className="inline-flex items-center rounded-full bg-[#dcfce7] px-2 py-0.5 text-[12px]">
            <Delta value={2.64} variant="circle" />
          </span>
          <span className="text-[12px]" style={{ color: MUTED }}>
            Vs last month
          </span>
        </div>
        <p className="text-[12px]" style={{ color: MUTED }}>
          Of monthly saving goals
        </p>
      </div>
      <ChartSlot height={HEIGHT} className="mt-4">
        <div onMouseEnter={() => pin(step)} onMouseLeave={() => pin(null)}>
          <Chart
            definition={definition}
            renderer={renderer}
            height={HEIGHT}
            ariaLabel={`${filled} of ${SLOTS} saving slots filled`}
          />
        </div>
      </ChartSlot>
      <div className="mt-4 grid grid-cols-3 text-[11px] whitespace-nowrap">
        <div className="pr-2">
          <p className="inline-flex items-center gap-1.5" style={{ color: MUTED }}>
            <span className="h-1.5 w-3 rounded-full bg-[#ececf0]" />
            Monthly goals
          </p>
          <p className="mt-1 text-[15px] font-semibold tabular-nums">{usd(GOAL, true)}</p>
        </div>
        <div className="border-l px-3" style={{ borderColor: GRID }}>
          <p className="inline-flex items-center gap-1.5" style={{ color: MUTED }}>
            <span className="h-1.5 w-3 rounded-full" style={{ backgroundColor: GREEN }} />
            Saved so far
          </p>
          <Num value={saved} className="mt-1 block text-[15px] font-semibold" />
        </div>
        <div className="border-l pl-3" style={{ borderColor: GRID }}>
          <p className="inline-flex items-center gap-1.5" style={{ color: MUTED }}>
            <span className="h-1.5 w-3 rounded-full" style={{ backgroundColor: BLUE }} />
            Est completion
          </p>
          <p className="mt-1 text-[15px] font-semibold" style={{ color: GREEN }}>
            3 days early
          </p>
        </div>
      </div>
    </Card>
  );
};
