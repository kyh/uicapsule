"use client";

import { GradientOrb } from "./gradient-orb";

export const controls = {
  baseColor: { default: "#3d5aff", label: "Base color", type: "color" },
  swirlColorA: { default: "#9d00ff", label: "Swirl color 1", type: "color" },
  swirlColorB: { default: "#ff5f1f", label: "Swirl color 2", type: "color" },
  hue: { default: 0, label: "Hue shift", max: 360, min: 0, step: 1, type: "number" },
  speed: { default: 1, label: "Flow speed", max: 3, min: 0, step: 0.05, type: "number" },
  rotationSpeed: { default: 0.3, max: 2, min: 0, step: 0.05, type: "number" },
  noiseScale: { default: 0.65, label: "Turbulence", max: 3, min: 0.1, step: 0.05, type: "number" },
  innerRadius: { default: 0.1, label: "Core size", max: 0.8, min: 0, step: 0.01, type: "number" },
  background: { default: "#0a0a0a", type: "color" },
} as const;

interface PreviewProps {
  background: string;
  baseColor: string;
  hue: number;
  innerRadius: number;
  noiseScale: number;
  rotationSpeed: number;
  speed: number;
  swirlColorA: string;
  swirlColorB: string;
}

const Preview = ({
  background = controls.background.default,
  baseColor = controls.baseColor.default,
  hue = controls.hue.default,
  innerRadius = controls.innerRadius.default,
  noiseScale = controls.noiseScale.default,
  rotationSpeed = controls.rotationSpeed.default,
  speed = controls.speed.default,
  swirlColorA = controls.swirlColorA.default,
  swirlColorB = controls.swirlColorB.default,
}: Partial<PreviewProps>) => (
  <div className="h-screen w-full">
    <GradientOrb
      config={{
        background,
        colors: [baseColor, swirlColorA, swirlColorB],
        hue,
        innerRadius,
        noiseScale,
        rotationSpeed,
        speed,
      }}
    />
  </div>
);

export default Preview;
