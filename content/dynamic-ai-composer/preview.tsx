"use client";

import { DynamicAiComposer } from "./dynamic-ai-composer";

export const controls = {
  placeholder: { default: "Ask anything", label: "Placeholder", type: "text" },
  surface: { default: "#171717", label: "Surface", type: "color" },
  sweepFrom: { default: "#a78bfa", label: "Sweep start", type: "color" },
  sweepTo: { default: "#67e8f9", label: "Sweep end", type: "color" },
  glow: { default: 0.55, label: "Glow", max: 1, min: 0, step: 0.05, type: "number" },
  radius: { default: 24, label: "Corner radius", max: 24, min: 6, step: 1, type: "number" },
  bounce: { default: 0.3, label: "Bounce", max: 0.6, min: 0, step: 0.05, type: "number" },
  duration: {
    default: 0.55,
    label: "Morph duration (s)",
    max: 1.2,
    min: 0.2,
    step: 0.05,
    type: "number",
  },
  thinkingMs: {
    default: 1500,
    label: "Think time (ms)",
    max: 4000,
    min: 300,
    step: 100,
    type: "number",
  },
  wordDelayMs: {
    default: 60,
    label: "Word delay (ms)",
    max: 200,
    min: 20,
    step: 5,
    type: "number",
  },
  bars: { default: 21, label: "Wave bars", max: 27, min: 5, step: 1, type: "number" },
  hint: { default: true, label: "Hint", type: "boolean" },
} as const;

interface PreviewProps {
  bars: number;
  bounce: number;
  duration: number;
  glow: number;
  hint: boolean;
  placeholder: string;
  radius: number;
  surface: string;
  sweepFrom: string;
  sweepTo: string;
  thinkingMs: number;
  wordDelayMs: number;
}

const Preview = ({
  bars = controls.bars.default,
  bounce = controls.bounce.default,
  duration = controls.duration.default,
  glow = controls.glow.default,
  hint = controls.hint.default,
  placeholder = controls.placeholder.default,
  radius = controls.radius.default,
  surface = controls.surface.default,
  sweepFrom = controls.sweepFrom.default,
  sweepTo = controls.sweepTo.default,
  thinkingMs = controls.thinkingMs.default,
  wordDelayMs = controls.wordDelayMs.default,
}: Partial<PreviewProps>) => (
  <main className="flex h-dvh flex-col items-center justify-end overflow-hidden bg-[radial-gradient(circle_at_50%_20%,#1e293b_0%,#0b1120_45%,#020617_100%)] px-5 pb-6">
    <DynamicAiComposer
      bars={bars}
      bounce={bounce}
      duration={duration}
      glow={glow}
      placeholder={placeholder}
      radius={radius}
      surface={surface}
      sweepFrom={sweepFrom}
      sweepTo={sweepTo}
      thinkingMs={thinkingMs}
      wordDelayMs={wordDelayMs}
    />
    {hint && <p className="mt-5 text-xs text-white/25">Enter to send · tap the mic for voice</p>}
  </main>
);

export default Preview;
