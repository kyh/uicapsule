"use client";

import { TeslaClimate } from "./tesla-climate";

export const controls = {
  defaultTemp: { default: 68, label: "Start temp", max: 80, min: 60, step: 1, type: "number" },
  defaultFanSpeed: { default: 4, label: "Start fan", max: 10, min: 1, step: 1, type: "number" },
  coldColor: { default: "#5a8cf0", label: "Cold air", type: "color" },
  hotColor: { default: "#eb6969", label: "Hot air", type: "color" },
  strandCount: { default: 38, label: "Strands", max: 80, min: 8, step: 1, type: "number" },
  glow: { default: 7, label: "Glow", max: 16, min: 0, step: 0.5, type: "number" },
  reach: { default: 1, label: "Reach", max: 1.5, min: 0.5, step: 0.05, type: "number" },
  hint: {
    default: "Drag anywhere to aim the air",
    label: "Hint",
    placeholder: "Caption",
    type: "text",
  },
} as const;

interface PreviewProps {
  coldColor: string;
  defaultFanSpeed: number;
  defaultTemp: number;
  glow: number;
  hint: string;
  hotColor: string;
  reach: number;
  strandCount: number;
}

const Preview = ({
  coldColor = controls.coldColor.default,
  defaultFanSpeed = controls.defaultFanSpeed.default,
  defaultTemp = controls.defaultTemp.default,
  glow = controls.glow.default,
  hint = controls.hint.default,
  hotColor = controls.hotColor.default,
  reach = controls.reach.default,
  strandCount = controls.strandCount.default,
}: Partial<PreviewProps>) => (
  <main className="flex h-dvh flex-col items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_25%,#26272b_0%,#141518_50%,#08090b_100%)] px-5">
    <TeslaClimate
      key={`${defaultTemp}-${defaultFanSpeed}`}
      defaultTemp={defaultTemp}
      defaultFanSpeed={defaultFanSpeed}
      coldColor={coldColor}
      hotColor={hotColor}
      strandCount={strandCount}
      glow={glow}
      reach={reach}
    />
    {hint && <p className="mt-6 text-xs text-white/25">{hint}</p>}
  </main>
);

export default Preview;
