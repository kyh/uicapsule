import type { ButtonHTMLAttributes, ReactNode } from "react";

import { StatusArc } from "./status";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  size?: "xs" | "sm" | "md" | "icon" | "icon-sm" | "icon-xs";
  pending?: boolean;
  pendingLabel?: string;
}

/** Starts an action. Secondary by default, so a view only gets its one ink key on purpose. */
export const Button = ({
  variant = "secondary",
  size = "md",
  pending,
  pendingLabel,
  children,
  className,
  disabled,
  type = "button",
  ...props
}: ButtonProps) => (
  <button
    aria-busy={pending || undefined}
    className={className ? `fj-btn ${className}` : "fj-btn"}
    data-size={size}
    data-variant={variant}
    disabled={disabled}
    // oxlint-disable-next-line react/button-has-type -- defaults to "button"; a form passes "submit"
    type={type}
    {...props}
  >
    {pending === undefined ? (
      children
    ) : (
      <span className="fj-btn-stack">
        <span aria-hidden={pending} data-hidden={pending ? "" : undefined}>
          {children}
        </span>
        <span aria-hidden={!pending} data-hidden={pending ? undefined : ""}>
          <StatusArc size={12} />
          {pendingLabel}
        </span>
      </span>
    )}
  </button>
);

export const ButtonGroup = ({ label, children }: { label: string; children: ReactNode }) => (
  <fieldset className="fj-btn-group">
    <legend className="fj-sr">{label}</legend>
    {children}
  </fieldset>
);
