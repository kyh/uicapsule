"use client";

import { useState } from "react";

import { ActionReceipt } from "../components/action-receipt";
import { Activity } from "../components/activity";
import { AutonomyRule } from "../components/autonomy-rule";
import type { Autonomy } from "../components/autonomy-rule";
import { Button } from "../components/button";
import { Panel, Shell } from "../components/card";
import { Mention } from "../components/chip";
import { DataList } from "../components/data-list";
import { FollowUps } from "../components/follow-ups";
import { AgentTurn, Bubble } from "../components/message";
import { PromptInput } from "../components/prompt-input";
import { Reasoning } from "../components/reasoning";
import { SendButton } from "../components/send-button";
import type { SendStatus } from "../components/send-button";
import { ToolApproval, ToolCall } from "../components/tool-call";
import { VoiceNote } from "../components/voice-note";
import { Specimen } from "../chrome";
import { useLater } from "../lib/hooks";

const SEND_STATES: readonly { status: SendStatus; empty: boolean; note: string }[] = [
  { empty: true, note: "Empty", status: "ready" },
  { empty: false, note: "Send", status: "ready" },
  { empty: false, note: "Stop", status: "streaming" },
  { empty: false, note: "Stopping", status: "stopping" },
];

const SPOKEN_WORDS =
  "Tell the platform team the batch limit doubles on Monday and draft the changelog line".split(
    " ",
  );

const WHY =
  "The CRM tool timed out after 10 seconds while it updated ticket 4471. The retry at 09:17 went through, so the record is current.";

const VoiceDemo = () => {
  const [started, setStarted] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  if (started !== null) {
    return (
      <div className="v-fill">
        <VoiceNote
          compact
          onCancel={() => setStarted(null)}
          onSave={() => {
            setSaved(true);
            setStarted(null);
          }}
          started={started}
          words={SPOKEN_WORDS}
        />
      </div>
    );
  }

  return (
    <div className="v-stack v-text-center">
      <p aria-live="polite" className="v-body-sm v-t2">
        {saved ? "Saved: a message to Platform, a changelog draft" : "Nothing dictated yet"}
      </p>
      <Button
        onClick={() => {
          setSaved(false);
          setStarted(Date.now());
        }}
        size="sm"
      >
        {saved ? "Dictate another" : "Dictate a task"}
      </Button>
    </div>
  );
};

const ReceiptDemo = ({ until }: { until: number }) => {
  const [undo, setUndo] = useState<"open" | "undoing" | "undone">("open");
  const later = useLater();

  return (
    <ActionReceipt
      at="09:12"
      by="Platform agent"
      onUndo={() => {
        setUndo("undoing");
        later(() => setUndo("undone"), 800);
      }}
      steps={[
        { detail: "key_…9f2c", label: "Made a new key for the docs agent" },
        { detail: "3 of 3", label: "Swapped it into the deployments" },
        { detail: "The router still uses it", failed: true, label: "Revoked the old key" },
      ]}
      title="Rotated the docs agent's key"
      undoUntil={until}
      undoing={undo === "undoing"}
      undone={undo === "undone"}
    />
  );
};

const MessageDemo = () => {
  const [answering, setAnswering] = useState(false);
  const later = useLater();

  return (
    <div className="v-fill v-stack">
      <Bubble>Why did run 8f29d3 fail?</Bubble>
      <AgentTurn
        model="Quill 4 mini"
        onRetry={
          answering
            ? undefined
            : () => {
                setAnswering(true);
                later(() => setAnswering(false), 1400);
              }
        }
        text={answering ? undefined : WHY}
      >
        {answering ? (
          <Activity active done="Read the trace" doing="Reading the trace" />
        ) : (
          <p className="v-body">{WHY}</p>
        )}
      </AgentTurn>
    </div>
  );
};

