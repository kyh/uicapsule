"use client";

import { useState } from "react";

import { ActionReceipt } from "../components/action-receipt";
import { AutonomyRule } from "../components/autonomy-rule";
import type { Autonomy } from "../components/autonomy-rule";
import { Button } from "../components/button";
import { Panel, Shell, ShellFoot } from "../components/card";
import { DataList } from "../components/data-list";
import { AgentTurn, Bubble } from "../components/message";
import { ToolApproval } from "../components/tool-call";
import { useLater } from "../lib/hooks";

const BATCH = [
  { label: "Tickets", value: "38 tagged login-loop" },
  { label: "Oldest", value: "6 days" },
  { label: "Says", value: "Update to 4.12 and sign in again" },
  { label: "Signed", value: "Tomasz, Support" },
] as const;

const RULES: readonly {
  id: string;
  title: string;
  description?: string;
  initial: Autonomy;
  locked?: boolean;
}[] = [
  { id: "route", initial: "auto", title: "Tag and route new tickets" },
  {
    description: "Only articles edited in the last 90 days",
    id: "articles",
    initial: "auto",
    title: "Answer from a help article",
  },
  { id: "bulk", initial: "ask", title: "Reply to more than 10 customers at once" },
  { id: "credit", initial: "ask", title: "Give an account credit" },
  {
    description: "Locked by Ruth, workspace admin",
    id: "plan",
    initial: "never",
    locked: true,
    title: "Change a customer's plan",
  },
];

type Stage = "asking" | "sending" | "sent" | "kept";

const Batch = () => {
  const [stage, setStage] = useState<Stage>("asking");
  const [sentAt, setSentAt] = useState(0);
  const [undo, setUndo] = useState<"open" | "undoing" | "undone">("open");
  const later = useLater();

  return (
    <div className="v-moment" data-wide="">
      <Bubble>
        Everyone stuck in the login loop: tell them 4.12 fixes it and close the tickets.
      </Bubble>
      <AgentTurn>
        <p className="v-body">
          38 open tickets match. A reply this wide goes out under your rules only once you have read
          it.
        </p>
        {stage === "asking" || stage === "sending" ? (
          <ToolApproval
            allowLabel="Send to 38"
            consequence="Sends from support@northfield.app and closes each ticket. Anyone who writes back reopens theirs."
            denyLabel="Keep as draft"
            meta="Drafted by the triage agent"
            onAllow={() => {
              setStage("sending");
              later(() => {
                setSentAt(Date.now());
                setUndo("open");
                setStage("sent");
              }, 1400);
            }}
            onDeny={() => setStage("kept")}
            pending={stage === "sending"}
            pendingLabel="Sending"
            question="Send the fix to 38 customers?"
          >
            <div className="v-rule-top">
              <DataList items={BATCH} />
            </div>
          </ToolApproval>
        ) : null}
        {stage === "sent" ? (
          <ActionReceipt
            at="10:42"
            by="Triage agent"
            onUndo={() => {
              setUndo("undoing");
              later(() => setUndo("undone"), 900);
            }}
            steps={[
              { detail: "38 sent", label: "Replied on every ticket" },
              { detail: "38 of 38", label: "Closed the tickets" },
              { detail: "login-loop-fixed", label: "Tagged the batch" },
            ]}
            title="Sent the 4.12 fix to 38 customers"
            undoUntil={sentAt + 60_000}
            undoing={undo === "undoing"}
            undone={undo === "undone"}
          />
        ) : null}
        {stage === "sent" && undo === "undone" ? (
          <div>
            <Button onClick={() => setStage("asking")} size="sm" variant="secondary">
              Read the draft again
            </Button>
          </div>
        ) : null}
        {stage === "kept" ? (
          <div className="v-stack-sm">
            <p className="v-body v-t1">Kept it as a draft in Triage. Nothing went out.</p>
            <div>
              <Button onClick={() => setStage("asking")} size="sm" variant="secondary">
                Read the draft again
              </Button>
            </div>
          </div>
        ) : null}
      </AgentTurn>
    </div>
  );
};

const Rules = () => {
  const [values, setValues] = useState<Record<string, Autonomy>>(() =>
    Object.fromEntries(RULES.map((rule) => [rule.id, rule.initial])),
  );

  const [saved, setSaved] = useState("Each change saves at once");

  return (
    <div className="v-moment" data-wide="">
      <Shell>
        <Panel>
          <ul aria-label="Triage agent permissions" className="v-rows">
            <li className="v-row">
              <span className="v-label">What the triage agent may do</span>
            </li>
            {RULES.map((rule) => (
              <AutonomyRule
                control="select"
                description={rule.description}
                disabled={rule.locked}
                key={rule.id}
                onValueChange={(next) => {
                  setValues((current) => ({ ...current, [rule.id]: next }));
                  setSaved(`Saved “${rule.title}”`);
                }}
                title={rule.title}
                value={values[rule.id] ?? rule.initial}
              />
            ))}
          </ul>
        </Panel>
        <ShellFoot meta={<span aria-live="polite">{saved}</span>} />
      </Shell>
    </div>
  );
};

/** A support agent holds a wide reply for a person, leaves a receipt, and keeps to its rules. */
export const TriageScreen = () => (
  <div className="v-screen-cols" data-split="wide">
    <Batch />
    <Rules />
  </div>
);
