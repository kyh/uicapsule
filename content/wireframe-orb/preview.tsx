"use client";

import { WireframeOrb } from "./wireframe-orb";

export const controls = {
  noiseScale: {
    default: 3,
    group: "Shape",
    label: "Orb size",
    max: 4.5,
    min: 1,
    step: 0.1,
    type: "number",
  },
  noiseDensity: {
    default: 0.7,
    group: "Shape",
    label: "Turbulence",
    max: 2,
    min: 0.3,
    step: 0.05,
    type: "number",
  },
  gridSize: {
    default: 150,
    group: "Shape",
    label: "Line density",
    max: 150,
    min: 50,
    step: 10,
    type: "number",
  },
  speed: { default: 20, group: "Shape", max: 60, min: 0, step: 1, type: "number" },
  color: { default: "#c0ebfc", group: "Color", label: "Line color", type: "color" },
  background: { default: "#0a0a0a", group: "Color", type: "color" },
  maxAlpha: {
    default: 0.45,
    group: "Color",
    label: "Brightness",
    max: 1,
    min: 0.05,
    step: 0.01,
    type: "number",
  },
  minAlpha: {
    default: 0.01,
    group: "Color",
    label: "Pulse floor",
    max: 0.3,
    min: 0,
    step: 0.01,
    type: "number",
  },
  bloomIntensity: {
    default: 1.5,
    group: "Bloom",
    label: "Bloom",
    max: 4,
    min: 0,
    step: 0.1,
    type: "number",
  },
  bloomRadius: {
    default: 0.85,
    group: "Bloom",
    label: "Bloom radius",
    max: 0.95,
    min: 0,
    step: 0.05,
    type: "number",
  },
  bloomThreshold: {
    default: 0,
    group: "Bloom",
    label: "Bloom threshold",
    max: 0.6,
    min: 0,
    step: 0.02,
    type: "number",
  },
} as const;

interface PreviewProps {
  background: string;
  bloomIntensity: number;
  bloomRadius: number;
  bloomThreshold: number;
  color: string;
  gridSize: number;
  maxAlpha: number;
  minAlpha: number;
  noiseDensity: number;
  noiseScale: number;
  speed: number;
}

const Preview = ({
  background = controls.background.default,
  bloomIntensity = controls.bloomIntensity.default,
  bloomRadius = controls.bloomRadius.default,
  bloomThreshold = controls.bloomThreshold.default,
  color = controls.color.default,
  gridSize = controls.gridSize.default,
  maxAlpha = controls.maxAlpha.default,
  minAlpha = controls.minAlpha.default,
  noiseDensity = controls.noiseDensity.default,
  noiseScale = controls.noiseScale.default,
  speed = controls.speed.default,
}: Partial<PreviewProps>) => (
  <div className="h-screen w-full">
    <WireframeOrb
      config={{
        background,
        bloomIntensity,
        bloomRadius,
        bloomThreshold,
        color,
        gridSize,
        maxAlpha,
        minAlpha,
        noiseDensity,
        noiseScale,
        speed,
      }}
    />
  </div>
);

export default Preview;
