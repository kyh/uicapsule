import { useState } from "react";

import { DataList, Facts } from "../components/data-list";
import { Group, Sheet, SpecCell } from "../components/page";
import { groupHead } from "./catalog";
import { StatusMark } from "../components/status";
import { StatusStrip, StripCell } from "../components/status-strip";
import { Avatar, AvatarStack, Kbd, Tag } from "../components/tag";

const CELLS = [
  { label: "Failed", status: "fail", value: 3 },
  { label: "Running", status: "running", value: 12 },
  { label: "Queued", status: "queued", value: 27 },
] as const;

export const Display = () => {
  const [cell, setCell] = useState<string>("Failed");

  return (
    <Group {...groupHead("display")}>
      <Sheet>
        <SpecCell
          name="Status strip"
          note="The few figures someone checks before anything else, on one ruled row. A cell that narrows the list below is a button, and only one can be pressed."
          path="display/status-strip"
          wide
        >
          <StatusStrip label="Cluster lakehouse-eu">
            {CELLS.map((item) => (
              <StripCell
                key={item.label}
                label={item.label}
                lead={<StatusMark status={item.status} />}
                onSelect={() => setCell(item.label)}
                selected={cell === item.label}
                value={item.value}
              />
            ))}
            <StripCell label="Workers" unit="/ 64" value="48" />
            <StripCell label="p95 latency" unit="ms" value="212" />
            <StripCell label="Region" value="eu-central-1" />
          </StatusStrip>
          <p className="hx-caption hx-ink-2">
            Filtering the list below by <span className="hx-label-sm">{cell}</span>.
          </p>
        </SpecCell>
        <SpecCell
          edge
          name="Tag"
          note="Something that does not change during a run: its environment, engine, version. Live state belongs to Status."
          path="display/tag"
        >
          <div className="hx-row-wrap">
            <Tag>Prod</Tag>
            <Tag>Postgres 16</Tag>
            <Tag tone="outline">eu-west-2</Tag>
            <Tag tone="wash">Pinned</Tag>
            <Tag tone="ok">Verified</Tag>
            <Tag tone="warn">Deprecated</Tag>
            <Tag tone="fail">Breaking</Tag>
          </div>
        </SpecCell>
        <SpecCell
          name="Kbd"
          note="The key cap a person presses, drawn the way it is printed."
          path="display/kbd"
        >
          <div className="hx-row-wrap hx-body-sm hx-ink-2">
            <span className="hx-row hx-gap-1">
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </span>
            Search
            <span className="hx-row hx-gap-1 hx-kbd-gap">
              <Kbd>R</Kbd>
            </span>
            Retry
            <span className="hx-row hx-gap-1 hx-kbd-gap">
              <Kbd>Shift</Kbd>
              <Kbd>N</Kbd>
            </span>
            Next failure
          </div>
        </SpecCell>
        <SpecCell
          edge
          name="Avatar"
          note="Initials on a square of the well. A stack shares one rule between neighbours."
          path="display/avatar"
        >
          <div className="hx-row-wrap">
            <Avatar name="Priya Raman" size="lg" />
            <span className="hx-stack hx-gap-0">
              <span className="hx-body-sm">Priya Raman</span>
              <span className="hx-code-sm hx-ink-3">on call · finance-data</span>
            </span>
            <span className="hx-end">
              <AvatarStack names={["Kwame Asante", "Ines Duarte", "Tomasz Wilk", "Mei Lin Zhao"]} />
            </span>
          </div>
        </SpecCell>
        <SpecCell
          name="Data list"
          note="Named facts about one object. On a phone the second form folds into a ruled two-by-two."
          path="display/data-list"
        >
          <DataList
            items={[
              { label: "Engine", value: "DuckDB 1.4" },
              { label: "Schedule", value: "0 */4 * * *" },
              { label: "Owner", value: "growth-data" },
            ]}
          />
          <div className="hx-frame">
            <Facts
              items={[
                { label: "Attempt", value: "2 of 3" },
                { label: "Worker", value: "wk-eu-07" },
                { label: "Rows", value: "1,482,906" },
                { label: "Took", value: "6m 41s" },
              ]}
            />
          </div>
        </SpecCell>
      </Sheet>
    </Group>
  );
};
