import { useState } from "react";
import type { CSSProperties } from "react";

import { Button } from "../components/button";
import { LineChart } from "../components/charts";
import { RadioGroup, Slider, Switch } from "../components/choice";
import { DataList } from "../components/data-list";
import { Dialog } from "../components/dialog";
import { Frame, FrameHead } from "../components/frame";
import { Popover } from "../components/popover";
import { Status } from "../components/status";
import { StatusStrip, StripCell } from "../components/status-strip";
import { Table } from "../components/table";
import type { Column } from "../components/table";
import { Avatar, Tag } from "../components/tag";
import { useToast } from "../components/toast";
import { full } from "../lib/format";
import {
  AT_CAP,
  BUDGET,
  DAY,
  DAYS,
  GROWTH,
  QUEUE_DEPTH,
  SPENT,
  SPILLS,
  TEAMS,
  forecastOf,
} from "./spend-data";
import type { AtCap, Spill, TeamSpend } from "./spend-data";

const BudgetBar = ({ credits, budget, cap }: { credits: number; budget: number; cap?: number }) => {
  const scale = Math.max(credits, budget, cap ?? 0) * 1.15;
  const over = credits > budget;

  return (
    <span
      aria-hidden
      className="hx-budget"
      data-over={over || undefined}
      style={
        {
          "--fill": `${(credits / scale) * 100}%`,
          "--tick": `${(budget / scale) * 100}%`,
        } as CSSProperties
      }
    />
  );
};

const SpillRow = ({ spill }: { spill: Spill }) => {
  const [open, setOpen] = useState(false);

  return (
    <li className="hx-spill">
      <Popover
        label={`Why ${spill.id} spilled`}
        onOpenChange={setOpen}
        open={open}
        renderTrigger={(props) => (
          <button {...props} className="hx-link hx-code-sm" type="button">
            {spill.id}
          </button>
        )}
      >
        <span className="hx-label-sm hx-ink-3">Why it spilled</span>
        <DataList
          items={[
            { label: "Step", value: spill.step },
            { label: "Rows in", value: spill.rows },
            { label: "Memory", value: `${spill.memory} GB` },
            { label: "To disk", value: `${spill.spilled} GB` },
          ]}
        />
      </Popover>
      <span className="hx-code-sm hx-ink-3 hx-truncate">{spill.team}</span>
      <span className="hx-code-sm hx-end">{spill.spilled} GB</span>
    </li>
  );
};

