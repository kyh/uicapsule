"use client";

import { useState } from "react";
import { LiquidOrb, presetLabel, type LiquidOrbPreset } from "./liquid-orb";

const Preview = () => {
  const [preset, setPreset] = useState<LiquidOrbPreset>("siri");

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[radial-gradient(ellipse_at_center,#0d0d14_0%,#050508_55%,#000000_100%)]">
      <LiquidOrb onPresetChange={setPreset} />
      <div className="pointer-events-none absolute inset-x-0 bottom-12 flex justify-center">
        <span
          key={preset}
          className="animate-[liquid-orb-label_700ms_ease] text-sm font-medium tracking-[0.35em] text-white/50 uppercase"
        >
          {presetLabel[preset]}
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

export default Preview;
