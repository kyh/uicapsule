"use client";

import { DynamicAiComposer } from "./dynamic-ai-composer";

const Preview = () => {
  return (
    <main className="flex h-dvh flex-col items-center justify-end overflow-hidden bg-[radial-gradient(circle_at_50%_20%,#1e293b_0%,#0b1120_45%,#020617_100%)] px-5 pb-6">
      <DynamicAiComposer />
      <p className="mt-5 text-xs text-white/25">Enter to send · tap the mic for voice</p>
    </main>
  );
};

export default Preview;
