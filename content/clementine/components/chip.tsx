import { Check } from "lucide-react";
import type { ReactNode } from "react";

import "./chip.css";

export const Chip = ({
  selected,
  onSelectedChange,
  children,
}: {
  selected: boolean;
  onSelectedChange: (selected: boolean) => void;
  children: ReactNode;
}) => (
  <button
    aria-pressed={selected}
    className="cl-chip"
    onClick={() => onSelectedChange(!selected)}
    type="button"
  >
    <Check aria-hidden className="cl-chip__check" size={14} strokeWidth={2.25} />
    {children}
  </button>
);
