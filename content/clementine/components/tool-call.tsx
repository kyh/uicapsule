import { Check, TriangleAlert } from "lucide-react";

import { Spinner } from "./spinner";

import "./tool-call.css";

export const ToolCall = ({
  label,
  detail,
  state,
}: {
  label: string;
  detail?: string;
  state: "running" | "done" | "failed";
}) => (
  <div className="cl-tool" data-state={state}>
    <span className="cl-tool__mark">
      {state === "running" ? <Spinner /> : null}
      {state === "done" ? <Check aria-hidden size={14} strokeWidth={2.5} /> : null}
      {state === "failed" ? <TriangleAlert aria-hidden size={14} strokeWidth={2} /> : null}
    </span>
    <span className="cl-sr">{{ done: "Done", failed: "Failed", running: "Working" }[state]}: </span>
    <span className="cl-tool__label">{label}</span>
    {detail ? <span className="cl-tool__detail">{detail}</span> : null}
  </div>
);
