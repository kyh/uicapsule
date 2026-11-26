"use client";

import { GradientOrb } from "./gradient-orb";

export const controls = {
  hue: { default: 0, label: "Hue shift", max: 360, min: 0, step: 1, type: "number" },
  rotationSpeed: { default: 0.3, max: 2, min: 0, step: 0.05, type: "number" },
  noiseScale: { default: 0.65, label: "Turbulence", max: 3, min: 0.1, step: 0.05, type: "number" },
  innerRadius: { default: 0.1, label: "Core size", max: 0.8, min: 0, step: 0.01, type: "number" },
  background: { default: "#0a0a0a", type: "color" },
} as const;

interface PreviewProps {
  background: string;
  hue: number;
  innerRadius: number;
  noiseScale: number;
  rotationSpeed: number;
}

const Preview = ({
  background = controls.background.default,
  hue = controls.hue.default,
  innerRadius = controls.innerRadius.default,
  noiseScale = controls.noiseScale.default,
  rotationSpeed = controls.rotationSpeed.default,
}: Partial<PreviewProps>) => (
  <div className="h-screen w-full">
    <GradientOrb config={{ background, hue, innerRadius, noiseScale, rotationSpeed }} />
  </div>
);

export default Preview;
