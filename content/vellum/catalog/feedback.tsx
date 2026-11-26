"use client";

import { ScrollText } from "lucide-react";
import { useState } from "react";

import { Alert } from "../components/alert";
import { Button } from "../components/button";
import { EmptyState } from "../components/empty-state";
import { Progress } from "../components/progress";
import { Status } from "../components/status";
import { useToast } from "../components/toast";
import { Specimen } from "../chrome";

/** Status, progress, skeleton, alert, toast and empty state. */
export const Feedback = () => {
  const toast = useToast();
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      <Specimen name="Status" note="seven states; a turn waiting on a person is not ochre" span={2}>
        <div className="v-cluster v-center v-gap-16">
          <Status status="idle" />
          <Status status="queued" />
          <Status status="running" />
          <Status status="waiting" />
          <Status status="ok">Passed</Status>
          <Status status="warn">Over token budget</Status>
          <Status status="fail" />
        </div>
      </Specimen>
      <Specimen
        name="Progress and skeleton"
        note="ink fill, green only when done; a still skeleton"
      >
        <div className="v-fill v-stack">
          <div className="v-stack-sm">
            <div className="v-between v-caption">
              <span>Indexing the help center</span>
              <span className="v-t2 v-data">64%</span>
            </div>
            <Progress label="Indexing the help center" value={64} />
          </div>
          <div className="v-stack-sm">
            <span className="v-caption">Embedding 1,240 tickets</span>
            <Progress label="Embedding tickets" />
          </div>
          <div className="v-stack-sm">
            <div className="v-between v-caption">
              <span>API reference</span>
              <span className="v-ok-text">Done</span>
            </div>
            <Progress label="API reference" size="sm" value={100} />
          </div>
          <div aria-busy={!loaded} className="v-panel v-pad">
            {loaded ? (
              <p className="v-body-sm">Batch requests, 6 chunks, indexed 10:14.</p>
            ) : (
              <div className="v-stack-sm" aria-label="Loading">
                <span className="v-skeleton" data-width="long" />
                <span className="v-skeleton" data-width="short" />
              </div>
            )}
          </div>
          <Button
            onClick={() => {
              setLoaded(!loaded);
            }}
            size="sm"
            variant="secondary"
          >
            {loaded ? "Show loading" : "Show loaded"}
          </Button>
        </div>
      </Specimen>
      <Specimen name="Alert" note="the tint and the word together">
        <div className="v-fill v-stack-sm">
          <Alert title="The CRM tool timed out" tone="fail">
            Three tickets went unanswered at 09:12. The agent retries them in 5 minutes.
          </Alert>
          <Alert title="This key expires in 6 days" tone="warn">
            The docs agent and the router both use it.
          </Alert>
          <Alert title="All 220 router cases graded" tone="ok" />
        </div>
      </Specimen>
      <Specimen name="Toast" note="bottom corner, one optional action; failures wait to be closed">
        <div className="v-cluster v-center">
          <Button
            onClick={() => {
              toast({
                action: {
                  label: "Undo",
                  onAction: () => {
                    toast({ title: "Put v11 back" });
                  },
                },
                title: "Published prompt v12",
                tone: "ok",
              });
            }}
            variant="secondary"
          >
            Publish v12
          </Button>
          <Button
            onClick={() => {
              toast({ title: "The eval run lost its worker", tone: "fail" });
            }}
            variant="secondary"
          >
            Fail a run
          </Button>
        </div>
      </Specimen>
      <Specimen name="Empty state" note="a light glyph, a title, one way forward">
        <EmptyState
          action={
            <Button
              onClick={() => {
                toast({ title: "Queued a test turn for the docs agent" });
              }}
              size="sm"
              variant="secondary"
            >
              Run a test turn
            </Button>
          }
          icon={<ScrollText aria-hidden />}
          title="No traces yet"
        >
          Run the agent once and every tool call it makes shows here, with what went in and out.
        </EmptyState>
      </Specimen>
    </>
  );
};
