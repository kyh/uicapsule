"use client";

import { ChevronRight } from "lucide-react";
import { useId, useState } from "react";
import type { ReactNode } from "react";

import { Button } from "./button";
import { Panel, Shell, ShellFoot } from "./card";
import { Status } from "./status";
import type { StatusKind } from "./status";

/** A row for one tool use; expand it to read the call and the result. */
export const ToolCall = ({
  title,
  status,
  input,
  output,
}: {
  title: string;
  status: StatusKind;
  input: string;
  output: string;
}) => {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <div className="v-stack-sm">
      <div className="v-between">
        <button
          aria-controls={id}
          aria-expanded={open}
          className="v-fold-trigger"
          onClick={() => setOpen(!open)}
          type="button"
        >
          <span className="v-truncate">{title}</span>
          <ChevronRight aria-hidden className="v-chev" />
        </button>
        <Status status={status} />
      </div>
      {open ? (
        <div className="v-fold-body v-code-frame" id={id}>
          <pre className="v-code-body v-code-block">
            <span className="v-tok-dim">input </span>
            {input}
            {"\n"}
            <span className="v-tok-dim">output </span>
            {output}
          </pre>
        </div>
      ) : null}
    </div>
  );
};

/** A call paused on the person: the question, what allowing does, a flat Deny and a green Allow. */
export const ToolApproval = ({
  question,
  consequence,
  children,
  meta,
  allowLabel,
  denyLabel,
  pendingLabel,
  pending,
  onDeny,
  onAllow,
}: {
  question: string;
  consequence: string;
  children: ReactNode;
  meta: ReactNode;
  allowLabel: string;
  denyLabel: string;
  pendingLabel: string;
  pending: boolean;
  onDeny: () => void;
  onAllow: () => void;
}) => (
  <Shell>
    <Panel>
      <div className="v-stack-sm v-card-head">
        <div className="v-between">
          <p className="v-label">{question}</p>
          <Status status="waiting" />
        </div>
        <p className="v-body-sm v-t2">{consequence}</p>
      </div>
      {children}
    </Panel>
    <ShellFoot meta={meta}>
      <Button disabled={pending} onClick={onDeny} size="sm" variant="secondary">
        {denyLabel}
      </Button>
      <Button
        onClick={onAllow}
        pending={pending}
        pendingLabel={pendingLabel}
        size="sm"
        variant="confirm"
      >
        {allowLabel}
      </Button>
    </ShellFoot>
  </Shell>
);