/** The assistant and agent components: composer, turns, thinking, tools, receipts, rules. */
export const Ai = () => {
  const [status, setStatus] = useState<SendStatus>("ready");
  const [sent, setSent] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [approval, setApproval] = useState<"waiting" | "pending" | "allowed" | "denied">("waiting");
  const [until, setUntil] = useState(() => Date.now() + 45_000);
  const [rule, setRule] = useState<Autonomy>("ask");
  const [picked, setPicked] = useState<string | null>(null);
  const later = useLater();

  return (
    <>
      <Specimen
        name="Prompt input"
        note="attach, the model, one glass Send that turns to Stop"
        span={2}
      >
        <div className="v-fill v-stack" data-wide="">
          <PromptInput
            label="Message the agent"
            onStop={() => {
              setStatus("stopping");
              later(() => setStatus("ready"), 600);
            }}
            onSubmit={(text) => {
              setSent(text);
              setStatus("submitted");
              later(
                () => setStatus((current) => (current === "submitted" ? "streaming" : current)),
                600,
              );
              later(
                () => setStatus((current) => (current === "streaming" ? "ready" : current)),
                3200,
              );
            }}
            placeholder="Ask an agent to do something"
            status={status}
          />
          <p aria-live="polite" className="v-caption v-t2">
            {sent ? `Sent “${sent}”` : "Type and press Enter, then Stop while it runs"}
          </p>
        </div>
      </Specimen>
      <Specimen name="Send button" note="empty, send, stop, stopping; the live one is above">
        <div aria-hidden className="v-cluster v-center v-gap-16" inert>
          {SEND_STATES.map((state) => (
            <div className="v-stack-sm v-text-center" key={state.note}>
              <SendButton
                empty={state.empty}
                onSend={() => null}
                onStop={() => null}
                status={state.status}
              />
              <span className="v-caption v-t2">{state.note}</span>
            </div>
          ))}
        </div>
      </Specimen>
      <Specimen name="Message" note="what you wrote sits in paper; the agent writes on the page">
        <MessageDemo />
      </Specimen>
      <Specimen name="Reasoning" note="open while it thinks, folded to one line after">
        <div className="v-fill v-stack">
          <Reasoning
            heading="Choosing which page to cite"
            key={String(thinking)}
            seconds={9}
            streaming={thinking}
          >
            The changelog says the batch limit doubled, but the API reference was edited after it,
            so the reference wins. Citing both would contradict itself.
          </Reasoning>
          <div>
            <Button
              onClick={() => {
                setThinking(true);
                later(() => setThinking(false), 2400);
              }}
              size="sm"
              variant="secondary"
            >
              Replay thinking
            </Button>
          </div>
        </div>
      </Specimen>
      <Specimen name="Tool call" note="a flat row; open it for what went in and came back">
        <div className="v-fill v-stack-sm v-gap-2">
          <ToolCall
            input='search_docs({ query: "batch limit", space: "changelog" })'
            output="4 results"
            status="ok"
            title="Searched the changelog"
          />
          <ToolCall
            input="update_crm({ ticket: 4471, seats: 12 })"
            output="timeout after 10,000 ms"
            status="fail"
            title="Could not update the CRM"
          />
          <ToolCall
            input='read_tickets({ tag: "login-loop" })'
            output="…"
            status="running"
            title="Reading 38 tickets"
          />
        </div>
      </Specimen>
      <Specimen name="Activity" note="an -ing phrase that settles into its past tense">
        <div className="v-stack v-text-center">
          <Activity active={busy} done="Graded 220 cases" doing="Grading 220 cases" />
          <Button
            disabled={busy}
            onClick={() => {
              setBusy(true);
              later(() => setBusy(false), 1800);
            }}
            size="sm"
            variant="secondary"
          >
            Grade again
          </Button>
        </div>
      </Specimen>
      <Specimen name="Tool approval" note="a flat way out and green glass for yes">
        <div className="v-fill">
          {approval === "waiting" || approval === "pending" ? (
            <ToolApproval
              allowLabel="Post it"
              consequence="Posts as the incident agent in a public channel 1,400 customers follow."
              denyLabel="Hold it"
              meta="Asked 1 min ago"
              onAllow={() => {
                setApproval("pending");
                later(() => setApproval("allowed"), 1000);
              }}
              onDeny={() => setApproval("denied")}
              pending={approval === "pending"}
              pendingLabel="Posting"
              question="Post the incident note to #service-status?"
            >
              <div className="v-rule-top">
                <DataList
                  items={[
                    { label: "Channel", value: "#service-status" },
                    { label: "Says", value: "Sign-in is fixed in 4.12." },
                  ]}
                />
              </div>
            </ToolApproval>
          ) : (
            <div className="v-stack v-items-start">
              <output className="v-body-sm">
                {approval === "allowed"
                  ? "Posted the incident note to #service-status."
                  : "Held. The note stays in drafts."}
              </output>
              <div>
                <Button onClick={() => setApproval("waiting")} size="sm" variant="secondary">
                  Show the request again
                </Button>
              </div>
            </div>
          )}
        </div>
      </Specimen>
      <Specimen name="Action receipt" note="past tense, the steps, a flat Undo with its window">
        <div className="v-fill v-stack">
          <ReceiptDemo key={until} until={until} />
          <div>
            <Button onClick={() => setUntil(Date.now() + 45_000)} size="sm" variant="ghost">
              Reset the window
            </Button>
          </div>
        </div>
      </Specimen>
      <Specimen name="Autonomy rule" note="Go ahead, Ask me or Never; saved on change">
        <div className="v-fill">
          <Shell>
            <Panel>
              <ul aria-label="Docs agent permissions" className="v-rows">
                <AutonomyRule
                  onValueChange={setRule}
                  title="Open pull requests for docs typos"
                  value={rule}
                />
              </ul>
            </Panel>
          </Shell>
        </div>
      </Specimen>
      <Specimen name="Voice note" note="words land faint and settle into ink as it hears more">
        <VoiceDemo />
      </Specimen>
      <Specimen
        name="Follow-ups and mentions"
        note="next prompts as you would type them; tools and people as chips"
      >
        <div className="v-fill v-stack">
          <p className="v-body">
            Run <Mention>/search_docs</Mention> over the <Mention>API reference</Mention> and copy{" "}
            <Mention>Ines Duarte</Mention> on anything about limits.
          </p>
          <FollowUps
            items={["Show the Enterprise plan limits", "Which endpoints skip the limit?"]}
            onSelect={setPicked}
          />
          <p aria-live="polite" className="v-caption v-t2">
            {picked ? `Sent “${picked}”` : "A follow-up sends at once"}
          </p>
        </div>
      </Specimen>
    </>
  );
};
