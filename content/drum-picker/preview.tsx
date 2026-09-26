"use client";

import { DrumPicker } from "./drum-picker";

const Preview = () => (
  <main className="flex h-dvh items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_60%_45%_at_50%_100%,rgb(239_68_68/0.16)_0%,transparent_70%),radial-gradient(circle_at_50%_35%,#3a0b14_0%,#22060c_50%,#0f0306_100%)] p-5">
    <DrumPicker />
  </main>
);

export default Preview;
