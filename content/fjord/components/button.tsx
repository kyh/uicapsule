import type { ButtonHTMLAttributes } from "react";

const VARIANTS = {
  accent:
    "bg-(--ds-accent-wash) text-accent-foreground shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--accent),transparent_70%)] hover:brightness-[0.98]",
  ghost: "hover:bg-secondary",
  outline:
    "bg-card shadow-[inset_0_0_0_1px_var(--input),var(--ds-shadow)] hover:bg-[color-mix(in_oklch,var(--card),var(--ds-ink)_3%)]",
  primary:
    "bg-primary text-primary-foreground bg-[linear-gradient(to_bottom,oklch(1_0_0/0.1),transparent)] shadow-[inset_0_1px_0_oklch(1_0_0/0.16),inset_0_-1px_0_oklch(0_0_0/0.4),0_1px_2px_-1px_oklch(0.21_0.026_258/0.4)] hover:brightness-125",
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
    className={`focus-visible:outline-ring inline-flex items-center justify-center gap-1.5 rounded-(--ds-radius-control) font-[440] whitespace-nowrap transition duration-(--ds-duration) ease-(--ds-ease) focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98] active:duration-60 disabled:pointer-events-none disabled:opacity-40 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    // oxlint-disable-next-line react/button-has-type -- defaults to "button"; callers may pass "submit"
    type={type}
    {...props}
  />
);
