import { Check } from "lucide-react";

interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
}

export const Checkbox = ({ checked, onCheckedChange, label }: CheckboxProps) => (
  <label className="flex cursor-pointer items-center gap-3 text-sm">
    <input
      checked={checked}
      className="peer sr-only"
      onChange={(event) => onCheckedChange(event.target.checked)}
      type="checkbox"
    />
    <span className="border-input peer-checked:bg-foreground peer-checked:border-foreground text-background peer-focus-visible:outline-ring grid size-4 shrink-0 place-items-center border-(length:--ds-border-width) transition-colors duration-(--ds-duration) peer-checked:*:scale-100 peer-checked:*:opacity-100 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2">
      <Check
        aria-hidden
        className="size-3 scale-50 opacity-0 transition duration-(--ds-duration) ease-(--ds-ease)"
        strokeWidth={3}
      />
    </span>
    <span>{label}</span>
  </label>
);
