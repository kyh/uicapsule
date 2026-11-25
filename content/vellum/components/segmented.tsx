import { useId } from "react";

/** Two to five views or levels of one thing; the chosen one slides under a paper thumb. */
export const Segmented = <T extends string>({
  label,
  options,
  value,
  onValueChange,
  size = "md",
  disabled = false,
}: {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T | undefined;
  onValueChange: (value: T) => void;
  size?: "sm" | "md";
  disabled?: boolean;
}) => {
  const name = useId();
  const index = options.findIndex((option) => option.value === value);
  const inset = size === "sm" ? 2 : 3;

  return (
    <fieldset
      className="v-seg"
      data-disabled={disabled ? "" : undefined}
      data-size={size}
      disabled={disabled}
    >
      <legend className="v-sr">{label}</legend>
      {index === -1 ? null : (
        <span
          aria-hidden
          className="v-seg-thumb"
          style={{
            translate: `${index * 100}% 0`,
            width: `calc((100% - ${inset * 2}px) / ${options.length})`,
          }}
        />
      )}
      {options.map((option) => (
        <label key={option.value}>
          <input
            checked={option.value === value}
            name={name}
            onChange={() => onValueChange(option.value)}
            type="radio"
            value={option.value}
          />
          <span className="v-seg-text">{option.label}</span>
        </label>
      ))}
    </fieldset>
  );
};
