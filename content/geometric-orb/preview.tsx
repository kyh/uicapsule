"use client";

import { GeometricOrb } from "./geometric-orb";

export const controls = {
  numLines: {
    default: 20,
    group: "Shape",
    label: "Lines",
    max: 60,
    min: 4,
    step: 1,
    type: "number",
  },
  radius: {
    default: 1.5,
    group: "Shape",
    label: "Radius",
    max: 2.5,
    min: 0.5,
    step: 0.05,
    type: "number",
  },
  pointsPerLine: {
    default: 96,
    group: "Shape",
    label: "Detail",
    max: 192,
    min: 16,
    step: 8,
    type: "number",
  },
  lineWidth: {
    default: 2,
    group: "Shape",
    label: "Line width",
    max: 6,
    min: 0.5,
    step: 0.5,
    type: "number",
  },
  speed: {
    default: 20,
    group: "Motion",
    label: "Cycle (s)",
    max: 60,
    min: 4,
    step: 1,
    type: "number",
  },
  squiggleAmount: {
    default: 0.04,
    group: "Motion",
    label: "Squiggle",
    max: 0.3,
    min: 0,
    step: 0.01,
    type: "number",
  },
  squiggleFrequency: {
    default: 4,
    group: "Motion",
    label: "Squiggle waves",
    max: 12,
    min: 1,
    step: 1,
    type: "number",
  },
  squiggleSpeed: {
    default: 2,
    group: "Motion",
    label: "Squiggle speed",
    max: 8,
    min: 0,
    step: 0.1,
    type: "number",
  },
  depthFade: {
    default: 0.85,
    group: "Color",
    label: "Depth fade",
    max: 1,
    min: 0,
    step: 0.05,
    type: "number",
  },
  color: { default: "#eeeeee", group: "Color", label: "Line color", type: "color" },
  background: { default: "#0a0a0a", group: "Color", type: "color" },
} as const;

interface PreviewProps {
  background: string;
  color: string;
  depthFade: number;
  lineWidth: number;
  numLines: number;
  pointsPerLine: number;
  radius: number;
  speed: number;
  squiggleAmount: number;
  squiggleFrequency: number;
  squiggleSpeed: number;
}

const Preview = ({
  background = controls.background.default,
  color = controls.color.default,
  depthFade = controls.depthFade.default,
  lineWidth = controls.lineWidth.default,
  numLines = controls.numLines.default,
  pointsPerLine = controls.pointsPerLine.default,
  radius = controls.radius.default,
  speed = controls.speed.default,
  squiggleAmount = controls.squiggleAmount.default,
  squiggleFrequency = controls.squiggleFrequency.default,
  squiggleSpeed = controls.squiggleSpeed.default,
}: Partial<PreviewProps>) => (
  <div className="h-screen w-full">
    <GeometricOrb
      config={{
        background,
        color,
        depthFade,
        lineWidth,
        numLines,
        pointsPerLine,
        radius,
        speed,
        squiggleAmount,
        squiggleFrequency,
        squiggleSpeed,
      }}
    />
  </div>
);

export default Preview;
