"use client";

import type { CSSProperties } from "react";

import { PredictiveBack } from "./predictive-back";

// Light pools on the left, the edge the back gesture pulls from.
const backdrop: CSSProperties = {
  background: [
    "radial-gradient(ellipse 45% 80% at 0% 50%, rgb(176 82 48 / 0.4), transparent 70%)",
    "radial-gradient(ellipse 50% 55% at 50% 45%, rgb(110 48 30 / 0.35), transparent 72%)",
    "linear-gradient(100deg, #3a1a10 0%, #26110b 45%, #140806 100%)",
  ].join(", "),
};

const Preview = () => (
  <main className="flex h-dvh items-center justify-center overflow-hidden p-5" style={backdrop}>
    <PredictiveBack />
  </main>
);

export default Preview;
