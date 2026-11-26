import { useState } from "react";

import { Button } from "../components/button";
import { CodeWindow, JsonView, json } from "../components/code";
import { LogViewer } from "../components/log-viewer";
import type { LogLine } from "../components/log-viewer";
import { Group, Sheet, SpecCell } from "../components/page";
import { groupHead } from "./catalog";
import { SchemaDiff } from "../components/schema-diff";
import type { DriftRow } from "../components/schema-diff";
import { useInterval } from "../lib/motion";

type Fix = "alias" | "drop" | "cast" | "keep" | "add" | "skip";

const ORDERS_DRIFT: DriftRow<Fix>[] = [
  {
    after: { name: "total_cents", type: "bigint" },
    before: { name: "total", type: "numeric(10,2)" },
    id: "total",
    kind: "renamed",
    options: [
      { label: "Divide by 100 as total", value: "alias" },
      { label: "Keep cents", value: "keep" },
    ],
  },
  {
    after: { name: "channel", type: "text" },
    id: "channel",
    kind: "added",
    options: [
      { label: "Add column", value: "add" },
      { label: "Skip", value: "skip" },
    ],
  },
  {
    before: { name: "coupon", type: "text" },
    id: "coupon",
    kind: "dropped",
    options: [
      { label: "Write null", value: "drop" },
      { label: "Cast from promo_id", value: "cast" },
    ],
  },
];

const MODEL = `-- models/marts/fct_revenue_daily.sql
SELECT booked_at::date AS day,
       currency,
       SUM(amount_minor) / 100.0 AS revenue
FROM ledger.entries
WHERE booked_at >= now() - INTERVAL '90 days'
GROUP BY 1, 2`;

const MANIFEST = json.obj({
  attempt: json.num(2),
  dedupe: json.bool(false),
  finished_at: json.nil(),
  partitions: json.obj({
    committed: json.num(13),
    failed: json.arr(json.str("2026-11-24/14")),
    total: json.num(24),
  }),
  pipeline: json.str("ledger.entries_daily"),
  run_id: json.str("run_9b20f3"),
  worker: json.obj({
    id: json.str("wk-eu-07"),
    memory_gb: json.num(32),
    region: json.str("eu-central-1"),
  }),
});

const SEED: LogLine[] = [
  {
    id: 1,
    level: "info",
    message: "connected to warehouse wh-ledger-prod",
    source: "load",
    time: "14:20:01",
  },
  {
    id: 2,
    level: "debug",
    message: "using 8 threads, batch size 50,000",
    source: "load",
    time: "14:20:01",
  },
  {
    id: 3,
    level: "info",
    message: "copying events_2026_11_24 part 1 of 12",
    source: "copy",
    time: "14:20:03",
  },
  {
    id: 4,
    level: "warn",
    message: "column referrer truncated to 2,048 chars on 14 rows",
    source: "copy",
    time: "14:20:06",
  },
];

const MESSAGES = [
  { level: "info", message: "copying events_2026_11_24 part {n} of 12", source: "copy" },
  { level: "debug", message: "flushed 50,000 rows in 1.2s", source: "load" },
  { level: "info", message: "copying events_2026_11_24 part {n} of 12", source: "copy" },
  {
    level: "fail",
    message: "S3 GetObject timed out after 30s on part {n}, retrying",
    source: "copy",
  },
  { level: "info", message: "retry succeeded for part {n}", source: "copy" },
] as const;

export const Code = () => {
  const [lines, setLines] = useState<LogLine[]>(SEED);
  const [streaming, setStreaming] = useState(false);

  useInterval(
    () => {
      setLines((current) => {
        const next = MESSAGES[current.length % MESSAGES.length] ?? MESSAGES[0];
        const id = current.length + 1;
        const second = String(6 + id * 2).padStart(2, "0");

        return [
          ...current,
          {
            id,
            level: next.level,
            message: next.message.replace("{n}", String(Math.min(12, Math.ceil(id / 3)))),
            source: next.source,
            time: `14:20:${Number(second) > 59 ? "59" : second}`,
          },
        ];
      });
    },
    700,
    streaming && lines.length < 30,
  );

  const [fixes, setFixes] = useState<Record<string, Fix>>({
    channel: "add",
    coupon: "drop",
    total: "alias",
  });

  return (
    <Group {...groupHead("code")}>
      <Sheet>
        <SpecCell
          edge
          name="Code window"
          note="A whole file on the recessed well with its line numbers. Keywords get an ink underline and quoted strings the readable amber."
          path="code/code-window"
        >
          <CodeWindow code={MODEL} meta="sql · 7 lines" name="fct_revenue_daily.sql" />
        </SpecCell>
        <SpecCell
          name="JSON view"
          note="A payload you can fold one level at a time. Keys sit back in ink-2; values keep exactly what was stored."
          path="code/json-view"
        >
          <JsonView name="run" value={MANIFEST} />
        </SpecCell>
        <SpecCell
          name="Schema diff"
          note="Two versions of a table's columns, one row per change. Added is green, dropped is red and struck, anything reshaped is orange; each row picks its own fix."
          path="code/schema-diff"
          wide
        >
          <div className="hx-frame">
            <SchemaDiff
              choices={fixes}
              from="v12"
              label="shop.orders, v12 to v13"
              onChoose={(id, value) => setFixes({ ...fixes, [id]: value })}
              rows={ORDERS_DRIFT}
              to="v13"
            />
          </div>
        </SpecCell>
        <SpecCell
          name="Log viewer"
          note="A run's output arriving line by line. Severity lives in the level column and the red band; message text stays plain ink."
          path="code/log-viewer"
          wide
        >
          <LogViewer
            height={220}
            lines={lines}
            name="run_e4a017"
            streaming={streaming && lines.length < 30}
            toolbar
          />
          <div className="hx-row">
            <Button onClick={() => setStreaming(!streaming)} size="sm">
              {streaming ? "Stop stream" : "Stream lines"}
            </Button>
            <Button
              onClick={() => {
                setLines(SEED);
                setStreaming(false);
              }}
              size="sm"
              variant="ghost"
            >
              Reset
            </Button>
          </div>
        </SpecCell>
      </Sheet>
    </Group>
  );
};
