import { useState } from "react";

import { short } from "../lib/format";
import { useWidth } from "../lib/use-width";
import { cssVars } from "../lib/css-vars";

export interface Datum {
  label: string;
  value: number;
}

interface StemChartProps {
  label: string;
  data: Datum[];
  tone?: "lamp" | "ink";
  height?: number;
  format?: (value: number) => string;
}

/** Periods as vertical stems with square heads, each labelled with its value. */
export const StemChart = ({
  label,
  data,
  tone = "lamp",
  height = 180,
  format = short,
}: StemChartProps) => {
  const { ref, width } = useWidth<HTMLDivElement>();
  const max = Math.max(...data.map((item) => item.value));
  const top = 36;
  const bottom = 22;
  const plot = height - top - bottom;
  const step = width / data.length;
  const turned = step < 44;

  return (
    <figure aria-label={label} ref={ref} className="hx-shrink">
      <svg
        aria-hidden
        className="hx-chart"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        width={width}
      >
        <line
          className="hx-axis"
          x1={0}
          x2={width}
          y1={height - bottom + 0.5}
          y2={height - bottom + 0.5}
        />
        <g className="hx-stems">
          {data.map((item, index) => {
            const x = Math.round(step * index + step / 2) + 0.5;
            const y = Math.round(top + plot - (item.value / max) * plot);

            return (
              <g key={item.label} style={cssVars({ "--i": index })}>
                <line className="hx-stem" x1={x} x2={x} y1={height - bottom} y2={y} />
                <rect
                  className="hx-stem-head"
                  data-tone={tone === "ink" ? "ink" : undefined}
                  height={8}
                  width={8}
                  x={x - 4.5}
                  y={y - 4}
                />
                <text
                  className="hx-chart-value"
                  textAnchor={turned ? "start" : "middle"}
                  transform={turned ? `rotate(-90 ${x + 4} ${y - 10})` : undefined}
                  x={turned ? x + 4 : x}
                  y={y - 10}
                >
                  {format(item.value)}
                </text>
                <text textAnchor="middle" x={x} y={height - 6}>
                  {item.label.toUpperCase()}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
      <table className="hx-sr">
        <caption>{label}</caption>
        <tbody>
          {data.map((item) => (
            <tr key={item.label}>
              <th scope="row">{item.label}</th>
              <td>{item.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
};

interface BlocksProps {
  label: string;
  data: (Datum & { tone?: "fail" | "ok" })[];
  format?: (value: number) => string;
  height?: number;
}

/** A total broken into flexed blocks sized by share; the first block is washed. */
export const BarBlocks = ({ label, data, format = short, height = 140 }: BlocksProps) => {
  const total = data.reduce<number>((sum, item) => sum + item.value, 0);

  return (
    <figure aria-label={label} className="hx-shrink">
      <ol className="hx-blocks" style={cssVars({ "--h": `${height}px` })}>
        {data.map((item, index) => {
          const share = item.value / total;
          const percent = share > 0 && share < 0.01 ? "<1%" : `${Math.round(share * 100)}%`;

          return (
            <li
              aria-label={`${item.label}: ${format(item.value)}, ${percent} of the total`}
              className="hx-block"
              data-tone={item.tone}
              key={item.label}
              style={cssVars({ "--i": index, "--share": share.toFixed(4) })}
            >
              <span aria-hidden className="hx-code">
                {format(item.value)}
              </span>
              <span aria-hidden className="hx-stack hx-gap-half">
                <span className="hx-code-sm hx-ink-3">{percent}</span>
                <span className="hx-block-name hx-micro">{item.label}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </figure>
  );
};

interface LineChartProps {
  label: string;
  data: Datum[];
  height?: number;
  format?: (value: number) => string;
  unit?: string;
  hint?: string;
}

/** An ink polyline over a washed area, with a pointer readout and width-aware ticks. */
export const LineChart = ({
  label,
  data,
  height = 180,
  format = short,
  unit = "",
  hint = "Point at the line to read a value",
}: LineChartProps) => {
  const { ref, width } = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const left = 44;
  const right = 8;
  const top = 12;
  const bottom = 24;
  const values = data.map((item) => item.value);
  const peak = Math.max(...values, 1);
  const step = 10 ** Math.floor(Math.log10(peak));
  const max = Math.ceil(peak / step) * step;
  const plotW = width - left - right;
  const plotH = height - top - bottom;
  const xAt = (index: number) => left + (index / (data.length - 1)) * plotW;
  const yAt = (value: number) => top + plotH - (value / max) * plotH;

  const points = data.map(
    (item, index) => `${xAt(index).toFixed(1)},${yAt(item.value).toFixed(1)}`,
  );

  const ticks = [0, 0.5, 1].map((share) => share * max);
  const labelEvery = Math.max(1, Math.ceil(64 / (plotW / Math.max(1, data.length - 1))));
  const crowded = (plotW / Math.max(1, data.length - 1)) * labelEvery < 96;

  const showLabel = (index: number) => {
    const fromEnd = data.length - 1 - index;

    return fromEnd % labelEvery === 0 && !(crowded && fromEnd === labelEvery);
  };

  const active = hover === null ? null : data[hover];

  return (
    <figure aria-label={label} className="hx-figure-box" ref={ref}>
      <svg
        aria-hidden
        className="hx-chart"
        height={height}
        onPointerLeave={() => {
          setHover(null);
        }}
        onPointerMove={(event) => {
          const box = event.currentTarget.getBoundingClientRect();
          const share = (event.clientX - box.left - left) / plotW;
          setHover(Math.max(0, Math.min(data.length - 1, Math.round(share * (data.length - 1)))));
        }}
        viewBox={`0 0 ${width} ${height}`}
        width={width}
      >
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              className="hx-grid-line"
              x1={left}
              x2={width - right}
              y1={Math.round(yAt(tick)) + 0.5}
              y2={Math.round(yAt(tick)) + 0.5}
            />
            <text textAnchor="end" x={left - 8} y={yAt(tick) + 4}>
              {short(tick)}
            </text>
          </g>
        ))}
        <polygon
          fill="var(--hx-wash)"
          points={`${left},${top + plotH} ${points.join(" ")} ${width - right},${top + plotH}`}
        />
        <polyline
          fill="none"
          points={points.join(" ")}
          stroke="var(--hx-ink-1)"
          strokeLinejoin="miter"
          strokeWidth={1.5}
        />
        {data.map((item, index) =>
          showLabel(index) ? (
            <text
              key={item.label}
              textAnchor={index === data.length - 1 ? "end" : "middle"}
              x={xAt(index)}
              y={height - 6}
            >
              {item.label.toUpperCase()}
            </text>
          ) : null,
        )}
        {active && hover !== null ? (
          <g>
            <line
              stroke="var(--hx-rule-control)"
              x1={Math.round(xAt(hover)) + 0.5}
              x2={Math.round(xAt(hover)) + 0.5}
              y1={top}
              y2={top + plotH}
            />
            <rect
              fill="var(--hx-lamp)"
              height={8}
              stroke="var(--hx-ink-1)"
              width={8}
              x={xAt(hover) - 4}
              y={yAt(active.value) - 4}
            />
          </g>
        ) : null}
      </svg>
      <p className="hx-code-sm hx-ink-2 hx-chart-readout">
        {active ? `${active.label}: ${format(active.value)}${unit}` : hint}
      </p>
    </figure>
  );
};
