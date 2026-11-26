import { useId } from "react";

import "./choice.css";

interface RadioGroupProps<T extends string> {
  label: string;
  value: T;
  options: readonly { value: T; label: string; description?: string; trailing?: string }[];
  onValueChange: (value: T) => void;
}

export const RadioGroup = <T extends string>({
  label,
  value,
  options,
  onValueChange,
}: RadioGroupProps<T>) => {
  const name = useId();

  return (
    <fieldset className="cl-radio-group">
      <legend className="cl-field__label">{label}</legend>
      {options.map((option) => (
        <label
          className="cl-radio"
          data-checked={option.value === value || undefined}
          key={option.value}
        >
          <input
            checked={option.value === value}
            className="cl-sr-input"
            name={name}
            onChange={() => {
              onValueChange(option.value);
            }}
            type="radio"
            value={option.value}
          />
          <span aria-hidden className="cl-radio__dot" />
          <span className="cl-check__text">
            <span>{option.label}</span>
            {option.description !== undefined && option.description !== "" ? (
              <span className="cl-check__desc">{option.description}</span>
            ) : null}
          </span>
          {option.trailing !== undefined && option.trailing !== "" ? (
            <span className="cl-radio__trail">{option.trailing}</span>
          ) : null}
        </label>
      ))}
    </fieldset>
  );
};
