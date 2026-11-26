import { CircleCheck, CircleX, Hourglass, TriangleExclamationPoint } from "lucide-react";
import type { ReactNode } from "react";

import { Arc } from "./arc";

export type StatusKind = "idle" | "queued" | "running" | "ok" | "warn" | "fail" | "waiting";

const WORD = {
  fail: "Failed",
  idle: "Idle",
  ok: "Done",
  queued: "Queued",
  running: "Running",
  waiting: "Your call",
  warn: "Warning",
} satisfies Record<StatusKind, string>;

/** Sort weight: failures first. */
export const statusRank = {
  fail: 6,
  idle: 0,
  ok: 1,
  queued: 2,
  running: 3,
  waiting: 5,
  warn: 4,
} satisfies Record<StatusKind, number>;

const Glyph = ({ status }: { status: StatusKind }) => {
  if (status === "ok") {
    return <CircleCheck aria-hidden strokeWidth={2} />;
  }

  if (status === "fail") {
    return <CircleX aria-hidden strokeWidth={2} />;
  }

  if (status === "warn") {
    return <TriangleExclamationPoint aria-hidden strokeWidth={2} />;
  }

  if (status === "waiting") {
    return <Hourglass aria-hidden strokeWidth={2} />;
  }

  if (status === "running") {
    return <Arc small />;
  }

  return null;
};

/** A run's state as a small glyph followed by its word. */
export const Status = ({
  status,
  size = "sm",
  children,
}: {
  status: StatusKind;
  size?: "sm" | "md";
  children?: ReactNode;
}) => (
  <span className="v-status" data-size={size} data-status={status}>
    <Glyph status={status} />
    {children ?? WORD[status]}
  </span>
);
