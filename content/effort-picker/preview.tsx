"use client";

import type { EffortTheme, EffortVariant } from "./effort-picker";

import { EffortPicker } from "./effort-picker";

const LEVEL_INDEX = { "extra-high": 3, high: 2, light: 0, medium: 1, ultra: 4 } as const;

export const controls = {
  variant: {
    default: "slingshot",
    label: "Variation",
    options: [
      { label: "Slingshot", value: "slingshot" },
      { label: "Karaoke", value: "karaoke" },
      { label: "Curls", value: "curls" },
    ],
    type: "select",
  },
  theme: {
    default: "chatgpt",
    options: [
      { label: "ChatGPT", value: "chatgpt" },
      { label: "Claude", value: "claude" },
    ],
    type: "select",
  },
  level: {
    default: "medium",
    label: "Start level",
    options: [
      { label: "Light", value: "light" },
      { label: "Medium", value: "medium" },
      { label: "High", value: "high" },
      { label: "Extra High", value: "extra-high" },
      { label: "Ultra", value: "ultra" },
    ],
    type: "select",
  },
} as const;

interface PreviewProps {
  level: keyof typeof LEVEL_INDEX;
  theme: EffortTheme;
  variant: EffortVariant;
}

const Preview = ({
  level = controls.level.default,
  theme = controls.theme.default,
  variant = controls.variant.default,
}: Partial<PreviewProps>) => (
  <div className="relative h-screen w-full bg-neutral-950">
    <EffortPicker key={level} variant={variant} theme={theme} defaultLevel={LEVEL_INDEX[level]} />
  </div>
);

export default Preview;
