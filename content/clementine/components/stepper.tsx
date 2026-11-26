import { Minus, Plus } from "lucide-react";

import { formatAmount } from "../lib/format";
import { Button } from "./button";

import "./stepper.css";

interface StepperProps {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
}

/** Nudges an amount up or down by a fixed step, for budgets and plans set by feel. */
export const Stepper = ({
  label,
  value,
  onValueChange,
  step = 25,
  min = 0,
  max = Number.POSITIVE_INFINITY,
}: StepperProps) => (
  <span className="cl-stepper">
    <Button
      aria-label={`Less for ${label}`}
      disabled={value - step < min}
      onClick={() => onValueChange(value - step)}
      size="icon-sm"
      variant="secondary"
    >
      <Minus aria-hidden size={16} strokeWidth={2} />
    </Button>
    <output aria-label={`${label}: ${formatAmount(value)}`} className="cl-stepper__value">
      {formatAmount(value)}
    </output>
    <Button
      aria-label={`More for ${label}`}
      disabled={value + step > max}
      onClick={() => onValueChange(value + step)}
      size="icon-sm"
      variant="secondary"
    >
      <Plus aria-hidden size={16} strokeWidth={2} />
    </Button>
  </span>
);
