"use client";

import { useState } from "react";

import { Button } from "../components/button";
import { Panel, Shell, ShellFoot } from "../components/card";
import { LineChart } from "../components/chart";
import { Dialog } from "../components/dialog";
import { Status, statusRank } from "../components/status";
import type { StatusKind } from "../components/status";
import { StatusStrip } from "../components/status-strip";
import { useToast } from "../components/toast";
import { useLater } from "../lib/hooks";

interface Suite {
  id: string;
  title: string;
  detail?: string;
  cases: number;
  matched: number;
  status: StatusKind;
}

const SUITES: readonly Suite[] = [
  { cases: 60, id: "json", matched: 60, status: "ok", title: "Tool calls return valid JSON" },
  {
    cases: 40,
    detail: "Drops the order ID after about 40 turns",
    id: "recall",
    matched: 35,
    status: "fail",
    title: "Long thread recall",
  },
  { cases: 40, id: "scope", matched: 39, status: "ok", title: "Declines out-of-scope asks" },
  { cases: 30, id: "handoff", matched: 30, status: "ok", title: "Hands off to a person" },
  { cases: 50, id: "traces", matched: 50, status: "ok", title: "Reads stack traces" },
];

const REGRADED = new Map([
  ["recall", 36],
  ["scope", 40],
]);

const FAILED_NIGHTS = new Set([4, 11, 16, 24, 29]);

const NIGHTS = Array.from<unknown, StatusKind>({ length: 30 }, (_, index) =>
  FAILED_NIGHTS.has(index) ? "fail" : "ok",
);

const DAYS = Array.from({ length: 14 }, (_, index) => (index === 0 ? "31 Oct" : `${index} Nov`));

const WORDS: Partial<Record<StatusKind, string>> = {
  fail: "Regressed",
  ok: "Holds",
  running: "Grading",
};

const percent = (list: readonly Suite[]) => {
  const cases = list.reduce((sum, suite) => sum + suite.cases, 0);
  const matched = list.reduce((sum, suite) => sum + suite.matched, 0);

  return `${((matched / cases) * 100).toFixed(1)}%`;
};

const Grades = () => {
  const [suites, setSuites] = useState(SUITES);
  const [grading, setGrading] = useState<ReadonlySet<string>>(new Set());
  const [nights, setNights] = useState(NIGHTS);
  const [onlyRegressions, setOnlyRegressions] = useState(false);
  const [gradedAt, setGradedAt] = useState("Graded at 1:10 am");
  const later = useLater();
  const running = grading.size > 0;

  const gradeAgain = () => {
    setGrading(new Set(SUITES.map((suite) => suite.id)));

    for (const [index, suite] of SUITES.entries()) {
      later(
        () => {
          setSuites((list) =>
            list.map((entry) =>
              entry.id === suite.id
                ? { ...entry, matched: REGRADED.get(suite.id) ?? entry.matched }
                : entry,
            ),
          );
          setGrading((set) => new Set([...set].filter((id) => id !== suite.id)));
        },
        600 + index * 420,
      );
    }

    later(
      () => {
        setNights((list) => [...list.slice(1), "fail"]);
        setGradedAt("Graded just now");
      },
      600 + SUITES.length * 420,
    );
  };

  const shown = suites
    .map((suite) => ({ ...suite, status: grading.has(suite.id) ? "running" : suite.status }))
    .filter((suite) => !onlyRegressions || suite.status === "fail" || suite.status === "running")
    .toSorted((a, b) => statusRank[b.status] - statusRank[a.status]);

  return (
    <Shell>
      <Panel>
        <div className="v-stack v-pad">
          <div className="v-stack-sm v-gap-2">
            <p className="v-label">Router grades</p>
            <p className="v-caption v-t2">Quill 4 mini takes the easy turns; Quill 4 grades it</p>
          </div>
          <p className="v-cluster v-gap-8 v-baseline">
            <span className="v-title v-data">{percent(suites)}</span>
            <span className="v-body-sm v-t2">of graded turns match Quill 4</span>
          </p>
          <StatusStrip
            from="15 Oct"
            label="Nightly grades, 30 nights"
            runs={nights}
            to="Last night"
          />
        </div>
        <ul
          aria-busy={running}
          aria-label="Suites, regressions first"
          className="v-rows v-rule-top"
        >
          {shown.map((suite) => (
            <li className="v-row v-row-hover v-items-start" key={suite.id}>
              <span className="v-row-main">
                <span className="v-body-sm v-t1">{suite.title}</span>
                {suite.detail && suite.status === "fail" ? (
                  <span className="v-caption v-t2">{suite.detail}</span>
                ) : null}
              </span>
              <span className="v-row-end">
                <span className="v-caption v-t2 v-data">
                  {suite.matched}/{suite.cases}
                </span>
                <Status status={suite.status}>{WORDS[suite.status]}</Status>
              </span>
            </li>
          ))}
        </ul>
      </Panel>
      <ShellFoot meta={<span aria-live="polite">{gradedAt}</span>}>
        <Button onClick={() => setOnlyRegressions(!onlyRegressions)} size="sm" variant="secondary">
          {onlyRegressions ? "Show all" : "Show regressions"}
        </Button>
        <Button onClick={gradeAgain} pending={running} pendingLabel="Grading" size="sm">
          Grade again
        </Button>
      </ShellFoot>
    </Shell>
  );
};

