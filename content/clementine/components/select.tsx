import { ChevronDown } from "lucide-react";

import { Field } from "./field";

import "./field.css";

interface SelectProps<T extends string> {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onValueChange: (value: T) => void;
  description?: string;
}

export const Select = <T extends string>({
  label,
  value,
  options,
  onValueChange,
  description,
}: SelectProps<T>) => (
  <Field description={description} label={label}>
    {({ id, describedBy }) => (
      <span className="cl-select">
        <select
          aria-describedby={describedBy}
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
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown aria-hidden size={16} strokeWidth={1.75} />
      </span>
    )}
  </Field>
);
