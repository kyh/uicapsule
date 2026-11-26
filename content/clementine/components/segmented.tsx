import type { CSSProperties } from "react";
import { useId } from "react";

import "./segmented.css";

interface SegmentedProps<T extends string> {
  label: string;
  options: readonly T[];
  value: T;
  onValueChange: (value: T) => void;
  block?: boolean;
}

export const Segmented = <T extends string>({
  label,
  options,
  value,
  onValueChange,
  block = false,
}: SegmentedProps<T>) => {
  const name = useId();
  const index = Math.max(0, options.indexOf(value));

  return (
    <fieldset
      className="cl-seg"
      data-block={block || undefined}
      style={
        {
          "--cl-seg-count": options.length,
          "--cl-seg-index": index,
        } as CSSProperties
      }
    >
      <legend className="cl-sr">{label}</legend>
      <span aria-hidden className="cl-seg__thumb" />
      {options.map((option) => (
        <label className="cl-seg__item" key={option}>
          <input
            checked={option === value}
            className="cl-sr-input"
            name={name}
            onChange={() => onValueChange(option)}
            type="radio"
            value={option}
          />
          <span>{option}</span>
        </label>
      ))}
    </fieldset>
  );
};
