import { useId } from "react";

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  meta?: string;
}

interface SelectProps<T extends string> {
  label: string;
  value: T;
  options: SelectOption<T>[];
  onValueChange: (value: T) => void;
  size?: "sm";
  hideLabel?: boolean;
}

/**
 * Picks one value from a short list. A native select, so the keyboard and screen readers get the
 * platform's own; where the browser allows it, its list is drawn as a Halogen overlay.
 */
export const Select = <T extends string>({
  label,
  value,
  options,
  onValueChange,
  size,
  hideLabel,
}: SelectProps<T>) => {
  const id = useId();

  return (
    <div className="hx-field">
      <label className={hideLabel ? "hx-sr" : "hx-field-label hx-label-sm"} htmlFor={id}>
        {label}
      </label>
      <select
        className="hx-select"
        data-size={size}
        id={id}
        onChange={(event) => {
          const next = options.find((option) => option.value === event.target.value);

          if (next) {
            onValueChange(next.value);
          }
        }}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.meta ? `${option.label} · ${option.meta}` : option.label}
          </option>
        ))}
      </select>
    </div>
  );
};
