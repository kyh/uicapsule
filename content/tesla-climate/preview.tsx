"use client";

import { TeslaClimate } from "./tesla-climate";

const Preview = () => {
  return (
    <main className="flex h-dvh flex-col items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_25%,#26272b_0%,#141518_50%,#08090b_100%)] px-5">
      <TeslaClimate />
      <p className="mt-6 text-xs text-white/25">Drag anywhere to aim the air</p>
    </main>
  );
};

export default Preview;
