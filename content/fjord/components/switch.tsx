interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
}

export const Switch = ({ checked, onCheckedChange, label }: SwitchProps) => (
  <button
    aria-checked={checked}
    className="group flex items-center justify-between gap-4 text-sm"
    onClick={() => onCheckedChange(!checked)}
    role="switch"
    type="button"
  >
    <span>{label}</span>
    <span className="bg-input group-aria-checked:bg-primary group-focus-visible:outline-ring relative h-5 w-9 shrink-0 rounded-(--ds-radius-control) transition-colors duration-(--ds-duration) group-focus-visible:outline-2 group-focus-visible:outline-offset-2">
      <span className="bg-card absolute top-0.5 left-0.5 size-4 rounded-(--ds-radius-inner) shadow-(--ds-shadow) transition-transform duration-(--ds-duration) ease-(--ds-ease) group-aria-checked:translate-x-4" />
    </span>
  </button>
);
