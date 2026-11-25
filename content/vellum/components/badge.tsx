import type { ReactNode } from "react";

const VARIANTS = {
  accent: "bg-(--ds-ok-tint) text-(--ds-ok-text)",
  destructive: "bg-(--ds-fail-tint) text-(--ds-fail-text)",
  muted: "bg-secondary text-muted-foreground",
  outline: "shadow-(--ds-shadow) text-foreground",
} as const;

export const Badge = ({
  variant = "muted",
  children,
}: {
  variant?: keyof typeof VARIANTS;
  children: ReactNode;
}) => (
  <span
    className={`inline-flex h-5.5 items-center rounded-full px-2 text-xs font-medium ${VARIANTS[variant]}`}
  >
    {children}
  </span>
);
