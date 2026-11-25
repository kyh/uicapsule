interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
}

export const Switch = ({ checked, onCheckedChange, label }: SwitchProps) => (
  <button
    aria-checked={checked}
    className="group flex items-center justify-between gap-4 text-[15px]"
    onClick={() => onCheckedChange(!checked)}
    role="switch"
    type="button"
  >
    <span>{label}</span>
    <span className="bg-input group-aria-checked:bg-(--ds-ink) group-focus-visible:outline-ring relative h-7 w-12 shrink-0 rounded-full transition-colors duration-(--ds-duration) group-focus-visible:outline-2 group-focus-visible:outline-offset-2">
      <span className="bg-card absolute top-0.5 left-0.5 size-6 rounded-full shadow-(--ds-shadow-thumb) transition-transform duration-200 ease-(--ds-ease) group-aria-checked:translate-x-5" />
    </span>
  </button>
);
