"use client";

import { StatReel } from "./stat-reel";

export const controls = {
  autoplay: { default: true, label: "Autoplay", type: "boolean" },
  dwell: { default: 0.6, label: "Hold", max: 3, min: 0.1, step: 0.1, type: "number" },
  stepDuration: { default: 0.8, label: "Step time", max: 2, min: 0.2, step: 0.05, type: "number" },
  resumeAfter: { default: 4, label: "Resume after", max: 10, min: 1, step: 0.5, type: "number" },
  centerScale: { default: 1.68, label: "Focus size", max: 2, min: 1, step: 0.02, type: "number" },
  farScale: { default: 0.7, label: "Edge size", max: 1, min: 0.5, step: 0.05, type: "number" },
  falloff: { default: 270, label: "Falloff", max: 500, min: 80, step: 10, type: "number" },
  figureScale: {
    default: 1.05,
    label: "Figure size",
    max: 1.4,
    min: 0.6,
    step: 0.05,
    type: "number",
  },
  focusColor: { default: "#010102", label: "Focus color", type: "color" },
  restColor: { default: "#636365", label: "Rest color", type: "color" },
  background: { default: "#f2f2f4", label: "Background", type: "color" },
} as const;

interface PreviewProps {
  autoplay: boolean;
  background: string;
  centerScale: number;
  dwell: number;
  falloff: number;
  farScale: number;
  figureScale: number;
  focusColor: string;
  restColor: string;
  resumeAfter: number;
  stepDuration: number;
}

const Preview = ({
  autoplay = controls.autoplay.default,
  background = controls.background.default,
  centerScale = controls.centerScale.default,
  dwell = controls.dwell.default,
  falloff = controls.falloff.default,
  farScale = controls.farScale.default,
  figureScale = controls.figureScale.default,
  focusColor = controls.focusColor.default,
  restColor = controls.restColor.default,
  resumeAfter = controls.resumeAfter.default,
  stepDuration = controls.stepDuration.default,
}: Partial<PreviewProps>) => (
  <StatReel
    autoplay={autoplay}
    background={background}
    centerScale={centerScale}
    dwell={dwell}
    falloff={falloff}
    farScale={farScale}
    figureScale={figureScale}
    focusColor={focusColor}
    restColor={restColor}
    resumeAfter={resumeAfter}
    stepDuration={stepDuration}
  />
);

export default Preview;
