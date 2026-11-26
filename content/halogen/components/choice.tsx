import { Check, Minus } from "lucide-react";
import { useId } from "react";
import type { CSSProperties, ReactNode } from "react";

import { Icon } from "./icon";

interface CheckboxProps {
  label: ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  indeterminate?: boolean;
  disabled?: boolean;
  description?: string;
}

/** A native checkbox drawn square, with an indeterminate bar for partial parents. */
export const Checkbox = ({
  label,
  checked,
  onCheckedChange,
  indeterminate,
  disabled,
  description,
}: CheckboxProps) => (
  <label className="hx-check">
    <input
      checked={checked}
      disabled={disabled}
      onChange={(event) => {
        onCheckedChange(event.target.checked);
      }}
      ref={(node) => {
        if (node) {
          node.indeterminate = Boolean(indeterminate);
        }
      }}
      type="checkbox"
    />
    <span className="hx-check-box">
      <Icon icon={indeterminate === true ? Minus : Check} size={14} />
    </span>
    <span className="hx-stack hx-gap-half">
      <span className="hx-body-sm">{label}</span>
      {description !== undefined && description !== "" ? (
        <span className="hx-caption hx-ink-3">{description}</span>
      ) : null}
    </span>
  </label>
);

interface RadioGroupProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string; description?: string }[];
  onValueChange: (value: T) => void;
}

/** A fieldset of native radios, each drawn as a square holding a square. */
export const RadioGroup = <T extends string>({
  label,
  value,
  options,
  onValueChange,
}: RadioGroupProps<T>) => {
  const name = useId();

  return (
    <fieldset className="hx-stack">
      <legend className="hx-label-sm hx-ink-2 hx-legend">{label}</legend>
      {options.map((option) => (
        <label className="hx-check" key={option.value}>
          <input
            checked={option.value === value}
            name={name}
            onChange={() => {
              onValueChange(option.value);
            }}
            type="radio"
            value={option.value}
          />
          <span className="hx-check-box">
            <span className="hx-radio-dot" />
          </span>
          <span className="hx-stack hx-gap-half">
            <span className="hx-body-sm">{option.label}</span>
            {option.description !== undefined && option.description !== "" ? (
              <span className="hx-caption hx-ink-3">{option.description}</span>
            ) : null}
          </span>
        </label>
      ))}
    </fieldset>
  );
};

interface SwitchProps {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  description?: string;
}

/** A two-state setting that applies the moment it flips. */
export const Switch = ({ label, checked, onCheckedChange, description }: SwitchProps) => (
  <button
    aria-checked={checked}
    className="hx-switch"
    onClick={() => {
      onCheckedChange(!checked);
    }}
    role="switch"
    type="button"
  >
    <span className="hx-switch-track" />
    <span className="hx-stack hx-gap-half">
      <span className="hx-body-sm">{label}</span>
      {description !== undefined && description !== "" ? (
        <span className="hx-caption hx-ink-3">{description}</span>
      ) : null}
    </span>
  </button>
);

interface SegmentedProps<T extends string> {
  label: string;
  options: readonly T[];
  value: T;
  onValueChange: (value: T) => void;
}

/** Radio buttons drawn as one ruled bar; the showing view takes the amber fill. */
export const Segmented = <T extends string>({
  label,
  options,
  value,
  onValueChange,
}: SegmentedProps<T>) => {
  const name = useId();

  return (
    <fieldset className="hx-seg">
      <legend className="hx-sr">{label}</legend>
      {options.map((option) => (
        <label key={option}>
          <input
            checked={option === value}
            name={name}
            onChange={() => {
              onValueChange(option);
            }}
            type="radio"
            value={option}
          />
          <span className="hx-seg-option">{option}</span>
        </label>
      ))}
    </fieldset>
  );
};

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  format: (value: number) => string;
  onValueChange: (value: number) => void;
}

/** A bounded number with its reading printed in mono above the rail. */
export const Slider = ({
  label,
  value,
  min,
  max,
  step = 1,
  format,
  onValueChange,
}: SliderProps) => {
  const id = useId();
  const fill = `${((value - min) / (max - min)) * 100}%`;

  return (
    <div className="hx-field">
      <div className="hx-meter-head">
        <label className="hx-label-sm hx-ink-2" htmlFor={id}>
          {label}
        </label>
        <output className="hx-code hx-end" htmlFor={id}>
          {format(value)}
        </output>
      </div>
      <input
        aria-valuetext={format(value)}
        className="hx-slider"
        id={id}
        max={max}
        min={min}
        onChange={(event) => {
          onValueChange(Number(event.target.value));
        }}
        step={step}
        style={{ "--fill": fill } as CSSProperties}
        type="range"
        value={value}
      />
    </div>
  );
};
