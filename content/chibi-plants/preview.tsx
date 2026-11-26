"use client";

import type { ChibiVariant } from "./chibi-plants";
import { CHIBI_VARIANTS, ChibiPlants, VARIANTS } from "./chibi-plants";

export const controls = {
  variant: {
    default: "pip",
    group: "Plant",
    label: "Plant",
    options: CHIBI_VARIANTS.map((value) => ({ label: VARIANTS[value].label, value })),
    type: "select",
  },
  eyeScale: {
    default: 1,
    group: "Plant",
    label: "Eye size",
    max: 1.6,
    min: 0.5,
    step: 0.05,
    type: "number",
  },
  gaze: {
    default: 1,
    group: "Plant",
    label: "Cursor follow",
    max: 1.5,
    min: 0,
    step: 0.05,
    type: "number",
  },
  wobble: {
    default: 1,
    group: "Motion",
    label: "Idle sway",
    max: 2,
    min: 0,
    step: 0.05,
    type: "number",
  },
  speed: {
    default: 1,
    group: "Motion",
    label: "Idle speed",
    max: 3,
    min: 0,
    step: 0.1,
    type: "number",
  },
  firmness: {
    default: 0.5,
    group: "Motion",
    label: "Firmness",
    max: 1,
    min: 0,
    step: 0.05,
    type: "number",
  },
  interactive: { default: true, group: "Motion", label: "Grab & toss", type: "boolean" },
  customColors: { default: false, group: "Color", label: "Custom colors", type: "boolean" },
  bodyColor: { default: "#9fd6a3", group: "Color", label: "Body", type: "color" },
  leafColor: { default: "#67b26f", group: "Color", label: "Leaves", type: "color" },
  potColor: { default: "#d98b71", group: "Color", label: "Pot", type: "color" },
  cheekColor: { default: "#e8798f", group: "Color", label: "Blush", type: "color" },
  glow: { default: "#2e2a33", group: "Color", label: "Backdrop glow", type: "color" },
  backdrop: { default: "#0b0a0e", group: "Color", label: "Backdrop", type: "color" },
} as const;

interface PreviewProps {
  backdrop: string;
  bodyColor: string;
  cheekColor: string;
  customColors: boolean;
  eyeScale: number;
  firmness: number;
  gaze: number;
  glow: string;
  interactive: boolean;
  leafColor: string;
  potColor: string;
  speed: number;
  variant: ChibiVariant;
  wobble: number;
}

const Preview = ({
  backdrop = controls.backdrop.default,
  bodyColor = controls.bodyColor.default,
  cheekColor = controls.cheekColor.default,
  customColors = controls.customColors.default,
  eyeScale = controls.eyeScale.default,
  firmness = controls.firmness.default,
  gaze = controls.gaze.default,
  glow = controls.glow.default,
  interactive = controls.interactive.default,
  leafColor = controls.leafColor.default,
  potColor = controls.potColor.default,
  speed = controls.speed.default,
  variant = controls.variant.default,
  wobble = controls.wobble.default,
}: Partial<PreviewProps>) => (
  <main className="relative h-dvh w-full overflow-hidden" style={{ backgroundColor: backdrop }}>
    <ChibiPlants
      background={[glow, backdrop]}
      bodyColor={customColors ? bodyColor : undefined}
      cheekColor={cheekColor}
      className="absolute inset-0"
      eyeScale={eyeScale}
      firmness={firmness}
      gaze={gaze}
      interactive={interactive}
      leafColor={customColors ? leafColor : undefined}
      potColor={customColors ? potColor : undefined}
      speed={speed}
      variant={variant}
      wobble={wobble}
    />
  </main>
);

export default Preview;
