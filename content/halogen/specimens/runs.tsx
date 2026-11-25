import { useEffect, useState } from "react";

import { Button } from "../components/button";
import { Group, Sheet, SpecCell } from "../components/page";
import { groupHead } from "./catalog";
import { Activity, PromptInput, ToolCallRow, ToolCallStack } from "../components/runs";
import { StatusMark } from "../components/status";

const FIRST = { elapsed: "00:04", text: "Reading crm-api schema for contacts v7" };

const ACTIVITY = [
  FIRST,
  { elapsed: "00:11", text: "Comparing 38 columns against core.contacts" },
  { elapsed: "00:19", text: "Holding 41,806 rows that fail the numeric check" },
  { elapsed: "00:26", text: "Paging growth-data with the column diff" },
];

const ANSWER =
  "At 06:20 UTC crm-api v7 renamed phone to phone_e164 and turned lifetime_value from numeric(12,2) into text. Every row whose lifetime_value no longer parsed as a number was held. Aliasing phone and casting lifetime_value back fits all 41,806.";

export const Runs = () => {
  const [approved, setApproved] = useState<boolean | null>(null);
  const [beat, setBeat] = useState(0);
  const [asked, setAsked] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);
  const message = ACTIVITY[beat] ?? FIRST;

  useEffect(() => {
    if (!thinking) {
      return;
    }

    const timer = window.setTimeout(() => setThinking(false), 1200);

    return () => window.clearTimeout(timer);
  }, [thinking]);

  let moveState: "waiting" | "done" | "skipped" = "waiting";

  if (approved === true) {
    moveState = "done";
  } else if (approved === false) {
    moveState = "skipped";
  }

  return (
    <Group {...groupHead("runs")}>
      <Sheet>
        <SpecCell
          edge
          name="Tool-call stack"
          note="What a run did, step by step, joined by dashed connectors. The active step wears a tab saying what it is doing; one that needs a person turns orange."
          path="runs/tool-call-row"
        >
          <ToolCallStack label="Agent run on ml-research spend">
            <ToolCallRow detail="ml-research" label="Read spend" seconds={1} state="done" />
            <ToolCallRow detail="q_a90c44" label="Profile spill" seconds={6} state="done" />
            <ToolCallRow
              detail="to wh-burst-xs"
              label="Move nightly jobs"
              state={moveState}
              tab={approved === null ? "Needs approval" : undefined}
            >
              {approved === null ? (
                <>
                  <p className="hx-caption hx-ink-2">
                    Three nightly feature jobs spill 121 GB each run. On wh-burst-xs they stop
                    queueing behind growth-data and cost about 210 credits less a month.
                  </p>
                  <div className="hx-row">
                    <Button onClick={() => setApproved(false)} size="sm" variant="ghost">
                      Decline
                    </Button>
                    <Button onClick={() => setApproved(true)} size="sm" variant="lamp">
                      Approve move
                    </Button>
                  </div>
                </>
              ) : (
                <div className="hx-row">
                  <span className="hx-code-sm hx-ink-2">
                    {approved ? "Approved by you at 09:44" : "Declined by you at 09:44"}
                  </span>
                  <Button
                    className="hx-end"
                    onClick={() => setApproved(null)}
                    size="sm"
                    variant="ghost"
                  >
                    Undo
                  </Button>
                </div>
              )}
            </ToolCallRow>
            <ToolCallRow
              detail="#ml-research"
              label="Post summary"
              state={approved === null ? "queued" : "running"}
              tab={approved === null ? undefined : "Posting"}
            />
          </ToolCallStack>
        </SpecCell>
        <SpecCell
          name="Activity"
          note="One line for the step underway. A new message types in once, then stays put until the next one arrives."
          path="runs/activity"
        >
          <div className="hx-frame hx-activity-frame">
            <Activity elapsed={message.elapsed} text={message.text} />
          </div>
          <div className="hx-row">
            <span className="hx-code-sm hx-ink-3">
              drift_4ac1 · step {beat + 1} of {ACTIVITY.length}
            </span>
            <Button
              className="hx-end"
              onClick={() => setBeat((beat + 1) % ACTIVITY.length)}
              size="sm"
            >
              {beat + 1 === ACTIVITY.length ? "From the top" : "Next message"}
            </Button>
          </div>
        </SpecCell>
        <SpecCell
          name="Prompt input"
          note="Ask about a run in plain words, with the run attached. Answers land complete."
          path="runs/prompt-input"
          wide
        >
          {asked ? (
            <div className="hx-stack">
              <p className="hx-body-sm hx-question">{asked}</p>
              <div className="hx-row hx-answer">
                <StatusMark label="Answer" status={thinking ? "running" : "ok"} />
                <p className="hx-body-sm hx-measure">
                  {thinking ? <span className="hx-ink-3">Reading drift_4ac1</span> : ANSWER}
                </p>
              </div>
            </div>
          ) : null}
          <PromptInput
            attachment="drift_4ac1"
            label="Ask about this run"
            onSubmit={(text) => {
              setAsked(text);
              setThinking(true);
            }}
            pending={thinking}
            placeholder="Why were 41,806 contacts held?"
          />
        </SpecCell>
      </Sheet>
    </Group>
  );
};
