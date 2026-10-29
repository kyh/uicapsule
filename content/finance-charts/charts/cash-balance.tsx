"use client";

import { barX, defineChart, dot, link, lineY, ruleY, tickX } from "@tanstack/charts";
import { d3Curve } from "@tanstack/charts/d3/shape";
import { Chart } from "@tanstack/charts/react/core";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { curveMonotoneX } from "d3-shape";
import { CreditCard, PiggyBank, Salad, ShoppingBag, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";

import { compact, rng, usd } from "../lib/data";
import {
  Bubble,
  Card,
  CardHeader,
  ChartSlot,
  MoreButton,
  Num,
  PlotOverlay,
  renderer,
  useCycle,
} from "../lib/kit";
import { BLUE, GREEN, GRID, MUTED, PURPLE, SPRING, THEME } from "../lib/tokens";

const START = 6;
const END = 17;
const LO = 4000;
const HI = 21_000;

// Hand-placed anchors shape the day (hour, $); seeded jitter roughens it.
const ANCHORS: [number, number][] = [
  [6, 13_900],
  [6.3, 12_900],
  [7, 13_300],
  [7.6, 13_900],
  [8.1, 13_000],
  [8.8, 14_400],
  [9.4, 13_700],
  [10, 14_500],
  [10.6, 12_500],
  [11.1, 12_100],
  [11.7, 12_900],
  [12.2, 15_400],
  [12.8, 16_400],
  [13.15, 15_900],
  [13.4, 12_000],
  [14, 12_000],
  [14.6, 12_800],
  [15, 11_800],
  [15.4, 10_300],
  [15.9, 10_800],
  [16.2, 10_200],
  [16.5, 11_500],
  [16.8, 12_400],
  [17, 11_300],
];

const lerpAnchors = (h: number) => {
  const i = ANCHORS.findIndex(([x]) => x >= h);
  if (i <= 0) {
    return ANCHORS[0]?.[1] ?? 0;
  }
  const [x0, y0] = ANCHORS[i - 1] ?? [START, 0];
  const [x1, y1] = ANCHORS[i] ?? [END, 0];
  return y0 + ((h - x0) / (x1 - x0)) * (y1 - y0);
};

const POINTS = (() => {
  const r = rng(41);
  const n = 72;
  return Array.from({ length: n }, (_, i) => {
    const hour = START + (i / (n - 1)) * (END - START);
    return { hour, value: lerpAnchors(hour) + (r() - 0.5) * 380 };
  });
})();

const valueAt = (hour: number) => {
  let [best] = POINTS;
  for (const p of POINTS) {
    if (best === undefined || Math.abs(p.hour - hour) < Math.abs(best.hour - hour)) {
      best = p;
    }
  }
  return best ?? { hour, value: 0 };
};

// Diagonal hatch for the 10K–15K "normal range" band; the chart clips the overhang.
const HATCH = Array.from({ length: 60 }, (_, i) => {
  const x = START - 1 + i * 0.22;
  return { id: i, x1: x, x2: x + 0.42, y1: 10_000, y2: 15_000 };
});

interface Event {
  hour: number;
  label: string;
  icon: LucideIcon;
  color: string;
}

const EVENTS: Event[] = [
  { color: "#f5b82e", hour: 9, icon: CreditCard, label: "Card top-up" },
  { color: GREEN, hour: 12.2, icon: Salad, label: "Lunch" },
  { color: BLUE, hour: 13.4, icon: ShoppingBag, label: "Shopping" },
  { color: PURPLE, hour: 16.2, icon: PiggyBank, label: "Savings" },
];

const TIME_LABELS = [
  { hour: 6, label: "6 AM" },
  { hour: 9, label: "9 AM" },
  { hour: 12, label: "12 PM" },
  { hour: 15, label: "3 PM" },
  { hour: 17, label: "5 PM" },
];

const TICKS = Array.from({ length: 22 }, (_, i) => START + 0.5 + i * 0.5).filter((h) => h <= END);

const MARGIN = { bottom: 8, left: 46, right: 4, top: 8 };
const HEIGHT = 200;
const TRACK_MARGIN = { bottom: 0, left: 0, right: 0, top: 0 };

const pct = (hour: number) => ((hour - START) / (END - START)) * 100;

const clock = (hour: number) => {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
};

const Stat = ({ label, value, delta }: { label: string; value: number; delta: number }) => (
  <div>
    <p className="text-[12px]" style={{ color: MUTED }}>
      {label}
    </p>
    <Num
      value={value}
      format={(n) => usd(n, true)}
      className="mt-0.5 block text-[24px] font-bold tracking-[-0.03em]"
    />
    <p className="mt-0.5 inline-flex items-center gap-1 text-[12px]" style={{ color: MUTED }}>
      <span className="inline-flex items-center gap-0.5 font-semibold" style={{ color: GREEN }}>
        <TrendingUp className="size-3.5" strokeWidth={2.5} />
        {delta}%
      </span>
      vs Yesterday
    </p>
  </div>
);

const CashBalanceBody = () => {
  const [active, pin] = useCycle(EVENTS.length, 2300);
  const event = EVENTS[active] ?? EVENTS[0];
  const hour = event?.hour ?? START;
  const point = valueAt(hour);

  const definition = useMemo(
    () =>
      defineChart({
        clip: true,
        margin: MARGIN,
        marks: [
          link(HATCH, {
            key: "id",
            lineCap: "butt",
            stroke: "#dbeafe",
            strokeOpacity: 0.9,
            strokeWidth: 3,
            x1: "x1",
            x2: "x2",
            y1: "y1",
            y2: "y2",
          }),
          ruleY([20_000, 5000], {
            stroke: "#d4d4da",
            strokeDasharray: "6 6",
            strokeOpacity: 1,
            strokeWidth: 1,
          }),
          lineY(POINTS, {
            curve: d3Curve(curveMonotoneX),
            stroke: BLUE,
            strokeWidth: 2.5,
            x: "hour",
            y: "value",
          }),
          dot([point], {
            fill: "#ffffff",
            key: () => "cursor",
            r: 5,
            stroke: BLUE,
            strokeWidth: 2.5,
            x: "hour",
            y: "value",
          }),
        ],
        scales: {
          x: { axis: false, scale: scaleLinear().domain([START, END]) },
          y: {
            axis: {
              line: false,
              tickLabels: { fontSize: 12 },
              ticks: {
                format: (v: number) => compact(v),
                size: 0,
                values: [5000, 10_000, 15_000, 20_000],
              },
            },
            scale: scaleLinear().domain([LO, HI]),
          },
        },
        theme: THEME,
      }),
    [point],
  );

  const track = useMemo(
    () =>
      defineChart({
        gradients: [
          {
            id: "cb-progress",
            stops: [
              { color: BLUE, offset: 0, opacity: 0.04 },
              { color: BLUE, offset: 0.55, opacity: 0.35 },
              { color: BLUE, offset: 1, opacity: 0.85 },
            ],
            x1: 0,
            x2: 1,
            y1: 0,
            y2: 0,
          },
        ],
        guides: false,
        margin: TRACK_MARGIN,
        marks: [
          tickX(
            TICKS.filter((t) => t > hour + 0.2),
            {
              key: (t) => t,
              length: 10,
              stroke: "#dcdce2",
              strokeWidth: 2.5,
              x: (t) => t,
              y: () => 0,
            },
          ),
          barX([{ id: "progress", to: hour }], {
            fill: "url(#cb-progress)",
            key: "id",
            radius: 6,
            x1: START,
            x2: "to",
            y: () => 0,
          }),
        ],
        scales: {
          x: { scale: scaleLinear().domain([START, END]) },
          y: { scale: scaleLinear().domain([-1, 1]) },
        },
        theme: THEME,
      }),
    [hour],
  );

  return (
    <>
      <CardHeader icon={CreditCard} color={BLUE} title="Cash Balance" actions={<MoreButton />} />
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Stat label="Total Balance" value={13_791} delta={8.6} />
        <Stat label="Income today" value={2350} delta={15.3} />
      </div>

      <ChartSlot height={HEIGHT} className="mt-5">
        <div onMouseLeave={() => pin(null)}>
          <Chart
            definition={definition}
            renderer={renderer}
            height={HEIGHT}
            ariaLabel="Cash balance through the day"
            onFocusChange={(p) => {
              const x = Number(p?.xValue);
              if (!p || !Number.isFinite(x)) {
                return;
              }
              let nearest = 0;
              for (const [i, e] of EVENTS.entries()) {
                if (Math.abs(e.hour - x) < Math.abs((EVENTS[nearest]?.hour ?? 0) - x)) {
                  nearest = i;
                }
              }
              pin(nearest);
            }}
          />
        </div>
        <PlotOverlay margin={MARGIN}>
          <Bubble
            left={pct(hour)}
            top={100 - ((point.value - LO) / (HI - LO)) * 100 - 9}
            dark
            align={hour > 15 ? "right" : "center"}
            className="-translate-y-full"
          >
            <p className="text-[11px] text-white/60">
              {clock(hour)} · {event?.label}
            </p>
            <p className="font-semibold tabular-nums">{usd(point.value, true)}</p>
          </Bubble>
        </PlotOverlay>
      </ChartSlot>

      {/* Day timeline: event pins over a progress track. */}
      <div className="relative mt-3 h-8">
        {EVENTS.map((e, i) => {
          const Icon = e.icon;
          const on = i === active;
          return (
            <motion.span
              key={e.label}
              className="absolute top-0 inline-flex size-7 items-center justify-center rounded-full ring-2 ring-white"
              style={{
                background: `linear-gradient(160deg, color-mix(in oklab, ${e.color} 65%, white), ${e.color})`,
                boxShadow: `0 4px 10px -4px ${e.color}`,
                left: `calc(${pct(e.hour)}% - 14px)`,
              }}
              animate={{ scale: on ? 1.12 : 0.92, y: on ? -2 : 0 }}
              transition={SPRING}
            >
              <Icon className="size-3.5 text-white" strokeWidth={2.4} />
            </motion.span>
          );
        })}
      </div>
      <ChartSlot height={12} className="mt-1">
        <Chart
          definition={track}
          renderer={renderer}
          height={12}
          ariaLabel="Time of day progress"
        />
      </ChartSlot>
      <div className="relative mt-1.5 h-4 text-[12px]" style={{ color: MUTED }}>
        {TIME_LABELS.map((t, i) => {
          let shift = "-50%";
          if (i === 0) {
            shift = "0%";
          } else if (i === TIME_LABELS.length - 1) {
            shift = "-100%";
          }
          return (
            <span
              key={t.label}
              className="absolute top-0 whitespace-nowrap"
              style={{ left: `${pct(t.hour)}%`, transform: `translateX(${shift})` }}
            >
              {t.label}
            </span>
          );
        })}
      </div>

      <div
        className="mt-5 grid grid-cols-3 gap-2 rounded-2xl px-3.5 py-3"
        style={{ backgroundColor: "#f6f6f8", borderColor: GRID }}
      >
        {[
          { label: "Expenses today", value: 1240 },
          { label: "Net cash flow", value: 3780 },
          { label: "Savings goal", value: 25_000 },
        ].map((s) => (
          <div key={s.label} className="min-w-0">
            <p className="truncate text-[11px]" style={{ color: MUTED }}>
              {s.label}
            </p>
            <Num
              value={s.value}
              format={(n) => usd(n, true)}
              className="mt-0.5 block text-[16px] font-bold tracking-[-0.02em]"
            />
          </div>
        ))}
      </div>
    </>
  );
};

// The cycle hooks read the Card's in-view context, so they live a level below it.
export const CashBalance = () => (
  <Card>
    <CashBalanceBody />
  </Card>
);
