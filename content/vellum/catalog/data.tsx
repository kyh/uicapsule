"use client";

import { ArrowDown } from "lucide-react";
import { useState } from "react";

import { Panel, Shell } from "../components/card";
import { LineChart } from "../components/chart";
import { CodeBlock } from "../components/code-block";
import { StatusStrip } from "../components/status-strip";
import { Status, statusRank } from "../components/status";
import type { StatusKind } from "../components/status";
import { Specimen } from "../chrome";

const RUNS: readonly { id: string; task: string; took: string; status: StatusKind }[] = [
  { id: "run_8f2c1a", status: "ok", task: "Answer a docs question", took: "4.2s" },
  { id: "run_8f29d3", status: "fail", task: "Update CRM record", took: "11.8s" },
  { id: "run_8f27b0", status: "waiting", task: "Bulk reply, 38 tickets", took: "6.1s" },
  { id: "run_8f2410", status: "ok", task: "Nightly router grades", took: "2m 14s" },
];

const DAYS = Array.from({ length: 14 }, (_, index) => `${index + 1} Nov`);
const LATENCY = [2.4, 2.6, 2.3, 2.9, 3.4, 3.1, 2.2, 2.1, 2.5, 2.8, 2.4, 2, 1.9, 2.1];

const TOOL_OUTPUT = `{
  "tool": "update_crm",
  "ticket": 4471,
  "fields": { "plan": "team", "seats": 12 },
  "status": "timeout",
  "after_ms": 10000,
  "retry_at": "2026-11-14T09:17:00Z"
}`;

/** Table, chart and code block. */
export const Data = () => {
  const [byStatus, setByStatus] = useState(true);

  const rows = byStatus
    ? RUNS.toSorted((a, b) => statusRank[b.status] - statusRank[a.status])
    : RUNS;

  return (
    <>
      <Specimen
        name="Table"
        note="sortable status column, regressions on top; hidden run IDs on phones"
        span={2}
      >
        <Shell>
          <Panel>
            <div className="v-scroll-x">
              <table className="v-table">
                <thead>
                  <tr>
                    <th scope="col">Task</th>
                    <th className="v-col-wide" scope="col">
                      Run
                    </th>
                    <th className="v-num" scope="col">
                      Took
                    </th>
                    <th aria-sort={byStatus ? "descending" : "none"} scope="col">
                      <button
                        className="v-fold-trigger"
                        data-size="sm"
                        onClick={() => setByStatus(!byStatus)}
                        type="button"
                      >
                        Status
                        {byStatus ? <ArrowDown aria-hidden /> : null}
                        <span className="v-sr">{byStatus ? ", failures first" : ""}</span>
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((run) => (
                    <tr key={run.id}>
                      <td>{run.task}</td>
                      <td className="v-code-sm v-t2 v-col-wide">{run.id}</td>
                      <td className="v-num">{run.took}</td>
                      <td>
                        <Status status={run.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </Shell>
      </Specimen>
      <Specimen
        name="Chart"
        note="one ink series, a hairline grid; hover or arrow through the days"
      >
        <div className="v-fill" data-wide="">
          <LineChart
            area
            format={(value) => `${value.toFixed(1)}s`}
            label="Median answer time a day, 1 to 14 November"
            labels={DAYS}
            series={[{ name: "Median answer", values: LATENCY }]}
            ticks={[0, 2, 4]}
          />
        </div>
      </Specimen>
      <Specimen name="Status strip" note="the last runs in ink; only a failure takes colour">
        <div className="v-fill v-stack-sm">
          <span className="v-label">Docs agent deploys</span>
          <StatusStrip
            from="2 Oct"
            label="Docs agent deploys"
            to="Deploying now"
            runs={Array.from({ length: 24 }, (_, index) => {
              if (index === 23) {
                return "running";
              }

              return index === 6 || index === 17 ? "fail" : "ok";
            })}
          />
        </div>
      </Specimen>
      <Specimen name="Code block" note="12px mono on paper, with a copy button">
        <CodeBlock code={TOOL_OUTPUT} title="update_crm output" />
      </Specimen>
    </>
  );
};
