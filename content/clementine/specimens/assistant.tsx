import { useState } from "react";

import { ActionReceipt } from "../components/action-receipt";
import { ApprovalRequest } from "../components/approval-request";
import { AutonomyRule } from "../components/autonomy-rule";
import { ChatInput } from "../components/chat-input";
import { FollowUps } from "../components/follow-ups";
import { Insight } from "../components/insight";
import { Message } from "../components/message";
import { ReceiptMatch } from "../components/receipt-match";
import { SplitRequest } from "../components/split-request";
import { ToolCall } from "../components/tool-call";
import { useToast } from "../components/toast";
import { ENERGY_WEEKS, TRANSIT_WEEKS } from "../data/money";
import { formatAmount } from "../lib/format";
import { Specimen } from "../shell";

import "./specimens.css";

const SHARES = [
  { name: "Amara Okafor", share: 31.2 },
  { name: "Teodor Varga", share: 28.6 },
  { name: "Hana Sato", share: 29.4 },
] as const;

const ANSWERS = new Map([
  [
    "Just this week",
    "This week: $9.25 across two orders, both from Little Ember on Tuesday and Thursday.",
  ],
  [
    "Against October",
    "October was $63.40 across six orders. November is on course for about half that.",
  ],
]);

interface Turn {
  from: "person" | "assistant";
  text: string;
}

