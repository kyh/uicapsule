import { useState } from "react";

import { Button } from "../components/button";
import {
  Alert,
  EmptyState,
  Progress,
  Skeleton,
  StepProgress,
  useSkeletonGate,
} from "../components/feedback";
import { CodeTag } from "../components/badge";
import { readingTime, useToast } from "../components/toast";
import type { ToastInput } from "../components/toast";
import { Category, Specimen } from "./specimen";

export const FEEDBACK_NAMES = ["Toast", "Alert", "Progress", "Empty state", "Skeleton"] as const;

const TOASTS: ToastInput[] = [
  { description: "Next run in 6 minutes.", title: "Schedule saved" },
  {
    action: { label: "Undo", onSelect: () => null },
    description: "It stays in the trash for 30 days.",
    title: "Agent archived",
  },
  {
    description: "The webhook answered 503 three times.",
    status: "fail",
    title: "Delivery to #oncall failed",
  },
];

const LOADS = [80, 900] as const;

export const Feedback = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [lastLoad, setLastLoad] = useState<number | null>(null);
  const shown = useSkeletonGate(loading);

  const load = (ms: number) => {
    setLoading(true);
    setLastLoad(ms);
    window.setTimeout(() => setLoading(false), ms);
  };

  return (
    <Category
      id="feedback"
      lede="How Fjord tells you something happened. A notice says what broke and what to do, stays still while you read it, and an empty list says why it is empty."
      title="Feedback"
    >
      <Specimen
        bare
        description="Paper and the frame line, with the trouble carried by its glyph and a heading that says what broke. The fill stays white."
        name="Alert"
        wide
      >
        <Alert
          actions={<Button size="sm">Rotate key</Button>}
          status="warn"
          title="ci-runner key expires in 3 days"
        >
          Pipelines using it start failing on Friday at 09:00.
        </Alert>
        <Alert
          actions={<Button size="sm">Retry sync</Button>}
          status="fail"
          title="Sync to staging failed"
        >
          The token for eu-north expired 2 h ago.
        </Alert>
        <Alert status="info" title="Traces are kept for 30 days">
          Export a run to keep it longer.
        </Alert>
      </Specimen>
      <Specimen
        description="Stays for a reading time worked out from its words, waits while hovered, appears without growing."
        name="Toast"
      >
        <div className="fj-vstack">
          {TOASTS.map((entry) => (
            <div className="fj-hstack" key={entry.title}>
              <Button onClick={() => toast(entry)} size="sm">
                {entry.title}
              </Button>
              <span className="fj-t-body-sm fj-c-3 fj-data">
                {(readingTime(entry) / 1000).toFixed(1)}s
              </span>
            </div>
          ))}
        </div>
      </Specimen>
      <Specimen
        bare
        description="A title, one line and the action, top left where the first row would be. No art."
        name="Empty state"
      >
        <div className="fj-card">
          <EmptyState actions={<Button size="sm">Clear filter</Button>} title="No runs match">
            Nothing ran with <CodeTag>status:denied</CodeTag> in the last 7 days.
          </EmptyState>
        </div>
      </Specimen>
      <Specimen
        description="Shows only if loading outlasts 150ms, then holds for 400ms so it never blinks. The fast load never shows it."
        name="Skeleton"
      >
        <div className="fj-hstack">
          {LOADS.map((ms) => (
            <Button key={ms} onClick={() => load(ms)} size="sm">
              Load in {ms}ms
            </Button>
          ))}
        </div>
        <div className="fj-card fj-skeleton-card" aria-busy={loading}>
          {shown ? (
            <div className="fj-vstack" data-gap="8">
              <Skeleton width="60%" />
              <Skeleton width="85%" />
              <Skeleton width="40%" />
            </div>
          ) : (
            <p className="fj-t-body-sm fj-c-2">
              {lastLoad === null
                ? "Press a button to load the run summary."
                : `Loaded in ${lastLoad}ms. reviewer finished 38 reviews today.`}
            </p>
          )}
        </div>
      </Specimen>
      <Specimen
        description="A 4px bar in the kind's line step, an unknown-length slide, and steps with the failed one marked."
        name="Progress"
      >
        <Progress kind="run" label="Nightly eval" value={286} max={350} valueText="286 of 350" />
        <Progress label="Indexing the repo" />
        <div className="fj-vstack" data-gap="4">
          <span className="fj-progress-head">
            <span>Release checks</span>
            <span className="fj-c-fail">3 of 5, one failed</span>
          </span>
          <StepProgress done={3} label="Release checks" total={5} trouble={2} />
        </div>
      </Specimen>
    </Category>
  );
};
