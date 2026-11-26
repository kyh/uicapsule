"use client";

import { useEffect, useMemo, useState } from "react";

import { BackgroundGlyphs } from "./background-shapes";

export const controls = {
  color: { default: "#ffffff", label: "Glyph color", type: "color" },
  background: { default: "#2164d6", type: "color" },
  cellSize: { default: 20, label: "Cell size", max: 60, min: 16, step: 2, type: "number" },
  strokeWidth: { default: 10, label: "Stroke width", max: 20, min: 3, step: 1, type: "number" },
  blankWeight: { default: 5, label: "Empty cells", max: 20, min: 0, step: 1, type: "number" },
  minInterval: {
    default: 1000,
    label: "Min swap delay (ms)",
    max: 5000,
    min: 100,
    step: 100,
    type: "number",
  },
  maxInterval: {
    default: 5000,
    label: "Max swap delay (ms)",
    max: 10_000,
    min: 200,
    step: 100,
    type: "number",
  },
} as const;

interface PreviewProps {
  background: string;
  blankWeight: number;
  cellSize: number;
  color: string;
  maxInterval: number;
  minInterval: number;
  strokeWidth: number;
}

const Preview = ({
  background = controls.background.default,
  blankWeight = controls.blankWeight.default,
  cellSize = controls.cellSize.default,
  color = controls.color.default,
  maxInterval = controls.maxInterval.default,
  minInterval = controls.minInterval.default,
  strokeWidth = controls.strokeWidth.default,
}: Partial<PreviewProps>) => {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const colors = useMemo(() => [color], [color]);

  useEffect(() => {
    const update = () => {
      setSize({ height: window.innerHeight, width: window.innerWidth });
    };

    update();
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div className="h-full w-full" style={{ backgroundColor: background }}>
      {size && (
        <BackgroundGlyphs
          width={size.width}
          height={size.height}
          cellSize={cellSize}
          strokeWidth={strokeWidth}
          colors={colors}
          minInterval={Math.min(minInterval, maxInterval)}
          maxInterval={Math.max(minInterval, maxInterval)}
          blankWeight={blankWeight}
        />
      )}
    </div>
  );
};

export default Preview;
