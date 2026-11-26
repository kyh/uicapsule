"use client";

import { DesignSystem } from "./design-system";

import "./tokens.css";
import "./vellum.css";
import "./page.css";

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
  radiusScale: { default: 1, label: "Radius", max: 2, min: 0, step: 0.1, type: "number" },
  monoScale: { default: 0.8, label: "Mono scale", max: 1, min: 0.7, step: 0.05, type: "number" },
  reducedMotion: { default: false, label: "Reduced motion", type: "boolean" },
} as const;

interface PreviewProps {
  theme: "light" | "dark";
  density: "compact" | "default" | "comfortable";
  radiusScale: number;
  monoScale: number;
  reducedMotion: boolean;
}

const Preview = ({
  theme = controls.theme.default,
  density = controls.density.default,
  radiusScale = controls.radiusScale.default,
  monoScale = controls.monoScale.default,
  reducedMotion = controls.reducedMotion.default,
}: Partial<PreviewProps>) => (
  <DesignSystem
    density={density}
    monoScale={monoScale}
    radiusScale={radiusScale}
    reducedMotion={reducedMotion}
    theme={theme}
  />
);

export default Preview;
