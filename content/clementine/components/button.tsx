import type { ButtonHTMLAttributes } from "react";

const VARIANTS = {
  accent: "bg-(--ds-ink) text-background hover:bg-[color-mix(in_oklch,var(--ds-ink),white_14%)]",
  ghost: "hover:bg-muted",
  outline: "border-input bg-card hover:bg-muted border-(length:--ds-border-width)",
  primary: "ds-glow text-primary-foreground font-semibold",
  secondary: "bg-secondary text-secondary-foreground hover:bg-[oklch(0.93_0.007_80)]",
} as const;

const SIZES = {
  icon: "size-10",
  md: "h-10 px-5 text-[15px]",
  sm: "h-8 px-3.5 text-sm",
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
    className={`focus-visible:outline-ring inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap transition-[background-color,box-shadow,scale] duration-80 ease-(--ds-ease) focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    // oxlint-disable-next-line react/button-has-type -- defaults to "button"; callers may pass "submit"
    type={type}
    {...props}
  />
);
