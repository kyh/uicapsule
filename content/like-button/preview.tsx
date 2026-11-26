"use client";

import { LikeButton } from "./like-button";

export const controls = {
  particles: {
    default: "confetti",
    group: "Burst",
    label: "Particles",
    options: [
      { label: "Confetti", value: "confetti" },
      { label: "Heart", value: "heart" },
    ],
    type: "select",
  },
  particleCount: {
    default: 14,
    group: "Burst",
    label: "Particle count",
    max: 28,
    min: 4,
    step: 1,
    type: "number",
  },
  burstRadius: {
    default: 32,
    group: "Burst",
    label: "Burst",
    max: 64,
    min: 24,
    step: 1,
    type: "number",
  },
  speed: {
    default: 1,
    group: "Burst",
    label: "Speed",
    max: 2,
    min: 0.25,
    step: 0.05,
    type: "number",
  },
  color: { default: "#fb2c36", group: "Color", label: "Heart", type: "color" },
  idleColor: { default: "#99a1af", group: "Color", label: "Idle", type: "color" },
  ringFrom: { default: "#e5214a", group: "Color", label: "Ring start", type: "color" },
  ringTo: { default: "#cc8ef5", group: "Color", label: "Ring end", type: "color" },
  count: {
    default: 0,
    group: "Button",
    label: "Count",
    max: 9999,
    min: 0,
    step: 1,
    type: "number",
  },
  size: { default: 16, group: "Button", label: "Size", max: 48, min: 12, step: 1, type: "number" },
} as const;

interface PreviewProps {
  burstRadius: number;
  color: string;
  count: number;
  idleColor: string;
  particleCount: number;
  particles: "confetti" | "heart";
  ringFrom: string;
  ringTo: string;
  size: number;
  speed: number;
}

const Preview = ({
  burstRadius = controls.burstRadius.default,
  color = controls.color.default,
  count = controls.count.default,
  idleColor = controls.idleColor.default,
  particleCount = controls.particleCount.default,
  particles = controls.particles.default,
  ringFrom = controls.ringFrom.default,
  ringTo = controls.ringTo.default,
  size = controls.size.default,
  speed = controls.speed.default,
}: Partial<PreviewProps>) => (
  <div
    className="flex h-screen items-center justify-center"
    style={{ color: idleColor, fontSize: size }}
  >
    <LikeButton
      burstRadius={burstRadius}
      color={color}
      count={count}
      particleColors={particles === "heart" ? [{ from: color, to: ringTo }] : undefined}
      particleCount={particleCount}
      ringFrom={ringFrom}
      ringTo={ringTo}
      size={size}
      speed={speed}
    />
  </div>
);

export default Preview;
