import React, { useId } from "react";

export type GridPatternProps = {
  width: number;
  height: number;
  x?: number | string;
  y?: number | string;
  squares?: number[][];
} & React.SVGProps<SVGSVGElement>;

export const GridPattern = ({
  width,
  height,
  x,
  y,
  squares,
  ...props
}: GridPatternProps) => {
  const patternId = useId();

  return (
    <svg aria-hidden="true" {...props}>
      <defs>
        <pattern
          id={patternId}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          x={x}
          y={y}
        >
          <path d={`M.5 ${height}V.5H${width}`} fill="none" />
        </pattern>
      </defs>
      <rect
        width="100%"
        height="100%"
        strokeWidth={0}
        fill={`url(#${patternId})`}
      />
      {squares && (
        <svg x={x} y={y} className="overflow-visible">
          {squares.map(([x, y]) => (
            <rect
              strokeWidth="0"
              key={`${x}-${y}`}
              width={width + 1}
              height={height + 1}
              x={(x ?? 0) * width}
              y={(y ?? 0) * height}
            />
          ))}
        </svg>
      )}
    </svg>
  );
};
