import { useId } from "react";
import type { ReactNode } from "react";
import { Check } from "lucide-react";

import { cssVars } from "../lib/css";
import { Icon } from "./icon";

interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}

export const Checkbox = ({
  checked,
  onCheckedChange,
  label,
  description,
  disabled,
}: CheckboxProps) => (
  <label className="fj-check">
    <input
      checked={checked}
      disabled={disabled}
      onChange={(event) => onCheckedChange(event.target.checked)}
      type="checkbox"
    />
    <span aria-hidden className="fj-check-box">
      <Check strokeWidth={3} />
    </span>
    <span className="fj-check-text">
      <span>{label}</span>
      {description ? <span>{description}</span> : null}
    </span>
  </label>
);

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
}

/** On or off at once. The track keeps the control corner; only people are round. */
export const Switch = ({ checked, onCheckedChange, label }: SwitchProps) => (
  <button
    aria-checked={checked}
    className="fj-switch"
    onClick={() => onCheckedChange(!checked)}
    role="switch"
    type="button"
  >
    <span className="fj-switch-track">
      <span className="fj-switch-thumb" />
    </span>
    {label}
  </button>
);

export const SwitchRow = ({
  checked,
  onCheckedChange,
  label,
  description,
}: SwitchProps & { description: string }) => (
  <div className="fj-switch-row">
    <div className="fj-item-main">
      <span className="fj-t-label">{label}</span>
      <span className="fj-item-desc">{description}</span>
    </div>
    <button
      aria-checked={checked}
      aria-label={label}
      className="fj-switch"
      onClick={() => onCheckedChange(!checked)}
      role="switch"
      type="button"
    >
      <span className="fj-switch-track">
        <span className="fj-switch-thumb" />
      </span>
    </button>
  </div>
);

interface SegmentedProps<T extends string> {
  label: string;
  options: readonly T[];
  value: T;
  onValueChange: (value: T) => void;
  size?: "xs";
  render?: (option: T) => ReactNode;
}

/** Switches a view between a handful of options. Built on native radios, so arrow keys work, and the picked option lifts onto paper. */
export const Segmented = <T extends string>({
  label,
  options,
  value,
  onValueChange,
  size,
  render,
}: SegmentedProps<T>) => {
  const name = useId();

  return (
    <fieldset className="fj-segmented" data-size={size}>
      <legend className="fj-sr">{label}</legend>
      {options.map((option) => (
        <label className="fj-seg-opt" key={option}>
          <input
            checked={option === value}
            name={name}
            onChange={() => onValueChange(option)}
            type="radio"
            value={option}
          />
          <span>{render ? render(option) : option}</span>
        </label>
      ))}
    </fieldset>
  );
};

interface ChoiceOption<T extends string> {
  value: T;
  label: string;
  description: string;
}

interface ChoiceListProps<T extends string> {
  label: string;
  options: readonly ChoiceOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
}

/** Picks one of a few, as ruled rows. The picked row gets the cold wash, an ink ring and a check at its end. */
export const ChoiceList = <T extends string>({
  label,
  options,
  value,
  onValueChange,
}: ChoiceListProps<T>) => {
  const name = useId();

  return (
    <fieldset className="fj-choice">
      <legend className="fj-sr">{label}</legend>
      {options.map((option) => (
        <label className="fj-choice-item" key={option.value}>
          <input
            checked={option.value === value}
            name={name}
            onChange={() => onValueChange(option.value)}
            type="radio"
            value={option.value}
          />
          <span className="fj-item-main">
            <span className="fj-t-label">{option.label}</span>
            <span className="fj-item-desc">{option.description}</span>
          </span>
          <span aria-hidden className="fj-choice-check">
            <Icon icon={Check} size={16} />
          </span>
        </label>
      ))}
    </fieldset>
  );
};

interface SliderProps {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  format: (value: number) => string;
  ticks?: string[];
}

export const Slider = ({
  label,
  value,
  onValueChange,
  min,
  max,
  step = 1,
  format,
  ticks,
}: SliderProps) => {
  const fill = `${((value - min) / (max - min)) * 100}%`;

  return (
    <label className="fj-slider">
      <span className="fj-slider-head">
        <span>{label}</span>
        <output>{format(value)}</output>
      </span>
      <input
        aria-valuetext={format(value)}
        className="fj-range"
        max={max}
        min={min}
        onChange={(event) => onValueChange(Number(event.target.value))}
        step={step}
        style={cssVars({ "--fj-fill": fill })}
        type="range"
        value={value}
      />
      {ticks ? (
        <span aria-hidden className="fj-slider-ticks">
          {ticks.map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </span>
      ) : null}
    </label>
  );
};
