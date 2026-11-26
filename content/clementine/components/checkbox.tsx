import { Check } from "lucide-react";
import type { ReactNode } from "react";

import "./choice.css";

interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: ReactNode;
  description?: string;
}

export const Checkbox = ({ checked, onCheckedChange, label, description }: CheckboxProps) => (
  <label className="cl-check">
    <input
      checked={checked}
      className="cl-sr-input"
      onChange={(event) => {
        onCheckedChange(event.target.checked);
      }}
      type="checkbox"
    />
    <span aria-hidden className="cl-check__box">
      <Check size={14} strokeWidth={2.5} />
    </span>
    <span className="cl-check__text">
      <span>{label}</span>
      {description !== undefined && description !== "" ? (
        <span className="cl-check__desc">{description}</span>
      ) : null}
    </span>
  </label>
);
