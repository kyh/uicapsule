import type { ReactNode } from "react";

import "./badge.css";

export const Badge = ({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "accent" | "success" | "warn" | "danger" | "outline";
  children: ReactNode;
}) => (
  <span className="cl-badge" data-tone={tone}>
    {children}
  </span>
);
