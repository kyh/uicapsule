import type { ReactNode } from "react";

export const Card = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div
    className={`bg-card text-card-foreground border-border rounded-(--ds-radius-frame) border-(length:--ds-border-width) p-5 ${className}`}
  >
    {children}
  </div>
);
