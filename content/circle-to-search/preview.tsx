"use client";

import { CircleToSearch } from "./circle-to-search";
import type { ClayTone } from "./phone-frame";

export const controls = {
  strokeStart: { default: "#a5b4fc", group: "Stroke", label: "Stroke start", type: "color" },
  strokeMid: { default: "#f0abfc", group: "Stroke", label: "Stroke middle", type: "color" },
  strokeEnd: { default: "#67e8f9", group: "Stroke", label: "Stroke end", type: "color" },
  strokeWidth: {
    default: 5,
    group: "Stroke",
    label: "Stroke width",
    max: 12,
    min: 2,
    step: 0.5,
    type: "number",
  },
  strokeGlow: {
    default: 10,
    group: "Stroke",
    label: "Stroke glow",
    max: 24,
    min: 0,
    step: 1,
    type: "number",
  },
  accent: { default: "#7c86ff", group: "Surface", label: "Accent", type: "color" },
  dim: {
    default: 0.35,
    group: "Surface",
    label: "Dim",
    max: 0.7,
    min: 0,
    step: 0.05,
    type: "number",
  },
  tone: {
    default: "plum",
    group: "Surface",
    label: "Shell",
    options: [
      { label: "Espresso", value: "espresso" },
      { label: "Graphite", value: "graphite" },
      { label: "Moss", value: "moss" },
      { label: "Ochre", value: "ochre" },
      { label: "Plum", value: "plum" },
      { label: "Slate", value: "slate" },
      { label: "Teal", value: "teal" },
      { label: "Terracotta", value: "terracotta" },
    ],
    type: "select",
  },
  pulseDuration: {
    default: 2,
    group: "Motion",
    label: "Edge pulse",
    max: 5,
    min: 0.6,
    step: 0.1,
    type: "number",
  },
  sheetBounce: {
    default: 0.18,
    group: "Motion",
    label: "Sheet bounce",
    max: 0.6,
    min: 0,
    step: 0.02,
    type: "number",
  },
  title: {
    default: "Autumn lookbook",
    group: "Copy",
    label: "Title",
    placeholder: "Page title",
    type: "text",
  },
  subtitle: {
    default: "Editorial · 12 pieces",
    group: "Copy",
    label: "Subtitle",
    placeholder: "Page subtitle",
    type: "text",
  },
  hint: {
    default: "Circle anything",
    group: "Copy",
    label: "Hint",
    placeholder: "Search prompt",
    type: "text",
  },
} as const;

interface PreviewProps {
  accent: string;
  dim: number;
  hint: string;
  pulseDuration: number;
  sheetBounce: number;
  strokeEnd: string;
  strokeGlow: number;
  strokeMid: string;
  strokeStart: string;
  strokeWidth: number;
  subtitle: string;
  title: string;
  tone: ClayTone;
}

const Preview = ({
  accent = controls.accent.default,
  dim = controls.dim.default,
  hint = controls.hint.default,
  pulseDuration = controls.pulseDuration.default,
  sheetBounce = controls.sheetBounce.default,
  strokeEnd = controls.strokeEnd.default,
  strokeGlow = controls.strokeGlow.default,
  strokeMid = controls.strokeMid.default,
  strokeStart = controls.strokeStart.default,
  strokeWidth = controls.strokeWidth.default,
  subtitle = controls.subtitle.default,
  title = controls.title.default,
  tone = controls.tone.default,
}: Partial<PreviewProps>) => (
  <main className="flex h-dvh items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_120%_60%_at_50%_105%,#6b2458_0%,rgb(107_36_88/0)_65%),radial-gradient(ellipse_80%_50%_at_20%_0%,rgb(76_42_130/0.45)_0%,transparent_70%),linear-gradient(180deg,#120b1f_0%,#1f1230_50%,#2c1232_100%)] p-5">
    <CircleToSearch
      accent={accent}
      dim={dim}
      hint={hint}
      pulseDuration={pulseDuration}
      sheetBounce={sheetBounce}
      strokeColors={[strokeStart, strokeMid, strokeEnd]}
      strokeGlow={strokeGlow}
      strokeWidth={strokeWidth}
      subtitle={subtitle}
      title={title}
      tone={tone}
    />
  </main>
);

export default Preview;
