import type { ReactNode } from "react";

const VARIANTS = {
  accent: { label: "text-foreground", mark: "bg-primary outline outline-(--ds-primary-edge)" },
  destructive: { label: "text-destructive", mark: "bg-destructive" },
  muted: { label: "text-muted-foreground", mark: "bg-muted-foreground/50" },
  outline: { label: "text-foreground", mark: "border-foreground border" },
} as const;

export const Badge = ({
  variant = "muted",
  children,
}: {
  variant?: keyof typeof VARIANTS;
  children: ReactNode;
}) => (
  <span
    className={`inline-flex h-6 items-center gap-1.5 font-(family-name:--ds-font-mono) text-xs tracking-[0.04em] ${VARIANTS[variant].label}`}
  >
    <span aria-hidden className={`size-2 shrink-0 ${VARIANTS[variant].mark}`} />
    {children}
  </span>
);
