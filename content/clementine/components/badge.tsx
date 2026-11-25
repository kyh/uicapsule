import type { ReactNode } from "react";

const VARIANTS = {
  accent: "bg-(--ds-accent-wash) text-accent-foreground",
  destructive: "bg-[oklch(0.95_0.03_25)] text-[oklch(0.48_0.18_25)]",
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
    className={`inline-flex h-7 items-center rounded-full px-3 text-[13px] font-medium ${VARIANTS[variant]}`}
  >
    {children}
  </span>
);
