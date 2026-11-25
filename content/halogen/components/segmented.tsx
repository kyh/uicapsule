import { useId } from "react";

interface SegmentedProps<T extends string> {
  label: string;
  options: readonly T[];
  value: T;
  onValueChange: (value: T) => void;
}

export const Segmented = <T extends string>({
  label,
  options,
  value,
  onValueChange,
}: SegmentedProps<T>) => {
  const name = useId();

  return (
    <fieldset className="border-border divide-border inline-flex w-fit divide-x-(length:--ds-border-width) border-(length:--ds-border-width)">
      <legend className="sr-only">{label}</legend>
      {options.map((option) => (
        <label className="cursor-pointer" key={option}>
          <input
            checked={option === value}
            className="peer sr-only"
            name={name}
            onChange={() => onValueChange(option)}
            type="radio"
            value={option}
          />
          <span className="text-muted-foreground peer-checked:bg-accent peer-checked:text-foreground peer-focus-visible:outline-ring grid h-7 place-items-center px-3 font-(family-name:--ds-font-mono) text-xs tracking-[0.04em] transition-colors duration-(--ds-duration) peer-focus-visible:outline-2 peer-focus-visible:-outline-offset-2">
            {option}
          </span>
        </label>
      ))}
    </fieldset>
  );
};
