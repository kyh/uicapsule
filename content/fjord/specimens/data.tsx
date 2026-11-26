import { useState } from "react";
import { X } from "lucide-react";

import { Badge, CodeTag } from "../components/badge";
import { Button } from "../components/button";
import { BarChart, LineChart } from "../components/charts";
import { CodeBlock, JsonView, LogViewer } from "../components/code";
import type { CodeLine, LogLine } from "../components/code";
import { Timeline } from "../components/data";
import { EmptyState } from "../components/feedback";
import { SearchInput } from "../components/field";
import { Icon } from "../components/icon";
import { STATUS_RANK, Status } from "../components/status";
import type { StatusValue } from "../components/status";
import { formatMs } from "../lib/format";
import { Category, Specimen } from "./specimen";

export const DATA_NAMES = ["Filter bar", "Table", "Timeline"] as const;
export const CODE_NAMES = ["Log viewer", "Code block", "JSON view"] as const;
export const CHART_NAMES = ["Bar chart", "Line chart"] as const;

interface CallRow {
  id: string;
  tool: string;
  agent: string;
  status: StatusValue;
  word?: string;
  ms: number;
}

const CALLS: CallRow[] = [
  { agent: "triage", id: "c1", ms: 245, status: "ok", tool: "search_issues" },
  { agent: "patchwright", id: "c2", ms: 1210, status: "warn", tool: "run_tests", word: "Retried" },
  { agent: "warden", id: "c3", ms: 388, status: "ok", tool: "audit_lockfile" },
  { agent: "scribe", id: "c4", ms: 1940, status: "fail", tool: "post_review" },
  { agent: "patchwright", id: "c5", ms: 0, status: "waiting", tool: "merge_pr" },
  { agent: "triage", id: "c6", ms: 12, status: "warn", tool: "label_issue", word: "Rate limited" },
  { agent: "scribe", id: "c7", ms: 642, status: "running", tool: "draft_changelog" },
];

const AGENTS = ["patchwright", "triage", "scribe", "warden"] as const;

