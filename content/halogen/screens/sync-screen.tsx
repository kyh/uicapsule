import { useEffect, useState } from "react";

import { Button } from "../components/button";
import { LineChart } from "../components/charts";
import { Switch } from "../components/choice";
import { DataList } from "../components/data-list";
import { Frame, FrameHead } from "../components/frame";
import { Progress } from "../components/meter";
import { Activity } from "../components/runs";
import { Status } from "../components/status";
import { Swimlanes } from "../components/swimlanes";
import { Tabs } from "../components/tabs";
import { useToast } from "../components/toast";
import { clock, full } from "../lib/format";
import { NIGHTS, SYNC_LANES, SYNC_STEPS } from "./data";

const STAGES = [
  { label: "Extract", value: "extract" },
  { label: "Load", value: "load" },
  { label: "Publish", value: "publish" },
] as const;

type Stage = (typeof STAGES)[number]["value"];

const STAGE_FACTS = {
  extract: [
    { label: "Source", value: "orders-db, 41 tables" },
    { label: "Method", value: "snapshot, then CDC" },
    { label: "Last window", value: "02:00 to 02:07 UTC" },
  ],
  load: [
    { label: "Target", value: "core.customers" },
    { label: "Dedupe key", value: "customer_id, updated_at" },
    { label: "Last rows", value: full(46_903_517) },
  ],
  publish: [
    { label: "Models", value: "18 in marts.customer_360" },
    { label: "Dashboards", value: "Revenue, Churn" },
    { label: "Freshness SLA", value: "ready by 06:00 UTC" },
  ],
} satisfies Record<Stage, { label: string; value: string }[]>;

const stateAt = (index: number, cursor: number) => {
  if (index < cursor) {
    return "done" as const;
  }

  return index === cursor ? ("active" as const) : ("pending" as const);
};

/** Demo: the customer 360 refresh, stepping across five systems; Run refresh lights each step and draws the next connector. */
export const SyncScreen = () => {
  const push = useToast();
  const [cursor, setCursor] = useState<number>(SYNC_STEPS.length);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [stage, setStage] = useState<Stage>("load");
  const [nights, setNights] = useState(NIGHTS);
  const running = cursor < SYNC_STEPS.length;

  useEffect(() => {
    if (!running) {
      return;
    }

    const timer = window.setTimeout(() => {
      const total = elapsed + 47 + cursor * 13;
      setCursor(cursor + 1);
      setElapsed(total);

      if (cursor + 1 === SYNC_STEPS.length) {
        setNights((list) =>
          list.at(-1)?.label === "Tonight"
            ? list
            : [...list.slice(1), { label: "Tonight", value: 47_288_041 }],
        );
        push({
          detail: `${full(47_288_041)} rows in ${clock(total).slice(3)}`,
          status: "ok",
          title: "Customer 360 refreshed",
        });
      }
    }, 1100);

    return () => window.clearTimeout(timer);
  }, [cursor, elapsed, push, running]);

  const steps = SYNC_STEPS.map((step, index) => ({ ...step, state: stateAt(index, cursor) }));
  const active = SYNC_STEPS.at(cursor);

  let status = (
    <Status live status="ok">
      Refreshed 02:07
    </Status>
  );

  if (running) {
    status = <Status live status="running" />;
  } else if (paused) {
    status = (
      <Status live status="idle">
        Paused
      </Status>
    );
  }

  return (
    <Frame label="Customer 360 refresh">
      <FrameHead
        meta={paused ? "Schedule paused" : "Next run 02:00 UTC"}
        status={status}
        title="sync.customer_360_nightly"
      />
      <div className="hx-split hx-sync">
        <div className="hx-stack hx-gap-0">
          <div className="hx-body-pad hx-rule-row hx-activity-row">
            {active ? (
              <Activity elapsed={clock(elapsed).slice(3)} text={active.activity} />
            ) : (
              <span className="hx-code hx-ink-2">
                {full(nights.at(-1)?.value ?? 0)} rows landed in the last refresh.
              </span>
            )}
          </div>
          <Swimlanes
            label="Customer 360 refresh, orders-db to dashboards"
            lanes={SYNC_LANES}
            steps={steps}
          />
        </div>
        <div className="hx-stack hx-gap-0">
          <div className="hx-body-pad hx-rule-row">
            <div className="hx-row">
              <span className="hx-label-sm hx-ink-3">Rows per refresh</span>
              <span className="hx-code-sm hx-ink-3 hx-end">14 nights</span>
            </div>
            <LineChart
              data={nights}
              format={full}
              height={150}
              hint="Point at the line to read a night"
              label="Rows landed per nightly refresh, last 14 nights"
              unit=" rows"
            />
          </div>
          <Tabs items={[...STAGES]} label="Stages" onValueChange={setStage} value={stage}>
            <div className="hx-body-pad">
              <DataList items={STAGE_FACTS[stage]} />
            </div>
          </Tabs>
        </div>
      </div>
      <footer className="hx-foot">
        <Switch checked={paused} label="Pause schedule" onCheckedChange={setPaused} />
        {running ? (
          <div className="hx-foot-progress">
            <Progress
              done={cursor}
              label="Steps"
              live
              total={SYNC_STEPS.length}
              cells={SYNC_STEPS.length}
            />
          </div>
        ) : null}
        <span className="hx-row hx-end">
          <Button disabled={running} onClick={() => setStage("publish")} variant="ghost">
            View marts
          </Button>
          <Button
            onClick={() => {
              setElapsed(0);
              setCursor(0);
            }}
            pending={running}
            pendingLabel="Refreshing"
            variant="lamp"
          >
            Run refresh
          </Button>
        </span>
      </footer>
    </Frame>
  );
};
