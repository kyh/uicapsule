"use client";

import { DesignSystem, SCREEN_OPTIONS } from "./design-system";
import type { ScreenId } from "./design-system";
import { LAMPS, LAMP_NAMES } from "./foundations/settings";
import type { Density, Lamp, Theme } from "./foundations/settings";

import "./tokens.css";
import "./styles/base.css";
import "./styles/controls.css";
import "./styles/overlays.css";
import "./styles/data.css";
import "./styles/showcase.css";

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
  lamp: {
    default: "amber",
    label: "Lamp",
    options: LAMP_NAMES.map((value) => ({ label: LAMPS[value].label, value })),
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
  featured: {
    default: "runs",
    label: "Featured screen",
    options: SCREEN_OPTIONS,
    type: "select",
  },
  motion: { default: true, label: "Motion", type: "boolean" },
} as const;

interface PreviewProps {
  density: Density;
  featured: ScreenId;
  lamp: Lamp;
  motion: boolean;
  theme: Theme;
}

const Preview = ({
  density = controls.density.default,
  featured = controls.featured.default,
  lamp = controls.lamp.default,
  motion = controls.motion.default,
  theme = controls.theme.default,
}: Partial<PreviewProps>) => (
  <DesignSystem density={density} featured={featured} lamp={lamp} motion={motion} theme={theme} />
);

export default Preview;
