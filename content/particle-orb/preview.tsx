"use client";

import { ParticleOrb } from "./particle-orb";

export const controls = {
  color: { default: "#101a88", label: "Dot color", type: "color" },
  backgroundInner: { default: "#060a33", label: "Background", type: "color" },
  backgroundOuter: { default: "#000000", label: "Vignette", type: "color" },
  radius: { default: 1.5, max: 1.8, min: 0.6, step: 0.05, type: "number" },
  detail: { default: 40, label: "Density", max: 64, min: 8, step: 1, type: "number" },
  particleSizeMax: {
    default: 0.08,
    label: "Dot size",
    max: 0.16,
    min: 0.02,
    step: 0.01,
    type: "number",
  },
  particleSizeMin: {
    default: 0.01,
    label: "Min dot size",
    max: 0.05,
    min: 0,
    step: 0.005,
    type: "number",
  },
  noiseStrength: {
    default: 0.4,
    label: "Distortion",
    max: 1.5,
    min: 0,
    step: 0.05,
    type: "number",
  },
  noiseScale: { default: 1, label: "Noise scale", max: 3, min: 0.2, step: 0.05, type: "number" },
  flowSpeed: { default: 1, label: "Flow speed", max: 4, min: 0, step: 0.05, type: "number" },
  rotationSpeed: { default: 0.2, label: "Spin", max: 2, min: -2, step: 0.05, type: "number" },
} as const;

interface PreviewProps {
  backgroundInner: string;
  backgroundOuter: string;
  color: string;
  detail: number;
  flowSpeed: number;
  noiseScale: number;
  noiseStrength: number;
  particleSizeMax: number;
  particleSizeMin: number;
  radius: number;
  rotationSpeed: number;
}

const Preview = ({
  backgroundInner = controls.backgroundInner.default,
  backgroundOuter = controls.backgroundOuter.default,
  color = controls.color.default,
  detail = controls.detail.default,
  flowSpeed = controls.flowSpeed.default,
  noiseScale = controls.noiseScale.default,
  noiseStrength = controls.noiseStrength.default,
  particleSizeMax = controls.particleSizeMax.default,
  particleSizeMin = controls.particleSizeMin.default,
  radius = controls.radius.default,
  rotationSpeed = controls.rotationSpeed.default,
}: Partial<PreviewProps>) => (
  <div className="h-screen w-full">
    <ParticleOrb
      backgroundInner={backgroundInner}
      backgroundOuter={backgroundOuter}
      color={color}
      detail={detail}
      flowSpeed={flowSpeed}
      noiseScale={noiseScale}
      noiseStrength={noiseStrength}
      particleSizeMax={particleSizeMax}
      particleSizeMin={particleSizeMin}
      radius={radius}
      rotationSpeed={rotationSpeed}
    />
  </div>
);

export default Preview;
