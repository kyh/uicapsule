import { amountAffordability, formatAmount, spokenAmount } from "../lib/format";
import { cx } from "../lib/cx";

import "./amount.css";

type Tone = "neutral" | "accent" | "warn" | "danger";

const TONE_BY_FIT = {
  comfortable: "neutral",
  insufficient: "danger",
  tight: "warn",
  unknown: "neutral",
} as const satisfies Record<ReturnType<typeof amountAffordability>, Tone>;

interface AmountProps {
  value: number;
  available?: number | null;
  signed?: boolean;
  tone?: Tone;
  size?: "sm" | "md" | "lg";
  compact?: boolean;
  approximate?: boolean;
  className?: string;
}

export const Amount = ({
  value,
  available,
  signed = false,
  tone,
  size = "md",
  compact = false,
  approximate = false,
  className,
}: AmountProps) => {
  const fit = amountAffordability(value, available);
  const shown = `${approximate ? "~" : ""}${formatAmount(value, { compact, signed })}`;
  const spoken = `${approximate ? "about " : ""}${spokenAmount(value)}${fit === "insufficient" ? ", not covered by what is available" : ""}`;

  return (
    <span
      className={cx("cl-amount", className)}
      data-affordability={fit}
      data-size={size}
      data-tone={tone ?? TONE_BY_FIT[fit]}
    >
      <span className="cl-sr">{spoken}</span>
      <span aria-hidden>{shown}</span>
    </span>
  );
};
