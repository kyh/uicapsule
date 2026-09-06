"use client";

import { defineChart, dot, lineY, text, tickX } from "@tanstack/charts";
import { motion } from "@tanstack/charts/motion";
import { Chart } from "@tanstack/charts/react/core";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { useMemo } from "react";

import type { DayRow } from "../lib/data";
import { FAINT, INK, MUTED, PAPER, SPRING } from "../lib/tokens";

const renderer = motion({ transition: SPRING, initial: "always" });

// One dot = one day, hollow = weekend, barcode floor keeps the calendar
// honest. Days land dot by dot; the hairline threads them once the month is
// complete.
export const HairlineLine = ({
  days,
  reveal,
  yMax,
  height,
  initialWidth,
}: {
  days: DayRow[];
  /** 0 → 1 entrance progress; days land left to right as it advances. */
  reveal: number;
  yMax: number;
  height: number;
  initialWidth: number;
}) => {
  const revealed = Math.min(days.length, Math.floor(reveal * (days.length + 1)));

  const definition = useMemo(() => {
    const shown = days.slice(0, revealed);
    const complete = revealed >= days.length;
    const weekdays = shown.filter((d) => !d.weekend);
    const weekends = shown.filter((d) => d.weekend);
    const peak = days.reduce((a, b) => (b.value > a.value ? b : a));
    const last = days[days.length - 1];
    // Two callouts crowd each other when the peak already sits near day 30.
    const callouts = !complete
      ? []
      : last === undefined || last.day === peak.day || peak.day >= 26
        ? [peak]
        : [peak, last];
    return defineChart({
      guides: false,
      margin: 0,
      motion: { path: "morph" },
      marks: [
        tickX(shown, {
          x: "day",
          y: () => 0,
          length: 8,
          key: "day",
          stroke: FAINT,
          strokeWidth: 1,
        }),
        ...(complete
          ? [
              lineY(days, {
                x: "day",
                y: "value",
                key: "day",
                stroke: INK,
                strokeWidth: 1.25,
              }),
            ]
          : []),
        dot(weekdays, {
          id: "weekday-dots",
          x: "day",
          y: "value",
          key: "day",
          r: 2.4,
          fill: INK,
        }),
        dot(weekends, {
          id: "weekend-dots",
          x: "day",
          y: "value",
          key: "day",
          r: 2.6,
          fill: PAPER,
          stroke: INK,
          strokeWidth: 1.1,
        }),
        text(callouts, {
          x: "day",
          y: "value",
          key: "day",
          text: (d) => `${d.value}`,
          anchor: (d) => (d.day >= 27 ? "end" : "middle"),
          dx: (d) => (d.day >= 27 ? 3 : 0),
          dy: -13,
          fill: INK,
          fontSize: 11.5,
          fontWeight: 800,
        }),
      ],
      scales: {
        x: { scale: scaleLinear().domain([1, 30]) },
        y: { scale: scaleLinear().domain([0, yMax * 1.2]) },
      },
    });
  }, [days, revealed, yMax]);

  return (
    <div>
      <Chart
        definition={definition}
        renderer={renderer}
        height={height}
        initialWidth={initialWidth}
        ariaLabel="Daily sign-ups over thirty days"
      />
      <div
        className="relative h-5 pt-1.5 text-[9px] font-semibold tracking-[0.09em]"
        style={{ color: MUTED }}
      >
        <span className="absolute left-0">DAY 1</span>
        <span className="absolute left-[48.3%] -translate-x-1/2">DAY 15</span>
        <span className="absolute right-0">DAY 30</span>
      </div>
    </div>
  );
};
