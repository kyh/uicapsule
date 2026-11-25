import type { ButtonHTMLAttributes } from "react";

const VARIANTS = {
  accent: "ds-glass bg-accent/90 text-accent-foreground",
  ghost: "hover:bg-secondary active:scale-[0.97]",
  outline:
    "bg-card shadow-(--ds-shadow) hover:bg-[color-mix(in_oklch,var(--card),var(--ds-ink)_3%)] active:scale-[0.97]",
  primary: "ds-glass bg-primary/80 text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground hover:bg-input active:scale-[0.97]",
} as const;

const SIZES = {
  icon: "size-8",
  md: "h-8 px-3.5 text-[13px]",
  sm: "h-6 px-2.5 text-xs",
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
    className={`focus-visible:outline-ring inline-flex items-center justify-center gap-1.5 rounded-full font-medium tracking-[0.01em] whitespace-nowrap transition duration-120 ease-(--ds-ease) focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-40 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    // oxlint-disable-next-line react/button-has-type -- defaults to "button"; callers may pass "submit"
    type={type}
    {...props}
  />
);
