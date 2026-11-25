import type { ReactNode } from "react";

export const Alert = ({ title, children }: { title: string; children: ReactNode }) => (
  <div
    className="border-border bg-background grid gap-1 border-(length:--ds-border-width) p-4 text-sm"
    role="alert"
  >
    <p className="text-destructive flex items-center gap-2 font-(family-name:--ds-font-mono) text-xs tracking-[0.04em]">
      <span aria-hidden className="bg-destructive size-2" />
      Failed
    </p>
    <p>{title}</p>
    <div className="text-muted-foreground">{children}</div>
  </div>
);
