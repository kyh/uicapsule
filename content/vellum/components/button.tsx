import type { ButtonHTMLAttributes } from "react";

import { Arc } from "./arc";

const VARIANT_CLASS = {
  confirm: "v-glass",
  destructive: "v-glass",
  ghost: "v-ghost",
  primary: "v-glass",
  secondary: "v-flat",
} as const;

const TONE = {
  confirm: "green",
  destructive: "coral",
  ghost: undefined,
  primary: undefined,
  secondary: undefined,
} as const;

export type ButtonVariant = keyof typeof VARIANT_CLASS;

export type ButtonSize = "sm" | "md" | "lg" | "icon-sm" | "icon" | "icon-lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Glass for the one lead (ink, coral or green); flat secondary; plain ghost. */
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Keeps the box and the name, blocks presses and turns the arc. */
  pending?: boolean;
  /** Shown while busy; screen readers keep hearing the resting name. */
  pendingLabel?: string;
  /** Draws the held state without a pointer, for specimens. */
  held?: boolean;
}

/** Starts an action. At most one glass Button leads any group. */
export const Button = ({
  variant = "primary",
  size = "md",
  pending = false,
  pendingLabel,
  held = false,
  className = "",
  children,
  onClick,
  type = "button",
  ...props
}: ButtonProps) => (
  <button
    aria-busy={pending || undefined}
    className={`v-btn ${VARIANT_CLASS[variant]} ${className}`}
    data-held={held ? "" : undefined}
    data-size={size === "md" ? undefined : size}
    data-tone={TONE[variant]}
    onClick={pending ? undefined : onClick}
    // oxlint-disable-next-line react/button-has-type -- defaults to "button"; a form passes "submit"
    type={type}
    {...props}
  >
    {pending ? <Arc small={size === "sm" || size === "icon-sm"} /> : null}
    {pending && pendingLabel !== undefined && pendingLabel !== "" ? (
      <>
        <span aria-hidden className="v-btn-label">
          {pendingLabel}
        </span>
        <span className="v-sr">{children}</span>
      </>
    ) : (
      children
    )}
  </button>
);
