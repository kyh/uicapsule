import { useState } from "react";

import { BarBlocks, LineChart, StemChart } from "../components/charts";
import { Segmented } from "../components/choice";
import { Group, Sheet, SpecCell } from "../components/page";
import { groupHead } from "./catalog";
import { Swimlanes } from "../components/swimlanes";
import { full } from "../lib/format";

const JOBS = {
  month: [
    { label: "Jul", value: 18_204 },
    { label: "Aug", value: 19_877 },
    { label: "Sep", value: 22_410 },
    { label: "Oct", value: 25_096 },
    { label: "Nov", value: 23_311 },
  ],
  week: [
    { label: "Mon", value: 1163 },
    { label: "Tue", value: 1388 },
    { label: "Wed", value: 1341 },
    { label: "Thu", value: 1472 },
    { label: "Fri", value: 1290 },
    { label: "Sat", value: 611 },
    { label: "Sun", value: 588 },
  ],
} as const;

const LATENCY = [
  { label: "10:00", value: 182 },
  { label: "10:30", value: 176 },
  { label: "11:00", value: 204 },
  { label: "11:30", value: 251 },
  { label: "12:00", value: 233 },
  { label: "12:30", value: 198 },
  { label: "13:00", value: 214 },
  { label: "13:30", value: 302 },
  { label: "14:00", value: 266 },
  { label: "14:30", value: 221 },
];

export const Charts = () => {
  const [span, setSpan] = useState<"week" | "month">("week");

  return (
    <Group {...groupHead("charts")}>
      <Sheet>
        <SpecCell
          edge
          name="Stem chart"
          note="A handful of periods where each value matters on its own, so each one is printed. Only one chart per view gets amber heads."
          path="charts/stem-chart"
        >
          <Segmented
            label="Span"
            onValueChange={setSpan}
            options={["week", "month"] as const}
            value={span}
          />
          <StemChart
            data={[...JOBS[span]]}
            format={full}
            key={span}
            label={`Jobs run per ${span}`}
          />
        </SpecCell>
        <SpecCell
          name="Bar blocks"
          note="One total cut into up to six slices, each as wide as its share. The slice you care about goes first and takes the wash."
          path="charts/bar-blocks"
        >
          <BarBlocks
            data={[
              { label: "Loaded", value: 1_187_530 },
              { label: "Skipped", value: 312_904 },
              { label: "Rejected", tone: "fail", value: 2410 },
            ]}
            label="Rows by outcome in the latest contacts load"
          />
        </SpecCell>
        <SpecCell
          edge
          name="Line chart"
          note="Something that moves over time, drawn as an ink line on a pale amber field. Hover to read any point."
          path="charts/chart"
        >
          <LineChart
            data={LATENCY}
            format={(value) => `${value}ms`}
            hint="Point at the line to read a half hour"
            label="p95 query latency, today"
          />
        </SpecCell>
        <SpecCell
          name="Swimlanes"
          note="Columns are places, rows are order. A step spans every system it touches, and the one that is working is lit."
          path="charts/swimlanes"
        >
          <Swimlanes
            label="Event export, app to warehouse"
            lanes={[
              { id: "app", label: "app" },
              { id: "queue", label: "queue" },
              { id: "wh", label: "warehouse" },
            ]}
            steps={[
              { from: "app", label: "Emit", meta: "4.1K/s", state: "done" },
              { from: "app", label: "Buffer", meta: "p99 80ms", state: "done", to: "queue" },
              { from: "queue", label: "Load", meta: "every 5m", state: "active", to: "wh" },
              { from: "wh", label: "Test", meta: "38 checks", state: "pending" },
            ]}
          />
        </SpecCell>
      </Sheet>
    </Group>
  );
};
