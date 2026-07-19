"use client";

import { useEffect, useMemo, useState, type ReactElement, type ReactNode } from "react";

interface CellProps {
  colors: string[];
  strokeWidth: number;
}

type CellComponent = (props: CellProps) => ReactElement | null;

// Cell shape functions that return JSX instead of SVG strings
const Cell1 = ({ colors }: CellProps) => (
  <circle cx="50" cy="50" r="9.44" fill={colors[0]} fillRule="evenodd" />
);

const Cell2 = ({ colors, strokeWidth }: CellProps) => (
  <>
    <line x1="25" x2="75" y1="25" y2="25" stroke={colors[0]} strokeWidth={strokeWidth} />
    <line x1="25" x2="75" y1="50" y2="50" stroke={colors[0]} strokeWidth={strokeWidth} />
    <line x1="25" x2="75" y1="75" y2="75" stroke={colors[0]} strokeWidth={strokeWidth} />
  </>
);

const Cell3 = ({ colors, strokeWidth }: CellProps) => (
  <>
    <line x1="25" x2="75" y1="25" y2="75" stroke={colors[0]} strokeWidth={strokeWidth} />
    <line x1="25" x2="75" y1="75" y2="25" stroke={colors[0]} strokeWidth={strokeWidth} />
  </>
);

const Cell4 = ({ colors, strokeWidth }: CellProps) => (
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

const Cell5 = ({ colors, strokeWidth }: CellProps) => (
  <line x1="25" x2="75" y1="75" y2="25" fill="none" stroke={colors[0]} strokeWidth={strokeWidth} />
);

const Cell6 = () => null;

const Cell7 = () => <rect width="75" height="75" x="12.5" y="12.5" fill="rgba(255,255,255,0.1)" />;

interface ShapeConfig {
  shape: CellComponent;
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

// Each config repeated `weight` times, so a uniform draw honours the weights.
// Built once at module scope: every cell re-rolls on its own timer, so rebuilding
// this per draw would allocate constantly.
const weightedShapes: ShapeConfig[] = shapesConfig.flatMap((config) =>
  Array.from({ length: config.weight }, () => config),
);

// Unreachable fallback for `noUncheckedIndexedAccess`; the index below is always in range.
const fallbackShape: ShapeConfig = { shape: Cell1, weight: 1 };

const pickShape = (): ShapeConfig =>
  weightedShapes[Math.floor(Math.random() * weightedShapes.length)] ?? fallbackShape;

// Cells are authored in a 100x100 viewBox; this maps one down to a `cellSize` grid slot.
const CELL_SCALE = 0.2;

// Module scope so the default keeps a stable identity across renders.
const DEFAULT_COLORS = ["white"];

// Individual shape component that manages its own interval
interface ShapeProps {
  x: number;
  y: number;
  colors: string[];
  strokeWidth: number;
  minInterval: number;
  maxInterval: number;
}

const Shape = ({ x, y, colors, strokeWidth, minInterval, maxInterval }: ShapeProps) => {
  const [currentShape, setCurrentShape] = useState<ShapeConfig>(pickShape);

  useEffect(() => {
    const getRandomInterval = () => Math.random() * (maxInterval - minInterval) + minInterval;

    let timeoutId: ReturnType<typeof setTimeout>;
    const scheduleNext = () => {
      timeoutId = setTimeout(() => {
        setCurrentShape(pickShape());
        scheduleNext();
      }, getRandomInterval());
    };
    scheduleNext();

    return () => clearTimeout(timeoutId);
  }, [minInterval, maxInterval]);

  const ShapeComponent = currentShape.shape;

  return (
    <g transform={`translate(${x} ${y})`}>
      <g transform={`scale(${CELL_SCALE})`}>
        <ShapeComponent colors={colors} strokeWidth={strokeWidth} />
      </g>
    </g>
  );
};

interface BackgroundShapesProps {
  width?: number;
  height?: number;
  cellSize?: number;
  strokeWidth?: number;
  colors?: string[];
  className?: string;
  minInterval?: number;
  maxInterval?: number;
}

export const BackgroundShapes = ({
  width = 500,
  height = 500,
  cellSize = 20,
  strokeWidth = 10,
  colors = DEFAULT_COLORS,
  className = "",
  minInterval = 1000,
  maxInterval = 5000,
}: BackgroundShapesProps) => {
  const borderSize = cellSize * 2;
  const colorsKey = colors.join("|");

  const shapes = useMemo<ReactNode[]>(() => {
    const list: ReactNode[] = [];
    for (let x = borderSize; x < width / 2; x += cellSize) {
      for (let y = borderSize; y < height - borderSize; y += cellSize) {
        list.push(
          <Shape
            key={`left-${x}-${y}`}
            x={x}
            y={y}
            colors={colors}
            strokeWidth={strokeWidth}
            minInterval={minInterval}
            maxInterval={maxInterval}
          />,
          <Shape
            key={`right-${x}-${y}`}
            x={width - cellSize - x}
            y={y}
            colors={colors}
            strokeWidth={strokeWidth}
            minInterval={minInterval}
            maxInterval={maxInterval}
          />,
        );
      }
    }
    return list;
    // colors identity may change per-render; use a stable join key instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, cellSize, strokeWidth, colorsKey, borderSize, minInterval, maxInterval]);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className}>
      {shapes}
    </svg>
  );
};
