"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactElement, ReactNode } from "react";

interface CellProps {
  colors: string[];
  strokeWidth: number;
}

type CellComponent = (props: CellProps) => ReactElement | null;

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

const Cell7 = ({ colors }: CellProps) => (
  <rect width="75" height="75" x="12.5" y="12.5" fill={colors[0]} fillOpacity={0.1} />
);

interface CellConfig {
  glyph: CellComponent;
  weight: number;
}

const cellConfigs: CellConfig[] = [
  { glyph: Cell1, weight: 1 },
  { glyph: Cell2, weight: 1 },
  { glyph: Cell3, weight: 1 },
  { glyph: Cell4, weight: 1 },
  { glyph: Cell5, weight: 1 },
  { glyph: Cell6, weight: 5 },
  { glyph: Cell7, weight: 3 },
];

const weightedCells: CellConfig[] = cellConfigs.flatMap((config) =>
  Array.from({ length: config.weight }, () => config),
);

const fallbackCell: CellConfig = { glyph: Cell1, weight: 1 };

const pickCell = () =>
  weightedCells[Math.floor(Math.random() * weightedCells.length)] ?? fallbackCell;

const GLYPH_VIEWBOX = 100;

const DEFAULT_COLORS = ["white"];

interface GridCellProps {
  x: number;
  y: number;
  size: number;
  colors: string[];
  strokeWidth: number;
  minInterval: number;
  maxInterval: number;
}

const GridCell = ({ x, y, size, colors, strokeWidth, minInterval, maxInterval }: GridCellProps) => {
  const [currentCell, setCurrentCell] = useState<CellConfig>(pickCell);

  useEffect(() => {
    const getRandomInterval = () => Math.random() * (maxInterval - minInterval) + minInterval;

    let timeoutId: ReturnType<typeof setTimeout>;

    const scheduleNext = () => {
      timeoutId = setTimeout(() => {
        setCurrentCell(pickCell());
        scheduleNext();
      }, getRandomInterval());
    };

    scheduleNext();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [minInterval, maxInterval]);

  const Glyph = currentCell.glyph;

  return (
    <g transform={`translate(${x} ${y})`}>
      <g transform={`scale(${size / GLYPH_VIEWBOX})`}>
        <Glyph colors={colors} strokeWidth={strokeWidth} />
      </g>
    </g>
  );
};

interface BackgroundGlyphsProps {
  width?: number;
  height?: number;
  cellSize?: number;
  strokeWidth?: number;
  colors?: string[];
  className?: string;
  minInterval?: number;
  maxInterval?: number;
}

export const BackgroundGlyphs = ({
  width = 500,
  height = 500,
  cellSize = 20,
  strokeWidth = 10,
  colors = DEFAULT_COLORS,
  className = "",
  minInterval = 1000,
  maxInterval = 5000,
}: BackgroundGlyphsProps) => {
  const borderSize = cellSize * 2;

  const cells = useMemo<ReactNode[]>(() => {
    const list: ReactNode[] = [];

    for (let column = 0; borderSize + (column + 1) * cellSize <= width / 2; column += 1) {
      const x = borderSize + column * cellSize;

      for (let row = 0; borderSize + row * cellSize < height - borderSize; row += 1) {
        const y = borderSize + row * cellSize;

        list.push(
          <GridCell
            key={`left-${column}-${row}`}
            x={x}
            y={y}
            size={cellSize}
            colors={colors}
            strokeWidth={strokeWidth}
            minInterval={minInterval}
            maxInterval={maxInterval}
          />,
          <GridCell
            key={`right-${column}-${row}`}
            x={width - cellSize - x}
            y={y}
            size={cellSize}
            colors={colors}
            strokeWidth={strokeWidth}
            minInterval={minInterval}
            maxInterval={maxInterval}
          />,
        );
      }
    }

    return list;
  }, [width, height, cellSize, strokeWidth, colors, borderSize, minInterval, maxInterval]);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className}>
      {cells}
    </svg>
  );
};
