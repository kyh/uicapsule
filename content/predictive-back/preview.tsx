"use client";

import type { CSSProperties } from "react";

import type { ClayTone } from "./phone-frame";
import { PredictiveBack } from "./predictive-back";

const backdrop: CSSProperties = {
  background: [
    "radial-gradient(ellipse 45% 80% at 0% 50%, rgb(176 82 48 / 0.4), transparent 70%)",
    "radial-gradient(ellipse 50% 55% at 50% 45%, rgb(110 48 30 / 0.35), transparent 72%)",
    "linear-gradient(100deg, #3a1a10 0%, #26110b 45%, #140806 100%)",
  ].join(", "),
};

export const controls = {
  commitAt: {
    default: 110,
    group: "Gesture",
    label: "Commit Point",
    max: 300,
    min: 40,
    step: 5,
    type: "number",
  },
  edgeWidth: {
    default: 28,
    group: "Gesture",
    label: "Edge Zone",
    max: 96,
    min: 12,
    step: 2,
    type: "number",
  },
  peekScale: {
    default: 0.86,
    group: "Gesture",
    label: "Peek Scale",
    max: 0.98,
    min: 0.7,
    step: 0.01,
    type: "number",
  },
  settleDuration: {
    default: 0.36,
    group: "Motion",
    label: "Settle Duration",
    max: 1.2,
    min: 0.15,
    step: 0.01,
    type: "number",
  },
  bounce: {
    default: 0.15,
    group: "Motion",
    label: "Cancel Bounce",
    max: 0.6,
    min: 0,
    step: 0.01,
    type: "number",
  },
  dim: {
    default: 0.6,
    group: "Surface",
    label: "Behind Dim",
    max: 0.9,
    min: 0,
    step: 0.05,
    type: "number",
  },
  arrow: { default: true, group: "Surface", label: "Back Arrow", type: "boolean" },
  accent: { default: "#e0673a", group: "Surface", label: "Accent", type: "color" },
  tone: {
    default: "terracotta",
    group: "Surface",
    label: "Phone Tone",
    options: [
      { label: "Terracotta", value: "terracotta" },
      { label: "Espresso", value: "espresso" },
      { label: "Graphite", value: "graphite" },
      { label: "Moss", value: "moss" },
      { label: "Ochre", value: "ochre" },
      { label: "Plum", value: "plum" },
      { label: "Slate", value: "slate" },
      { label: "Teal", value: "teal" },
    ],
    type: "select",
  },
  title: {
    default: "Edge peeks: predictive back and the end of mystery navigation",
    group: "Copy",
    label: "Headline",
    placeholder: "Article headline",
    type: "text",
  },
  hint: {
    default: "Drag from the left edge",
    group: "Copy",
    label: "Hint",
    placeholder: "Helper text",
    type: "text",
  },
} as const;

interface PreviewProps {
  accent: string;
  arrow: boolean;
  bounce: number;
  commitAt: number;
  dim: number;
  edgeWidth: number;
  hint: string;
  peekScale: number;
  settleDuration: number;
  title: string;
  tone: ClayTone;
}

const Preview = ({
  accent = controls.accent.default,
  arrow = controls.arrow.default,
  bounce = controls.bounce.default,
  commitAt = controls.commitAt.default,
  dim = controls.dim.default,
  edgeWidth = controls.edgeWidth.default,
  hint = controls.hint.default,
  peekScale = controls.peekScale.default,
  settleDuration = controls.settleDuration.default,
  title = controls.title.default,
  tone = controls.tone.default,
}: Partial<PreviewProps>) => (
  <main className="flex h-dvh items-center justify-center overflow-hidden p-5" style={backdrop}>
    <PredictiveBack
      accent={accent}
      arrow={arrow}
      bounce={bounce}
      commitAt={commitAt}
      dim={dim}
      edgeWidth={edgeWidth}
      hint={hint}
      peekScale={peekScale}
      settleDuration={settleDuration}
      title={title}
      tone={tone}
    />
  </main>
);

export default Preview;
