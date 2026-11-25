import { Inbox } from "lucide-react";
import { useState } from "react";

import { Alert, EmptyState, Skeleton } from "../components/alert";
import { Button } from "../components/button";
import { Icon } from "../components/icon";
import { Meter, Progress } from "../components/meter";
import { Group, Sheet, SpecCell } from "../components/page";
import { groupHead } from "./catalog";
import { STATUS_WORD, Status } from "../components/status";
import type { RunStatus } from "../components/status";
import { useToast } from "../components/toast";
import { useInterval } from "../lib/motion";

const ALL = Object.keys(STATUS_WORD) as RunStatus[];

export const Feedback = () => {
  const push = useToast();
  const [done, setDone] = useState(9);
  const [running, setRunning] = useState(false);
  const [disk, setDisk] = useState(71);
  const [loaded, setLoaded] = useState(false);
  const [rotated, setRotated] = useState(false);

  useInterval(
    () => {
      setDone((value) => {
        if (value >= 32) {
          setRunning(false);

          return value;
        }

        return value + 1;
      });
    },
    140,
    running,
  );

  return (
    <Group {...groupHead("feedback")}>
      <Sheet>
        <SpecCell
          edge
          name="Status"
          note="Every state the scheduler knows, each a square and a word. Finished outcomes are coloured; anything still in flight stays ink."
          path="feedback/status"
        >
          <div className="hx-stack hx-gap-3">
            {ALL.map((status) => (
              <span className="hx-row hx-gap-4" key={status}>
                <span className="hx-status-col">
                  <Status status={status} />
                </span>
                <span className="hx-code-sm hx-ink-3">{status}</span>
              </span>
            ))}
          </div>
        </SpecCell>
        <SpecCell
          name="Meter"
          note="How full something is against a known ceiling. Cross the threshold tick and the fill turns orange and says so."
          path="feedback/meter"
        >
          <Meter
            label="Scratch disk"
            max={100}
            reading={`${disk * 4} / 400 GB`}
            value={disk}
            warnAt={0.8}
            failAt={0.95}
          />
          <Meter label="Queue depth" max={500} reading="118 / 500" value={118} />
          <div className="hx-row">
            <Button onClick={() => setDisk(Math.max(40, disk - 12))} size="sm">
              Free space
            </Button>
            <Button onClick={() => setDisk(Math.min(99, disk + 12))} size="sm">
              Fill disk
            </Button>
          </div>
        </SpecCell>
        <SpecCell
          edge
          name="Progress"
          note="Countable work, drawn one cell per unit. The cell in progress is the lit one."
          path="feedback/progress"
        >
          <Progress done={done} label="Backfill partitions" live={running} total={32} cells={32} />
          <div className="hx-row">
            <Button
              onClick={() => {
                if (done >= 32) {
                  setDone(0);
                }

                setRunning(!running);
              }}
              size="sm"
            >
              {running ? "Pause backfill" : "Run backfill"}
            </Button>
            <span className="hx-code-sm hx-ink-3">
              {Math.round((done / 32) * 100)}% · Nov 1 to Dec 2
            </span>
          </div>
        </SpecCell>
        <SpecCell
          name="Alert"
          note="When a result needs a full sentence: tinted band, its state word, then what to do next."
          path="feedback/alert"
        >
          {rotated ? (
            <Alert
              actions={
                <Button onClick={() => setRotated(false)} size="sm" variant="ghost">
                  Show the warning again
                </Button>
              }
              framed
              tone="ok"
              word="Key rotated"
            >
              <code>ads.spend_rollup</code> now signs with a key valid to Feb 24. The old one stops
              at 02:00 UTC.
            </Alert>
          ) : (
            <Alert
              actions={
                <Button onClick={() => setRotated(true)} size="sm">
                  Rotate key
                </Button>
              }
              framed
              tone="warn"
              word="Key expires in 6 days"
            >
              The service key for <code>ads.spend_rollup</code> stops working on Dec 1. Rotate it
              before the 02:00 run.
            </Alert>
          )}
          <Alert framed tone="ok" word="Backfill done">
            All 24 partitions committed on attempt 3.
          </Alert>
        </SpecCell>
        <SpecCell
          edge
          name="Toast"
          note="Confirms something happened, from the corner, for five seconds. Nothing in it needs an answer."
          path="feedback/toast"
        >
          <div className="hx-row-wrap">
            <Button
              onClick={() =>
                push({
                  detail: "run_c0ffee · Manual",
                  status: "running",
                  title: "orders_nightly started",
                })
              }
            >
              Start run
            </Button>
            <Button
              onClick={() =>
                push({
                  detail: "42 rows rejected",
                  status: "fail",
                  title: "Load of crm.contacts failed",
                })
              }
            >
              Fail a load
            </Button>
          </div>
        </SpecCell>
        <SpecCell
          name="Empty state"
          note="Explains why nothing is here and offers the single way to get something back."
          path="feedback/empty-state"
        >
          <EmptyState
            action={<Button size="sm">Clear filters</Button>}
            icon={<Icon icon={Inbox} size={24} />}
            title="No failed runs today"
          >
            Nothing has failed in <code>prod</code> since 00:00 UTC. Clear the filter to see every
            run.
          </EmptyState>
        </SpecCell>
        <SpecCell
          name="Skeleton"
          note="Holds the outline of data that has not arrived. It sits still; the four-square mark is the only thing that repeats."
          path="feedback/skeleton"
          wide
        >
          <div className="hx-frame">
            <div className="hx-head">
              <span className="hx-head-title hx-code">warehouse usage</span>
              <span className="hx-head-meta hx-code-sm">{loaded ? "loaded" : "loading"}</span>
              <div className="hx-head-actions">
                <Button onClick={() => setLoaded(!loaded)} size="sm" variant="ghost">
                  {loaded ? "Reload" : "Finish load"}
                </Button>
              </div>
            </div>
            <div className="hx-body-pad">
              {loaded ? (
                <>
                  <span className="hx-code">3,412 credits · 18.6 TB · 37 slots</span>
                  <span className="hx-body-sm hx-ink-2">
                    Billing period Nov 1 to 30, eu-central-1.
                  </span>
                </>
              ) : (
                <>
                  <Skeleton width="44%" />
                  <Skeleton height={8} width="72%" />
                </>
              )}
            </div>
          </div>
        </SpecCell>
      </Sheet>
    </Group>
  );
};