/** Demo: a month of credit spend by team, the queue behind it, and the queries spilling to disk. Cap a team is the one lit action. */
export const SpendScreen = () => {
  const push = useToast();
  const [team, setTeam] = useState("growth-data");
  const [caps, setCaps] = useState<Record<string, number>>({});
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(GROWTH.budget);
  const [atCap, setAtCap] = useState<AtCap>("burst");
  const [burst, setBurst] = useState(true);
  const chosen = TEAMS.find((item) => item.team === team) ?? GROWTH;

  const forecastFor = (item: TeamSpend) => {
    const cap = caps[item.team];
    const pace = forecastOf(item.credits);

    return cap === undefined ? pace : Math.min(pace, cap);
  };

  const forecast = TEAMS.reduce<number>((sum, item) => sum + forecastFor(item), 0);
  const overPace = forecast > BUDGET;
  const spilled = SPILLS.reduce<number>((sum, item) => sum + item.spilled, 0);

  const columns: Column<TeamSpend>[] = [
    {
      key: "team",
      label: "Team",
      render: (row) => (
        <span className="hx-row">
          {row.team}
          {caps[row.team] === undefined ? null : <Tag tone="outline">Capped</Tag>}
        </span>
      ),
      sort: (row) => row.team,
    },
    {
      dim: true,
      key: "lead",
      label: "Lead",
      optional: true,
      render: (row) => (
        <span className="hx-row">
          <Avatar name={row.lead} />
          <span className="hx-code-sm">{row.lead.split(" ")[0]}</span>
        </span>
      ),
    },
    {
      key: "use",
      label: "Budget",
      render: (row) => <BudgetBar budget={row.budget} cap={caps[row.team]} credits={row.credits} />,
    },
    {
      key: "credits",
      label: "Credits",
      num: true,
      render: (row) => (
        <span className={row.credits > row.budget ? "hx-warn-text" : undefined}>
          {full(row.credits)}
          <span className="hx-ink-3 hx-wide-only"> / {full(row.budget)}</span>
        </span>
      ),
      sort: (row) => row.credits / row.budget,
    },
    {
      dim: true,
      key: "trend",
      label: "Vs Oct",
      num: true,
      render: (row) => {
        const change = Math.round(((row.credits - row.october) / row.october) * 100);

        return `${change > 0 ? "+" : ""}${change}%`;
      },
      sort: (row) => row.credits / row.october,
    },
  ];

  const pace = forecastOf(chosen.credits);
  const saved = Math.max(0, pace - draft);

  const exportCsv = () => {
    const lines = [
      "team,lead,credits,budget,october,forecast,cap",
      ...TEAMS.map((item) =>
        [
          item.team,
          item.lead,
          item.credits,
          item.budget,
          item.october,
          forecastFor(item),
          caps[item.team] ?? "",
        ].join(","),
      ),
    ];

    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
    const link = document.createElement("a");

    link.href = url;
    link.download = "spend-november.csv";
    link.click();
    URL.revokeObjectURL(url);
    push({ detail: `${TEAMS.length} teams · ${link.download}`, status: "ok", title: "Exported" });
  };

  const confirm = () => {
    setCaps({ ...caps, [chosen.team]: draft });
    setOpen(false);
    push({
      detail: `${full(draft)} credits · ${AT_CAP.find((item) => item.value === atCap)?.label}`,
      status: "ok",
      title: `${chosen.team} capped`,
    });
  };

  return (
    <Frame label="Credit spend">
      <FrameHead
        meta={`wh-ledger-prod · day ${DAY} of ${DAYS}`}
        status={
          <Status live status={overPace ? "warn" : "ok"}>
            {overPace ? "Over pace" : "On pace"}
          </Status>
        }
        title="spend · november"
      />
      <StatusStrip label="Spend facts" plain>
        <StripCell label="Spent" unit="credits" value={full(SPENT)} />
        <StripCell label="Forecast" unit={`/ ${full(BUDGET)}`} value={full(forecast)} />
        <StripCell label="Waiting now" unit="queries" value={19} />
        <StripCell label="Spilled today" unit="GB" value={spilled} />
      </StatusStrip>
      <div className="hx-split hx-spend-split">
        <div className="hx-stack hx-gap-0">
          <div className="hx-head hx-subhead">
            <span className="hx-micro hx-ink-3">By team</span>
            <span className="hx-code-sm hx-ink-3 hx-end">Pick a row to cap it</span>
          </div>
          <Table
            columns={columns}
            initialSort={{ desc: true, key: "credits" }}
            label="Credit spend by team, November"
            onSelect={setTeam}
            rowKey={(row) => row.team}
            rows={TEAMS}
            selected={team}
          />
        </div>
        <div className="hx-stack hx-gap-0">
          <div className="hx-body-pad">
            <div className="hx-row">
              <span className="hx-micro hx-ink-3">Queue depth</span>
              <span className="hx-code-sm hx-ink-3 hx-end">last hour</span>
            </div>
            <LineChart
              data={QUEUE_DEPTH}
              format={String}
              height={148}
              hint="Point at the line to read five minutes"
              label="Queries waiting for a slot, every five minutes"
              unit=" waiting"
            />
          </div>
          <div className="hx-body-pad hx-rule-top">
            <div className="hx-row">
              <span className="hx-micro hx-ink-3">Spilled to disk</span>
              <span className="hx-code-sm hx-ink-3 hx-end">today</span>
            </div>
            <ul className="hx-spills">
              {SPILLS.map((spill) => (
                <SpillRow key={spill.id} spill={spill} />
              ))}
            </ul>
          </div>
        </div>
      </div>
      <footer className="hx-foot">
        <Switch
          checked={burst}
          description="Queries past 24 waiting run on wh-burst-xs"
          label="Overflow"
          onCheckedChange={setBurst}
        />
        <span className="hx-row hx-end">
          <Button onClick={exportCsv} variant="ghost">
            Export CSV
          </Button>
          <Button
            onClick={() => {
              setDraft(
                caps[chosen.team] ??
                  Math.floor(Math.min(chosen.budget, forecastOf(chosen.credits)) / 100) * 100,
              );
              setOpen(true);
            }}
            variant="lamp"
          >
            Cap {chosen.team}
          </Button>
        </span>
      </footer>
      <Dialog
        footer={
          <>
            <Button onClick={() => setOpen(false)} variant="ghost">
              Cancel
            </Button>
            <Button onClick={confirm} variant="lamp">
              Set cap at {full(draft)}
            </Button>
          </>
        }
        meta={`Budget ${full(chosen.budget)}`}
        onOpenChange={setOpen}
        open={open}
        title={`Cap ${chosen.team}`}
      >
        <p className="hx-body-sm hx-ink-2">
          A cap is a hard ceiling for the rest of November. It resets at 00:00 UTC on the 1st.
        </p>
        <Slider
          format={(value) => `${full(value)} credits`}
          label="Monthly cap"
          max={8000}
          min={500}
          onValueChange={setDraft}
          step={100}
          value={draft}
        />
        <DataList
          items={[
            { label: "Spent so far", value: `${full(chosen.credits)} credits` },
            { label: "At this pace", value: `${full(pace)} by Nov 30` },
            { label: "Held back", value: saved ? `${full(saved)} credits` : "nothing yet" },
          ]}
        />
        <RadioGroup
          label="At the cap"
          onValueChange={setAtCap}
          options={[...AT_CAP]}
          value={atCap}
        />
      </Dialog>
    </Frame>
  );
};
