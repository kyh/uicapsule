import type { ReactNode } from "react";

import { cx } from "../lib/cx";

export type RunStatus =
  | "ok"
  | "warn"
  | "fail"
  | "running"
  | "queued"
  | "waiting"
  | "idle"
  | "skipped";

export const STATUS_WORD = {
  fail: "Failed",
  idle: "Idle",
  ok: "Succeeded",
  queued: "Queued",
  running: "Running",
  skipped: "Skipped",
  waiting: "Waiting",
  warn: "Degraded",
} satisfies Record<RunStatus, string>;

/** Sort rank for a status column, broken states first. */
export const statusRank = {
  fail: 7,
  idle: 0,
  ok: 2,
  queued: 3,
  running: 4,
  skipped: 1,
  waiting: 5,
  warn: 6,
} satisfies Record<RunStatus, number>;

/** Just the mark. Pass `label` when it appears without its word. */
export const StatusMark = ({ status, label }: { status: RunStatus; label?: string }) => {
  const a11y = label
    ? { "aria-label": label, role: "img" as const }
    : { "aria-hidden": true as const };

  if (status === "running") {
    return (
      <span className="hx-mark hx-pending" data-status="running" {...a11y}>
        <span />
        <span />
        <span />
        <span />
      </span>
    );
  }

  return <span className="hx-mark" data-status={status} {...a11y} />;
};

interface StatusProps {
  status: RunStatus;
  children?: ReactNode;
  size?: "sm" | "md";
  live?: boolean;
}

/** A run state as a square mark followed by its word in capitals. */
export const Status = ({ status, children, size = "sm", live }: StatusProps) => (
  <span
    aria-live={live ? "polite" : undefined}
    className={cx("hx-status", size === "sm" ? "hx-label-sm" : "hx-label")}
    data-status={status}
  >
    <StatusMark status={status} />
    {children ?? STATUS_WORD[status]}
  </span>
);
