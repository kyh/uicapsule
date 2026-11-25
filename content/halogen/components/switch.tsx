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
    <span className="border-input bg-muted group-aria-checked:bg-primary group-aria-checked:border-(--ds-primary-edge) group-focus-visible:outline-ring relative h-5 w-9 shrink-0 border-(length:--ds-border-width) transition-colors duration-(--ds-duration) group-focus-visible:outline-2 group-focus-visible:outline-offset-2">
      <span className="bg-foreground absolute top-0.5 left-0.5 size-3.5 transition-transform duration-(--ds-duration) ease-(--ds-ease) group-aria-checked:translate-x-4" />
    </span>
  </button>
);
