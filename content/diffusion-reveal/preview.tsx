"use client";

import { DiffusionReveal } from "./diffusion-reveal";

const Preview = () => (
  <main className="flex h-dvh items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_75%_55%_at_50%_0%,rgb(167_139_250/0.22)_0%,transparent_70%),radial-gradient(ellipse_90%_45%_at_50%_105%,rgb(236_72_153/0.14)_0%,transparent_70%),linear-gradient(180deg,#1c1233_0%,#130c24_55%,#0a0614_100%)] p-5">
    <DiffusionReveal />
  </main>
);

export default Preview;
