"use client";

import type { CSSProperties } from "react";

import { MaterialYouTheming } from "./material-you-theming";

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.07'/%3E%3C/svg%3E\")";

const backdrop: CSSProperties = {
  background: [
    GRAIN,
    "radial-gradient(ellipse 55% 60% at 30% 18%, rgb(118 128 70 / 0.34), transparent 70%)",
    "radial-gradient(ellipse 50% 55% at 50% 58%, rgb(74 90 52 / 0.3), transparent 75%)",
    "linear-gradient(170deg, #232a17 0%, #161b0f 50%, #0a0d07 100%)",
  ].join(", "),
};

const Preview = () => (
  <main className="flex h-dvh items-center justify-center overflow-hidden p-5" style={backdrop}>
    <MaterialYouTheming />
  </main>
);

export default Preview;
