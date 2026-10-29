"use client";

import { bandX, barY, defineChart, text } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react/core";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { Car, ShoppingBag, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo } from "react";

import { rng, WEEKDAYS } from "../lib/data";
import { Card, ChartSlot, MoreButton, Num, Segmented, renderer, useCycle } from "../lib/kit";
import { BLUE, GREEN, MUTED, ORANGE, THEME } from "../lib/tokens";

// The chart works in pixels: y is a pixel-height domain, so the elliptical
// caps keep a constant thickness however wide the column gets.
const HEIGHT = 250;
const BASE = 30;
const TOP = HEIGHT - 14;
const CAP = 13;
const LABEL_Y = 12;

const RANGES = [
  [0.22, 0.47, 0.36, 0.69, 0.22, 0.36, 0.47],
  [0.41, 0.3, 0.58, 0.52, 0.66, 0.27, 0.44],
  [0.62, 0.55, 0.31, 0.78, 0.48, 0.58, 0.38],
] as const;
const HOT_DAY = [3, 4, 3] as const;

const DAY_LIST: readonly string[] = WEEKDAYS;

const level = (v: number) => BASE + v * (TOP - BASE);

// Sparkles that drift inside the lit cylinder: offsets from its centre.
const SPARKS = (() => {
  const r = rng(515);
  return Array.from({ length: 14 }, (_, i) => ({
    dx: (r() - 0.5) * 0.7,
    id: i,
    size: 3 + r() * 4,
    t: 0.08 + r() * 0.84,
  }));
})();

const TRANSACTIONS: {
  amount: number;
  icon: LucideIcon;
  time: string;
  tint: string;
  title: string;
}[] = [
  { amount: 2764, icon: Wallet, time: "9:24 AM", tint: BLUE, title: "Salary Deposit" },
  { amount: 67.93, icon: Car, time: "12:24 PM", tint: ORANGE, title: "Fuel" },
  { amount: 320.63, icon: ShoppingBag, time: "10:05 AM", tint: GREEN, title: "Groceries" },
];

