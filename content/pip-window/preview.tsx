"use client";

import type { CSSProperties } from "react";

import type { ClayTone } from "./phone-frame";
import type { PipCorner } from "./pip-window";
import { PipWindow } from "./pip-window";

const backdrop: CSSProperties = {
  background: [
    "repeating-linear-gradient(0deg, rgb(255 255 255 / 0.018) 0 1px, transparent 1px 4px)",
    "radial-gradient(ellipse 60% 45% at 50% 100%, rgb(46 120 116 / 0.35), transparent 75%)",
    "radial-gradient(ellipse 45% 55% at 50% 40%, rgb(30 78 78 / 0.4), transparent 70%)",
    "linear-gradient(180deg, #0a1c1d 0%, #07191a 45%, #031011 100%)",
  ].join(", "),
};

export const controls = {
  name: { default: "Nova", label: "Caller", placeholder: "Name", type: "text" },
  initials: { default: "NV", label: "Initials", placeholder: "NV", type: "text" },
  defaultCorner: {
    default: "bottom-right",
    label: "Start corner",
    options: [
      { label: "Top left", value: "top-left" },
      { label: "Top right", value: "top-right" },
      { label: "Bottom left", value: "bottom-left" },
      { label: "Bottom right", value: "bottom-right" },
    ],
    type: "select",
  },
  width: { default: 150, label: "Window width", max: 200, min: 120, step: 2, type: "number" },
  margin: { default: 14, label: "Edge margin", max: 40, min: 6, step: 1, type: "number" },
  momentum: { default: 0.18, label: "Throw", max: 0.4, min: 0.04, step: 0.01, type: "number" },
  bounce: { default: 0.32, label: "Bounce", max: 0.6, min: 0.08, step: 0.01, type: "number" },
  duration: {
    default: 0.55,
    label: "Settle time",
    max: 1.2,
    min: 0.25,
    step: 0.05,
    type: "number",
  },
  tuck: { default: true, label: "Edge tuck", type: "boolean" },
  peek: { default: 26, label: "Peek tab", max: 56, min: 18, step: 1, type: "number" },
  accent: { default: "#00d492", label: "Speaking", type: "color" },
  tone: {
    default: "teal",
    label: "Phone",
    options: [
      { label: "Teal", value: "teal" },
      { label: "Graphite", value: "graphite" },
      { label: "Slate", value: "slate" },
      { label: "Moss", value: "moss" },
      { label: "Plum", value: "plum" },
      { label: "Espresso", value: "espresso" },
      { label: "Ochre", value: "ochre" },
      { label: "Terracotta", value: "terracotta" },
    ],
    type: "select",
  },
  hint: {
    default: "Flick the call window · throw it off an edge to tuck it",
    label: "Hint",
    placeholder: "Hint text",
    type: "text",
  },
} as const;

interface PreviewProps {
  accent: string;
  bounce: number;
  defaultCorner: PipCorner;
  duration: number;
  hint: string;
  initials: string;
  margin: number;
  momentum: number;
  name: string;
  peek: number;
  tone: ClayTone;
  tuck: boolean;
  width: number;
}

const Preview = ({
  accent = controls.accent.default,
  bounce = controls.bounce.default,
  defaultCorner = controls.defaultCorner.default,
  duration = controls.duration.default,
  hint = controls.hint.default,
  initials = controls.initials.default,
  margin = controls.margin.default,
  momentum = controls.momentum.default,
  name = controls.name.default,
  peek = controls.peek.default,
  tone = controls.tone.default,
  tuck = controls.tuck.default,
  width = controls.width.default,
}: Partial<PreviewProps>) => (
  <main className="flex h-dvh items-center justify-center overflow-hidden p-5" style={backdrop}>
    <PipWindow
      key={defaultCorner}
      accent={accent}
      bounce={bounce}
      defaultCorner={defaultCorner}
      duration={duration}
      hint={hint}
      initials={initials}
      margin={margin}
      momentum={momentum}
      name={name}
      peek={peek}
      tone={tone}
      tuck={tuck}
      width={width}
    />
  </main>
);

export default Preview;
