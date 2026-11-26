"use client";

import { SCREENS } from "./data/catalog";
import { DesignSystem } from "./design-system";
import type { ScreenId } from "./design-system";

import "./tokens.css";

export const controls = {
  theme: {
    default: "light",
    label: "Theme",
    options: [
      { label: "Light", value: "light" },
      { label: "Dark", value: "dark" },
    ],
    type: "select",
  },
  accent: { default: "#ff8c2b", label: "Accent", type: "color" },
  radiusScale: { default: 1, label: "Roundness", max: 2, min: 0, step: 0.05, type: "number" },
  typeScale: { default: 1, label: "Type scale", max: 1.25, min: 0.85, step: 0.05, type: "number" },
  motionScale: { default: 1, label: "Motion", max: 3, min: 0, step: 0.25, type: "number" },
  screen: {
    default: "all",
    label: "In use",
    options: [
      { label: "All screens", value: "all" },
      ...SCREENS.map((item) => ({ label: item.name, value: item.id })),
    ],
    type: "select",
  },
} as const;

interface PreviewProps {
  accent: string;
  motionScale: number;
  radiusScale: number;
  screen: "all" | ScreenId;
  theme: "light" | "dark";
  typeScale: number;
}

const Preview = ({
  accent = controls.accent.default,
  motionScale = controls.motionScale.default,
  radiusScale = controls.radiusScale.default,
  screen = controls.screen.default,
  theme = controls.theme.default,
  typeScale = controls.typeScale.default,
}: Partial<PreviewProps>) => (
  <DesignSystem
    accent={accent.toLowerCase() === controls.accent.default ? undefined : accent}
    motionScale={motionScale}
    radiusScale={radiusScale}
    screen={screen === "all" ? undefined : screen}
    theme={theme}
    typeScale={typeScale}
  />
);

export default Preview;
