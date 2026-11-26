import { X } from "lucide-react";
import { useState } from "react";

import { Button } from "../components/button";
import { Segmented } from "../components/choice";
import { Icon } from "../components/icon";
import { Group, Sheet, SpecCell } from "../components/page";
import { groupHead } from "./catalog";
import { Select } from "../components/select";
import { Status, statusRank } from "../components/status";
import type { RunStatus } from "../components/status";
import { Table } from "../components/table";
import { Tag } from "../components/tag";
import { full } from "../lib/format";

interface Model {
  name: string;
  status: RunStatus;
  rows: number;
  ms: number;
  layer: string;
}

const MODELS: Model[] = [
  { layer: "staging", ms: 1840, name: "stg_orders", rows: 2_204_118, status: "ok" },
  { layer: "staging", ms: 920, name: "stg_refunds", rows: 48_220, status: "ok" },
  { layer: "marts", ms: 14_210, name: "fct_revenue_daily", rows: 3650, status: "fail" },
  { layer: "marts", ms: 6110, name: "dim_customers", rows: 412_908, status: "warn" },
  { layer: "intermediate", ms: 3320, name: "int_order_lines", rows: 7_880_214, status: "running" },
  { layer: "marts", ms: 0, name: "fct_churn_weekly", rows: 0, status: "queued" },
];

const LAYERS = [
  { label: "Any layer", value: "any" },
  { label: "staging", value: "staging" },
  { label: "intermediate", value: "intermediate" },
  { label: "marts", value: "marts" },
] as const;

const STATES = ["All", "Failing", "Passing"] as const;

export const Data = () => {
  const [selected, setSelected] = useState<string | null>("fct_revenue_daily");
  const [layer, setLayer] = useState<(typeof LAYERS)[number]["value"]>("any");
  const [state, setState] = useState<(typeof STATES)[number]>("All");
  const [owner, setOwner] = useState(true);

  const rows = MODELS.filter(
    (model) =>
      (layer === "any" || model.layer === layer) &&
      (state === "All" ||
        (state === "Failing"
          ? statusRank[model.status] >= statusRank.waiting
          : model.status === "ok")),
  );

  return (
    <Group {...groupHead("data")}>
      <Sheet>
        <SpecCell
          name="Filter bar and Table"
          note="The filters share one ruled row above the rows they narrow. Broken things sort to the top, identifiers stay mono, and the row you picked is washed."
          path="data/table · data/filter-bar"
          wide
        >
          <div className="hx-frame">
            <div className="hx-head">
              <span className="hx-head-title hx-code">dbt run 2026-11-24</span>
              <span className="hx-head-meta hx-code-sm">{rows.length} of 6 models</span>
            </div>
            <div className="hx-toolbar">
              <div className="hx-toolbar-select">
                <Select
                  hideLabel
                  label="Layer"
                  onValueChange={setLayer}
                  options={[...LAYERS]}
                  size="sm"
                  value={layer}
                />
              </div>
              <Segmented label="State" onValueChange={setState} options={STATES} value={state} />
              {owner ? (
                <span className="hx-tag hx-tag-removable">
                  Owner: finance-data
                  <button
                    aria-label="Remove owner filter"
                    className="hx-sort hx-tag-x"
                    onClick={() => {
                      setOwner(false);
                    }}
                    type="button"
                  >
                    <Icon icon={X} size={14} />
                  </button>
                </span>
              ) : (
                <Button
                  onClick={() => {
                    setOwner(true);
                  }}
                  size="sm"
                  variant="ghost"
                >
                  Add filter
                </Button>
              )}
              <Button
                className="hx-end"
                onClick={() => {
                  setLayer("any");
                  setState("All");
                  setOwner(false);
                }}
                size="sm"
                variant="ghost"
              >
                Clear
              </Button>
            </div>
            <Table
              columns={[
                {
                  render: (model) => <Status status={model.status} />,
                  key: "status",
                  label: "Status",
                  sort: (model) => statusRank[model.status],
                },
                {
                  render: (model) => model.name,
                  key: "name",
                  label: "Model",
                  sort: (model) => model.name,
                },
                { render: (model) => <Tag>{model.layer}</Tag>, key: "layer", label: "Layer" },
                {
                  render: (model) => full(model.rows),
                  key: "rows",
                  label: "Rows",
                  num: true,
                  sort: (model) => model.rows,
                },
                {
                  render: (model) => (model.ms ? `${(model.ms / 1000).toFixed(1)}s` : "-"),
                  key: "ms",
                  label: "Took",
                  num: true,
                  sort: (model) => model.ms,
                },
              ]}
              initialSort={{ desc: true, key: "status" }}
              label="Models"
              onSelect={setSelected}
              rowKey={(model) => model.name}
              rows={rows}
              selected={selected}
            />
          </div>
        </SpecCell>
      </Sheet>
    </Group>
  );
};
