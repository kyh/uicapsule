import { useState } from "react";

import { Avatar } from "../components/avatar";
import { Badge, CodeTag } from "../components/badge";
import { Button } from "../components/button";
import { Countdown } from "../components/countdown";
import { StatStrip } from "../components/data";
import { Card, CardHead, Panel, PanelBody, PanelFoot, PanelHead } from "../components/frame";
import { Checkbox, Segmented } from "../components/selection";
import { InkSlot, Status } from "../components/status";
import { useToast } from "../components/toast";
import { useInterval } from "../lib/hooks";
import { PageHeader, Screen } from "./screen";

type Phase = "open" | "switching" | "swapped" | "declined" | "dropped";

type Verdict = "better" | "worse" | "same" | "both-failed";

interface Task {
  id: string;
  title: string;
  before: boolean;
  after: boolean;
  delta: string;
}

const TASKS: Task[] = [
  { after: true, before: false, delta: "-41s", id: "t1", title: "Price service timeout in unit" },
  { after: false, before: true, delta: "+12s", id: "t2", title: "Rename OrderLine.qty" },
  { after: true, before: false, delta: "-1m 8s", id: "t3", title: "Split checkout.tsx in two" },
  { after: false, before: true, delta: "+3s", id: "t4", title: "Drop the legacy-tax flag" },
  { after: false, before: false, delta: "+20s", id: "t5", title: "Cache tax table lookups" },
  { after: true, before: true, delta: "-9s", id: "t6", title: "Coupon total read too early" },
  { after: true, before: true, delta: "-2s", id: "t7", title: "Bump zod in the lockfile" },
  { after: true, before: true, delta: "-14s", id: "t8", title: "Translate cart strings to de" },
];

const VERDICT_RANK = { better: 2, "both-failed": 1, same: 0, worse: 3 } satisfies Record<
  Verdict,
  number
>;

const verdictOf = (task: Task) => {
  if (task.before === task.after) {
    return task.after ? "same" : "both-failed";
  }

  return task.after ? "better" : "worse";
};

const VerdictWord = ({ verdict }: { verdict: Verdict }) => {
  if (verdict === "worse") {
    return <Status status="warn">Worse</Status>;
  }

  if (verdict === "both-failed") {
    return <Status status="fail">Both failed</Status>;
  }

  return (
    <Status status={verdict === "better" ? "ok" : "idle"}>
      {verdict === "better" ? "Better" : "Same"}
    </Status>
  );
};

const Result = ({ passed }: { passed: boolean }) =>
  passed ? <Status status="ok">Passed</Status> : <Status status="fail">Failed</Status>;

const WINDOW = 20 * 60;
const START_LEFT = 9 * 60 + 41;
const EXTENSION = 10 * 60;

const IN_FLIGHT = [
  { finishesIn: 3, id: "kr-2830-1", title: "Split checkout.tsx in two" },
  { finishesIn: 5, id: "kr-2831-1", title: "Drop the legacy-tax flag" },
  { finishesIn: 8, id: "kr-2832-2", title: "Cache tax table lookups" },
] as const;

const SWITCH_SECONDS = 8;

const OUTCOME = {
  declined: "You declined. tern-4 stopped taking shadow tasks and patchwright stays on tern-3.",
  dropped:
    "Nobody signed before the window closed, so the swap was dropped. patchwright stays on tern-3.",
  open: "Maren Holt proposed the swap and signed. A second person signs before patchwright moves.",
  swapped: "patchwright runs on tern-4. tern-3 stays warm for a day in case you swap back.",
  switching: "Signed. Runs already started finish on tern-3; every new run starts on tern-4.",
} satisfies Record<Phase, string>;

