import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode, RefObject } from "react";
import { RotateCcw } from "lucide-react";

import { Avatar } from "../components/avatar";
import { Badge, CodeTag } from "../components/badge";
import type { Kind } from "../components/badge";
import { Button } from "../components/button";
import { JsonView } from "../components/code";
import type { JsonValue } from "../components/code";
import { DataList } from "../components/data";
import { Card, CardHead } from "../components/frame";
import { Icon } from "../components/icon";
import { InkSlot, Status } from "../components/status";
import { ToolCall, ToolCallList } from "../components/tool-call";
import type { ToolCallStatus } from "../components/tool-call";
import { formatMs } from "../lib/format";
import { useInterval } from "../lib/hooks";
import { PageHeader, Screen } from "./screen";

interface Step {
  id: string;
  name: string;
  kind: Kind;
  start: number;
  end: number;
  lane?: "fork" | "branch";
  cached?: boolean;
  failed?: boolean;
  retriedBy?: string;
  input: JsonValue;
  output: string;
}

/** The steps of one recorded run: a cache hit, three checks forked side by side, and a check a person retried. */
export const STEPS: Step[] = [
  {
    end: 360,
    id: "checkout",
    input: { branch: "agent/coupon-race", depth: 1 },
    kind: "repo",
    name: "checkout",
    output: "agent/coupon-race at 9e41b07, 3 commits ahead of main",
    start: 0,
  },
  {
    cached: true,
    end: 400,
    id: "index",
    input: { key: "storefront@9e41b07", paths: 1284 },
    kind: "repo",
    name: "index_repo",
    output: "Served from the index cache built 40 minutes ago, so nothing was parsed again.",
    start: 360,
  },
  {
    end: 2240,
    id: "propose",
    input: { files: ["src/checkout/coupon.ts"], model: "tern-3", turns: 4 },
    kind: "agent",
    name: "propose_patch",
    output: "Wait for the coupon lookup to resolve before the total is summed.",
    start: 400,
  },
  {
    end: 2460,
    id: "edit",
    input: { files: 2, hunks: 3 },
    kind: "repo",
    name: "write_files",
    output: "3 hunks across coupon.ts and coupon.test.ts",
    start: 2240,
  },
  {
    end: 6420,
    id: "checks",
    input: { together: ["lint", "typecheck", "unit"] },
    kind: "run",
    lane: "fork",
    name: "checks",
    output: "All three passed once unit was run a second time.",
    start: 2460,
  },
  {
    end: 3300,
    id: "lint",
    input: { command: "pnpm lint --filter storefront" },
    kind: "run",
    lane: "branch",
    name: "lint",
    output: "0 problems in 412 files",
    start: 2460,
  },
  {
    end: 4580,
    id: "typecheck",
    input: { command: "pnpm typecheck --filter storefront" },
    kind: "run",
    lane: "branch",
    name: "typecheck",
    output: "No type errors",
    start: 2460,
  },
  {
    end: 3820,
    failed: true,
    id: "unit",
    input: { command: "pnpm test coupon", shard: "1 of 1" },
    kind: "run",
    lane: "branch",
    name: "unit",
    output: "57 passed, 1 failed: the price service did not answer within 800ms.",
    start: 2460,
  },
  {
    end: 6420,
    id: "unit-again",
    input: { command: "pnpm test coupon", reason: "price service was restarting" },
    kind: "run",
    lane: "branch",
    name: "unit",
    output: "58 passed",
    retriedBy: "Idris Okafor",
    start: 5060,
  },
  {
    end: 6600,
    id: "sign",
    input: { key: "KESTREL_SIGNING", scope: "agent/*" },
    kind: "secret",
    name: "sign_commits",
    output: "3 commits signed with the agent signing key",
    start: 6420,
  },
  {
    end: 6980,
    id: "push",
    input: { force: false, remote: "origin" },
    kind: "repo",
    name: "push",
    output: "Pushed agent/coupon-race, pull request #2817 updated",
    start: 6600,
  },
];

const GATE = 7060;
const MERGE_MS = 1100;
const SCALE = 8600;
const TICKS = [0, 2000, 4000, 6000, 8000];

type Phase = "running" | "waiting" | "merging" | "done" | "denied";

const pct = (ms: number) => `${(ms / SCALE) * 100}%`;

