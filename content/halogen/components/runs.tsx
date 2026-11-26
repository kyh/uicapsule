import { ArrowUp, Paperclip } from "lucide-react";
import { useId, useRef, useState } from "react";
import type { ReactNode, SyntheticEvent } from "react";

import { duration as formatDuration } from "../lib/format";
import { Button } from "./button";
import { Icon } from "./icon";
import { Pending } from "./pending";
import { StatusMark } from "./status";
import { TypeText } from "./text-motion";

export type CallState = "done" | "running" | "failed" | "waiting" | "queued" | "skipped";

const MARK = {
  done: "ok",
  failed: "fail",
  queued: "queued",
  running: "running",
  skipped: "skipped",
  waiting: "waiting",
} as const;

interface ToolCallRowProps {
  label: string;
  detail?: string;
  state: CallState;
  seconds?: number;
  tab?: string;
  children?: ReactNode;
}

/** A machine step: bracketed verb, the object it touched, its time, and an optional tab or approval. */
export const ToolCallRow = ({ label, detail, state, seconds, tab, children }: ToolCallRowProps) => (
  <li className="hx-call" data-state={state}>
    {tab !== undefined && tab !== "" ? (
      <span className="hx-call-tab">
        {state === "running" ? <Pending /> : null}
        {tab}
      </span>
    ) : null}
    <div className="hx-call-head">
      <StatusMark label={state} status={MARK[state]} />
      <span className="hx-call-name hx-label-sm">{label}</span>
      {detail !== undefined && detail !== "" ? (
        <span className="hx-call-detail hx-code-sm">{detail}</span>
      ) : null}
      <span className="hx-code-sm hx-ink-3 hx-end hx-nowrap">
        {seconds === undefined ? "" : formatDuration(seconds)}
      </span>
    </div>
    {Boolean(children) && <div className="hx-call-body">{children}</div>}
  </li>
);

/** An ordered list of tool-call rows joined by dashed connectors. Place it next to a frame. */
export const ToolCallStack = ({ label, children }: { label: string; children: ReactNode }) => (
  <ol aria-label={label} className="hx-calls">
    {children}
  </ol>
);

/** The current message of a run, typed once when it changes, with an elapsed clock. */
export const Activity = ({ text, elapsed }: { text: string; elapsed?: string }) => (
  <div aria-live="polite" className="hx-row hx-code hx-activity">
    <Pending />
    <span className="hx-grow hx-truncate">
      <TypeText text={text} />
    </span>
    {elapsed !== undefined && elapsed !== "" ? (
      <span className="hx-code-sm hx-ink-3">{elapsed}</span>
    ) : null}
  </div>
);

interface PromptInputProps {
  label: string;
  placeholder: string;
  onSubmit: (text: string) => void;
  pending?: boolean;
  attachment?: string;
}

/** A question box with an attached run and a single send button. */
export const PromptInput = ({
  label,
  placeholder,
  onSubmit,
  pending,
  attachment,
}: PromptInputProps) => {
  const [text, setText] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const picker = useRef<HTMLInputElement>(null);
  const id = useId();

  const submit = (event: SyntheticEvent) => {
    event.preventDefault();

    if (!text.trim()) {
      return;
    }

    onSubmit(text.trim());
    setText("");
  };

  return (
    <form className="hx-frame hx-prompt" onSubmit={submit}>
      <label className="hx-sr" htmlFor={id}>
        {label}
      </label>
      <textarea
        className="hx-body-sm hx-prompt-text"
        id={id}
        onChange={(event) => {
          setText(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            submit(event);
          }
        }}
        placeholder={placeholder}
        rows={2}
        value={text}
      />
      <div className="hx-row hx-prompt-bar">
        <input
          aria-hidden
          className="hx-sr"
          onChange={(event) => {
            setPicked(event.target.files?.[0]?.name ?? null);
          }}
          ref={picker}
          tabIndex={-1}
          type="file"
        />
        <Button
          aria-label="Attach a file"
          onClick={() => picker.current?.click()}
          size="icon-sm"
          title="Attach a file"
          variant="ghost"
        >
          <Icon icon={Paperclip} />
        </Button>
        {(picked !== null && picked !== "") || (attachment !== undefined && attachment !== "") ? (
          <span className="hx-code-sm hx-ink-3 hx-truncate">
            {[attachment, picked].filter(Boolean).join(" + ")} attached
          </span>
        ) : null}
        <Button
          aria-label="Ask"
          className="hx-end"
          disabled={!text.trim() && pending !== true}
          pending={pending}
          size="icon-sm"
          type="submit"
          variant="lamp"
        >
          <Icon icon={ArrowUp} />
        </Button>
      </div>
    </form>
  );
};
