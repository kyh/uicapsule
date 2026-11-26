import { useState } from "react";
import type { ReactNode } from "react";
import { Check, ChevronRight, Pause, X } from "lucide-react";

import { formatMs } from "../lib/format";
import { Icon } from "./icon";
import { StatusArc } from "./status";

export type ToolCallStatus = "running" | "completed" | "error" | "awaiting" | "denied" | "stopped";

export interface ToolCallData {
  id: string;
  active: string;
  done: string;
  ask: string;
  detail: string;
  status: ToolCallStatus;
  ms?: number;
  output?: string;
  reason?: string;
}

const END_WORD = { denied: "Denied", error: "Failed", stopped: "Stopped" } as const;

const Glyph = ({ status }: { status: ToolCallStatus }) => {
  if (status === "running") {
    return <StatusArc size={12} />;
  }

  if (status === "completed") {
    return <Icon icon={Check} size={12} />;
  }

  if (status === "awaiting") {
    return <Icon icon={Pause} size={12} />;
  }

  return <Icon icon={X} size={12} />;
};

const verbFor = (call: ToolCallData) => {
  if (call.status === "running") {
    return call.active;
  }

  if (call.status === "awaiting" || call.status === "denied") {
    return call.ask;
  }

  return call.done;
};

interface ToolCallProps {
  call: ToolCallData;
  question?: ReactNode;
  actions?: ReactNode;
}

/** A tool an agent called, as one row: a glyph for where it stands, the time it took, and a word only when it failed, stopped or was refused. A call that needs a person opens its question under the row. */
export const ToolCall = ({ call, question, actions }: ToolCallProps) => {
  const [open, setOpen] = useState(false);
  const expandable = Boolean(call.output ?? call.reason);

  const endWord =
    call.status === "denied" || call.status === "error" || call.status === "stopped"
      ? END_WORD[call.status]
      : undefined;

  return (
    <li className="fj-tool" data-status={call.status}>
      <button
        aria-expanded={expandable ? open : undefined}
        className="fj-tool-row"
        disabled={!expandable}
        onClick={() => {
          setOpen((value) => !value);
        }}
        type="button"
      >
        <span aria-hidden className="fj-tool-glyph">
          <Glyph status={call.status} />
        </span>
        <span className="fj-tool-verb">{verbFor(call)}</span>
        <span className="fj-tool-detail">{call.detail}</span>
        <span className="fj-tool-end">
          {endWord ? <span className="fj-tool-word">{endWord}</span> : null}
          {call.status === "running" ? <span className="fj-sr">Running</span> : null}
          {call.ms === undefined ? null : <span className="fj-data">{formatMs(call.ms)}</span>}
          {expandable ? <Icon icon={ChevronRight} size={12} /> : null}
        </span>
      </button>
      {open && call.reason !== undefined && call.reason !== "" ? (
        <p className="fj-tool-reason">{call.reason}</p>
      ) : null}
      {open &&
      call.output !== undefined &&
      call.output !== "" &&
      (call.reason === undefined || call.reason === "") ? (
        <pre className="fj-tool-out fj-well">{call.output}</pre>
      ) : null}
      {call.status === "awaiting" && question ? (
        <div className="fj-tool-ask">
          <p>{question}</p>
          <div className="fj-hstack">{actions}</div>
        </div>
      ) : null}
    </li>
  );
};

export const ToolCallList = ({ children, label }: { children: ReactNode; label: string }) => (
  <ol aria-label={label} className="fj-tools">
    {children}
  </ol>
);
