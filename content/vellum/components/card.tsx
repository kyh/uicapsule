import type { ReactNode } from "react";

export const Card = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div
    className={`bg-card text-card-foreground rounded-[14px] p-5 shadow-(--ds-shadow) ${className}`}
  >
    {children}
  </div>
);
