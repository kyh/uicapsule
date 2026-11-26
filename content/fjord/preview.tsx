"use client";

import { DesignSystem } from "./design-system";

import "./tokens.css";
import "./styles/base.css";
import "./styles/controls.css";
import "./styles/display.css";
import "./styles/overlays.css";
import "./styles/agents.css";
import "./styles/page.css";

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
  focusHue: { default: 244, label: "Focus hue", max: 360, min: 0, step: 1, type: "number" },
  radiusScale: { default: 1, label: "Radius", max: 2, min: 0, step: 0.05, type: "number" },
  typeScale: {
    default: 1,
    label: "Type scale",
    max: 1.25,
    min: 0.875,
    step: 0.025,
    type: "number",
  },
  density: {
    default: "regular",
    label: "Density",
    options: [
      { label: "Compact", value: "compact" },
      { label: "Regular", value: "regular" },
      { label: "Comfortable", value: "comfortable" },
    ],
    type: "select",
  },
  reducedMotion: { default: false, label: "Reduce motion", type: "boolean" },
  featuredScreen: {
    default: "screen-repo",
    label: "Featured screen",
    options: [
      { label: "Repo overview", value: "screen-repo" },
      { label: "Run trace", value: "screen-trace" },
      { label: "Model swap", value: "screen-swap" },
      { label: "Deploy keys", value: "screen-keys" },
    ],
    type: "select",
  },
} as const;

interface PreviewProps {
  theme: "light" | "dark";
  focusHue: number;
  radiusScale: number;
  typeScale: number;
  density: "compact" | "regular" | "comfortable";
  reducedMotion: boolean;
  featuredScreen: "screen-repo" | "screen-trace" | "screen-swap" | "screen-keys";
}

const Preview = ({
  theme = controls.theme.default,
  focusHue = controls.focusHue.default,
  radiusScale = controls.radiusScale.default,
  typeScale = controls.typeScale.default,
  density = controls.density.default,
  reducedMotion = controls.reducedMotion.default,
  featuredScreen = controls.featuredScreen.default,
}: Partial<PreviewProps>) => (
  <DesignSystem
    density={density}
    featuredScreen={featuredScreen}
    focusHue={focusHue}
    radiusScale={radiusScale}
    reducedMotion={reducedMotion}
    theme={theme}
    typeScale={typeScale}
  />
);

export default Preview;
