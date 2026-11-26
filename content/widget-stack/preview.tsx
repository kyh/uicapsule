"use client";

import { WidgetStack } from "./widget-stack";

export const controls = {
  autoAdvance: { default: true, label: "Auto-advance", type: "boolean" },
  interval: { default: 4, label: "Interval (s)", max: 10, min: 1.5, step: 0.5, type: "number" },
  direction: {
    default: "up",
    label: "Direction",
    options: [
      { label: "Up", value: "up" },
      { label: "Down", value: "down" },
    ],
    type: "select",
  },
  flipAngle: { default: 78, label: "Flip angle", max: 90, min: 0, step: 1, type: "number" },
  travel: { default: 38, label: "Travel (%)", max: 80, min: 0, step: 1, type: "number" },
  duration: {
    default: 0.55,
    label: "Duration (s)",
    max: 1.2,
    min: 0.2,
    step: 0.05,
    type: "number",
  },
  bounce: { default: 0.2, label: "Bounce", max: 0.6, min: 0, step: 0.05, type: "number" },
  perspective: {
    default: 900,
    label: "Perspective",
    max: 2000,
    min: 400,
    step: 50,
    type: "number",
  },
  cornerRadius: { default: 24, label: "Corner radius", max: 48, min: 0, step: 1, type: "number" },
  scale: { default: 1, label: "Size", max: 1.5, min: 0.75, step: 0.05, type: "number" },
  showDots: { default: true, label: "Page dots", type: "boolean" },
  showHint: { default: true, label: "Hint", type: "boolean" },
} as const;

interface PreviewProps {
  autoAdvance: boolean;
  bounce: number;
  cornerRadius: number;
  direction: "up" | "down";
  duration: number;
  flipAngle: number;
  interval: number;
  perspective: number;
  scale: number;
  showDots: boolean;
  showHint: boolean;
  travel: number;
}

const Preview = ({
  autoAdvance = controls.autoAdvance.default,
  bounce = controls.bounce.default,
  cornerRadius = controls.cornerRadius.default,
  direction = controls.direction.default,
  duration = controls.duration.default,
  flipAngle = controls.flipAngle.default,
  interval = controls.interval.default,
  perspective = controls.perspective.default,
  scale = controls.scale.default,
  showDots = controls.showDots.default,
  showHint = controls.showHint.default,
  travel = controls.travel.default,
}: Partial<PreviewProps>) => (
  <main className="flex h-dvh items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_18%_22%,rgb(99_102_241/0.55)_0%,transparent_42%),radial-gradient(circle_at_85%_80%,rgb(139_92_246/0.45)_0%,transparent_45%),radial-gradient(circle_at_78%_12%,rgb(59_130_246/0.35)_0%,transparent_38%),linear-gradient(160deg,#1e1b4b_0%,#14113a_55%,#0a0823_100%)] p-5">
    <div style={{ scale }}>
      <WidgetStack
        autoAdvance={autoAdvance}
        bounce={bounce}
        cornerRadius={cornerRadius}
        direction={direction}
        duration={duration}
        flipAngle={flipAngle}
        interval={interval * 1000}
        perspective={perspective}
        showDots={showDots}
        showHint={showHint}
        travel={travel}
      />
    </div>
  </main>
);

export default Preview;
