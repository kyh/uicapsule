"use client";

import { SpinnerPixelGrid, spinnerDots, spinnerVariants } from "./spinner-pixel-grid";
import type { SpinnerDot, SpinnerVariant } from "./spinner-pixel-grid";

const titleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export const controls = {
  variant: {
    default: "all",
    label: "Animation",
    options: [
      { label: "All", value: "all" },
      ...spinnerVariants.map((value) => ({ label: titleCase(value), value })),
    ],
    type: "select",
  },
  dot: {
    default: "square",
    label: "Dot shape",
    options: spinnerDots.map((value) => ({ label: titleCase(value), value })),
    type: "select",
  },
  color: { default: "#ffdf20", type: "color" },
  glow: { default: true, type: "boolean" },
  rainbow: { default: true, type: "boolean" },
  size: { default: 10, label: "Dot size", max: 20, min: 4, step: 1, type: "number" },
  gridSize: { default: 5, label: "Grid size", max: 9, min: 3, step: 2, type: "number" },
  speed: { default: 1, max: 3, min: 0.25, step: 0.25, type: "number" },
} as const;

interface PreviewProps {
  color: string;
  dot: SpinnerDot;
  glow: boolean;
  gridSize: number;
  rainbow: boolean;
  size: number;
  speed: number;
  variant: "all" | SpinnerVariant;
}

const Preview = ({
  color = controls.color.default,
  dot = controls.dot.default,
  glow = controls.glow.default,
  gridSize = controls.gridSize.default,
  rainbow = controls.rainbow.default,
  size = controls.size.default,
  speed = controls.speed.default,
  variant = controls.variant.default,
}: Partial<PreviewProps>) => {
  const spinnerProps = { color, dot, glow, gridSize, rainbow, size, speed };

  return variant === "all" ? (
    <div className="min-h-screen bg-black">
      <div className="grid grid-cols-2 pb-32 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {spinnerVariants.map((v) => (
          <div
            key={v}
            className="flex flex-col items-center justify-center gap-4 border border-white/10 p-8"
          >
            <SpinnerPixelGrid variant={v} {...spinnerProps} />
            <span className="text-xs text-gray-500">{v}</span>
          </div>
        ))}
      </div>
    </div>
  ) : (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-black">
      <SpinnerPixelGrid variant={variant} {...spinnerProps} />
      <span className="text-xs text-gray-500">{variant}</span>
    </div>
  );
};

export default Preview;
