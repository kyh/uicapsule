"use client";

import { SplitButton } from "./split-button";

export const controls = {
  label: { default: "Save", placeholder: "Action", type: "text" },
  doneLabel: { default: "Saved", label: "Done label", placeholder: "Confirmation", type: "text" },
  width: { default: 144, label: "Width", max: 220, min: 120, step: 2, type: "number" },
  accent: { default: "#a8c7fa", label: "Accent", type: "color" },
  ink: { default: "#062e6f", label: "Ink", type: "color" },
  menuColor: { default: "#2b2c30", label: "Menu", type: "color" },
  menuInk: { default: "#e3e3e3", label: "Menu ink", type: "color" },
  highlight: { default: "#004a77", label: "Highlight", type: "color" },
  highlightInk: { default: "#c2e7ff", label: "Highlight ink", type: "color" },
  bounce: { default: 0.35, label: "Bounce", max: 0.7, min: 0, step: 0.05, type: "number" },
  morphDuration: {
    default: 0.3,
    label: "Morph duration",
    max: 1,
    min: 0.1,
    step: 0.05,
    type: "number",
  },
  pressScale: {
    default: 0.9,
    label: "Press scale",
    max: 0.97,
    min: 0.75,
    step: 0.01,
    type: "number",
  },
  confirmMs: { default: 1600, label: "Confirm ms", max: 4000, min: 600, step: 100, type: "number" },
  glow: { default: "#1d2433", label: "Glow", type: "color" },
  background: { default: "#131314", label: "Background", type: "color" },
} as const;

interface PreviewProps {
  accent: string;
  background: string;
  bounce: number;
  confirmMs: number;
  doneLabel: string;
  glow: string;
  highlight: string;
  highlightInk: string;
  ink: string;
  label: string;
  menuColor: string;
  menuInk: string;
  morphDuration: number;
  pressScale: number;
  width: number;
}

const Preview = ({
  accent = controls.accent.default,
  background = controls.background.default,
  bounce = controls.bounce.default,
  confirmMs = controls.confirmMs.default,
  doneLabel = controls.doneLabel.default,
  glow = controls.glow.default,
  highlight = controls.highlight.default,
  highlightInk = controls.highlightInk.default,
  ink = controls.ink.default,
  label = controls.label.default,
  menuColor = controls.menuColor.default,
  menuInk = controls.menuInk.default,
  morphDuration = controls.morphDuration.default,
  pressScale = controls.pressScale.default,
  width = controls.width.default,
}: Partial<PreviewProps>) => (
  <main
    className="flex h-dvh items-start justify-center overflow-hidden pt-[38vh]"
    style={{
      background: `radial-gradient(ellipse 60% 55% at 50% 40%, ${glow} 0%, ${background} 70%)`,
    }}
  >
    <SplitButton
      accent={accent}
      bounce={bounce}
      confirmMs={confirmMs}
      doneLabel={doneLabel}
      highlight={highlight}
      highlightInk={highlightInk}
      ink={ink}
      label={label}
      menuColor={menuColor}
      menuInk={menuInk}
      morphDuration={morphDuration}
      pressScale={pressScale}
      width={width}
    />
  </main>
);

export default Preview;
