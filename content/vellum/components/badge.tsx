import type { ReactNode } from "react";

/** A fixed tag: a version, a state of a draft, a grade. */
export const Badge = ({
  tone,
  children,
}: {
  tone?: "ok" | "warn" | "fail" | "outline";
  children: ReactNode;
}) => (
  <span className="v-badge" data-tone={tone}>
    {children}
  </span>
);
