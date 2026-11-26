"use client";

import { useState } from "react";
import { LiquidOrb, presetLabel } from "./liquid-orb";
import type { LiquidOrbPreset } from "./liquid-orb";

export const controls = {
  preset: {
    default: "siri",
    label: "Starting preset",
    options: [
      { label: presetLabel.siri, value: "siri" },
      { label: presetLabel.chrome, value: "chrome" },
      { label: presetLabel.aurora, value: "aurora" },
      { label: presetLabel.violetEmber, value: "violetEmber" },
      { label: presetLabel.blueDrop, value: "blueDrop" },
      { label: presetLabel.opal, value: "opal" },
      { label: presetLabel.plasma, value: "plasma" },
    ],
    type: "select",
  },
  cycle: { default: true, label: "Cycle presets", type: "boolean" },
  holdDuration: { default: 1.8, label: "Hold (s)", max: 6, min: 0.3, step: 0.1, type: "number" },
  morphDuration: {
    default: 1.25,
    label: "Morph (s)",
    max: 4,
    min: 0.2,
    step: 0.05,
    type: "number",
  },
  speed: { default: 1, label: "Flow speed", max: 3, min: 0, step: 0.05, type: "number" },
  glass: { default: true, label: "Glass shell", type: "boolean" },
  glow: { default: 0.55, max: 1.5, min: 0, step: 0.05, type: "number" },
} as const;

interface PreviewProps {
  cycle: boolean;
  glass: boolean;
  glow: number;
  holdDuration: number;
  morphDuration: number;
  preset: LiquidOrbPreset;
  speed: number;
}

const OrbStage = ({ preset, ...config }: PreviewProps) => {
  const [caption, setCaption] = useState(preset);

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[radial-gradient(ellipse_at_center,#0d0d14_0%,#050508_55%,#000000_100%)]">
      <LiquidOrb {...config} preset={preset} onPresetChange={setCaption} />
      <div className="pointer-events-none absolute inset-x-0 bottom-12 flex justify-center">
        <span
          key={caption}
          className="animate-[liquid-orb-label_700ms_ease] text-sm font-medium tracking-[0.35em] text-white/50 uppercase"
        >
          {presetLabel[caption]}
        </span>
      </div>
      <style>{`
        @keyframes liquid-orb-label {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: none; }
        }
      `}</style>
    </main>
  );
};

const Preview = ({
  cycle = controls.cycle.default,
  glass = controls.glass.default,
  glow = controls.glow.default,
  holdDuration = controls.holdDuration.default,
  morphDuration = controls.morphDuration.default,
  preset = controls.preset.default,
  speed = controls.speed.default,
}: Partial<PreviewProps>) => (
  <OrbStage
    key={preset}
    cycle={cycle}
    glass={glass}
    glow={glow}
    holdDuration={holdDuration}
    morphDuration={morphDuration}
    preset={preset}
    speed={speed}
  />
);

export default Preview;
