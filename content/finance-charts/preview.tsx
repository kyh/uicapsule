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
} as const;

interface PreviewProps {
  autoScroll: boolean;
  columnWidth: number;
  speed: number;
}

const Preview = ({
  autoScroll = controls.autoScroll.default,
  columnWidth = controls.columnWidth.default,
  speed = controls.speed.default,
}: Partial<PreviewProps>) => (
  <main className="flex h-dvh items-center justify-center overflow-hidden bg-[#f3f4f7]">
    <FinanceCharts autoScroll={autoScroll} columnWidth={columnWidth} speed={speed} />
  </main>
);

export default Preview;
