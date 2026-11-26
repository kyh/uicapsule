import { Ban, Copy, FileText, Inbox, RefreshCw, RotateCcw, Search } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "../components/alert";
import { Button } from "../components/button";
import { Segmented } from "../components/choice";
import { Input } from "../components/field";
import { Frame, FrameHead } from "../components/frame";
import { Icon } from "../components/icon";
import { DropdownMenu } from "../components/menu";
import { MoreGlyph } from "../components/more-glyph";
import { Select } from "../components/select";
import { Status, StatusMark, statusRank } from "../components/status";
import type { RunStatus } from "../components/status";
import { StatusStrip, StripCell } from "../components/status-strip";
import { Table } from "../components/table";
import type { Column } from "../components/table";
import { Breadcrumb, Pagination } from "../components/tabs";
import { ScrambleText } from "../components/text-motion";
import { useToast } from "../components/toast";
import { clock, duration, full, short } from "../lib/format";
import { copyText, useInterval } from "../lib/motion";
import { OWNERS, RUNS } from "./data";
import type { Owner, Run } from "./data";
import { BUDGET, SPENT } from "./spend-data";

type TeamRun = (typeof RUNS)[number];

type StripFilter = Extract<RunStatus, "fail" | "running" | "queued" | "ok"> | null;

const STRIP: { status: Exclude<StripFilter, null>; label: string }[] = [
  { label: "Failed", status: "fail" },
  { label: "Running", status: "running" },
  { label: "Queued", status: "queued" },
  { label: "Succeeded", status: "ok" },
];

const WINDOWS = ["24h", "7d", "30d"] as const;

const EARLIER_TODAY = 63;
const SYNCED_AT = 14 * 3600 + 20 * 60 + 4;

const MENU = [
  { icon: FileText, id: "logs", label: "View logs" },
  { icon: RotateCcw, id: "retry", label: "Retry run", shortcut: "R" },
  { icon: Copy, id: "copy", label: "Copy run ID" },
  { icon: Ban, id: "cancel", label: "Cancel run", separatorBefore: true, tone: "fail" as const },
];

const hexId = () =>
  `run_${Math.floor(Math.random() * 0xff_ff_ff)
    .toString(16)
    .padStart(6, "0")}`;

