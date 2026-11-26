"use client";

import { useState } from "react";
import NumberFlow from "@number-flow/react";

import { RadialSlider } from "./radial-slider";

export const controls = {
  maxValue: { default: 100, label: "Ticks", max: 180, min: 12, step: 1, type: "number" },
  dragSensitivity: {
    default: 0.2,
    label: "Sensitivity",
    max: 1,
    min: 0.05,
    step: 0.05,
    type: "number",
  },
  snapStiffness: {
    default: 300,
    label: "Snap stiffness",
    max: 800,
    min: 50,
    step: 10,
    type: "number",
  },
  snapDamping: { default: 30, label: "Snap damping", max: 60, min: 5, step: 1, type: "number" },
  tickColor: { default: "#e5e7eb", label: "Ticks color", type: "color" },
  gradientFrom: { default: "#2b7fff", label: "Gradient start", type: "color" },
  gradientTo: { default: "#f0b100", label: "Gradient end", type: "color" },
  needleColor: { default: "#ffffff", label: "Needle", type: "color" },
  background: { default: "#18181b", type: "color" },
} as const;

interface PreviewProps {
  background: string;
  dragSensitivity: number;
  gradientFrom: string;
  gradientTo: string;
  maxValue: number;
  needleColor: string;
  snapDamping: number;
  snapStiffness: number;
  tickColor: string;
}

type DialProps = Omit<PreviewProps, "background">;

const Dial = ({ needleColor, ...slider }: DialProps) => {
  const [value, setValue] = useState(0);

  return (
    <div className="relative h-36 w-96 overflow-hidden rounded-3xl bg-black p-4 shadow-2xl">
      <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-30 h-[20%] bg-gradient-to-b from-transparent to-black" />
      <div className="mb-6 flex items-center justify-center text-white">
        <NumberFlow value={value} className="text-xl" />
      </div>
      <div
        className="pointer-events-none absolute left-1/2 z-20 h-full w-1 -translate-x-1/2 -translate-y-3 rounded-full"
        style={{ backgroundColor: needleColor }}
      />
      <RadialSlider {...slider} onChange={setValue} />
    </div>
  );
};

const Preview = ({
  background = controls.background.default,
  dragSensitivity = controls.dragSensitivity.default,
  gradientFrom = controls.gradientFrom.default,
  gradientTo = controls.gradientTo.default,
  maxValue = controls.maxValue.default,
  needleColor = controls.needleColor.default,
  snapDamping = controls.snapDamping.default,
  snapStiffness = controls.snapStiffness.default,
  tickColor = controls.tickColor.default,
}: Partial<PreviewProps>) => (
  <main className="flex h-dvh items-center justify-center p-5" style={{ background }}>
    <Dial
      key={maxValue}
      dragSensitivity={dragSensitivity}
      gradientFrom={gradientFrom}
      gradientTo={gradientTo}
      maxValue={maxValue}
      needleColor={needleColor}
      snapDamping={snapDamping}
      snapStiffness={snapStiffness}
      tickColor={tickColor}
    />
  </main>
);

export default Preview;
