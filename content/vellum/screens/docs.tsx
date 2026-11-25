"use client";

import { Fragment, useState } from "react";

import { Activity } from "../components/activity";
import { Panel, Shell } from "../components/card";
import { FollowUps } from "../components/follow-ups";
import { AgentTurn, Bubble } from "../components/message";
import { PromptInput } from "../components/prompt-input";
import type { SendStatus } from "../components/send-button";
import { Reasoning } from "../components/reasoning";
import { ToolCall } from "../components/tool-call";
import { useLater } from "../lib/hooks";

const SOURCES = [
  { meta: "API reference, edited 2 days ago", title: "Batch requests" },
  { meta: "Plans and billing, edited last week", title: "Rate limits by plan" },
] as const;

type Part =
  | { kind: "text"; text: string }
  | { kind: "strong"; text: string }
  | { kind: "cite"; source: number };

const ANSWER: readonly Part[] = [
  { kind: "text", text: "Yes. Every request inside a batch is billed as one call " },
  { kind: "cite", source: 1 },
  { kind: "text", text: ", so a batch of 50 spends 50 of the " },
  { kind: "strong", text: "600 calls a minute" },
  { kind: "text", text: " a Team workspace gets " },
  { kind: "cite", source: 2 },
  { kind: "text", text: ". A batch over 100 is refused whole, before anything is counted " },
  { kind: "cite", source: 1 },
  { kind: "text", text: "." },
];

const ANSWER_TEXT = ANSWER.map((part) => {
  if (part.kind === "cite") {
    return `[${part.source}]`;
  }

  return part.text;
}).join("");

const REPLIES = new Map([
  [
    "Show me a batch call with curl",
    "POST the calls as a JSON array to /v2/batch with your key in the Authorization header. Each item takes a method, a path and a body, and the response keeps their order.",
  ],
  [
    "What happens when a batch hits the limit?",
    "The calls that fit run, and the rest come back as 429 with a retry_after in seconds. Nothing is half-applied: a call either ran or it was refused.",
  ],
]);

const FOLLOW_UPS = [...REPLIES.keys()];

const replyTo = (prompt: string) =>
  REPLIES.get(prompt) ??
  `Nothing in the API reference answers “${prompt}” directly. Rate limits by plan is the nearest page; I can draft a question for the platform team instead.`;

interface Turn {
  id: number;
  prompt: string;
  reply: string | null;
  stopped: boolean;
}

const CitedAnswer = ({
  active,
  onActive,
}: {
  active: number | null;
  onActive: (source: number | null) => void;
}) => (
  <p className="v-body v-measure">
    {ANSWER.map((part, index) => {
      if (part.kind === "cite") {
        return (
          <button
            aria-describedby={`answer-source-${part.source}`}
            aria-label={`Source ${part.source}, ${SOURCES[part.source - 1]?.title}`}
            className="v-cite"
            data-active={active === part.source ? "" : undefined}
            // oxlint-disable-next-line react/no-array-index-key -- the answer is a fixed literal and a source repeats
            key={`cite-${index}`}
            onBlur={() => onActive(null)}
            onFocus={() => onActive(part.source)}
            onPointerEnter={() => onActive(part.source)}
            onPointerLeave={() => onActive(null)}
            type="button"
          >
            {part.source}
          </button>
        );
      }

      if (part.kind === "strong") {
        return (
          <b className="v-strong" key={part.text}>
            {part.text}
          </b>
        );
      }

      return <Fragment key={part.text}>{part.text}</Fragment>;
    })}
  </p>
);

const Sources = ({ active }: { active: number | null }) => (
  <Shell>
    <Panel>
      <ol aria-label="Sources" className="v-rows">
        {SOURCES.map((source, index) => (
          <li
            className="v-row v-source"
            data-active={active === index + 1 ? "" : undefined}
            id={`answer-source-${index + 1}`}
            key={source.title}
          >
            <span className="v-cite" data-active={active === index + 1 ? "" : undefined}>
              {index + 1}
            </span>
            <span className="v-row-main">
              <span className="v-label">{source.title}</span>
              <span className="v-caption v-t2">{source.meta}</span>
            </span>
          </li>
        ))}
      </ol>
    </Panel>
  </Shell>
);

