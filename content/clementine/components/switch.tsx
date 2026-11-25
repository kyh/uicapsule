import "./switch.css";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  hideLabel?: boolean;
  description?: string;
}

export const Switch = ({
  checked,
  onCheckedChange,
  label,
  hideLabel = false,
  description,
}: SwitchProps) => (
  <button
    aria-checked={checked}
    aria-label={hideLabel ? label : undefined}
    className="cl-switch"
    data-bare={hideLabel || undefined}
    onClick={() => onCheckedChange(!checked)}
    role="switch"
    type="button"
  >
    {hideLabel ? null : (
      <span className="cl-check__text">
        <span>{label}</span>
        {description ? <span className="cl-check__desc">{description}</span> : null}
      </span>
    )}
    <span aria-hidden className="cl-switch__track">
      <span className="cl-switch__thumb" />
    </span>
  </button>
);
