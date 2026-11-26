import { useState } from "react";

import { DataList } from "../components/data-list";
import { Group, Sheet, SpecCell } from "../components/page";
import { groupHead } from "./catalog";
import { Breadcrumb, Pagination, Tabs } from "../components/tabs";

const TABS = [
  { count: 74, label: "Runs", value: "runs" },
  { count: 12, label: "Partitions", value: "partitions" },
  { label: "Schedule", value: "schedule" },
  { label: "Lineage", value: "lineage" },
] as const;

const PANELS = {
  lineage: "Reads raw.events and crm.accounts. Feeds 6 marts and 2 dashboards.",
  partitions: "12 partitions written today, the newest 2026-11-24/14 at 03:18 UTC.",
  runs: "74 runs today: 61 succeeded, 2 failed, 4 running, 7 queued.",
  schedule: "Every hour at minute 5, UTC. Paused during the Dec 31 freeze.",
} as const;

const STAGES = [
  { label: "Ingest", value: "ingest" },
  { label: "Transform", value: "transform" },
  { label: "Load", value: "load" },
] as const;

const STAGE_FACTS = {
  ingest: [
    { label: "Source", value: "s3://larch-raw/events" },
    { label: "Files", value: "1,912 · 38.4 GB" },
  ],
  load: [
    { label: "Target", value: "analytics.events" },
    { label: "Mode", value: "merge on event_id" },
  ],
  transform: [
    { label: "Models", value: "14 dbt models" },
    { label: "Tests", value: "212 passed, 0 failed" },
  ],
} as const;

const PATH = ["larch", "prod", "pipelines", "events.clickstream_compact"];

export const Navigation = () => {
  const [tab, setTab] = useState<(typeof TABS)[number]["value"]>("runs");
  const [stage, setStage] = useState<(typeof STAGES)[number]["value"]>("transform");
  const [depth, setDepth] = useState(PATH.length);
  const [page, setPage] = useState(3);

  return (
    <Group {...groupHead("navigation")}>
      <Sheet>
        <SpecCell
          edge
          name="Tabs"
          note="Peer views of a single object in no particular order. Arrow keys move along the row."
          path="navigation/tabs"
        >
          <div className="hx-frame">
            <Tabs items={[...TABS]} label="Pipeline" onValueChange={setTab} value={tab}>
              <p className="hx-body-sm hx-pad-3">{PANELS[tab]}</p>
            </Tabs>
          </div>
        </SpecCell>
        <SpecCell
          name="Numbered tabs"
          note="Stages that happen in sequence, each carrying its index. A page gets one row of these and no more."
          path="navigation/numbered-tabs"
        >
          <div className="hx-frame">
            <Tabs
              items={[...STAGES]}
              label="Stages"
              numbered
              onValueChange={setStage}
              value={stage}
            >
              <div className="hx-tab-panel">
                <DataList items={[...STAGE_FACTS[stage]]} />
              </div>
            </Tabs>
          </div>
        </SpecCell>
        <SpecCell
          edge
          name="Breadcrumb"
          note="The path down to this page, each segment spelled as stored. The last is where you are."
          path="navigation/breadcrumb"
        >
          <Breadcrumb onNavigate={(index) => setDepth(index + 1)} path={PATH.slice(0, depth)} />
          {depth < PATH.length ? (
            <button
              className="hx-sort hx-code-sm hx-ink-3"
              onClick={() => setDepth(PATH.length)}
              type="button"
            >
              Back to {PATH.at(-1)}
            </button>
          ) : null}
        </SpecCell>
        <SpecCell
          name="Pagination"
          note="Steps through a long list. The page you are on gets the wash and nothing louder."
          path="navigation/pagination"
        >
          <Pagination onPageChange={setPage} page={page} pages={12} />
          <span className="hx-code-sm hx-ink-3">
            Runs {(page - 1) * 50 + 1} to {Math.min(page * 50, 588)} of 588
          </span>
        </SpecCell>
      </Sheet>
    </Group>
  );
};