export const SpendingOverviewCylinder = () => {
  const [range, setRange] = useCycle(RANGES.length, 9000, 0);
  const [hi, pin] = useCycle(WEEKDAYS.length, 1800, HOT_DAY[0]);
  const values = RANGES[range] ?? RANGES[0];

  const definition = useMemo(() => {
    const days = WEEKDAYS.map((day, i) => ({ day, hot: i === hi, level: level(values[i] ?? 0) }));
    const hot = days[hi] ?? days[0];
    const sparks = SPARKS.map((s) => ({
      ...s,
      day: hot?.day ?? "Sun",
      y: BASE + s.t * ((hot?.level ?? BASE) - BASE - CAP),
    }));
    return defineChart({
      focusRing: false,
      gradients: [
        {
          id: "soc-glow",
          stops: [
            { color: "#e3efff", offset: 0, opacity: 0 },
            { color: "#e3efff", offset: 0.55, opacity: 1 },
            { color: "#e3efff", offset: 0.9, opacity: 0 },
          ],
          x1: 0,
          x2: 0,
          y1: 0,
          y2: 1,
        },
        {
          id: "soc-gray",
          stops: [
            { color: "#ebebed", offset: 0 },
            { color: "#e2e2e5", offset: 0.55 },
            { color: "#d3d3d7", offset: 1 },
          ],
          x1: 0,
          x2: 1,
          y1: 0,
          y2: 0,
        },
        {
          id: "soc-hot",
          stops: [
            { color: "#d47bf8", offset: 0 },
            { color: "#b9a6fb", offset: 0.3 },
            { color: "#a6f6f6", offset: 0.62 },
            { color: "#46a6ff", offset: 1 },
          ],
          x1: 0,
          x2: 0,
          y1: 0,
          y2: 1,
        },
      ],
      guides: false,
      margin: 0,
      marks: [
        bandX(
          days.filter((d) => d.hot),
          {
            fill: "url(#soc-glow)",
            inset: -7,
            key: () => "glow",
            x: "day",
          },
        ),
        // Empty glass tube and its open rim.
        barY(days, {
          fill: "#f7f7f8",
          key: (d) => `${d.day}-tube`,
          radius: [0, 0, 14, 14],
          stroke: "#ebebee",
          strokeWidth: 1,
          x: "day",
          y1: BASE - CAP / 2,
          y2: TOP,
        }),
        barY(days, {
          fill: "#f9f9fa",
          key: (d) => `${d.day}-rim`,
          radius: 999,
          stroke: "#e6e6e9",
          strokeWidth: 1,
          x: "day",
          y1: TOP - CAP / 2,
          y2: TOP + CAP / 2,
        }),
        // The liquid: body, bright lip, darker surface.
        barY(days, {
          fill: (d) => (d.hot ? "url(#soc-hot)" : "url(#soc-gray)"),
          key: (d) => `${d.day}-body`,
          radius: [0, 0, 14, 14],
          x: "day",
          y1: BASE - CAP / 2,
          y2: "level",
        }),
        text(sparks, {
          dx: (d) => d.dx * 40,
          fill: "rgba(255,255,255,0.85)",
          fontSize: 6,
          key: "id",
          text: () => "•",
          x: "day",
          y: "y",
        }),
        barY(days, {
          fill: (d) => (d.hot ? "#ffffff" : "#d9d9dd"),
          key: (d) => `${d.day}-lip`,
          radius: 999,
          x: "day",
          y1: (d) => d.level - CAP / 2,
          y2: (d) => d.level + CAP / 2,
        }),
        barY(days, {
          fill: (d) => (d.hot ? "#c069f6" : "#a2a2a7"),
          inset: 6,
          key: (d) => `${d.day}-surface`,
          radius: 999,
          x: "day",
          y1: (d) => d.level - CAP * 0.3,
          y2: (d) => d.level + CAP * 0.3,
        }),
        text(days, {
          fill: (d) => (d.hot ? BLUE : "#a4a4ab"),
          fontSize: 12,
          fontWeight: 500,
          key: (d) => `${d.day}-label`,
          text: "day",
          x: "day",
          y: () => LABEL_Y,
        }),
      ],
      scales: {
        x: {
          scale: scaleBand<string>()
            .domain([...WEEKDAYS])
            .paddingInner(0.2)
            .paddingOuter(0.05),
        },
        y: { scale: scaleLinear().domain([0, HEIGHT]) },
      },
      theme: THEME,
    });
  }, [values, hi]);

  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <h3 className="truncate pt-1 text-[16px] font-semibold tracking-[-0.01em]">
          Spending Overview
        </h3>
        <div className="flex shrink-0 items-center gap-1.5">
          <span
            className="inline-flex h-8 items-center gap-1 rounded-full px-2 text-[11px] font-medium"
            style={{
              backgroundColor: "#e8f8ed",
              boxShadow: "inset 0 0 0 1px #bfe9cc",
              color: GREEN,
            }}
          >
            <Wallet className="size-3" strokeWidth={2.6} />
            Balance <Num value={2653.87} className="font-semibold" />
          </span>
          <MoreButton />
        </div>
      </div>
      <p className="mt-0.5 text-[12px]" style={{ color: MUTED }}>
        Track your spending pattern and stay in control
      </p>
      <Segmented
        options={["Week", "Month", "Year"]}
        value={range}
        onChange={setRange}
        className="mt-4"
      />
      <ChartSlot height={HEIGHT} className="mt-4">
        <div onMouseLeave={() => pin(null)}>
          <Chart
            definition={definition}
            renderer={renderer}
            height={HEIGHT}
            ariaLabel="Spending by weekday, drawn as filling cylinders"
            onFocusChange={(p) => {
              if (p) {
                pin(DAY_LIST.indexOf(String(p.xValue)));
              }
            }}
          />
        </div>
      </ChartSlot>
      <div className="mt-4 flex flex-col gap-2">
        {TRANSACTIONS.map(({ amount, icon: Icon, time, tint, title }) => (
          <div
            key={title}
            className="flex items-center gap-3 rounded-2xl bg-[#f6f6f7] px-3 py-2.5 ring-1 ring-black/[0.04]"
          >
            <span
              className="inline-flex size-9 items-center justify-center rounded-full"
              style={{
                backgroundColor: `color-mix(in oklab, ${tint} 12%, white)`,
                boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${tint} 28%, white)`,
                color: tint,
              }}
            >
              <Icon className="size-4" strokeWidth={2.4} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium">{title}</p>
              <p className="text-[11px]" style={{ color: MUTED }}>
                June 17, 2026 · {time}
              </p>
            </div>
            <Num value={amount} className="text-[14px] font-semibold" />
          </div>
        ))}
      </div>
    </Card>
  );
};
