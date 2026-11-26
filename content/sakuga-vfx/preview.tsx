"use client";

import { useEffect } from "react";

import { clock } from "./sakuga-core";
import { SakugaVfx } from "./sakuga-vfx";

export const controls = {
  speed: {
    default: 1,
    group: "Style",
    label: "Speed",
    max: 1.5,
    min: 0.2,
    step: 0.05,
    type: "number",
  },
  outline: {
    default: 3.2,
    group: "Style",
    label: "Outline",
    max: 5,
    min: 1.5,
    step: 0.1,
    type: "number",
  },
  radius: {
    default: 15,
    group: "Style",
    label: "Radius",
    max: 26,
    min: 0,
    step: 1,
    type: "number",
  },
  primary: { default: "#8f8df7", group: "Color", label: "Primary", type: "color" },
  accent: { default: "#ff5fa8", group: "Color", label: "Accent", type: "color" },
  ink: { default: "#1d1a4a", group: "Color", label: "Ink", type: "color" },
  shadow: { default: "#b8b3ff", group: "Color", label: "Shadow", type: "color" },
  paper: { default: "#ffffff", group: "Color", label: "Paper", type: "color" },
  line: { default: "#5a4fd8", group: "Color", label: "Effect line", type: "color" },
  hints: { default: true, group: "Copy", label: "Hints", type: "boolean" },
  confirmLabel: { default: "Confirm", group: "Copy", label: "Button label", type: "text" },
  toastMessage: {
    default: "Saved successfully!",
    group: "Copy",
    label: "Toast message",
    type: "text",
  },
  tooltipText: { default: "Helpful hint!", group: "Copy", label: "Tooltip text", type: "text" },
} as const;

interface PreviewProps {
  primary: string;
  accent: string;
  ink: string;
  shadow: string;
  paper: string;
  line: string;
  radius: number;
  outline: number;
  speed: number;
  hints: boolean;
  confirmLabel: string;
  toastMessage: string;
  tooltipText: string;
}

const Preview = ({
  primary = controls.primary.default,
  accent = controls.accent.default,
  ink = controls.ink.default,
  shadow = controls.shadow.default,
  paper = controls.paper.default,
  line = controls.line.default,
  radius = controls.radius.default,
  outline = controls.outline.default,
  speed = controls.speed.default,
  hints = controls.hints.default,
  confirmLabel = controls.confirmLabel.default,
  toastMessage = controls.toastMessage.default,
  tooltipText = controls.tooltipText.default,
}: Partial<PreviewProps>) => {
  useEffect(() => {
    Reflect.set(globalThis, "SakugaFX", clock);
  }, []);

  return (
    <main
      className="min-h-dvh overflow-x-clip px-4 py-8 [color-scheme:light]"
      style={{ background: paper }}
    >
      <div className="mx-auto flex justify-center">
        <SakugaVfx
          theme={{ accent, ink, line, outline, paper, primary, radius, shadow }}
          speed={speed}
          hints={hints}
          confirmLabel={confirmLabel || controls.confirmLabel.default}
          toastMessage={toastMessage || controls.toastMessage.default}
          tooltipText={tooltipText || controls.tooltipText.default}
        />
      </div>
    </main>
  );
};

export default Preview;
