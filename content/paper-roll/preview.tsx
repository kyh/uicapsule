"use client";

import { PaperRoll } from "./paper-roll";

export const controls = {
  brand: { default: "KYH", label: "Brand", placeholder: "Wordmark", type: "text" },
  speed: { default: 9, max: 16, min: 2, step: 0.5, type: "number" },
  wander: { default: 1, max: 2, min: 0, step: 0.05, type: "number" },
  distance: {
    default: 1,
    label: "Camera distance",
    max: 1.8,
    min: 0.6,
    step: 0.05,
    type: "number",
  },
  paperWidth: { default: 1.5, label: "Paper width", max: 2.2, min: 1, step: 0.05, type: "number" },
  trailLength: {
    default: 760,
    label: "Trail length",
    max: 1000,
    min: 60,
    step: 10,
    type: "number",
  },
  accent: { default: "#e4551f", type: "color" },
  warm: { default: "#f0a32e", label: "Warm ink", type: "color" },
  cool: { default: "#1e4fd6", label: "Cool ink", type: "color" },
  background: { default: "#eaeaec", type: "color" },
  floor: { default: "#e7e7ea", type: "color" },
} as const;

interface PreviewProps {
  accent: string;
  background: string;
  brand: string;
  cool: string;
  distance: number;
  floor: string;
  paperWidth: number;
  speed: number;
  trailLength: number;
  wander: number;
  warm: string;
}

const Preview = ({
  accent = controls.accent.default,
  background = controls.background.default,
  brand = controls.brand.default,
  cool = controls.cool.default,
  distance = controls.distance.default,
  floor = controls.floor.default,
  paperWidth = controls.paperWidth.default,
  speed = controls.speed.default,
  trailLength = controls.trailLength.default,
  wander = controls.wander.default,
  warm = controls.warm.default,
}: Partial<PreviewProps>) => (
  <div className="h-dvh w-full">
    <PaperRoll
      accent={accent}
      background={background}
      brand={brand}
      cool={cool}
      distance={distance}
      floor={floor}
      paperWidth={paperWidth}
      speed={speed}
      trailLength={trailLength}
      wander={wander}
      warm={warm}
    />
  </div>
);

export default Preview;
