"use client";

import { DiffusionReveal } from "./diffusion-reveal";

export const controls = {
  prompt: {
    default: "a quiet valley at dusk, low fog, oil painting",
    label: "Prompt",
    placeholder: "Describe the image",
    type: "text",
  },
  hue: { default: 0, label: "Hue shift", max: 360, min: 0, step: 1, type: "number" },
  duration: { default: 6.2, label: "Duration (s)", max: 15, min: 1.5, step: 0.1, type: "number" },
  steps: { default: 30, label: "Steps", max: 100, min: 4, step: 1, type: "number" },
  grain: { default: 1, label: "Noise", max: 1, min: 0, step: 0.05, type: "number" },
  loop: { default: false, label: "Auto regenerate", type: "boolean" },
} as const;

interface PreviewProps {
  duration: number;
  grain: number;
  hue: number;
  loop: boolean;
  prompt: string;
  steps: number;
}

const Preview = ({
  duration = controls.duration.default,
  grain = controls.grain.default,
  hue = controls.hue.default,
  loop = controls.loop.default,
  prompt = controls.prompt.default,
  steps = controls.steps.default,
}: Partial<PreviewProps>) => (
  <main className="flex h-dvh items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_75%_55%_at_50%_0%,rgb(167_139_250/0.22)_0%,transparent_70%),radial-gradient(ellipse_90%_45%_at_50%_105%,rgb(236_72_153/0.14)_0%,transparent_70%),linear-gradient(180deg,#1c1233_0%,#130c24_55%,#0a0614_100%)] p-5">
    <DiffusionReveal
      duration={duration}
      grain={grain}
      hue={hue}
      loop={loop}
      prompt={prompt}
      steps={steps}
    />
  </main>
);

export default Preview;
