"use client";

import type { CSSProperties } from "react";

import { ScreenshotCapture } from "./screenshot-capture";

// A low horizon glow under a rose-to-plum sky: dusk, not the flat amber of daylight.
const backdrop: CSSProperties = {
  background: [
    "radial-gradient(ellipse 70% 38% at 50% 100%, rgb(214 120 96 / 0.42), transparent 72%)",
    "radial-gradient(ellipse 60% 50% at 50% 78%, rgb(160 68 88 / 0.35), transparent 75%)",
    "linear-gradient(180deg, #170c17 0%, #2a1224 45%, #4a1f30 80%, #5c2a32 100%)",
  ].join(", "),
};

const Preview = () => (
  <main className="flex h-dvh items-center justify-center overflow-hidden p-5" style={backdrop}>
    <ScreenshotCapture />
  </main>
);

export default Preview;
