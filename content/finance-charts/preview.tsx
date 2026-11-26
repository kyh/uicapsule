"use client";

import { FinanceCharts } from "./finance-charts";

export const controls = {
  autoScroll: { default: true, label: "Auto-scroll", type: "boolean" },
  speed: { default: 42, label: "Scroll speed", max: 160, min: 10, step: 2, type: "number" },
  columnWidth: {
    default: 340,
    label: "Column width",
    max: 480,
    min: 260,
    step: 10,
    type: "number",
  },
  gap: { default: 16, label: "Gap", max: 40, min: 4, step: 2, type: "number" },
  background: { default: "#f3f4f7", label: "Background", type: "color" },
} as const;

interface PreviewProps {
  autoScroll: boolean;
  background: string;
  columnWidth: number;
  gap: number;
  speed: number;
}

const Preview = ({
  autoScroll = controls.autoScroll.default,
  background = controls.background.default,
  columnWidth = controls.columnWidth.default,
  gap = controls.gap.default,
  speed = controls.speed.default,
}: Partial<PreviewProps>) => (
  <main className="flex h-dvh items-center justify-center overflow-hidden" style={{ background }}>
    <FinanceCharts
      autoScroll={autoScroll}
      background={background}
      columnWidth={columnWidth}
      gap={gap}
      speed={speed}
    />
  </main>
);

export default Preview;
