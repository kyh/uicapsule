import { useState } from "react";

import { Checkbox, RadioGroup, Segmented, Slider, Switch } from "../components/choice";
import { Group, Sheet, SpecCell } from "../components/page";
import { groupHead } from "./catalog";

const TABLES = ["orders", "order_items", "refunds"] as const;

const MODES = [
  { description: "Rewrite each partition from source.", label: "Full refresh", value: "full" },
  {
    description: "Only rows changed since the last run.",
    label: "Incremental",
    value: "incremental",
  },
  {
    description: "Keep every version with valid_from and valid_to.",
    label: "Snapshot history",
    value: "scd",
  },
] as const;

const RANGES = ["1h", "24h", "7d", "30d"] as const;

export const Selection = () => {
  const [picked, setPicked] = useState<string[]>(["orders", "refunds"]);
  const [mode, setMode] = useState<(typeof MODES)[number]["value"]>("incremental");
  const [alerts, setAlerts] = useState(true);
  const [dryRun, setDryRun] = useState(false);
  const [workers, setWorkers] = useState(24);
  const [range, setRange] = useState<(typeof RANGES)[number]>("24h");
  const all = picked.length === TABLES.length;

  return (
    <Group {...groupHead("selection")}>
      <Sheet>
        <SpecCell
          edge
          name="Checkbox"
          note="A ticked box fills amber under an ink tick. The parent shows a bar when only some are ticked."
          path="selection/checkbox"
        >
          <Checkbox
            checked={all}
            indeterminate={!all && picked.length > 0}
            label="Sync all tables"
            onCheckedChange={(checked) => setPicked(checked ? [...TABLES] : [])}
          />
          <div className="hx-stack hx-indent">
            {TABLES.map((table) => (
              <Checkbox
                checked={picked.includes(table)}
                key={table}
                label={<code>{table}</code>}
                onCheckedChange={(checked) =>
                  setPicked(checked ? [...picked, table] : picked.filter((item) => item !== table))
                }
              />
            ))}
          </div>
        </SpecCell>
        <SpecCell
          name="Radio group"
          note="Pick exactly one. The radio is a square, and so is the dot inside it."
          path="selection/radio-group"
        >
          <RadioGroup label="Load mode" onValueChange={setMode} options={[...MODES]} value={mode} />
        </SpecCell>
        <SpecCell
          edge
          name="Switch"
          note="Takes effect the moment it flips, so no Save button follows."
          path="selection/switch"
        >
          <Switch
            checked={alerts}
            description="Page the owner after two failed retries."
            label="Failure alerts"
            onCheckedChange={setAlerts}
          />
          <Switch
            checked={dryRun}
            description="Plan the run, write nothing."
            label="Dry run"
            onCheckedChange={setDryRun}
          />
        </SpecCell>
        <SpecCell
          name="Slider"
          note="Sets a number inside known bounds and prints it in mono. Arrow keys nudge it one step."
          path="selection/slider"
        >
          <Slider
            format={(value) => `${value} workers`}
            label="Max workers"
            max={64}
            min={4}
            onValueChange={setWorkers}
            step={4}
            value={workers}
          />
          <p className="hx-caption hx-ink-3">
            About {Math.round(workers * 0.25 * 10) / 10} credits an hour at full load.
          </p>
        </SpecCell>
        <SpecCell
          name="Segmented control"
          note="Flips one dataset between a handful of views. The view on screen takes the amber fill."
          path="selection/segmented-control"
          wide
        >
          <div className="hx-row-wrap">
            <Segmented label="Window" onValueChange={setRange} options={RANGES} value={range} />
            <span className="hx-code-sm hx-ink-3">Showing the last {range}</span>
          </div>
        </SpecCell>
      </Sheet>
    </Group>
  );
};
