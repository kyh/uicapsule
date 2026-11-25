import "./status.css";

export type StatusKind = "paid" | "scheduled" | "pending" | "failed" | "refunded";

const LABEL = {
  failed: "Failed",
  paid: "Paid",
  pending: "Pending",
  refunded: "Refunded",
  scheduled: "Scheduled",
} as const satisfies Record<StatusKind, string>;

export const Status = ({ status, label }: { status: StatusKind; label?: string }) => (
  <span className="cl-status" data-status={status}>
    <span aria-hidden className="cl-status__dot" />
    {label ?? LABEL[status]}
  </span>
);