/** Demo: the run board for prod. The strip filters the table; Run now or Restart is the one lit action. */
export const RunsScreen = ({ onSearch }: { onSearch: () => void }) => {
  const push = useToast();
  const [runs, setRuns] = useState<TeamRun[]>(RUNS);
  const [filter, setFilter] = useState<StripFilter>(null);
  const [owner, setOwner] = useState<Owner>("all");
  const [query, setQuery] = useState("");
  const [range, setRange] = useState<(typeof WINDOWS)[number]>("24h");
  const [selected, setSelected] = useState<string | null>("run_7c41e0");
  const [menu, setMenu] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [age, setAge] = useState(4);
  const [syncedAt, setSyncedAt] = useState(SYNCED_AT);
  const [refresh, setRefresh] = useState(0);

  useInterval(() => {
    setAge((value) => value + 1);
  }, 1000);

  const count = (status: RunStatus) => runs.filter((run) => run.status === status).length;

  const shown = runs.filter(
    (run) =>
      (filter === null || run.status === filter || (filter === "fail" && run.status === "warn")) &&
      (owner === "all" || run.team === owner) &&
      run.pipeline.includes(query.trim().toLowerCase()),
  );

  const rowsLoaded = runs.reduce<number>((sum, run) => sum + (run.rows ?? 0), 0);
  const current = runs.find((run) => run.id === selected);

  const busy = current?.status === "running" || current?.status === "queued";

  const clearFilters = () => {
    setFilter(null);
    setOwner("all");
    setQuery("");
  };

  const runNow = () => {
    if (!current) {
      return;
    }

    const id = hexId();
    const restarted = busy ? current.id : null;

    setRuns((list) => [
      {
        ...current,
        id,
        rows: 0,
        seconds: 0,
        started: "14:21",
        status: "running",
        trigger: "Manual",
      },
      ...list.map((item) =>
        item.id === restarted ? { ...item, status: "skipped" as const } : item,
      ),
    ]);
    setSelected(id);
    setFilter(null);
    push({
      detail: restarted !== null && restarted !== "" ? `${restarted} cancelled · ${id}` : id,
      status: "running",
      title: `${current.pipeline} ${restarted !== null && restarted !== "" ? "restarted" : "started"}`,
    });
  };

  const onMenu = (run: Run, action: string) => {
    if (action === "cancel") {
      setRuns((list) =>
        list.map((item) => (item.id === run.id ? { ...item, status: "skipped" } : item)),
      );
      push({ detail: run.id, status: "skipped", title: `Cancelled ${run.pipeline}` });
    } else if (action === "copy") {
      void copyText(run.id);
      push({ detail: run.id, status: "ok", title: "Run ID copied" });
    } else if (action === "retry") {
      setRuns((list) =>
        list.map((item) =>
          item.id === run.id ? { ...item, seconds: 0, status: "running" } : item,
        ),
      );
      push({ detail: run.id, status: "running", title: `Retrying ${run.pipeline}` });
    } else {
      push({ detail: run.id, status: "idle", title: `Opened logs for ${run.pipeline}` });
    }
  };

  const columns: Column<TeamRun>[] = [
    {
      render: (run) => <Status status={run.status} />,
      key: "status",
      label: "Status",
      sort: (run) => statusRank[run.status],
    },
    {
      render: (run) => run.pipeline,
      key: "pipeline",
      label: "Pipeline",
      sort: (run) => run.pipeline,
    },
    {
      render: (run) => <ScrambleText replay={refresh} text={run.id} />,
      dim: true,
      key: "run",
      label: "Run",
    },
    { render: (run) => run.trigger, dim: true, key: "trigger", label: "Trigger" },
    { render: (run) => run.started, key: "started", label: "Started", sort: (run) => run.started },
    {
      render: (run) => (run.seconds === null ? "-" : duration(run.seconds)),
      key: "duration",
      label: "Duration",
      num: true,
      sort: (run) => run.seconds ?? -1,
    },
    {
      render: (run) => (run.rows === null ? "-" : full(run.rows)),
      key: "rows",
      label: "Rows",
      num: true,
      sort: (run) => run.rows ?? -1,
    },
    {
      render: (run) => (
        <DropdownMenu
          items={MENU}
          label={`Actions for ${run.id}`}
          onOpenChange={(open) => {
            setMenu(open ? run.id : null);
          }}
          onSelect={(action) => {
            onMenu(run, action);
          }}
          open={menu === run.id}
          renderTrigger={(props) => (
            <Button
              {...props}
              aria-label={`Actions for ${run.id}`}
              onClick={(event) => {
                event.stopPropagation();
                props.onClick();
              }}
              size="icon-sm"
              variant="ghost"
            >
              <MoreGlyph />
            </Button>
          )}
        />
      ),
      key: "actions",
      label: "",
      num: true,
    },
  ];

  return (
    <Frame label="Run board">
      <FrameHead
        actions={
          <>
            <Button
              aria-label="Search runs"
              onClick={onSearch}
              size="icon-sm"
              title="Search, Cmd K"
              variant="ghost"
            >
              <Icon icon={Search} />
            </Button>
            <Button
              aria-label="Refresh runs"
              onClick={() => {
                setSyncedAt(syncedAt + age);
                setAge(0);
                setRefresh((value) => value + 1);
              }}
              size="icon-sm"
              title="Refresh"
              variant="ghost"
            >
              <Icon icon={RefreshCw} />
            </Button>
          </>
        }
        meta={`Updated ${clock(syncedAt)} UTC · ${age}s ago`}
        title={<Breadcrumb path={["larch", "prod", "runs"]} />}
      />
      <StatusStrip label="Runs today" plain>
        {STRIP.map((cell) => (
          <StripCell
            key={cell.status}
            label={cell.label}
            lead={<StatusMark status={cell.status} />}
            onSelect={() => {
              setFilter(filter === cell.status ? null : cell.status);
            }}
            selected={filter === cell.status}
            value={cell.status === "fail" ? count("fail") + count("warn") : count(cell.status)}
          />
        ))}
        <StripCell label="Rows loaded" unit={range} value={short(rowsLoaded)} />
        <StripCell label="Credits" unit={`/ ${full(BUDGET)}`} value={full(SPENT)} />
      </StatusStrip>
      <div className="hx-toolbar">
        <div className="hx-toolbar-search">
          <Input
            aria-label="Filter pipelines"
            fieldSize="sm"
            lead={<Icon icon={Search} size={14} />}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
            placeholder="Filter pipelines"
            value={query}
          />
        </div>
        <div className="hx-toolbar-select">
          <Select
            hideLabel
            label="Owner"
            onValueChange={setOwner}
            options={[...OWNERS]}
            size="sm"
            value={owner}
          />
        </div>
        <span className="hx-end">
          <Segmented label="Window" onValueChange={setRange} options={WINDOWS} value={range} />
        </span>
      </div>
      <Table
        columns={columns}
        initialSort={{ desc: true, key: "status" }}
        label="Runs"
        onSelect={setSelected}
        rowKey={(run) => run.id}
        empty={
          <EmptyState
            action={
              <Button onClick={clearFilters} size="sm">
                Clear filters
              </Button>
            }
            icon={<Icon icon={Inbox} size={24} />}
            title="No runs match"
          >
            Nothing on the board fits {query ? <code>{query}</code> : "these filters"}. Clear the
            filters to bring back all {runs.length} runs on the board.
          </EmptyState>
        }
        rows={shown}
        selected={selected}
      />
      <footer className="hx-foot">
        <Pagination onPageChange={setPage} page={page} pages={7} />
        <span className="hx-code-sm hx-ink-3">
          {shown.length} of {EARLIER_TODAY + runs.length} runs
          {current ? ` · ${current.pipeline}` : ""}
        </span>
        <span className="hx-row hx-end">
          <Button
            onClick={() => {
              push({
                detail: "geo.tiles_rebuild",
                status: "queued",
                title: "Backfill queued for Nov 1 to 24",
              });
            }}
          >
            Backfill
          </Button>
          <Button disabled={!current} onClick={runNow} variant="lamp">
            {busy ? "Restart" : "Run now"}
          </Button>
        </span>
      </footer>
    </Frame>
  );
};
