import { useState } from "react";

import { AvatarGroup } from "../components/avatar";
import { Badge, CodeTag } from "../components/badge";
import { Button } from "../components/button";
import { RelativeTime } from "../components/data";
import { Card, CardHead, Item, Panel, PanelBody, PanelFoot, PanelHead } from "../components/frame";
import { InkSlot, STATUS_RANK, Status } from "../components/status";
import type { StatusValue } from "../components/status";
import { useToast } from "../components/toast";
import { formatClock } from "../lib/format";
import { useInterval } from "../lib/hooks";
import { PageHeader, Screen } from "./screen";

interface Job {
  id: string;
  agent: string;
  task: string;
  length: number;
}

interface Slot {
  job: Job | null;
  elapsed: number;
  done: number;
}

const START_SLOTS: Slot[] = [
  {
    done: 0,
    elapsed: 74,
    job: { agent: "patchwright", id: "j1", length: 96, task: "Coupon total read too early" },
  },
  {
    done: 0,
    elapsed: 21,
    job: { agent: "triage", id: "j2", length: 26, task: "Label 9 new issues" },
  },
  {
    done: 0,
    elapsed: 40,
    job: { agent: "scribe", id: "j3", length: 140, task: "Changelog for 2.8" },
  },
  { done: 0, elapsed: 0, job: null },
];

const START_QUEUE: Job[] = [
  { agent: "warden", id: "j4", length: 30, task: "Scan the lockfile bump" },
  { agent: "patchwright", id: "j5", length: 60, task: "Rename OrderLine.qty" },
  { agent: "scribe", id: "j6", length: 45, task: "Reply on #2799" },
  { agent: "triage", id: "j7", length: 22, task: "Close stale duplicates" },
];

const HOLD = 2;

const ASSIGNED: Job = {
  agent: "patchwright",
  id: "j-2836",
  length: 50,
  task: "Fix #2836, kiosk receipt prints twice",
};

const SHOWN = 3;

interface Branch {
  name: string;
  agent: string;
  ahead: number;
  behind: number;
  checks: StatusValue;
  checksWord?: string;
  pushedAgo: number;
}

const BRANCHES: Branch[] = [
  {
    agent: "patchwright",
    ahead: 3,
    behind: 0,
    checks: "waiting",
    checksWord: "Merge asks you",
    name: "agent/coupon-race",
    pushedAgo: 120,
  },
  {
    agent: "warden",
    ahead: 1,
    behind: 14,
    checks: "fail",
    name: "agent/pin-undici",
    pushedAgo: 3300,
  },
  {
    agent: "patchwright",
    ahead: 5,
    behind: 2,
    checks: "warn",
    checksWord: "Passed on retry",
    name: "agent/split-checkout",
    pushedAgo: 900,
  },
  {
    agent: "scribe",
    ahead: 1,
    behind: 0,
    checks: "running",
    name: "agent/changelog-2.8",
    pushedAgo: 40,
  },
  {
    agent: "triage",
    ahead: 2,
    behind: 0,
    checks: "ok",
    name: "agent/labels-sync",
    pushedAgo: 5400,
  },
  {
    agent: "patchwright",
    ahead: 4,
    behind: 1,
    checks: "queued",
    name: "agent/orderline-qty",
    pushedAgo: 60,
  },
];

const tick = (slots: Slot[], queue: Job[]) => {
  const nextQueue = [...queue];

  const nextSlots = slots.map((slot) => {
    if (slot.job && slot.done > 0) {
      if (slot.done >= HOLD) {
        nextQueue.push(slot.job);

        return { done: 0, elapsed: 0, job: null };
      }

      return { ...slot, done: slot.done + 1 };
    }

    if (slot.job) {
      const elapsed = slot.elapsed + 1;

      return elapsed >= slot.job.length ? { ...slot, done: 1, elapsed } : { ...slot, elapsed };
    }

    const job = nextQueue.shift() ?? null;

    return { done: 0, elapsed: 0, job };
  });

  return { queue: nextQueue, slots: nextSlots };
};

const SlotCell = ({ slot, index }: { slot: Slot; index: number }) => {
  if (!slot.job) {
    return (
      <li className="fj-slot" data-state="free">
        <span className="fj-t-label-sm fj-c-3">Slot {index + 1}</span>
        <span className="fj-c-3">Free</span>
      </li>
    );
  }

  return (
    <li className="fj-slot" data-state={slot.done > 0 ? "done" : "busy"}>
      <span className="fj-hstack fj-t-label-sm fj-c-3" data-gap="8">
        Slot {index + 1}
        <Badge kind="agent">{slot.job.agent}</Badge>
      </span>
      <span className="fj-slot-task">{slot.job.task}</span>
      <span className="fj-hstack" data-gap="8">
        {slot.done > 0 ? <Status status="ok" /> : <Status status="running" />}
        <span className="fj-data fj-c-3 fj-push">{formatClock(slot.elapsed)}</span>
      </span>
    </li>
  );
};

