import "./sparkline.css";

export const Sparkline = ({
  points,
  width = 72,
  height = 28,
}: {
  points: readonly number[];
  width?: number;
  height?: number;
}) => {
  if (points.length < 2) {
    return null;
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;

  const xy = points.map<[number, number]>((point, index) => [
    2 + (index / (points.length - 1)) * (width - 4),
    2 + (1 - (point - min) / span) * (height - 4),
  ]);

  const last = xy.at(-1) ?? [0, 0];

  return (
    <svg
      aria-hidden
      className="cl-spark"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
    >
      <polyline fill="none" points={xy.map(([x, y]) => `${x},${y}`).join(" ")} />
      <circle cx={last[0]} cy={last[1]} r={2.5} />
    </svg>
  );
};
