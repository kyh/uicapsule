"use client";

import { DesignSystem } from "./design-system";

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
  accent: { default: "#f3821d", label: "Accent", type: "color" },
  density: {
    default: "default",
    label: "Density",
    options: [
      { label: "Compact", value: "compact" },
      { label: "Default", value: "default" },
      { label: "Comfortable", value: "comfortable" },
    ],
    type: "select",
  },
  radiusScale: { default: 1, label: "Radius", max: 2, min: 0, step: 0.05, type: "number" },
  durationScale: { default: 1, label: "Duration", max: 4, min: 0, step: 0.25, type: "number" },
} as const;

interface PreviewProps {
  theme: "light" | "dark";
  accent: string;
  density: "compact" | "default" | "comfortable";
  radiusScale: number;
  durationScale: number;
}

const Preview = ({
  theme = controls.theme.default,
  accent = controls.accent.default,
  density = controls.density.default,
  radiusScale = controls.radiusScale.default,
  durationScale = controls.durationScale.default,
}: Partial<PreviewProps>) => (
  <DesignSystem
    accent={accent}
    density={density}
    durationScale={durationScale}
    radiusScale={radiusScale}
    theme={theme}
  />
);

export default Preview;
