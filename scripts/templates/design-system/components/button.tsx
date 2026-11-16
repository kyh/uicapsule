import type { ButtonHTMLAttributes } from "react";

const VARIANTS = {
  accent: "bg-accent text-accent-foreground hover:brightness-105",
  ghost: "hover:bg-muted",
  outline: "border-border bg-card hover:bg-muted border-(length:--ds-border-width)",
  primary: "bg-primary text-primary-foreground hover:brightness-110",
  secondary: "bg-secondary text-secondary-foreground hover:brightness-95",
} as const;

const SIZES = {
  icon: "size-9",
  md: "h-9 px-4 text-sm",
  sm: "h-7 px-3 text-xs",
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
    className={`focus-visible:outline-ring inline-flex items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap transition duration-(--ds-duration) ease-(--ds-ease) focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    // oxlint-disable-next-line react/button-has-type -- defaults to "button"; callers may pass "submit"
    type={type}
    {...props}
  />
);
