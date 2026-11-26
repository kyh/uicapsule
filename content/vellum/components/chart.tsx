"use client";

import { useEffect, useRef, useState } from "react";

const noop = () => null;

const FALLBACK_WIDTH = 560;
const HEIGHT = 168;
const PAD = { bottom: 22, left: 36, right: 8, top: 8 };

interface Series {
  name: string;
  values: readonly number[];
}

const smooth = (points: readonly (readonly [number, number])[]) =>
  points
    .map(([x, y], index) => {
      if (index === 0) {
        return `M${x},${y}`;
      }

      const previous = points[index - 1] ?? [x, y];
      const before = points[index - 2] ?? previous;
      const after = points[index + 1] ?? [x, y];
      const c1x = previous[0] + (x - before[0]) / 6;
      const c1y = previous[1] + (y - before[1]) / 6;
      const c2x = x - (after[0] - previous[0]) / 6;
      const c2y = y - (after[1] - previous[1]) / 6;

      return `C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${x},${y}`;
    })
    .join(" ");

/** Numbers over time in ink: the first series at 80%, the second at 45%, never a hue. */
export const LineChart = ({
  label,
  labels,
  series,
  ticks,
  format,
  area = false,
}: {
  label: string;
  labels: readonly string[];
  series: readonly Series[];
  ticks: readonly number[];
  format: (value: number) => string;
  area?: boolean;
}) => {
  const [focus, setFocus] = useState<number | null>(null);
  const [width, setWidth] = useState(FALLBACK_WIDTH);
  const frame = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = frame.current;

    if (!node) {
      return noop;
    }

    const observer = new ResizeObserver(([entry]) => {
      const measured = Math.round(entry?.contentRect.width ?? 0);

      if (measured > 0) {
        setWidth(measured);
      }
    });

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  const min = Math.min(...ticks);
  const max = Math.max(...ticks);
  const count = labels.length;
  const step = Math.ceil(count / Math.max(2, Math.floor(width / 96)));
  const plot = width - PAD.left - PAD.right;

  const x = (index: number) => PAD.left + (index / (count - 1)) * plot;

  const y = (value: number) =>
    PAD.top + (1 - (value - min) / (max - min)) * (HEIGHT - PAD.top - PAD.bottom);

  const shown = focus ?? count - 1;

  const readout = series
    .map((entry) => `${entry.name} ${format(entry.values[shown] ?? 0)}`)
    .join(", ");

  return (
    <figure className="v-stack-sm v-gap-8">
      <figcaption aria-hidden className="v-caption v-t2 v-data">
        <span className="v-t1">{labels[shown]}</span>
        {series.map((entry) => (
          <span key={entry.name}>
            {" · "}
            {entry.name} {format(entry.values[shown] ?? 0)}
          </span>
        ))}
      </figcaption>
      <div className="v-chart-frame" ref={frame}>
        <svg aria-hidden className="v-chart" viewBox={`0 0 ${width} ${HEIGHT}`}>
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                className="v-grid"
                x1={PAD.left}
                x2={width - PAD.right}
                y1={y(tick)}
                y2={y(tick)}
              />
              <text
                className="v-axis"
                dominantBaseline="middle"
                textAnchor="end"
                x={PAD.left - 8}
                y={y(tick)}
              >
                {format(tick)}
              </text>
            </g>
          ))}
          {labels.map((name, index) =>
            index === count - 1 ||
            (index % step === 0 && ((count - 1 - index) * plot) / (count - 1) >= 96) ? (
              <text
                className="v-axis"
                key={name}
                textAnchor={index === count - 1 ? "end" : "middle"}
                x={x(index)}
                y={HEIGHT - 4}
              >
                {name}
              </text>
            ) : null,
          )}
          {area && series[0] ? (
            <path
              className="v-area"
              d={`${smooth(series[0].values.map((value, index) => [x(index), y(value)] as const))} L${x(count - 1)},${y(min)} L${x(0)},${y(min)} Z`}
            />
          ) : null}
          {series.map((entry, order) => (
            <path
              className={order === 0 ? "v-series-1" : "v-series-2"}
              d={smooth(entry.values.map((value, index) => [x(index), y(value)] as const))}
              key={entry.name}
            />
          ))}
          {focus === null ? null : (
            <g>
              <line
                className="v-cursor"
                x1={x(focus)}
                x2={x(focus)}
                y1={PAD.top}
                y2={HEIGHT - PAD.bottom}
              />
              {series.map((entry) => (
                <circle
                  className="v-dot"
                  cx={x(focus)}
                  cy={y(entry.values[focus] ?? 0)}
                  key={entry.name}
                  r={3.5}
                />
              ))}
            </g>
          )}
        </svg>
        <input
          aria-label={label}
          aria-valuetext={`${labels[shown]}: ${readout}`}
          className="v-chart-scrub"
          max={count - 1}
          min={0}
          onBlur={() => {
            setFocus(null);
          }}
          onChange={(event) => {
            setFocus(Number(event.target.value));
          }}
          onPointerLeave={() => {
            setFocus(null);
          }}
          onPointerMove={(event) => {
            const box = event.currentTarget.getBoundingClientRect();
            const relative = ((event.clientX - box.left) / box.width) * width;
            const index = Math.round(((relative - PAD.left) / plot) * (count - 1));

            setFocus(Math.min(count - 1, Math.max(0, index)));
          }}
          step={1}
          type="range"
          value={shown}
        />
      </div>
      {series.length > 1 ? (
        <div aria-hidden className="v-legend">
          {series.map((entry, order) => (
            <span key={entry.name}>
              <i data-series={order + 1} />
              {entry.name}
            </span>
          ))}
        </div>
      ) : null}
    </figure>
  );
};
