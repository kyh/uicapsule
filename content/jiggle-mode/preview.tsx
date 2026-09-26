"use client";

import { JiggleMode } from "./jiggle-mode";

const Preview = () => (
  <main className="flex h-dvh items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_60%_70%_at_50%_45%,#6a4514_0%,#3a250b_45%,#1a1005_80%,#0f0903_100%)] p-5">
    <JiggleMode />
  </main>
);

export default Preview;
