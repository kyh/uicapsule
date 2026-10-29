"use client";

import { barY, defineChart, dot, text } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react/core";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { CalendarDays } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";

import { rng, WEEKDAYS } from "../lib/data";
import { Card, ChartSlot, Chip, Delta, Num, renderer, useCycle } from "../lib/kit";
import { BLUE, MUTED, SPRING, THEME } from "../lib/tokens";
import { stripes } from "./net-worth-stripes";

const TABS = [
  { name: "Technical", total: 56_754.08, values: [52, 68, 43, 100, 52, 83, 31] },
  { name: "Account", total: 48_210.4, values: [61, 47, 88, 55, 72, 40, 58] },
  { name: "Billing", total: 39_877.13, values: [35, 58, 49, 66, 92, 54, 44] },
  { name: "Product", total: 61_302.95, values: [74, 96, 62, 70, 48, 57, 39] },
] as const;

const DAY_INDEX = new Map(WEEKDAYS.map((d, i) => [String(d), i]));
const PAD = 0.2;
const TOP = 108;
const HEIGHT = 250;
const LABEL_SPACE = 24;
const MARGIN = { bottom: LABEL_SPACE, left: 0, right: 0, top: 0 };
const PLOT_H = HEIGHT - LABEL_SPACE;
// ~340px plot / 7 bands at paddingInner 0.2.
const BAR_W = 39;

// Twinkles inside the lit bar: (u across, v up) in bar-relative units.
const SPARKS = (() => {
  const r = rng(77);
  return Array.from({ length: 14 }, (_, i) => ({
    id: i,
    r: 0.8 + r() * 1.1,
    u: 0.12 + r() * 0.76,
    v: 0.04 + r() * 0.9,
  }));
})();

const AnalyticsBody = () => {
  const [tab, pinTab] = useCycle(TABS.length, 3200);
  const [hover, setHover] = useState<number | null>(null);
  const meta = TABS[tab] ?? TABS[0];
  const values = meta?.values ?? TABS[0].values;
  let peak = 0;
  for (const [i, v] of values.entries()) {
    if (v > (values[peak] ?? 0)) {
      peak = i;
    }
  }
  const lit = hover ?? peak;

  const definition = useMemo(() => {
    const rows = WEEKDAYS.map((day, i) => ({ day, i, value: values[i] ?? 0 }));
    const hot = rows[lit] ?? rows[0];
    return defineChart({
      gradients: [
        ...rows.map((r) =>
          stripes({
            base: "#f2f2f4",
            height: (r.value / TOP) * PLOT_H,
            id: `an-idle-${r.i}`,
            line: "#eaeaed",
            pitch: 9,
            width: BAR_W,
          }),
        ),
        {
          id: "an-hot",
          stops: [
            { color: "#1366e8", offset: 0 },
            { color: "#1aa3ff", offset: 0.5 },
            { color: "#1366e8", offset: 1 },
          ],
          x1: 0,
          x2: 1,
          y1: 0,
          y2: 0,
        },
      ],
      margin: MARGIN,
      marks: [
        barY(rows, {
          fill: (d) => (d.i === lit ? "url(#an-hot)" : `url(#an-idle-${d.i})`),
          key: "day",
          radius: [14, 14, 0, 0],
          stroke: (d) => (d.i === lit ? "#0f5fd6" : "#dcdce0"),
          strokeWidth: 1.2,
          x: "day",
          y: "value",
        }),
        dot(
          SPARKS.map((s) => ({
            ...s,
            sx: (hot?.i ?? 0) + s.u * (1 - PAD),
            sy: s.v * (hot?.value ?? 0),
          })),
          {
            fill: "#bfe9ff",
            fillOpacity: 0.85,
            key: "id",
            r: "r",
            x: "sx",
            xScale: "sx",
            y: "sy",
          },
        ),
        text(rows, {
          dy: 15,
          fill: (d) => (d.i === lit ? BLUE : "#a1a1aa"),
          fontSize: 12,
          fontWeight: 500,
          key: "day",
          text: "day",
          x: "day",
          y: () => 0,
        }),
      ],
      scales: {
        sx: {
          axis: false,
          channel: "x",
          scale: scaleLinear().domain([0, WEEKDAYS.length - PAD]),
        },
        x: {
          axis: false,
          scale: scaleBand<string>()
            .domain([...WEEKDAYS])
            .paddingInner(PAD)
            .paddingOuter(0),
        },
        y: { axis: false, scale: scaleLinear().domain([0, TOP]) },
      },
      theme: THEME,
    });
  }, [values, lit]);

  return (
    <>
      <div className="flex items-center justify-between">
        <h3 className="text-[18px] font-semibold tracking-[-0.01em]">Analytics</h3>
        <Chip icon={CalendarDays} chevron>
          Weekly
        </Chip>
      </div>
      <p className="mt-4 text-[12px]" style={{ color: MUTED }}>
        Total portfolio value
      </p>
      <div className="mt-0.5 flex items-end gap-2">
        <Num value={meta?.total ?? 0} className="text-[30px] font-bold tracking-[-0.03em]" />
        <p className="pb-1.5 text-[11px]" style={{ color: MUTED }}>
          <Delta value={1.16} className="text-[11px]" /> Vs Last week
        </p>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-1.5">
        {TABS.map((t, i) => (
          <button
            key={t.name}
            type="button"
            onClick={() => pinTab(i)}
            className="relative rounded-full py-1.5 text-[12px] font-medium ring-1 ring-black/[0.08]"
            style={{ color: i === tab ? "#ffffff" : "#55555c" }}
          >
            {i === tab ? (
              <motion.span
                layoutId="analytics-tab"
                transition={SPRING}
                className="absolute inset-0 rounded-full"
                style={{
                  background: "linear-gradient(180deg, #2f8cff, #1570ef)",
                  boxShadow:
                    "inset 0 1px 0 rgba(255,255,255,0.35), 0 6px 14px -6px rgba(21,112,239,0.85)",
                }}
              />
            ) : null}
            <span className="relative">{t.name}</span>
          </button>
        ))}
      </div>
      <ChartSlot height={HEIGHT} className="mt-5">
        <div
          onMouseLeave={() => {
            setHover(null);
            pinTab(null);
          }}
        >
          <Chart
            definition={definition}
            renderer={renderer}
            height={HEIGHT}
            ariaLabel={`${meta?.name} activity by weekday`}
            onFocusChange={(p) => {
              const i = DAY_INDEX.get(String(p?.xValue)) ?? -1;
              if (i !== -1) {
                setHover(i);
                pinTab(tab);
              }
            }}
          />
        </div>
      </ChartSlot>
    </>
  );
};

// The cycle hooks read the Card's in-view context, so they live a level below it.
export const Analytics = () => (
  <Card>
    <AnalyticsBody />
  </Card>
);
