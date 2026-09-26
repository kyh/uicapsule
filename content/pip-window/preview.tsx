"use client";

import type { CSSProperties } from "react";

import { PipWindow } from "./pip-window";

// Faint scanlines nod to the video call without competing with the floating window.
const backdrop: CSSProperties = {
  background: [
    "repeating-linear-gradient(0deg, rgb(255 255 255 / 0.018) 0 1px, transparent 1px 4px)",
    "radial-gradient(ellipse 60% 45% at 50% 100%, rgb(46 120 116 / 0.35), transparent 75%)",
    "radial-gradient(ellipse 45% 55% at 50% 40%, rgb(30 78 78 / 0.4), transparent 70%)",
    "linear-gradient(180deg, #0a1c1d 0%, #07191a 45%, #031011 100%)",
  ].join(", "),
};

const Preview = () => (
  <main className="flex h-dvh items-center justify-center overflow-hidden p-5" style={backdrop}>
    <PipWindow />
  </main>
);

export default Preview;