export const AssistantSpecimens = () => {
  const toast = useToast();
  const [gymState, setGymState] = useState<"waiting" | "approved" | "declined">("waiting");
  const [undone, setUndone] = useState(false);
  const [cap, setCap] = useState("40");
  const [days, setDays] = useState("2");
  const [weekly, setWeekly] = useState("150");
  const [paired, setPaired] = useState(false);
  const [included, setIncluded] = useState<string[]>(SHARES.map((person) => person.name));
  const [requested, setRequested] = useState(false);
  const [moved, setMoved] = useState(false);
  const [watching, setWatching] = useState(false);
  const [draft, setDraft] = useState("");

  const [turns, setTurns] = useState<Turn[]>([
    { from: "person", text: "What have I spent on takeaway this month?" },
  ]);

  const say = (text: string) => {
    if (!text.trim()) {
      return;
    }

    setTurns((list) => [
      ...list,
      { from: "person", text },
      {
        from: "assistant",
        text:
          ANSWERS.get(text) ??
          "November so far: $41.00 on takeaway, three orders, all from Little Ember.",
      },
    ]);
    setDraft("");
  };

  return (
    <>
      <Specimen
        name="Approval request"
        note="Before Clementine moves money it shows the payee, the amount and its reasoning, and waits. Approve carries the zest ring; Decline stays quiet."
      >
        <div className="cl-spec-col">
          <ApprovalRequest
            amount={-34}
            onApprove={() => {
              setGymState("approved");
            }}
            onDecline={() => {
              setGymState("declined");
            }}
            reason="Your climbing membership renews on Monday"
            reasons={[
              { source: "Paid every month since March", text: "Same gym, same $34.00" },
              { source: "Added by you on Sep 2", text: "Gym is on your pay-for-me list" },
            ]}
            state={gymState}
            title="Pay Granite Wall Climbing"
          />
          {gymState === "waiting" ? null : (
            <button
              className="cl-link"
              onClick={() => {
                setGymState("waiting");
              }}
              type="button"
            >
              Show the request again
            </button>
          )}
        </div>
      </Specimen>
      <Specimen
        name="Approval request, not enough"
        note="Given what is available, it can tell when a payment would not clear: Approve switches off and the short line says by how much."
      >
        <ApprovalRequest
          amount={-620}
          available={480}
          onApprove={() => {
            toast.show({ title: "Approve stays off until Everyday has $620.00" });
          }}
          onDecline={() => {
            toast.show({ title: "Lantern Mutual can wait until payday" });
          }}
          reason="Car insurance for the year, due Dec 3"
          title="Pay Lantern Mutual"
        />
      </Specimen>
      <Specimen
        name="Action receipt"
        note="After it acts: one line per thing it did, in the past tense. A failure stays on the list with its reason, and Undo reverses the lot."
      >
        <ActionReceipt
          lines={[
            { label: "Put $35.00 into Kyoto in April" },
            {
              detail: "$24.00 a month from December",
              label: "Moved Cobalt Mobile to a smaller plan",
            },
            {
              detail: "the card on file expired",
              failed: true,
              label: "Could not pay Loop Streaming",
            },
          ]}
          onUndo={() => {
            setUndone(true);
          }}
          summary="Done this morning, while you slept."
          undone={undone}
        />
      </Specimen>
      <Specimen
        name="Autonomy rule"
        note="Each limit reads as a sentence with its number inside as a field. It saves as you type and never glows."
      >
        <div className="cl-spec-col">
          <AutonomyRule
            after="without asking me first"
            before="Pay anything up to"
            onValueChange={setCap}
            value={cap}
          />
          <AutonomyRule
            after="days early, never on the due date"
            before="Settle bills"
            kind="number"
            onValueChange={setDays}
            value={days}
          />
          <AutonomyRule
            after="a week into savings, at most"
            before="Sweep"
            disabled
            onValueChange={setWeekly}
            value={weekly}
          />
        </div>
      </Specimen>
      <Specimen
        name="Receipt match"
        note="A sketch of the paper next to the card payment. A tick when they agree, an ochre mark when the totals differ, a dashed slot when the photo is missing."
      >
        <ul className="cl-matches">
          <ReceiptMatch amount={-41.2} date="Nov 2" merchant="Marrow & Thyme" state="matched" />
          <ReceiptMatch
            amount={-44.2}
            date="Nov 6"
            merchant="Ferro Hardware"
            note="Paper shows $42.80"
            state="review"
          />
          <ReceiptMatch
            amount={-129}
            date="Nov 11"
            merchant="Quill & Fold"
            onAdd={() => {
              setPaired(true);
            }}
            state={paired ? "matched" : "missing"}
          />
        </ul>
      </Specimen>
      <Specimen
        name="Insight"
        note="Something Clementine spotted, said in a few words, backed by one number and eight weeks of sparkline, with one thing you could do about it."
      >
        <div className="cl-spec-col cl-insights">
          <Insight
            action={watching ? undefined : "Tell me at $30.00"}
            basis="on trains this week, the most since June"
            figure="$34.00"
            onAction={() => {
              setWatching(true);
            }}
            points={TRANSIT_WEEKS}
            status={watching ? "We will tell you when a week passes $30.00." : undefined}
            title="Commuting is creeping up"
          />
          <Insight
            action={moved ? undefined : `Put ${formatAmount(18.4)} toward Kyoto`}
            basis="on energy since the new boiler"
            figure="−$18.40"
            onAction={() => {
              setMoved(true);
              toast.show({
                action: {
                  label: "Undo",
                  onClick: () => {
                    setMoved(false);
                  },
                },
                title: "Put $18.40 toward Kyoto in April",
              });
            }}
            points={ENERGY_WEEKS}
            status={moved ? "$18.40 is in Kyoto in April." : undefined}
            title="Hearth Energy came in lower"
          />
        </div>
      </Specimen>
      <Specimen
        name="Split request"
        note="Dinner you covered, shared out by who had what. Leave someone out and the total updates before one request goes to everyone still in."
      >
        <SplitRequest
          included={included}
          onIncludedChange={(names) => {
            setIncluded(names);
            setRequested(false);
          }}
          onRequest={(total) => {
            setRequested(true);
            toast.show({
              action: {
                label: "Undo",
                onClick: () => {
                  setRequested(false);
                },
              },
              title: `Asked ${String(included.length)} friends for ${formatAmount(total)}`,
            });
          }}
          paid={118.4}
          place="Saltgrass Kitchen, Nov 17"
          sent={requested}
          shares={SHARES}
        />
      </Specimen>
      <Specimen
        name="Message, tool call, follow-ups, chat input"
        note="Clementine answers in plain text on the page; your words sit in a warm bubble. Each lookup it makes shows as a single line with its outcome."
        wide
      >
        <div className="cl-convo">
          {turns.map((turn, index) => (
            <div className="cl-convo__turn" key={`${turn.text}-${String(index)}`}>
              {turn.from === "assistant" ? (
                <ToolCall
                  detail="Nov 1 until today"
                  label="Looked through your payments"
                  state="done"
                />
              ) : null}
              <Message from={turn.from}>
                <p>{turn.text}</p>
              </Message>
            </div>
          ))}
          {turns.length === 1 ? (
            <>
              <ToolCall label="Looking through your payments" state="running" />
              <ToolCall detail="Harbor Credit Union" label="October statement" state="failed" />
            </>
          ) : null}
          <FollowUps items={[...ANSWERS.keys()]} onPick={say} />
          <ChatInput
            onSend={() => {
              say(draft);
            }}
            onValueChange={setDraft}
            value={draft}
          />
        </div>
      </Specimen>
    </>
  );
};
