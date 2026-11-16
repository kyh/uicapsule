import type { ReactNode } from "react";

const VARIANTS = {
  accent: "bg-accent text-accent-foreground",
  destructive: "bg-destructive text-primary-foreground",
  muted: "bg-muted text-muted-foreground",
  outline: "border-border border-(length:--ds-border-width)",
} as const;

export const Badge = ({
  variant = "muted",
  children,
}: {
  variant?: keyof typeof VARIANTS;
  children: ReactNode;
}) => (
  <span
    className={`inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium ${VARIANTS[variant]}`}
  >
    {children}
  </span>
);
