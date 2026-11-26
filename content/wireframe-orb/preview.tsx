"use client";

import { WireframeOrb } from "./wireframe-orb";

export const controls = {
  color: { default: "#c0ebfc", label: "Line color", type: "color" },
  background: { default: "#0a0a0a", type: "color" },
  speed: { default: 20, max: 60, min: 0, step: 1, type: "number" },
  noiseScale: { default: 3, label: "Orb size", max: 6, min: 1, step: 0.1, type: "number" },
  noiseDensity: { default: 0.7, label: "Turbulence", max: 2, min: 0.1, step: 0.05, type: "number" },
  gridSize: { default: 150, label: "Line density", max: 150, min: 50, step: 10, type: "number" },
  maxAlpha: { default: 0.45, label: "Brightness", max: 1, min: 0.05, step: 0.01, type: "number" },
  bloomIntensity: { default: 1.5, label: "Bloom", max: 4, min: 0, step: 0.1, type: "number" },
} as const;

interface PreviewProps {
  background: string;
  bloomIntensity: number;
  color: string;
  gridSize: number;
  maxAlpha: number;
  noiseDensity: number;
  noiseScale: number;
  speed: number;
}

const Preview = ({
  background = controls.background.default,
  bloomIntensity = controls.bloomIntensity.default,
  color = controls.color.default,
  gridSize = controls.gridSize.default,
  maxAlpha = controls.maxAlpha.default,
  noiseDensity = controls.noiseDensity.default,
  noiseScale = controls.noiseScale.default,
  speed = controls.speed.default,
}: Partial<PreviewProps>) => (
  <div className="h-screen w-full">
    <WireframeOrb
      config={{
        background,
        bloomIntensity,
        color,
        gridSize,
        maxAlpha,
        noiseDensity,
        noiseScale,
        speed,
      }}
    />
  </div>
);

export default Preview;
