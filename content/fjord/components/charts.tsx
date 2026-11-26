import { useId, useState } from "react";

import { cssVars } from "../lib/css";
import { formatNumber } from "../lib/format";

export interface BarDatum {
  label: string;
  ok: number;
  warn: number;
  fail: number;
}

const niceMax = (value: number) => {
  const magnitude = 10 ** Math.floor(Math.log10(Math.max(1, value)));
  const steps = [1, 2, 2.5, 5, 10];
  const step = steps.find((candidate) => candidate * magnitude >= value) ?? 10;

  return step * magnitude;
};

interface BarChartProps {
  data: BarDatum[];
  label: string;
  tickEvery: number;
  unit: string;
}

/** Bars in the run hue; trouble stacks on top in amber and red, the only warm marks on the chart. */
export const BarChart = ({ data, label, tickEvery, unit }: BarChartProps) => {
  const [hover, setHover] = useState<number | null>(null);
  const id = useId();
  const max = niceMax(Math.max(...data.map((datum) => datum.ok + datum.warn + datum.fail)));
  const ticks = [max, max / 2, 0];
  const active = hover === null ? undefined : data[hover];

  return (
    <figure aria-labelledby={`${id}-cap`} className="fj-chart">
      <figcaption className="fj-sr" id={`${id}-cap`}>
        {label}
      </figcaption>
      <div className="fj-chart-plot" data-kind="run">
        <div aria-hidden className="fj-chart-y">
          {ticks.map((tick) => (
            <span key={tick}>{formatNumber(tick)}</span>
          ))}
        </div>
        <div
          aria-hidden
          className="fj-chart-area"
          onPointerLeave={() => {
            setHover(null);
          }}
        >
          {ticks.map((tick) => (
            <span
              className="fj-chart-grid"
              key={tick}
              style={{ bottom: `${(tick / max) * 100}%` }}
            />
          ))}
          <div className="fj-chart-bars">
            {data.map((datum, index) => (
              <span
                className="fj-chart-col"
                data-active={hover === index ? "" : undefined}
                key={datum.label}
                onPointerEnter={() => {
                  setHover(index);
                }}
              >
                <span
                  className="fj-chart-stack"
                  style={cssVars({
                    "--fj-h": `${((datum.ok + datum.warn + datum.fail) / max) * 100}%`,
                  })}
                >
                  {datum.fail > 0 ? (
                    <span data-trouble="fail" style={{ flexGrow: datum.fail }} />
                  ) : null}
                  {datum.warn > 0 ? (
                    <span data-trouble="warn" style={{ flexGrow: datum.warn }} />
                  ) : null}
                  <span style={{ flexGrow: datum.ok }} />
                </span>
              </span>
            ))}
          </div>
          {active && hover !== null ? (
            <div
              className="fj-chart-tip fj-overlay"
              style={{ left: `${((hover + 0.5) / data.length) * 100}%` }}
            >
              <span className="fj-strong">{active.label}</span>
              <span className="fj-data">
                {formatNumber(active.ok)} {unit}
              </span>
              {active.warn > 0 ? (
                <span className="fj-c-warn fj-data">{active.warn} degraded</span>
              ) : null}
              {active.fail > 0 ? (
                <span className="fj-c-fail fj-data">{active.fail} failed</span>
              ) : null}
            </div>
          ) : null}
        </div>
        <div aria-hidden className="fj-chart-x">
          {data.map((datum, index) => (
            <span key={datum.label}>{index % tickEvery === 0 ? datum.label : ""}</span>
          ))}
        </div>
      </div>
      <table className="fj-sr">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th scope="col">Time</th>
            <th scope="col">Done</th>
            <th scope="col">Degraded</th>
            <th scope="col">Failed</th>
          </tr>
        </thead>
        <tbody>
          {data.map((datum) => (
            <tr key={datum.label}>
              <th scope="row">{datum.label}</th>
              <td>{datum.ok}</td>
              <td>{datum.warn}</td>
              <td>{datum.fail}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
};

interface LineChartProps {
  values: number[];
  compare?: number[];
  threshold?: number;
  min?: number;
  max: number;
  label: string;
  labels: string[];
  format: (value: number) => string;
}

/** One 2px line in the kind's line step; a comparison series is dashed, never another hue. */
export const LineChart = ({
  values,
  compare,
  threshold,
  min = 0,
  max,
  label,
  labels,
  format,
}: LineChartProps) => {
  const width = 100;
  const height = 40;
  const toY = (value: number) => height - ((value - min) / (max - min)) * height;

  const toPoints = (series: number[]) =>
    series
      .map((value, index) => `${(index / (series.length - 1)) * width},${toY(value)}`)
      .join(" ");

  const last = values.at(-1) ?? 0;

  return (
    <figure className="fj-line" data-kind="run">
      <figcaption className="fj-hstack" data-align="baseline">
        <span className="fj-t-label">{label}</span>
        <span className="fj-t-stat">{format(last)}</span>
      </figcaption>
      <svg
        aria-label={`${label}, last value ${format(last)}`}
        preserveAspectRatio="none"
        role="img"
        viewBox={`0 0 ${width} ${height}`}
      >
        {threshold === undefined ? null : (
          <line
            className="fj-line-threshold"
            x1="0"
            x2={width}
            y1={toY(threshold)}
            y2={toY(threshold)}
          />
        )}
        {compare ? <polyline className="fj-line-compare" points={toPoints(compare)} /> : null}
        <polyline className="fj-line-main" points={toPoints(values)} />
      </svg>
      <div aria-hidden className="fj-line-x">
        {labels.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
      <table className="fj-sr">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th scope="col">Point</th>
            <th scope="col">This week</th>
            {compare ? <th scope="col">Last week</th> : null}
          </tr>
        </thead>
        <tbody>
          {values.map((value, index) => (
            <tr key={index}>
              <th scope="row">{index + 1}</th>
              <td>{format(value)}</td>
              {compare ? <td>{format(compare[index] ?? 0)}</td> : null}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
};
