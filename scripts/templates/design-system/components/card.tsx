import type { ReactNode } from "react";

export const Card = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div
    className={`bg-card text-card-foreground border-border rounded-xl border-(length:--ds-border-width) p-5 shadow-(--ds-shadow) ${className}`}
  >
    {children}
  </div>
);
