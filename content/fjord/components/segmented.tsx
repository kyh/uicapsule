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
    <fieldset className="bg-muted inline-flex w-fit rounded-(--ds-radius-control) p-0.5">
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
          <span className="text-muted-foreground peer-checked:bg-card peer-checked:text-foreground peer-focus-visible:outline-ring grid h-7 place-items-center rounded-(--ds-radius-inner) px-3 text-sm font-[440] transition duration-(--ds-duration) ease-(--ds-ease) peer-checked:shadow-(--ds-shadow) peer-focus-visible:outline-2">
            {option}
          </span>
        </label>
      ))}
    </fieldset>
  );
};
