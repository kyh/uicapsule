"use client";

import { clock, useNow } from "../lib/hooks";
import { Button } from "./button";
import { Panel, Shell, ShellFoot } from "./card";
import { Status } from "./status";

interface ReceiptStep {
  label: string;
  detail?: string;
  failed?: boolean;
}

const Result = ({ undone, partial }: { undone: boolean; partial: boolean }) => {
  if (undone) {
    return <Status status="idle">Undone</Status>;
  }

  if (partial) {
    return <Status status="warn">Partly done</Status>;
  }

  return <Status status="ok">Done</Status>;
};

/** The record of what an agent did, with a flat Undo that leaves when its window closes. */
export const ActionReceipt = ({
  title,
  by,
  at,
  steps,
  undoUntil,
  onUndo,
  undoing = false,
  undone = false,
}: {
  title: string;
  by: string;
  at: string;
  steps: readonly ReceiptStep[];
  undoUntil?: number;
  onUndo?: () => void;
  undoing?: boolean;
  undone?: boolean;
}) => {
  const now = useNow(1000, undoUntil !== undefined && !undone);
  const left = undoUntil === undefined ? 0 : Math.ceil((undoUntil - now) / 1000);
  const canUndo = onUndo !== undefined && (left > 0 || undoing) && !undone;
  const partial = steps.some((step) => step.failed === true);

  return (
    <Shell>
      <Panel>
        <div className="v-between v-items-start v-card-head">
          <p className={`v-label ${undone ? "v-t2" : ""}`}>{title}</p>
          <Result partial={partial} undone={undone} />
        </div>
        <ul className="v-receipt-steps">
          {steps.map((step) => (
            <li className="v-receipt-step" key={step.label}>
              <span className={`v-body-sm ${undone ? "v-t2" : "v-t1"}`}>
                <span className="v-sr">{step.failed === true ? "Failed: " : "Done: "}</span>
                {step.label}
              </span>
              {step.detail !== undefined && step.detail !== "" ? (
                <span className={`v-caption ${step.failed === true ? "v-fail-text" : "v-t2"}`}>
                  {step.detail}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </Panel>
      <ShellFoot
        meta={canUndo && !undoing ? `${by}, ${at} · undo for ${clock(left)}` : `${by}, ${at}`}
      >
        {canUndo ? (
          <Button
            onClick={onUndo}
            pending={undoing}
            pendingLabel="Undoing"
            size="sm"
            variant="secondary"
          >
            Undo
          </Button>
        ) : null}
      </ShellFoot>
      <output className="v-sr">{undone ? "Undone" : ""}</output>
    </Shell>
  );
};