const FLIP_AT = 0.68;

const labelAt = (start: number, end: number, settled: number) =>
  settled / SCALE > FLIP_AT ? { right: `calc(100% - ${pct(start)})` } : { left: pct(end) };

const CALL_STATUS = {
  denied: "denied",
  done: "completed",
  merging: "running",
  running: "awaiting",
  waiting: "awaiting",
} satisfies Record<Phase, ToolCallStatus>;

const RunStatus = ({ phase }: { phase: Phase }) => {
  if (phase === "waiting") {
    return <Status live status="waiting" />;
  }

  if (phase === "done") {
    return (
      <Status live status="ok">
        Merged
      </Status>
    );
  }

  if (phase === "denied") {
    return (
      <Status live status="ok">
        Stopped before merge
      </Status>
    );
  }

  return <Status status="running" />;
};

const StepStatus = ({ step, elapsed }: { step: Step; elapsed: number }) => {
  if (step.end > elapsed) {
    return <Status status="running" />;
  }

  if (step.failed === true) {
    return <Status status="fail" />;
  }

  if (step.cached === true) {
    return <Status status="ok">From cache</Status>;
  }

  return <Status status="ok" />;
};

const StepDetail = ({ step, elapsed }: { step: Step; elapsed: number }) => {
  const extra =
    step.retriedBy !== undefined && step.retriedBy !== ""
      ? [
          {
            term: "Retried by",
            value: (
              <span className="fj-hstack" data-gap="8">
                <Avatar name={step.retriedBy} size="sm" />
                {step.retriedBy}
              </span>
            ),
          },
        ]
      : [];

  return (
    <>
      <CardHead
        action={<Badge kind={step.kind} trouble={step.failed === true ? "fail" : undefined} />}
        title={step.name}
      />
      <div className="fj-detail">
        <DataList
          entries={[
            { term: "Began at", value: formatMs(step.start) },
            {
              term: "Lasted",
              value: formatMs(Math.max(0, Math.min(step.end, elapsed) - step.start)),
            },
            { term: "Result", value: <StepStatus elapsed={elapsed} step={step} /> },
            ...extra,
          ]}
        />
        <JsonView label="Step input" value={step.input} />
        <p className="fj-t-body fj-c-2">{step.end > elapsed ? "No output yet." : step.output}</p>
      </div>
    </>
  );
};

interface GateDetailProps {
  phase: Phase;
  decided: boolean;
  mergeMs: number;
  decide: (allow: boolean) => void;
  outcome: RefObject<HTMLParagraphElement | null>;
}

const GateDetail = ({ phase, decided, mergeMs, decide, outcome }: GateDetailProps) => (
  <>
    <CardHead action={<InkSlot size="sm">Your call</InkSlot>} title="merge" />
    <div className="fj-detail">
      <ToolCallList label="Calls in this step">
        <ToolCall
          actions={
            <>
              <Button
                onClick={() => {
                  decide(false);
                }}
                size="sm"
              >
                Keep it open
              </Button>
              <Button
                onClick={() => {
                  decide(true);
                }}
                size="sm"
                variant="primary"
              >
                Merge #2817
              </Button>
            </>
          }
          call={{
            active: "Merging",
            ask: "Merge",
            detail: "#2817 into main",
            done: "Merged",
            id: "merge",
            ms: phase === "done" || phase === "merging" ? mergeMs : undefined,
            reason: phase === "denied" ? "You kept #2817 open so a person reviews it." : undefined,
            status: CALL_STATUS[phase],
          }}
          question="patchwright asks to merge #2817 into main. All checks passed, one of them on a retry, and the change is 3 hunks in 2 files."
        />
      </ToolCallList>
      {decided ? (
        <p className="fj-outcome" ref={outcome} tabIndex={-1}>
          {phase === "denied"
            ? "You kept #2817 open. patchwright asked Maren Holt to review it."
            : "You merged #2817 at 7.06s into the run."}
        </p>
      ) : null}
      <JsonView
        label="Merge input"
        value={{ into: "main", pr: 2817, repo: "kestrel/storefront", strategy: "rebase" }}
      />
    </div>
  </>
);

