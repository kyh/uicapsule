import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cx } from "../lib/cx";
import { Pending } from "./pending";

export type ButtonVariant = "lamp" | "plain" | "ghost" | "danger";

export type ButtonSize = "sm" | "md" | "lg" | "icon" | "icon-sm";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  pending?: boolean;
  pendingLabel?: string;
  children?: ReactNode;
}

/** A button. `lamp` is the lit variant; keep one per view. */
export const Button = ({
  variant = "plain",
  size = "md",
  pending = false,
  pendingLabel,
  className,
  children,
  onClick,
  type = "button",
  ...rest
}: ButtonProps) => (
  <button
    aria-busy={pending || undefined}
    className={cx("hx-btn", className)}
    data-size={size === "md" ? undefined : size}
    data-variant={variant}
    onClick={pending ? undefined : onClick}
    // oxlint-disable-next-line react/button-has-type -- defaults to "button"; a form passes "submit"
    type={type}
    {...rest}
  >
    <span className="hx-btn-label hx-row" data-hidden={pending || undefined}>
      {children}
    </span>
    {pending ? (
      <span className="hx-btn-pending">
        <Pending />
        {pendingLabel}
      </span>
    ) : null}
  </button>
);

/** A fieldset that fuses buttons along shared edges. */
export const ButtonGroup = ({ label, children }: { label: string; children: ReactNode }) => (
  <fieldset aria-label={label} className="hx-btn-group">
    {children}
  </fieldset>
);
