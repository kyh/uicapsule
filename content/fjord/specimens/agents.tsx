import { useState } from "react";
import { ArrowUp, RotateCcw } from "lucide-react";

import { Avatar } from "../components/avatar";
import { Badge, CodeTag } from "../components/badge";
import { Button } from "../components/button";
import { CopyButton } from "../components/copy-button";
import { Countdown } from "../components/countdown";
import { Panel, PanelBody, PanelFoot, PanelHead } from "../components/frame";
import { Icon } from "../components/icon";
import { Dialog } from "../components/overlays";
import { Status } from "../components/status";
import { ToolCall, ToolCallList } from "../components/tool-call";
import type { ToolCallData } from "../components/tool-call";
import { useInterval } from "../lib/hooks";
import { RunTrace } from "../screens/run-trace";
import { Category, Specimen } from "./specimen";

export const AGENT_NAMES = [
  "Run trace",
  "Tool call",
  "Agent turn",
  "Shadow window",
  "Deploy key row",
] as const;

const STATIC_CALLS: ToolCallData[] = [
  {
    active: "Searching",
    ask: "Search",
    detail: "open issues that mention coupon",
    done: "Searched",
    id: "a",
    ms: 318,
    output: "3 issues, newest #2809",
    status: "completed",
  },
  {
    active: "Posting",
    ask: "Post",
    detail: "a review comment on #2817",
    done: "Posted",
    id: "b",
    ms: 1940,
    output: "Rate limited by the forge API, 3 attempts, next window in 41s",
    status: "error",
  },
  {
    active: "Deleting",
    ask: "Delete",
    detail: "branch release/2.7",
    done: "Deleted",
    id: "c",
    reason: "2.7 still ships to the kiosk fleet until March.",
    status: "denied",
  },
  {
    active: "Reading",
    ask: "Read",
    detail: "src/checkout/cart.ts",
    done: "Read",
    id: "d",
    status: "running",
  },
];

export const ToolCallSpecimen = () => {
  const [decision, setDecision] = useState<"awaiting" | "completed" | "denied">("awaiting");

  return (
    <div className="fj-card">
      <ToolCallList label="Tool calls">
        {STATIC_CALLS.map((call) => (
          <ToolCall call={call} key={call.id} />
        ))}
        <ToolCall
          actions={
            <>
              <Button onClick={() => setDecision("denied")} size="sm">
                Deny
              </Button>
              <Button onClick={() => setDecision("completed")} size="sm" variant="primary">
                Allow force-push
              </Button>
            </>
          }
          call={{
            active: "Force-pushing",
            ask: "Force-push",
            detail: "release/2.8, rewriting 2 commits",
            done: "Force-pushed",
            id: "e",
            ms: decision === "completed" ? 1380 : undefined,
            reason:
              decision === "denied"
                ? "You kept the history. warden opens a revert commit instead."
                : undefined,
            status: decision,
          }}
          question="warden wants to drop two commits from release/2.8 that pinned a vulnerable undici. Nobody has pulled the branch since they landed."
        />
      </ToolCallList>
      {decision === "awaiting" ? null : (
        <div className="fj-card-foot">
          <Button onClick={() => setDecision("awaiting")} size="xs" variant="ghost">
            <Icon icon={RotateCcw} size={12} />
            Ask again
          </Button>
        </div>
      )}
    </div>
  );
};

const TURN_CALLS: Omit<ToolCallData, "status" | "ms">[] = [
  { active: "Looking up", ask: "Look up", detail: "deploy 2.8.1", done: "Looked up", id: "t1" },
  { active: "Reading", ask: "Read", detail: "errors since 13:40", done: "Read", id: "t2" },
  {
    active: "Comparing",
    ask: "Compare",
    detail: "2.8.0 against 2.8.1",
    done: "Compared",
    id: "t3",
  },
];

const STEP_MS = [420, 1180, 760] as const;

const AgentTurn = () => {
  const [tick, setTick] = useState(0);
  const [queued, setQueued] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const doneCount = Math.min(TURN_CALLS.length, Math.floor(tick / 12));
  const finished = doneCount >= TURN_CALLS.length;

  useInterval(() => setTick((value) => value + 1), finished ? null : 100);

  const send = () => {
    const text = draft.trim();

    if (text) {
      setQueued((current) => [...current, text]);
      setDraft("");
    }
  };

  return (
    <div className="fj-card">
      <div className="fj-turn">
        <p className="fj-bubble">Why did errors jump after the 2.8.1 deploy?</p>
        <div className="fj-turn-agent">
          <Avatar name="triage" size="sm" type="agent" />
          triage
          <span className="fj-push">
            {finished ? <Status status="ok">Answered</Status> : <Status status="running" />}
          </span>
        </div>
        <ToolCallList label="What triage did">
          {TURN_CALLS.slice(0, doneCount + 1).map((call, index) => (
            <ToolCall
              call={{
                ...call,
                ms: index < doneCount ? STEP_MS[index] : undefined,
                output: index < doneCount ? "Done" : undefined,
                status: index < doneCount ? "completed" : "running",
              }}
              key={call.id}
            />
          ))}
        </ToolCallList>
        {finished ? (
          <p className="fj-response">
            2.8.1 moved session refresh behind the new cache. Since 13:40, 212 requests failed with{" "}
            <CodeTag>401</CodeTag> on <CodeTag>/v1/session</CodeTag>, all from clients older than
            4.2. Rolling the cache flag back clears it; nothing in 2.8.0 changed this path.
          </p>
        ) : null}
        {queued.map((text) => (
          <div className="fj-hstack fj-queued" key={text}>
            <span className="fj-truncate fj-t-body-sm">{text}</span>
            <Status size="sm" status="queued" />
          </div>
        ))}
        <div className="fj-composer">
          <textarea
            aria-label="Ask triage"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                send();
              }
            }}
            placeholder="Ask triage a follow-up"
            rows={1}
            value={draft}
          />
          <Button
            aria-label="Send"
            disabled={draft.trim() === ""}
            onClick={send}
            size="icon-sm"
            variant="primary"
          >
            <Icon icon={ArrowUp} />
          </Button>
        </div>
        <Button onClick={() => setTick(0)} size="xs" variant="ghost">
          <Icon icon={RotateCcw} size={12} />
          Replay turn
        </Button>
      </div>
    </div>
  );
};

