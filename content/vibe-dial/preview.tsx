"use client";

import { VibeDial } from "./vibe-dial";

export const controls = {
  start: { default: 10, group: "Value", label: "Start", max: 100, min: 0, step: 1, type: "number" },
  max: {
    default: 2,
    group: "Value",
    label: "Max value",
    max: 10,
    min: 1,
    step: 0.5,
    type: "number",
  },
  decimals: {
    default: 2,
    group: "Value",
    label: "Decimals",
    max: 3,
    min: 0,
    step: 1,
    type: "number",
  },
  sensitivity: {
    default: 1,
    group: "Value",
    label: "Sensitivity",
    max: 3,
    min: 0.25,
    step: 0.05,
    type: "number",
  },
  coolHue: {
    default: 215,
    group: "Style",
    label: "Cool hue",
    max: 360,
    min: 0,
    step: 1,
    type: "number",
  },
  hotHue: {
    default: 25,
    group: "Style",
    label: "Hot hue",
    max: 360,
    min: 0,
    step: 1,
    type: "number",
  },
  glow: {
    default: 1,
    group: "Style",
    label: "Glow",
    max: 1.5,
    min: 0,
    step: 0.05,
    type: "number",
  },
  ticks: {
    default: 41,
    group: "Style",
    label: "Ticks",
    max: 81,
    min: 13,
    step: 4,
    type: "number",
  },
  size: {
    default: 300,
    group: "Style",
    label: "Size",
    max: 400,
    min: 220,
    step: 10,
    type: "number",
  },
  label: {
    default: "temperature",
    group: "Copy",
    label: "Label",
    placeholder: "Readout label",
    type: "text",
  },
  moods: {
    default: "Precise, Balanced, Creative, Loose, Unhinged",
    group: "Copy",
    label: "Moods",
    placeholder: "Comma-separated, low to high",
    type: "text",
  },
  lowLabel: {
    default: "safe",
    group: "Copy",
    label: "Low end",
    placeholder: "Low end label",
    type: "text",
  },
  highLabel: {
    default: "spicy",
    group: "Copy",
    label: "High end",
    placeholder: "High end label",
    type: "text",
  },
} as const;

interface PreviewProps {
  coolHue: number;
  decimals: number;
  glow: number;
  highLabel: string;
  hotHue: number;
  label: string;
  lowLabel: string;
  max: number;
  moods: string;
  sensitivity: number;
  size: number;
  start: number;
  ticks: number;
}

const Preview = ({
  coolHue = controls.coolHue.default,
  decimals = controls.decimals.default,
  glow = controls.glow.default,
  highLabel = controls.highLabel.default,
  hotHue = controls.hotHue.default,
  label = controls.label.default,
  lowLabel = controls.lowLabel.default,
  max = controls.max.default,
  moods = controls.moods.default,
  sensitivity = controls.sensitivity.default,
  size = controls.size.default,
  start = controls.start.default,
  ticks = controls.ticks.default,
}: Partial<PreviewProps>) => (
  <main className="flex h-dvh items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_42%,rgb(234_88_12/0.12)_0%,transparent_40%),radial-gradient(ellipse_at_50%_45%,#2a150b_0%,#170b06_55%,#0a0503_100%)] p-5">
    <VibeDial
      key={`${String(start)}:${String(max)}`}
      coolHue={coolHue}
      decimals={decimals}
      defaultValue={(start / 100) * max}
      glow={glow}
      highLabel={highLabel}
      hotHue={hotHue}
      label={label}
      lowLabel={lowLabel}
      max={max}
      moods={moods
        .split(",")
        .map((mood) => mood.trim())
        .filter(Boolean)}
      sensitivity={sensitivity}
      size={size}
      ticks={ticks}
    />
  </main>
);

export default Preview;