export const ModelSwap = () => {
  const [phase, setPhase] = useState<Phase>("open");
  const [left, setLeft] = useState(START_LEFT);
  const [total, setTotal] = useState(WINDOW);
  const [extended, setExtended] = useState(false);
  const [read, setRead] = useState(false);
  const [compared, setCompared] = useState(36);
  const [switched, setSwitched] = useState(0);
  const [view, setView] = useState<"Disagreements" | "All tasks">("All tasks");
  const toast = useToast();

  useInterval(
    () => {
      const next = left - 1;

      setLeft(next);

      if (next % 7 === 0) {
        setCompared((value) => value + 1);
      }

      if (next <= 0) {
        setPhase("dropped");
        toast({
          description: "patchwright stays on tern-3.",
          title: "Shadow window closed unsigned",
        });
      }
    },
    phase === "open" ? 1000 : null,
  );

  useInterval(
    () => {
      const next = switched + 1;

      setSwitched(next);

      if (next >= SWITCH_SECONDS) {
        setPhase("swapped");
      }
    },
    phase === "switching" ? 1000 : null,
  );

  const reset = () => {
    setPhase("open");
    setLeft(START_LEFT);
    setTotal(WINDOW);
    setExtended(false);
    setRead(false);
    setSwitched(0);
  };

  const sign = () => {
    setPhase("switching");
    setSwitched(0);
    toast({
      action: { label: "Undo", onSelect: reset },
      description: "3 runs finish on tern-3, then patchwright moves to tern-4.",
      status: "ok",
      title: "You signed the swap",
    });
  };

  const decline = () => {
    setPhase("declined");
    toast({ description: "patchwright stays on tern-3.", title: "Swap declined" });
  };

  const extend = () => {
    setLeft((value) => value + EXTENSION);
    setTotal((value) => value + EXTENSION);
    setExtended(true);
  };

  const rows = TASKS.filter((task) => view === "All tasks" || verdictOf(task) !== "same").toSorted(
    (a, b) => VERDICT_RANK[verdictOf(b)] - VERDICT_RANK[verdictOf(a)],
  );

  const open = phase === "open";
  const agreed = compared - 7;

  return (
    <Screen
      bar={
        <Button onClick={reset} size="xs" variant="ghost">
          Start over
        </Button>
      }
      crumbs={["Kestrel", "Agents", "patchwright", "Model"]}
      description="A model change that waits for two signatures. The new model runs in the shadow of the old one until someone signs, and a window that nobody signs closes on the safe side."
      id="screen-swap"
      title="Model swap"
    >
      <PageHeader title="Move patchwright to tern-4">
        <Badge kind="agent">patchwright</Badge>
        <span className="fj-hstack" data-gap="8">
          <CodeTag>tern-3</CodeTag>
          <span className="fj-c-3">to</span>
          <CodeTag>tern-4</CodeTag>
        </span>
        <span>Proposed by Maren Holt</span>
      </PageHeader>

      <div className="fj-swap-grid">
        <Card label="Shadow comparison">
          <CardHead
            action={
              <Segmented
                label="Tasks shown"
                onValueChange={setView}
                options={["Disagreements", "All tasks"] as const}
                size="xs"
                value={view}
              />
            }
            meta="same tasks, nothing kept"
            title="Shadow comparison"
          />
          <div className="fj-swap-strip">
            <StatStrip
              label="Shadow results so far"
              stats={[
                { label: "Tasks compared", value: compared },
                { label: "Same result", value: agreed },
                { label: "tern-4 better", value: 3 },
                { label: "tern-4 worse", value: 2 },
              ]}
            />
          </div>
          <div className="fj-scroll-x">
            <table className="fj-table fj-stack-table">
              <caption className="fj-sr">Tasks both models ran, worst change first</caption>
              <thead>
                <tr>
                  <th scope="col">Task</th>
                  <th scope="col">tern-3</th>
                  <th scope="col">tern-4</th>
                  <th scope="col">Change</th>
                  <th data-num="" scope="col">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((task) => (
                  <tr key={task.id}>
                    <th scope="row">{task.title}</th>
                    <td data-label="tern-3">
                      <Result passed={task.before} />
                    </td>
                    <td data-label="tern-4">
                      <Result passed={task.after} />
                    </td>
                    <td data-label="Change">
                      <VerdictWord verdict={verdictOf(task)} />
                    </td>
                    <td data-label="Time" data-num="">
                      {task.delta}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="fj-vstack" data-gap="12">
          <Panel label="Signatures">
            <PanelHead meta="2 needed" title="Signatures" />
            <PanelBody>
              <ul className="fj-ledger">
                <li>
                  <Avatar name="Maren Holt" />
                  <span className="fj-grow">Maren Holt</span>
                  <span className="fj-c-3">Signed 14 min ago</span>
                </li>
                <li>
                  <Avatar name="Idris Okafor" />
                  <span className="fj-grow">You</span>
                  {open ? <InkSlot size="sm">Your call</InkSlot> : null}
                  {phase === "switching" || phase === "swapped" ? (
                    <span className="fj-c-3">Signed just now</span>
                  ) : null}
                  {phase === "declined" ? <span className="fj-c-3">Declined</span> : null}
                  {phase === "dropped" ? <span className="fj-c-3">Did not sign</span> : null}
                </li>
              </ul>
              <div className="fj-pad">
                <output className="fj-t-body-sm fj-c-2">{OUTCOME[phase]}</output>
                {open ? (
                  <Checkbox
                    checked={read}
                    description="Rename OrderLine.qty and Drop the legacy-tax flag"
                    label="I read the two tasks tern-4 did worse"
                    onCheckedChange={setRead}
                  />
                ) : null}
              </div>
            </PanelBody>
            {open ? (
              <PanelFoot>
                <span className="fj-t-body-sm fj-c-3 fj-grow">
                  {read ? "Your signature moves patchwright." : "Tick the box to sign."}
                </span>
                <Button onClick={decline}>Decline</Button>
                <Button disabled={!read} onClick={sign} variant="primary">
                  Sign and swap
                </Button>
              </PanelFoot>
            ) : null}
          </Panel>

          {phase === "switching" || phase === "swapped" ? (
            <Panel label="Switching runs">
              <PanelHead
                meta={`${IN_FLIGHT.filter((run) => run.finishesIn <= switched).length} of 3`}
                title="Runs finishing on tern-3"
              />
              <PanelBody>
                <ul className="fj-ledger">
                  {IN_FLIGHT.map((run) => (
                    <li key={run.id}>
                      <CodeTag>{run.id}</CodeTag>
                      <span className="fj-grow fj-truncate">{run.title}</span>
                      <Status status={run.finishesIn <= switched ? "ok" : "running"} />
                    </li>
                  ))}
                </ul>
              </PanelBody>
            </Panel>
          ) : (
            <Panel label="Shadow window">
              <PanelHead meta="closes unsigned on tern-3" title="Shadow window" />
              <PanelBody>
                <Countdown
                  left={left}
                  running={open}
                  total={total}
                  word={open ? "until the window closes" : "window closed"}
                >
                  <p className="fj-t-body-sm fj-c-2">
                    One mark per minute. When the last one goes out, tern-4 stops shadowing and
                    nothing changes.
                  </p>
                </Countdown>
              </PanelBody>
              {open ? (
                <PanelFoot>
                  <Button disabled={extended} onClick={extend} size="sm">
                    {extended ? "Extended once" : "Add 10 minutes"}
                  </Button>
                </PanelFoot>
              ) : null}
            </Panel>
          )}
        </div>
      </div>
    </Screen>
  );
};
