"use client";

import type { EffortTheme, EffortVariant } from "./effort-picker";

import { EffortPicker } from "./effort-picker";

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
} as const;

interface PreviewProps {
  theme: EffortTheme;
  variant: EffortVariant;
}

const Preview = ({
  theme = controls.theme.default,
  variant = controls.variant.default,
}: Partial<PreviewProps>) => (
  <div className="relative h-screen w-full bg-neutral-950">
    <EffortPicker variant={variant} theme={theme} />
  </div>
);

export default Preview;