export const RepoHome = () => {
  const [state, setState] = useState(() => ({ queue: START_QUEUE, slots: START_SLOTS }));
  const [sort, setSort] = useState<"checks" | "pushed">("checks");
  const toast = useToast();

  useInterval(() => setState((current) => tick(current.slots, current.queue)), 1000);

  const busy = state.slots.filter((slot) => slot.job).length;

  const assigned =
    state.queue.some((job) => job.id === ASSIGNED.id) ||
    state.slots.some((slot) => slot.job?.id === ASSIGNED.id);

  const mine = state.queue.findIndex((job) => job.id === ASSIGNED.id);

  const line = state.queue
    .map((job, place) => ({ job, place }))
    .filter(({ place }) => place < SHOWN || place === mine);

  const assign = () => {
    setState((current) => ({ ...current, queue: [...current.queue, ASSIGNED] }));
    toast({
      description: "triage gave it to patchwright, and it joins the end of the line.",
      title: "Issue #2836 assigned",
    });
  };

  const branches = BRANCHES.toSorted((a, b) =>
    sort === "checks" ? STATUS_RANK[b.checks] - STATUS_RANK[a.checks] : a.pushedAgo - b.pushedAgo,
  );

  return (
    <Screen
      bar={
        <AvatarGroup
          label="On call this week: Maren Holt and Idris Okafor"
          names={["Maren Holt", "Idris Okafor"]}
        />
      }
      crumbs={["Kestrel", "storefront"]}
      description="One repository as its agents see it: four slots of work, the line waiting for a slot, the questions held for a person, and every branch an agent has open."
      id="screen-repo"
      title="Repo overview"
    >
      <PageHeader
        actions={
          <Button disabled={assigned} onClick={assign} variant="primary">
            {assigned ? "Issue #2836 assigned" : "Assign #2836"}
          </Button>
        }
        title="storefront"
      >
        <Badge kind="repo" />
        <Status status="ok">main is green</Status>
        <span>{BRANCHES.length} agent branches</span>
      </PageHeader>

      <div className="fj-repo-grid">
        <Card label="Agent slots">
          <CardHead meta={`${busy} of 4 busy`} title="Agent slots" />
          <ol className="fj-slots">
            {state.slots.map((slot, index) => (
              <SlotCell index={index} key={`slot-${index + 1}`} slot={slot} />
            ))}
          </ol>
          <div className="fj-queue">
            <p className="fj-hstack fj-t-label-sm fj-c-3">
              <span className="fj-grow">Next in line</span>
              <span className="fj-data">{state.queue.length} waiting</span>
            </p>
            <ol className="fj-queue-list">
              {line.map(({ job, place }) => (
                <li key={job.id} value={place + 1}>
                  <span className="fj-data fj-c-3">{place + 1}</span>
                  <span className="fj-grow fj-truncate">{job.task}</span>
                  <Badge kind="agent">{job.agent}</Badge>
                </li>
              ))}
            </ol>
          </div>
        </Card>

        <Panel label="Asks for you">
          <PanelHead meta="3" title="Asks for you" />
          <PanelBody>
            <Item
              description="patchwright, all checks passed"
              end={<InkSlot size="sm">Your call</InkSlot>}
              title="Merge #2817 into main"
            />
            <Item
              description="warden wants to rewrite 2 commits"
              end={<InkSlot size="sm">Your call</InkSlot>}
              title={
                <>
                  Force-push <CodeTag>release/2.8</CodeTag>
                </>
              }
            />
            <Item
              description="Second signature, window closes in 9 min"
              end={<span className="fj-c-3">Signed by 1 of 2</span>}
              title="Move patchwright to tern-4"
            />
          </PanelBody>
          <PanelFoot>
            <span className="fj-t-body-sm fj-c-3">Oldest first</span>
          </PanelFoot>
        </Panel>

        <Card label="Agent branches">
          <CardHead
            action={
              <Button
                onClick={() => setSort(sort === "checks" ? "pushed" : "checks")}
                size="xs"
                variant="ghost"
              >
                {sort === "checks" ? "Sort by last push" : "Sort by checks"}
              </Button>
            }
            meta={sort === "checks" ? "trouble first" : "newest push first"}
            title="Agent branches"
          />
          <div className="fj-scroll-x">
            <table className="fj-table fj-stack-table">
              <caption className="fj-sr">Branches agents have open on storefront</caption>
              <thead>
                <tr>
                  <th scope="col">Branch</th>
                  <th scope="col">Agent</th>
                  <th data-num="" scope="col">
                    Ahead
                  </th>
                  <th data-num="" scope="col">
                    Behind
                  </th>
                  <th scope="col">Checks</th>
                  <th data-num="" scope="col">
                    Pushed
                  </th>
                </tr>
              </thead>
              <tbody>
                {branches.map((branch) => (
                  <tr key={branch.name}>
                    <th scope="row">
                      <CodeTag>{branch.name}</CodeTag>
                    </th>
                    <td data-label="Agent">
                      <Badge kind="agent">{branch.agent}</Badge>
                    </td>
                    <td data-label="Ahead" data-num="">
                      {branch.ahead}
                    </td>
                    <td data-label="Behind" data-num="">
                      <span className={branch.behind > 10 ? "fj-c-warn" : undefined}>
                        {branch.behind}
                      </span>
                    </td>
                    <td data-label="Checks">
                      <Status plain status={branch.checks}>
                        {branch.checksWord}
                      </Status>
                    </td>
                    <td data-label="Pushed" data-num="">
                      <RelativeTime secondsAgo={branch.pushedAgo} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </Screen>
  );
};
