/** Flips a single setting, applied the moment it moves. */
export const Switch = ({
  checked,
  onCheckedChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}) => (
  <button
    aria-checked={checked}
    className="v-switch"
    disabled={disabled}
    onClick={() => onCheckedChange(!checked)}
    role="switch"
    type="button"
  >
    <span className="v-switch-track">
      <span className="v-switch-thumb" />
    </span>
    <span>{label}</span>
  </button>
);
