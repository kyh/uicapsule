import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cx } from "../lib/cx";
import { Spinner } from "./spinner";

import "./button.css";

import "./glow.css";

export type ButtonVariant =
  | "primary"
  | "solid"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive"
  | "link";

export type ButtonSize = "sm" | "md" | "lg" | "icon-sm" | "icon" | "icon-lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  pending?: boolean;
  icon?: ReactNode;
  block?: boolean;
}

export const Button = ({
  variant = "primary",
  size = "md",
  pending = false,
  icon,
  block = false,
  className,
  children,
  type = "button",
  onClick,
  ...props
}: ButtonProps) => (
  <button
    aria-busy={pending || undefined}
    className={cx("cl-btn", block && "cl-btn--block", className)}
    data-pending={pending || undefined}
    data-size={size}
    data-variant={variant}
    onClick={pending ? undefined : onClick}
    // oxlint-disable-next-line react/button-has-type -- defaults to "button"; a form passes "submit"
    type={type}
    {...props}
  >
    {pending ? (
      <span className="cl-btn__spin">
        <Spinner />
      </span>
    ) : null}
    <span className="cl-btn__body">
      {icon}
      {children}
    </span>
  </button>
);
