import { useRef } from "react";
import type { ReactNode } from "react";

import { useInView } from "../lib/hooks";

/** Every status a run can show. */
export const STATUS_VALUES = [
  "running",
  "waiting",
  "queued",
  "ok",
  "warn",
  "fail",
  "idle",
] as const;

export type StatusValue = (typeof STATUS_VALUES)[number];

export const STATUS_WORD = {
  fail: "Failed",
  idle: "Idle",
  ok: "Done",
  queued: "Queued",
  running: "Running",
  waiting: "Your call",
  warn: "Degraded",
} satisfies Record<StatusValue, string>;

export const STATUS_RANK = {
  fail: 6,
  idle: 0,
  ok: 1,
  queued: 2,
  running: 3,
  waiting: 5,
  warn: 4,
} satisfies Record<StatusValue, number>;

/** The running mark: a three-quarter arc that turns once per --fj-dur-arc and pauses offscreen. */
export const StatusArc = ({ name, size = 14 }: { name?: string; size?: 12 | 14 }) => {
  const ref = useRef<SVGSVGElement>(null);
  const visible = useInView(ref);

  return (
    <svg
      aria-hidden={name !== undefined && name !== "" ? undefined : true}
      aria-label={name}
      className="fj-arc"
      data-paused={visible ? undefined : ""}
      data-size={size}
      ref={ref}
      role={name !== undefined && name !== "" ? "img" : undefined}
      viewBox="0 0 16 16"
    >
      <circle
        cx="8"
        cy="8"
        fill="none"
        r="6"
        stroke="currentColor"
        strokeDasharray="28.3 37.7"
        strokeLinecap="round"
        strokeWidth="1.75"
      />
    </svg>
  );
};

/** Marks work held for a person: a flat cold-grey field with ink text and no edge, so it never passes for a button. */
export const InkSlot = ({ children, size }: { children: ReactNode; size?: "sm" }) => (
  <span className="fj-inkslot" data-size={size}>
    {children}
  </span>
);

interface StatusProps {
  status: StatusValue;
  children?: ReactNode;
  size?: "sm";
  live?: boolean;
  plain?: boolean;
}

/** The state of a job, spelled out. Amber for degraded and red for failed are the only colors it uses. */
export const Status = ({ status, children, size, live, plain }: StatusProps) => {
  const word = children ?? STATUS_WORD[status];

  if (status === "waiting" && plain !== true) {
    return (
      <span
        aria-live={live === true ? "polite" : undefined}
        role={live === true ? "status" : undefined}
      >
        <InkSlot size={size}>{word}</InkSlot>
      </span>
    );
  }

  return (
    <span
      aria-live={live === true ? "polite" : undefined}
      className="fj-status"
      data-size={size}
      data-status={status}
      role={live === true ? "status" : undefined}
    >
      {status === "running" ? <StatusArc size={size === "sm" ? 12 : 14} /> : null}
      {word}
    </span>
  );
};