const ROUTER_COST = [
  0.44, 0.41, 0.42, 0.4, 0.39, 0.41, 0.38, 0.37, 0.39, 0.38, 0.36, 0.38, 0.37, 0.38,
];

const QUILL_COST = [
  1.04, 1.08, 1.05, 1.1, 1.07, 1.02, 1.06, 1.09, 1.05, 1.03, 1.08, 1.06, 1.04, 1.06,
];

const money = (value: number) => `$${value.toFixed(2)}`;

const Cost = () => {
  const [confirm, setConfirm] = useState(false);
  const [paused, setPaused] = useState(false);
  const [pausing, setPausing] = useState(false);
  const [longThreads, setLongThreads] = useState(false);
  const toast = useToast();
  const later = useLater();
  const routed = longThreads ? 0.41 : 0.38;

  return (
    <Shell>
      <Panel>
        <div className="v-stack v-pad">
          <div className="v-between">
            <p className="v-label">Cost per 1,000 turns</p>
            {paused ? <Status status="idle">Paused</Status> : <Status status="ok">Routing</Status>}
          </div>
          <div className="v-cluster v-gap-24">
            <p className="v-stack-sm v-gap-0">
              <span className="v-caption v-t2">With the router</span>
              <span className="v-heading v-data">{money(paused ? 1.06 : routed)}</span>
            </p>
            <p className="v-stack-sm v-gap-0">
              <span className="v-caption v-t2">Quill 4 alone</span>
              <span className="v-heading v-data">{money(1.06)}</span>
            </p>
            <p className="v-caption v-t2 v-self-end">
              {paused
                ? "Nothing saved while paused"
                : `${Math.round((1 - routed / 1.06) * 100)}% less`}
            </p>
          </div>
          <LineChart
            format={money}
            label="Cost per 1,000 turns by day, the router against Quill 4 alone"
            labels={DAYS}
            series={[
              { name: "Router", values: ROUTER_COST },
              { name: "Quill 4 alone", values: QUILL_COST },
            ]}
            ticks={[0, 0.6, 1.2]}
          />
        </div>
      </Panel>
      <ShellFoot
        meta={
          <span aria-live="polite">
            {longThreads ? "Long threads on Quill 4" : "Live since 31 Oct"}
          </span>
        }
      >
        {paused ? (
          <Button onClick={() => setPaused(false)} size="sm" variant="secondary">
            Resume
          </Button>
        ) : (
          <Button onClick={() => setConfirm(true)} size="sm" variant="secondary">
            Pause
          </Button>
        )}
        <Button
          disabled={longThreads || paused}
          onClick={() => {
            setLongThreads(true);
            toast({
              action: { label: "Undo", onAction: () => setLongThreads(false) },
              title: "Threads past 40 turns now stay on Quill 4",
              tone: "ok",
            });
          }}
          size="sm"
          variant="confirm"
        >
          Keep long threads on Quill 4
        </Button>
      </ShellFoot>
      <Dialog
        description="Every turn goes to Quill 4, at about $1.06 per 1,000, until you resume. The nightly grades keep running."
        footer={
          <>
            <Button
              data-autofocus=""
              onClick={() => setConfirm(false)}
              size="sm"
              variant="secondary"
            >
              Keep routing
            </Button>
            <Button
              onClick={() => {
                setPausing(true);
                later(() => {
                  setPaused(true);
                  setPausing(false);
                  setConfirm(false);
                }, 900);
              }}
              pending={pausing}
              pendingLabel="Pausing"
              size="sm"
              variant="destructive"
            >
              Pause
            </Button>
          </>
        }
        meta="Routing since 31 Oct"
        onOpenChange={setConfirm}
        open={confirm}
        role="alertdialog"
        title="Pause the router?"
      />
    </Shell>
  );
};

/** A live model router, graded every night against the big model, and what it saves. */
export const RoutingScreen = () => (
  <div className="v-screen-cols">
    <Grades />
    <Cost />
  </div>
);
