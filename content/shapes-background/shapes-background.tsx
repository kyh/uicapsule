import React, { useEffect, useState } from "react";

// Cell shape functions that return JSX instead of SVG strings
const Cell1 = ({ colors }: { colors: string[]; strokeWidth: number }) => (
  <circle cx="50" cy="50" r="9.44" fill={colors[0]} fillRule="evenodd" />
);

const Cell2 = ({
  colors,
  strokeWidth,
}: {
  colors: string[];
  strokeWidth: number;
}) => (
  <>
    <line
      x1="25"
      x2="75"
      y1="25"
      y2="25"
      stroke={colors[0]}
      strokeWidth={strokeWidth}
    />
    <line
      x1="25"
      x2="75"
      y1="50"
      y2="50"
      stroke={colors[0]}
      strokeWidth={strokeWidth}
    />
    <line
      x1="25"
      x2="75"
      y1="75"
      y2="75"
      stroke={colors[0]}
      strokeWidth={strokeWidth}
    />
  </>
);

const Cell3 = ({
  colors,
  strokeWidth,
}: {
  colors: string[];
  strokeWidth: number;
}) => (
  <>
    <line
      x1="25"
      x2="75"
      y1="25"
      y2="75"
      stroke={colors[0]}
      strokeWidth={strokeWidth}
    />
    <line
      x1="25"
      x2="75"
      y1="75"
      y2="25"
      stroke={colors[0]}
      strokeWidth={strokeWidth}
    />
  </>
);

const Cell4 = ({
  colors,
  strokeWidth,
}: {
  colors: string[];
  strokeWidth: number;
}) => (
  <rect
    width="50"
    height="50"
    x="25"
    y="25"
    fill="none"
    stroke={colors[0]}
    strokeWidth={strokeWidth}
  />
);

const Cell5 = ({
  colors,
  strokeWidth,
}: {
  colors: string[];
  strokeWidth: number;
}) => (
  <line
    x1="25"
    x2="75"
    y1="75"
    y2="25"
    fill="none"
    stroke={colors[0]}
    strokeWidth={strokeWidth}
  />
);

const Cell6 = () => null;

const Cell7 = () => (
  <rect width="75" height="75" x="12.5" y="12.5" fill="rgba(255,255,255,0.1)" />
);

// Simple seeded random number generator
const seedPRNG = (seed: number) => {
  // Simple implementation - in production you might want a more robust seeded RNG
  // This is a basic seeded RNG implementation
  let seedValue = seed;
  return () => {
    seedValue = (seedValue * 9301 + 49297) % 233280;
    return seedValue / 233280;
  };
};

interface ShapeConfig {
  shape: ({
    colors,
    strokeWidth,
  }: {
    colors: string[];
    strokeWidth: number;
  }) => React.ReactElement | null;
  weight: number;
}

const shapesConfig: ShapeConfig[] = [
  { shape: Cell1, weight: 1 },
  { shape: Cell2, weight: 1 },
  { shape: Cell3, weight: 1 },
  { shape: Cell4, weight: 1 },
  { shape: Cell5, weight: 1 },
  { shape: Cell6, weight: 5 },
  { shape: Cell7, weight: 3 },
];

// Create weighted selector
const createWeightedSelector = (
  items: ShapeConfig[],
  seededRandom: () => number,
) => {
  const weightedArray: ShapeConfig[] = [];

  for (const item of items) {
    for (let i = 0; i < item.weight; i++) {
      weightedArray.push(item);
    }
  }

  return () => weightedArray[Math.floor(seededRandom() * weightedArray.length)];
};

interface ShapesBackgroundProps {
  width?: number;
  height?: number;
  cellSize?: number;
  strokeWidth?: number;
  colors?: string[];
  initialSeed?: number;
  className?: string;
  interval?: number;
}

export const ShapesBackground = ({
  width = 500,
  height = 500,
  cellSize = 20,
  strokeWidth = 10,
  colors = ["white"],
  initialSeed = 668,
  className = "",
  interval = 3000,
}: ShapesBackgroundProps) => {
  const [seed, setSeed] = React.useState(initialSeed);
  const [shapes, setShapes] = useState<React.ReactNode[]>([]);
  const borderSize = cellSize * 2;
  const scale = 0.2;

  React.useEffect(() => {
    if (interval === 0) return;
    const intervalId = setInterval(() => {
      setSeed(Math.floor(Math.random() * 1000));
    }, interval);

    return () => clearInterval(intervalId);
  }, [interval]);

  useEffect(() => {
    // Create seeded random function
    const seededRandom = seedPRNG(seed);

    // Create weighted selector with seeded random
    const pickShape = createWeightedSelector(shapesConfig, seededRandom);

    const newShapes: React.ReactNode[] = [];

    // Generate shapes for each cell
    for (let x = borderSize; x < width / 2; x += cellSize) {
      for (let y = borderSize; y < height - borderSize; y += cellSize) {
        const shapeChoice = pickShape();
        const ShapeComponent = shapeChoice.shape;

        // Left side
        newShapes.push(
          <g key={`left-${x}-${y}`} transform={`translate(${x} ${y})`}>
            <g transform={`scale(${scale})`}>
              <ShapeComponent colors={colors} strokeWidth={strokeWidth} />
            </g>
          </g>,
        );

        // Right side (mirrored)
        newShapes.push(
          <g
            key={`right-${x}-${y}`}
            transform={`translate(${width - cellSize - x} ${y})`}
          >
            <g transform={`scale(${scale})`}>
              <ShapeComponent colors={colors} strokeWidth={strokeWidth} />
            </g>
          </g>,
        );
      }
    }

    setShapes(newShapes);
  }, [width, height, cellSize, strokeWidth, colors, seed, borderSize, scale]);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
    >
      {shapes}
    </svg>
  );
};
