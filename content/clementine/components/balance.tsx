import { Wallet } from "lucide-react";

import { formatAmount, spokenAmount } from "../lib/format";

import "./balance.css";

import "./glow.css";

interface BalanceProps {
  value: number;
  low?: boolean;
  actionLabel?: string;
  onClick: () => void;
  disabled?: boolean;
}

export const Balance = ({
  value,
  low = false,
  actionLabel = "Add money",
  onClick,
  disabled = false,
}: BalanceProps) => (
  <button
    aria-label={`${spokenAmount(value)}${low ? ", running low" : ""}. ${actionLabel}`}
    className="cl-balance"
    data-low={low || undefined}
    disabled={disabled}
    onClick={onClick}
    type="button"
  >
    <Wallet aria-hidden size={16} strokeWidth={1.75} />
    <span aria-hidden>{formatAmount(value)}</span>
    {low ? (
      <span aria-hidden className="cl-balance__left">
        left
      </span>
    ) : null}
  </button>
);
