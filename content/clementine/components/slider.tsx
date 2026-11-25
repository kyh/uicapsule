import type { CSSProperties } from "react";
import { useId } from "react";

import "./slider.css";

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onValueChange: (value: number) => void;
  format?: (value: number) => string;
}

export const Slider = ({
  label,
  value,
  min,
  max,
  step = 1,
  onValueChange,
  format = String,
}: SliderProps) => {
  const id = useId();
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="cl-slider">
      <div className="cl-slider__head">
        <label className="cl-field__label" htmlFor={id}>
          {label}
        </label>
        <output className="cl-slider__value" htmlFor={id}>
          {format(value)}
        </output>
      </div>
      <input
        aria-valuetext={format(value)}
        id={id}
        max={max}
        min={min}
        onChange={(event) => onValueChange(Number(event.target.value))}
        step={step}
        style={{ "--cl-fill": `${pct}%` } as CSSProperties}
        type="range"
        value={value}
      />
    </div>
  );
};
