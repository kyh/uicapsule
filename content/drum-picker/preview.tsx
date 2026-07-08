"use client";

import { DrumPicker } from "./drum-picker";

const Preview = () => {
  return (
    <main className="flex h-dvh items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_20%,#232329_0%,#121215_55%,#070709_100%)] p-5">
      <DrumPicker />
    </main>
  );
};

export default Preview;
