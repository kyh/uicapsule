import { useId } from "react";

/** One choice from a short list that stays visible. */
export const RadioGroup = <T extends string>({
  label,
  options,
  value,
  onValueChange,
}: {
  label: string;
  options: readonly { value: T; label: string; hint?: string }[];
  value: T;
  onValueChange: (value: T) => void;
}) => {
  const name = useId();

  return (
    <fieldset className="v-stack-sm v-bare">
      <legend className="v-label v-legend">{label}</legend>
      {options.map((option) => (
        <label className="v-radio v-items-start" key={option.value}>
          <input
            checked={option.value === value}
            name={name}
            onChange={() => {
              onValueChange(option.value);
            }}
            type="radio"
            value={option.value}
          />
          <span aria-hidden className="v-radio-dot v-nudge" />
          <span className="v-stack-sm v-gap-1">
            <span>{option.label}</span>
            {option.hint !== undefined && option.hint !== "" ? (
              <span className="v-caption v-t2">{option.hint}</span>
            ) : null}
          </span>
        </label>
      ))}
    </fieldset>
  );
};
