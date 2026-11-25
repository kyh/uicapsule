import type { ReactNode } from "react";

const VARIANTS = {
  accent: "bg-(--ds-accent-wash) text-accent-foreground",
  destructive: "bg-[color-mix(in_oklch,var(--destructive),white_90%)] text-destructive",
  muted: "bg-secondary text-muted-foreground",
  outline: "shadow-[inset_0_0_0_1px_var(--border)] text-foreground",
} as const;

export const Badge = ({
  variant = "muted",
  children,
}: {
  variant?: keyof typeof VARIANTS;
  children: ReactNode;
}) => (
  <span
    className={`inline-flex h-5 items-center rounded-(--ds-radius-inner) px-1.5 text-xs font-[440] ${VARIANTS[variant]}`}
  >
    {children}
  </span>
);
