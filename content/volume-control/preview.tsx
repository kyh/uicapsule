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
  defaultVolume: { default: 35, label: "Start volume", max: 100, min: 0, step: 5, type: "number" },
  title: { default: "Output level", label: "Title", placeholder: "HUD heading", type: "text" },
} as const;

interface PreviewProps {
  variant: VolumeVariant;
  defaultVolume: number;
  title: string;
}

const Preview = ({
  variant = controls.variant.default,
  defaultVolume = controls.defaultVolume.default,
  title = controls.title.default,
}: Partial<PreviewProps>) => (
  <div className="relative h-screen w-full bg-neutral-950">
    <VolumeControl
      key={defaultVolume}
      variant={variant}
      defaultVolume={defaultVolume}
      title={title}
    />
  </div>
);

export default Preview;