const SHADOW_TOTAL = 5 * 60;

const ShadowWindow = () => {
  const [left, setLeft] = useState(3 * 60 + 12);
  const [state, setState] = useState<"open" | "closed" | "signed">("open");

  useInterval(
    () => {
      if (left <= 1) {
        setLeft(0);
        setState("closed");
      } else {
        setLeft(left - 1);
      }
    },
    state === "open" ? 1000 : null,
  );

  const reset = () => {
    setLeft(3 * 60 + 12);
    setState("open");
  };

  const words = {
    closed: "closed unsigned",
    open: "until scribe stays on tern-3",
    signed: "signed, moving to tern-4",
  } as const;

  return (
    <Panel label="Shadow window">
      <PanelHead meta={<CodeTag>scribe</CodeTag>} title="Shadow window" />
      <PanelBody>
        <Countdown left={left} running={state === "open"} total={SHADOW_TOTAL} word={words[state]}>
          <p className="fj-t-body-sm fj-c-2">
            tern-4 shadows scribe for five minutes. A minute mark goes out each minute, and an empty
            ruler means no change.
          </p>
        </Countdown>
      </PanelBody>
      <PanelFoot>
        {state === "open" ? (
          <Button onClick={() => setState("signed")} size="sm" variant="primary">
            Sign the swap
          </Button>
        ) : (
          <Button onClick={reset} size="sm" variant="ghost">
            Open it again
          </Button>
        )}
      </PanelFoot>
    </Panel>
  );
};

const TAILS = ["b91f", "40da", "e37c"] as const;

const KeyRowSpecimen = () => {
  const [revoked, setRevoked] = useState(false);
  const [asking, setAsking] = useState(false);
  const [minted, setMinted] = useState(0);

  return (
    <div className="fj-card">
      <div className="fj-rows">
        <div className="fj-keyrow">
          <div className="fj-item-main">
            <span className="fj-item-title">
              status-probe <Badge>Read only</Badge>
            </span>
            <span className="fj-item-desc">Used 6 min ago by the uptime probe</span>
          </div>
          <CodeTag>kd_prod_••••7c2e</CodeTag>
          <CopyButton label="Copy key id" value="kd_key_status_probe" />
        </div>
        <div className="fj-keyrow">
          <div className="fj-item-main">
            <span className="fj-item-title">
              soak-test <Badge kind="secret">Admin</Badge>
            </span>
            <span className="fj-item-desc">
              {revoked ? "Burned just now" : "Never used, minted by Tomasz Wierzba"}
            </span>
          </div>
          <CodeTag>kd_stage_••••{TAILS[minted % TAILS.length]}</CodeTag>
          {revoked ? (
            <Button
              onClick={() => {
                setMinted((value) => value + 1);
                setRevoked(false);
              }}
              size="sm"
              variant="ghost"
            >
              Mint a new one
            </Button>
          ) : (
            <Button onClick={() => setAsking(true)} size="sm" variant="destructive">
              Burn key
            </Button>
          )}
        </div>
      </div>
      <Dialog
        description="Pipelines that still send soak-test start failing. A burned key cannot come back."
        footer={
          <>
            <Button onClick={() => setAsking(false)}>Keep it</Button>
            <Button
              onClick={() => {
                setRevoked(true);
                setAsking(false);
              }}
              variant="destructive"
            >
              Burn key
            </Button>
          </>
        }
        onOpenChange={setAsking}
        open={asking}
        title="Burn soak-test?"
      />
    </div>
  );
};

export const Agents = () => (
  <Category
    id="agents"
    lede="What a console for coding agents is built from: a run drawn against the clock, calls that report their own outcome, a turn that streams, a window that closes on the safe side, and a key that is readable once."
    title="Runs and agents"
  >
    <Specimen
      bare
      description="The run from the trace screen, from its first step. Forked checks share a bracket, the cache hit is hollow, and Idris's retry carries his initials. Pick any row to read its input."
      name="Run trace"
      wide
    >
      <RunTrace startAt={0} />
    </Specimen>
    <Specimen
      bare
      description="A glyph and a time per call. Failed, Denied and Stopped are the only words, and a refusal is somebody's decision, so it is not drawn as an error. A row with output opens."
      name="Tool call"
      wide
    >
      <ToolCallSpecimen />
    </Specimen>
    <Specimen
      bare
      description="A question, each call as it starts under one running status, then the answer. A follow-up typed mid-turn waits its turn."
      name="Agent turn"
      wide
    >
      <AgentTurn />
    </Specimen>
    <Specimen
      bare
      description="A swap that times out unsigned. The ruler loses a minute mark per minute, in ink, because closing is the safe outcome."
      name="Shadow window"
    >
      <ShadowWindow />
    </Specimen>
    <Specimen
      bare
      description="After the one time it is shown, a key is its last four characters. Admin keys carry the secret kind. Burning one asks first, because nothing brings a burned key back."
      name="Deploy key row"
    >
      <KeyRowSpecimen />
    </Specimen>
  </Category>
);
