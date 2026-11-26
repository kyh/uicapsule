"use client";

import { EditorialCharts } from "./editorial-charts";
import { SCENES } from "./lib/data";
import { PALETTES, SPRING } from "./lib/tokens";

export const controls = {
  palette: {
    default: "ink",
    group: "Style",
    label: "Palette",
    options: [
      { label: "Ink on paper", value: "ink" },
      { label: "Blueprint", value: "blueprint" },
      { label: "Sepia", value: "sepia" },
      { label: "Red ink", value: "redInk" },
      { label: "Inverted", value: "inverted" },
    ],
    type: "select",
  },
  scale: {
    default: 0.94,
    group: "Style",
    label: "Scale",
    max: 1.1,
    min: 0.5,
    step: 0.01,
    type: "number",
  },
  quarter: {
    default: "Q1",
    group: "Tour",
    label: "Quarter",
    options: ["Q1", "Q2", "Q3"],
    type: "select",
  },
  autoCycle: { default: true, group: "Tour", label: "Auto-cycle", type: "boolean" },
  cycleSeconds: {
    default: 4.6,
    group: "Tour",
    label: "Cycle (s)",
    max: 10,
    min: 2.5,
    step: 0.1,
    type: "number",
  },
  revealMs: {
    default: 1500,
    group: "Motion",
    label: "Ink-in (ms)",
    max: 4000,
    min: 300,
    step: 50,
    type: "number",
  },
  twist: {
    default: 14,
    group: "Motion",
    label: "Dial twist",
    max: 90,
    min: 0,
    step: 1,
    type: "number",
  },
  stiffness: {
    default: 170,
    group: "Motion",
    label: "Stiffness",
    max: 400,
    min: 60,
    step: 5,
    type: "number",
  },
  damping: {
    default: 22,
    group: "Motion",
    label: "Damping",
    max: 40,
    min: 8,
    step: 1,
    type: "number",
  },
  title: {
    default: "The quarter, drawn in ink",
    group: "Copy",
    label: "Title",
    placeholder: "Title",
    type: "text",
  },
  subtitle: {
    default: "four marks, one grammar, one spring",
    group: "Copy",
    label: "Subtitle",
    placeholder: "Subtitle",
    type: "text",
  },
} as const;

interface PreviewProps {
  autoCycle: boolean;
  cycleSeconds: number;
  damping: number;
  palette: keyof typeof PALETTES;
  quarter: "Q1" | "Q2" | "Q3";
  revealMs: number;
  scale: number;
  stiffness: number;
  subtitle: string;
  title: string;
  twist: number;
}

const Preview = ({
  autoCycle = controls.autoCycle.default,
  cycleSeconds = controls.cycleSeconds.default,
  damping = controls.damping.default,
  palette = controls.palette.default,
  quarter = controls.quarter.default,
  revealMs = controls.revealMs.default,
  scale = controls.scale.default,
  stiffness = controls.stiffness.default,
  subtitle = controls.subtitle.default,
  title = controls.title.default,
  twist = controls.twist.default,
}: Partial<PreviewProps>) => (
  <main className="flex h-dvh items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_25%,#26272b_0%,#141518_50%,#08090b_100%)] px-5">
    <div className="origin-center" style={{ transform: `scale(${scale})` }}>
      <EditorialCharts
        key={`${quarter}:${revealMs}:${autoCycle}`}
        palette={PALETTES[palette]}
        initialScene={Math.max(
          0,
          SCENES.findIndex((s) => s.quarter === quarter),
        )}
        autoCycle={autoCycle}
        cycleMs={cycleSeconds * 1000}
        revealMs={revealMs}
        twist={twist}
        spring={{ ...SPRING, damping, stiffness }}
        title={title}
        subtitle={subtitle}
      />
    </div>
  </main>
);

export default Preview;
