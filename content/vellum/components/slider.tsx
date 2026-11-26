import { useId } from "react";
import { cssVars } from "../lib/css-vars";

/** Picks a number on a range; the filled track is ink, never a hue. */
export const Slider = ({
  label,
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  format = String,
}: {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  format?: (value: number) => string;
}) => {
  const id = useId();
  const fill = ((value - min) / (max - min)) * 100;

  return (
    <div className="v-slider">
      <div className="v-between">
        <label className="v-label" htmlFor={id}>
          {label}
        </label>
        <output className="v-caption v-t2 v-data" htmlFor={id}>
          {format(value)}
        </output>
      </div>
      <input
        aria-valuetext={format(value)}
        id={id}
        max={max}
        min={min}
        onChange={(event) => {
          onValueChange(Number(event.target.value));
        }}
        step={step}
        style={cssVars({ "--fill": `${fill}%` })}
        type="range"
        value={value}
      />
    </div>
  );
};
