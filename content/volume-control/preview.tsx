"use client";

import type { VolumeVariant } from "./volume-control";

import { VolumeControl } from "./volume-control";

export const controls = {
  variant: {
    default: "tilt",
    options: [
      { label: "Tilt", value: "tilt" },
      { label: "Cannon", value: "cannon" },
      { label: "Curling", value: "curling" },
      { label: "Dots", value: "dots" },
      { label: "+/− game", value: "plus-minus" },
    ],
    type: "select",
  },
} as const;

interface PreviewProps {
  variant: VolumeVariant;
}

const Preview = ({ variant = controls.variant.default }: Partial<PreviewProps>) => (
  <div className="relative h-screen w-full bg-neutral-950">
    <VolumeControl variant={variant} />
  </div>
);

export default Preview;
