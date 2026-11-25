import type { ButtonHTMLAttributes } from "react";

const VARIANTS = {
  accent: "bg-accent text-accent-foreground hover:brightness-[0.98]",
  ghost: "hover:bg-muted",
  outline: "border-input bg-card hover:bg-muted border-(length:--ds-border-width)",
  primary:
    "bg-primary text-primary-foreground border-(length:--ds-border-width) border-(--ds-primary-edge) bg-[linear-gradient(to_top,var(--ds-primary-lit),transparent_60%)] shadow-[inset_0_-1px_0_var(--ds-primary-lit)] hover:brightness-[1.04]",
  secondary: "bg-secondary text-secondary-foreground hover:brightness-[0.97]",
} as const;

const SIZES = {
  icon: "size-8",
  md: "h-8 px-3 text-sm",
  sm: "h-6 px-2 text-xs",
} as const;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
}

export const Button = ({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  ...props
}: ButtonProps) => (
  <button
    className={`focus-visible:outline-ring inline-flex items-center justify-center gap-2 whitespace-nowrap transition-[filter,background-color,translate] duration-80 ease-(--ds-ease) focus-visible:outline-2 focus-visible:outline-offset-2 active:translate-y-px disabled:pointer-events-none disabled:opacity-40 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    // oxlint-disable-next-line react/button-has-type -- defaults to "button"; callers may pass "submit"
    type={type}
    {...props}
  />
);