/** A question put to the docs: thinking folded, tools as rows, an answer with its sources. */
export const DocsScreen = () => {
  const [active, setActive] = useState<number | null>(null);
  const [status, setStatus] = useState<SendStatus>("ready");
  const [turns, setTurns] = useState<readonly Turn[]>([]);
  const [rerunning, setRerunning] = useState(false);
  const later = useLater();

  const run = (id: number, prompt: string) => {
    setStatus("submitted");
    later(() => setStatus((current) => (current === "submitted" ? "streaming" : current)), 700);
    later(() => {
      setTurns((list) =>
        list.map((turn) =>
          turn.id === id && turn.reply === null && !turn.stopped
            ? { ...turn, reply: replyTo(prompt) }
            : turn,
        ),
      );
      setStatus((current) => (current === "streaming" ? "ready" : current));
    }, 2400);
  };

  const ask = (prompt: string) => {
    const id = Date.now();

    setTurns((list) => [...list, { id, prompt, reply: null, stopped: false }]);
    run(id, prompt);
  };

  const retry = (turn: Turn) => {
    setTurns((list) =>
      list.map((item) => (item.id === turn.id ? { ...item, reply: null, stopped: false } : item)),
    );
    run(turn.id, turn.prompt);
  };

  const stop = () => {
    setStatus("stopping");
    later(() => {
      setTurns((list) =>
        list.map((turn) => (turn.reply === null ? { ...turn, stopped: true } : turn)),
      );
      setStatus("ready");
    }, 500);
  };

  return (
    <div className="v-moment v-moment-docs">
      <Bubble>Do calls inside a batch count toward our rate limit?</Bubble>
      <AgentTurn
        model="Quill 4"
        onRetry={() => {
          setRerunning(true);
          later(() => setRerunning(false), 1600);
        }}
        text={rerunning ? undefined : ANSWER_TEXT}
      >
        {rerunning ? (
          <Activity active done="Read 2 pages" doing="Reading the API reference again" />
        ) : (
          <>
            <Reasoning seconds={6}>
              Batching is described in the API reference, but the limit itself is set per plan, so
              the answer needs both pages. The workspace is on Team.
            </Reasoning>
            <div className="v-stack-sm v-gap-2">
              <ToolCall
                input='search_docs({ query: "batch rate limit", space: "api" })'
                output="9 results, 2 above the cut-off"
                status="ok"
                title="Searched the API reference"
              />
              <ToolCall
                input='read_doc({ ids: ["api_batch", "plan_limits"] })'
                output="2 pages, 1,180 words"
                status="ok"
                title="Read 2 pages"
              />
            </div>
            <CitedAnswer active={active} onActive={setActive} />
            <Sources active={active} />
          </>
        )}
      </AgentTurn>
      {turns.length === 0 ? <FollowUps items={FOLLOW_UPS} onSelect={ask} /> : null}
      {turns.map((turn) => (
        <div className="v-stack" key={turn.id}>
          <Bubble>{turn.prompt}</Bubble>
          <AgentTurn
            model={turn.reply === null && !turn.stopped ? undefined : "Quill 4"}
            onRetry={status === "ready" ? () => retry(turn) : undefined}
            stopped={turn.stopped}
            text={turn.reply ?? undefined}
          >
            {turn.stopped ? <p className="v-body v-t2">Stopped before it answered.</p> : null}
            {turn.reply === null && !turn.stopped ? (
              <Activity active done="Searched 86 pages" doing="Searching 86 pages" />
            ) : null}
            {turn.reply === null ? null : <p className="v-body">{turn.reply}</p>}
          </AgentTurn>
        </div>
      ))}
      <PromptInput
        label="Ask the docs"
        onStop={stop}
        onSubmit={ask}
        placeholder="Ask about an endpoint, a limit or an error"
        status={status}
      />
    </div>
  );
};
