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
    <fieldset className="bg-muted inline-flex w-fit rounded-full p-1">
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
          <span className="text-muted-foreground peer-checked:bg-card peer-checked:text-foreground peer-focus-visible:outline-ring grid h-8 place-items-center rounded-full px-4 text-sm font-medium transition duration-(--ds-duration) ease-(--ds-ease) peer-checked:shadow-(--ds-shadow-thumb) peer-focus-visible:outline-2">
            {option}
          </span>
        </label>
      ))}
    </fieldset>
  );
};