export const Data = () => {
  const [query, setQuery] = useState("");
  const [agents, setAgents] = useState<string[]>([]);
  const [troubleOnly, setTroubleOnly] = useState(false);
  const [order, setOrder] = useState<"status" | "took">("status");
  const [selected, setSelected] = useState<string | null>("c4");

  const toggleAgent = (agent: string) =>
    setAgents((current) =>
      current.includes(agent) ? current.filter((item) => item !== agent) : [...current, agent],
    );

  const rows = CALLS.filter(
    (row) =>
      row.tool.includes(query.trim()) &&
      (agents.length === 0 || agents.includes(row.agent)) &&
      (!troubleOnly || STATUS_RANK[row.status] >= STATUS_RANK.warn),
  ).toSorted((a, b) =>
    order === "status" ? STATUS_RANK[b.status] - STATUS_RANK[a.status] : b.ms - a.ms,
  );

  const filtered = query !== "" || agents.length > 0 || troubleOnly;

  return (
    <Category
      id="data"
      lede="Lists of calls and the steps of one piece of work. Every row is one height, trouble sorts to the top, and the digits line up without mono."
      title="Data"
    >
      <Specimen
        description="A search box and a chip per agent. Press chips to narrow the table below; Clear turns up once anything is narrowed."
        name="Filter bar"
        wide
      >
        <div className="fj-filterbar">
          <div className="fj-grow">
            <SearchInput
              label="Search tools"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tools"
              value={query}
            />
          </div>
          <div className="fj-hstack" data-gap="4" data-wrap="">
            {AGENTS.map((agent) => (
              <button
                aria-pressed={agents.includes(agent)}
                className="fj-chip"
                key={agent}
                onClick={() => toggleAgent(agent)}
                type="button"
              >
                {agent}
              </button>
            ))}
            <button
              aria-pressed={troubleOnly}
              className="fj-chip"
              onClick={() => setTroubleOnly((value) => !value)}
              type="button"
            >
              Trouble only
            </button>
            {filtered ? (
              <Button
                onClick={() => {
                  setQuery("");
                  setAgents([]);
                  setTroubleOnly(false);
                }}
                size="xs"
                variant="ghost"
              >
                <Icon icon={X} size={12} />
                Clear
              </Button>
            ) : null}
          </div>
        </div>
      </Specimen>
      <Specimen
        bare
        description="Pick a row and it takes the cold wash without gaining an edge. Sort by how bad the outcome was or by how long the call took."
        name="Table"
        wide
      >
        <div className="fj-card">
          {rows.length === 0 ? (
            <EmptyState title="No calls match">
              Nothing matches <CodeTag>{query || "these filters"}</CodeTag>.
            </EmptyState>
          ) : (
            <div className="fj-scroll-x">
              <table className="fj-table">
                <caption className="fj-sr">Tool calls, select a row with its button</caption>
                <thead>
                  <tr>
                    <th aria-sort={order === "status" ? "descending" : "none"} scope="col">
                      <button className="fj-sort" onClick={() => setOrder("status")} type="button">
                        Result
                      </button>
                    </th>
                    <th scope="col">Tool</th>
                    <th scope="col">Agent</th>
                    <th
                      aria-sort={order === "took" ? "descending" : "none"}
                      data-num=""
                      scope="col"
                    >
                      <button className="fj-sort" onClick={() => setOrder("took")} type="button">
                        Took
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr aria-selected={row.id === selected} key={row.id}>
                      <td>
                        <Status plain status={row.status}>
                          {row.word}
                        </Status>
                      </td>
                      <th scope="row">
                        <button
                          className="fj-row-select"
                          onClick={() => setSelected(row.id)}
                          type="button"
                        >
                          {row.tool}
                        </button>
                      </th>
                      <td>
                        <Badge kind="agent">{row.agent}</Badge>
                      </td>
                      <td data-num="">
                        {row.status === "waiting" ? (
                          <span className="fj-c-3">None yet</span>
                        ) : (
                          formatMs(row.ms)
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Specimen>
      <Specimen
        bare
        description="Stages of one piece of work, one row each. The rail glyph is where it stands, and the far end gives the time or what is left."
        name="Timeline"
      >
        <div className="fj-card">
          <Timeline
            label="Issue 2834 from report to review"
            steps={[
              {
                description: "Reported by Tomasz Wierzba from the kiosk fleet",
                end: <span className="fj-c-2 fj-data">09:12</span>,
                id: "a",
                status: "ok",
                title: "Filed",
              },
              {
                description: "triage labelled it checkout and bug",
                end: <span className="fj-c-2 fj-data">09:13</span>,
                id: "b",
                status: "ok",
                title: "Sorted",
              },
              {
                description: "patchwright wrote 3 hunks in 2 files",
                end: <span className="fj-c-2 fj-data">09:31</span>,
                id: "c",
                status: "ok",
                title: "Patched",
              },
              {
                description: "Maren Holt has signed, Idris Okafor has not",
                end: "1 of 2",
                id: "d",
                status: "running",
                title: "Review",
              },
            ]}
          />
        </div>
      </Specimen>
    </Category>
  );
};

const PATCH: CodeLine[] = [
  [["com", "// src/checkout/cart.ts"]],
  [
    ["kw", "export async function "],
    ["fn", "totalWithCoupon"],
    ["txt", "(cart: Cart, code: "],
    ["kw", "string"],
    ["txt", ") {"],
  ],
  [
    ["txt", "  "],
    ["kw", "await "],
    ["fn", "applyCoupon"],
    ["txt", "(cart, code);"],
  ],
  [
    ["txt", "  "],
    ["kw", "return "],
    ["txt", "cart.total ?? "],
    ["num", "0"],
    ["txt", ";"],
  ],
  [["txt", "}"]],
];

const SHELL: CodeLine[] = [
  [
    ["prompt", "$ "],
    ["txt", "kestrel agents attach "],
    ["str", "storefront"],
  ],
  [
    ["prompt", "$ "],
    ["txt", "kestrel runs tail --agent "],
    ["str", "patchwright"],
  ],
];

const LOG_START: LogLine[] = [
  {
    level: "info",
    message: "kr-2817-3 took slot 2 for patchwright",
    source: "scheduler",
    time: "09:41:03.118",
  },
  {
    level: "info",
    message: "index_repo served from cache, 1284 paths",
    source: "indexer",
    time: "09:41:03.522",
  },
  {
    level: "warn",
    message: "price service slow to answer, 812ms",
    source: "unit",
    time: "09:41:06.380",
  },
  {
    level: "fail",
    message: "unit: 57 passed, 1 failed in coupon.test.ts",
    source: "unit",
    time: "09:41:06.884",
  },
  {
    level: "info",
    message: "Idris Okafor retried unit",
    source: "console",
    time: "09:41:08.121",
  },
];

const LOG_STREAM: LogLine[] = [
  { level: "info", message: "unit: 58 passed", source: "unit", time: "09:41:09.480" },
  {
    level: "info",
    message: "sign_commits 3 commits with the agent key",
    source: "patchwright",
    time: "09:41:09.661",
  },
  {
    level: "info",
    message: "pushed agent/coupon-race, #2817 updated",
    source: "patchwright",
    time: "09:41:10.042",
  },
  {
    level: "warn",
    message: "forge API rate limit at 80%, slowing comments",
    source: "scribe",
    time: "09:41:10.377",
  },
  { level: "info", message: "merge held for a person", source: "gate", time: "09:41:10.512" },
  {
    level: "info",
    message: "warden finished the lockfile scan, nothing new",
    source: "warden",
    time: "09:41:11.930",
  },
];

export const Code = () => (
  <Category
    id="code"
    lede="Source, payloads and log output. Highlighting is ink at a few strengths only, so no token in a snippet passes for a kind badge or a failure."
    title="Code"
  >
    <Specimen
      bare
      description="Keywords a weight heavier, strings and comments lighter ink, calls with a faint underline. The copy button takes the whole block."
      name="Code block"
      wide
    >
      <CodeBlock lines={PATCH} title="cart.ts" />
      <CodeBlock lines={SHELL} numbered={false} title="Terminal" />
    </Specimen>
    <Specimen
      description="A tool input as a tree. A shut branch says how many entries it holds, and opening one does not animate."
      name="JSON view"
    >
      <JsonView
        label="Tool call input"
        value={{
          input: { checks: ["lint", "typecheck", "unit"], pr: 2817, strategy: "rebase" },
          tool: "merge",
          requested_by: "patchwright",
          timeout_ms: 30_000,
        }}
      />
    </Specimen>
    <Specimen
      bare
      description="Streams new lines in and keeps the newest in view. The level is a word; warn and fail lines take amber and red."
      name="Log viewer"
    >
      <LogViewer
        header={
          <span className="fj-hstack">
            <span className="fj-t-label">Logs</span>
            <Status status="running">Live</Status>
          </span>
        }
        initial={LOG_START}
        stream={LOG_STREAM}
      />
    </Specimen>
  </Category>
);

const DAILY = [
  { fail: 2, label: "Mon", ok: 410, warn: 9 },
  { fail: 0, label: "Tue", ok: 452, warn: 6 },
  { fail: 5, label: "Wed", ok: 498, warn: 14 },
  { fail: 1, label: "Thu", ok: 470, warn: 8 },
  { fail: 3, label: "Fri", ok: 389, warn: 11 },
  { fail: 0, label: "Sat", ok: 96, warn: 1 },
  { fail: 1, label: "Sun", ok: 122, warn: 2 },
];

export const Charts = () => (
  <Category
    id="charts"
    lede="A chart takes the hue of what it counts, adds amber and red only for trouble, and ships its numbers as a table for screen readers."
    title="Charts"
  >
    <Specimen
      description="Calls per day, with degraded and failed calls stacked on top. Hovering a day shows its counts."
      name="Bar chart"
    >
      <BarChart data={DAILY} label="Tool calls per day for patchwright" tickEvery={1} unit="done" />
    </Specimen>
    <Specimen
      description="This week as a solid line, last week dashed, and the 4.5s budget as a dotted amber rule."
      name="Line chart"
    >
      <LineChart
        compare={[3.9, 4.1, 3.8, 4.4, 4.2, 4, 4.3, 4.1]}
        format={(value) => `${value.toFixed(1)}s`}
        label="p95 reply time, triage"
        labels={["Mon", "Wed", "Fri", "Sun"]}
        max={5}
        min={2.5}
        threshold={4.5}
        values={[3.1, 3.3, 3.2, 3.6, 3.4, 3.9, 4.1, 3.8]}
      />
    </Specimen>
  </Category>
);
