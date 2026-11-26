"use client";

import type { ChibiVariant } from "./chibi-plants";
import { CHIBI_VARIANTS, ChibiPlants, VARIANTS } from "./chibi-plants";

export const controls = {
  variant: {
    default: "pip",
    label: "Plant",
    options: CHIBI_VARIANTS.map((value) => ({ label: VARIANTS[value].label, value })),
    type: "select",
  },
  eyeScale: { default: 1, label: "Eye size", max: 1.6, min: 0.5, step: 0.05, type: "number" },
  gaze: { default: 1, label: "Cursor follow", max: 1.5, min: 0, step: 0.05, type: "number" },
  wobble: { default: 1, label: "Idle sway", max: 2, min: 0, step: 0.05, type: "number" },
  speed: { default: 1, label: "Idle speed", max: 3, min: 0, step: 0.1, type: "number" },
  firmness: { default: 0.5, label: "Firmness", max: 1, min: 0, step: 0.05, type: "number" },
  interactive: { default: true, label: "Grab & toss", type: "boolean" },
  cheekColor: { default: "#e8798f", label: "Blush", type: "color" },
  glow: { default: "#2e2a33", label: "Backdrop glow", type: "color" },
  backdrop: { default: "#0b0a0e", label: "Backdrop", type: "color" },
} as const;

interface PreviewProps {
  backdrop: string;
  cheekColor: string;
  eyeScale: number;
  firmness: number;
  gaze: number;
  glow: string;
  interactive: boolean;
  speed: number;
  variant: ChibiVariant;
  wobble: number;
}

const Preview = ({
  backdrop = controls.backdrop.default,
  cheekColor = controls.cheekColor.default,
  eyeScale = controls.eyeScale.default,
  firmness = controls.firmness.default,
  gaze = controls.gaze.default,
  glow = controls.glow.default,
  interactive = controls.interactive.default,
  speed = controls.speed.default,
  variant = controls.variant.default,
  wobble = controls.wobble.default,
}: Partial<PreviewProps>) => (
  <main className="relative h-dvh w-full overflow-hidden" style={{ backgroundColor: backdrop }}>
    <ChibiPlants
      background={[glow, backdrop]}
      cheekColor={cheekColor}
      className="absolute inset-0"
      eyeScale={eyeScale}
      firmness={firmness}
      gaze={gaze}
      interactive={interactive}
      speed={speed}
      variant={variant}
      wobble={wobble}
    />
  </main>
);

export default Preview;