const useFollow = (scroller: RefObject<HTMLDivElement | null>, elapsed: number) => {
  useLayoutEffect(() => {
    const node = scroller.current;

    if (!node || node.scrollWidth <= node.clientWidth) {
      return;
    }

    const lane = node.querySelector(".fj-trace-axis");

    if (!lane) {
      return;
    }

    const box = lane.getBoundingClientRect();
    const frame = node.getBoundingClientRect();

    const start = box.left - frame.left + node.scrollLeft;
    const x = start + (Math.min(elapsed, SCALE) / SCALE) * box.width;
    const target = x - (start + node.clientWidth) / 2;

    if (x > node.scrollLeft + node.clientWidth - 48 || x < node.scrollLeft + start + 24) {
      node.scrollTo({ left: Math.max(0, target) });
    }
  }, [scroller, elapsed]);
};

const Lane = ({ children }: { children?: ReactNode }) => (
  <span className="fj-trace-lane">
    {TICKS.map((tick) => (
      <span className="fj-trace-gridline" key={tick} style={{ left: pct(tick) }} />
    ))}
    {children}
  </span>
);

/** A run as a waterfall that forks: steps that ran together share a bracket, a cache hit is hollow, and a person's retry carries their face. */
export const RunTrace = ({ startAt = 3000 }: { startAt?: number }) => {
  const [elapsed, setElapsed] = useState(startAt);
  const [phase, setPhase] = useState<Phase>("running");

  const [selected, setSelected] = useState(
    () => STEPS.findLast((candidate) => candidate.start <= startAt)?.id ?? "checkout",
  );

  const [decided, setDecided] = useState(false);
  const outcome = useRef<HTMLParagraphElement>(null);
  const scroller = useRef<HTMLDivElement>(null);

  useInterval(
    () => {
      if (phase === "running") {
        const next = Math.min(GATE, elapsed + 100);

        setElapsed(next);

        if (next >= GATE) {
          setPhase("waiting");
          setSelected("merge");
        }
      } else {
        const next = Math.min(GATE + MERGE_MS, elapsed + 100);

        setElapsed(next);

        if (next >= GATE + MERGE_MS) {
          setPhase("done");
        }
      }
    },
    phase === "running" || phase === "merging" ? 100 : null,
  );

  useFollow(scroller, elapsed);

  useEffect(() => {
    if (decided) {
      outcome.current?.focus();
    }
  }, [decided]);

  const replay = () => {
    setElapsed(0);
    setPhase("running");
    setSelected("checkout");
    setDecided(false);
  };

  const decide = (allow: boolean) => {
    setPhase(allow ? "merging" : "denied");
    setDecided(true);
  };

  const visible = STEPS.filter((step) => step.start <= elapsed);
  const finished = STEPS.filter((step) => step.end <= elapsed && step.lane !== "fork");
  const summed = finished.reduce((sum, step) => sum + (step.end - step.start), 0);
  const wall = Math.min(elapsed, GATE);
  const showGate = phase !== "running";
  const mergeEnd = phase === "done" ? GATE + MERGE_MS : elapsed;
  const step = STEPS.find((candidate) => candidate.id === selected);

  return (
    <div className="fj-trace-grid">
      <Card label="Run trace">
        <CardHead
          action={
            <span className="fj-hstack" data-gap="8">
              <RunStatus phase={phase} />
              <Button aria-label="Replay run" onClick={replay} size="icon-sm" variant="ghost">
                <Icon icon={RotateCcw} />
              </Button>
            </span>
          }
          meta={<span className="fj-data">{formatMs(Math.min(elapsed, GATE + MERGE_MS))}</span>}
          title={
            <span className="fj-hstack">
              Run <CodeTag>kr-2817-3</CodeTag>
            </span>
          }
        />
        <div className="fj-scroll-x" ref={scroller}>
          <div className="fj-trace">
            <div className="fj-trace-row" aria-hidden>
              <span className="fj-trace-name fj-c-3 fj-t-label-sm">Step</span>
              <div className="fj-trace-axis">
                {TICKS.map((tick) => (
                  <span key={tick} style={{ left: pct(tick) }}>
                    {tick / 1000}s
                  </span>
                ))}
              </div>
            </div>
            {visible.map((row) => {
              const end = Math.min(row.end, elapsed);
              const live = elapsed < row.end;

              return (
                <button
                  aria-pressed={row.id === selected}
                  className="fj-trace-row"
                  data-kind={row.kind}
                  data-lane={row.lane}
                  data-trouble={row.failed === true && !live ? "fail" : undefined}
                  key={row.id}
                  onClick={() => {
                    setSelected(row.id);
                  }}
                  type="button"
                >
                  <span className="fj-trace-name">
                    <span className="fj-truncate">{row.name}</span>
                    {row.lane === "fork" ? <span className="fj-trace-note">3 together</span> : null}
                    {row.retriedBy !== undefined && row.retriedBy !== "" ? (
                      <Avatar name={row.retriedBy} size="sm" />
                    ) : null}
                  </span>
                  <Lane>
                    <span
                      className="fj-trace-bar"
                      data-cached={row.cached === true ? "" : undefined}
                      data-fork={row.lane === "fork" ? "" : undefined}
                      data-live={live ? "" : undefined}
                      style={{ left: pct(row.start), width: pct(end - row.start) }}
                    />
                    <span
                      className="fj-trace-dur"
                      data-flip={row.end / SCALE > FLIP_AT ? "" : undefined}
                      style={labelAt(row.start, end, row.end)}
                    >
                      {row.cached === true ? "cache hit" : formatMs(end - row.start)}
                      {row.failed === true && !live ? (
                        <span className="fj-c-fail"> failed</span>
                      ) : null}
                      {row.retriedBy !== undefined && row.retriedBy !== "" ? (
                        <span className="fj-sr"> retried by {row.retriedBy}</span>
                      ) : null}
                    </span>
                  </Lane>
                </button>
              );
            })}
            {showGate ? (
              <button
                aria-pressed={selected === "merge"}
                className="fj-trace-row"
                data-kind="repo"
                onClick={() => {
                  setSelected("merge");
                }}
                type="button"
              >
                <span className="fj-trace-name">
                  <span className="fj-truncate">merge</span>
                  <span className="fj-trace-note">your call</span>
                </span>
                <Lane>
                  {phase === "waiting" || phase === "denied" ? (
                    <span className="fj-trace-bar" data-gate="" style={{ left: pct(GATE) }} />
                  ) : (
                    <>
                      <span
                        className="fj-trace-bar"
                        data-live={phase === "merging" ? "" : undefined}
                        style={{ left: pct(GATE), width: pct(mergeEnd - GATE) }}
                      />
                      <span
                        className="fj-trace-dur"
                        data-flip=""
                        style={labelAt(GATE, mergeEnd, GATE + MERGE_MS)}
                      >
                        {formatMs(mergeEnd - GATE)}
                      </span>
                    </>
                  )}
                </Lane>
              </button>
            ) : null}
          </div>
        </div>
        <dl className="fj-trace-foot">
          <div>
            <dt>Wall clock</dt>
            <dd>{formatMs(wall)}</dd>
          </div>
          <div>
            <dt>Step time added up</dt>
            <dd>{formatMs(summed)}</dd>
          </div>
          <div>
            <dt>Saved by forking</dt>
            <dd>{formatMs(Math.max(0, summed - wall))}</dd>
          </div>
          <div>
            <dt>Retries by people</dt>
            <dd>{elapsed >= 5060 ? 1 : 0}</dd>
          </div>
        </dl>
      </Card>

      <Card label="Step detail">
        {selected === "merge" ? (
          <GateDetail
            decide={decide}
            decided={decided}
            mergeMs={mergeEnd - GATE}
            outcome={outcome}
            phase={phase}
          />
        ) : null}
        {step ? <StepDetail elapsed={elapsed} step={step} /> : null}
      </Card>
    </div>
  );
};

export const RunTraceScreen = () => (
  <Screen
    crumbs={["Kestrel", "storefront", "Runs", "kr-2817-3"]}
    description="One run of an agent, drawn against the clock. Checks fork and rejoin, a cached step costs nothing, a person's retry is marked with their face, and the run halts at main until you choose."
    id="screen-trace"
    title="Run trace"
  >
    <PageHeader title="Coupon total read too early">
      <Badge kind="agent">patchwright</Badge>
      <span>Assigned by Idris Okafor</span>
      <CodeTag>agent/coupon-race</CodeTag>
    </PageHeader>
    <RunTrace />
  </Screen>
);
